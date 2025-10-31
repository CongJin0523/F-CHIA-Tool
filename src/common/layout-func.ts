import ELK from 'elkjs/lib/elk.bundled.js';


import type { AppNode } from '@/common/types';
import {
  type Edge,
} from '@xyflow/react';
import { no } from 'zod/v4/locales';

const elk = new ELK();
export const elkOptions = {
  'org.eclipse.elk.algorithm': 'layered',
  // default direction (can be overridden via options)
  'org.eclipse.elk.direction': 'DOWN',
  // safer spacings to avoid overlap
  'org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers': '70',
  'org.eclipse.elk.spacing.nodeNode': '40',
  'org.eclipse.elk.spacing.componentComponent': '220',
  // routing & placement
  'org.eclipse.elk.edgeRouting': 'POLYLINE',
  'org.eclipse.elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'org.eclipse.elk.layered.considerModelOrder.strategy': 'PREFER_EDGES',
  // fewer crossings usually helps readability (can be overridden)
  'org.eclipse.elk.crossingMinimization.strategy': 'LAYER_SWEEP',
  // merge edge connection points on nodes
  'org.eclipse.elk.layered.mergeEdges': 'true',
  'org.eclipse.elk.partitioning.activate': 'true',
  'org.eclipse.elk.validateOptions': 'true',
  'org.eclipse.elk.layered.generatePositionAndLayerIds': 'true',

};

export const getLayoutedElements = async (nodes: AppNode[], edges: Edge[], options = {}) => {
  console.log('Starting ELK layout with nodes:', nodes, 'edges:', edges, 'options:', options);
  const baseOptions = { ...elkOptions, ...(options as any) };

  // infer direction
  const isHorizontal = baseOptions?.['elk.direction'] === 'RIGHT';

  // compute a conservative between-layers spacing based on tallest node we've measured
  const tallest = Math.max(0, ...nodes.map((n: any) => (typeof n.height === 'number' ? n.height : 0)));
  const desiredBetweenLayers = Math.max(
    parseInt(String(baseOptions['elk.layered.spacing.nodeNodeBetweenLayers'] || 0), 10) || 0,
    Math.round((tallest || 60) * 0.9)
  );
  baseOptions['elk.layered.spacing.nodeNodeBetweenLayers'] = String(desiredBetweenLayers);

  // --- group nodes that should share the same layer (rank) ---
  // Build an undirected graph from edges that originate from the right-side handle.
  const sameLayerAdj = new Map<string, Set<string>>();
  edges.forEach((e: any) => {
    if (typeof e.sourceHandle === 'string' && e.sourceHandle.endsWith('-source-right')) {
      if (!sameLayerAdj.has(e.source)) sameLayerAdj.set(e.source, new Set());
      if (!sameLayerAdj.has(e.target)) sameLayerAdj.set(e.target, new Set());
      sameLayerAdj.get(e.source)!.add(e.target);
      sameLayerAdj.get(e.target)!.add(e.source);
    }
  });
  // Find connected components; each component gets one partition id so ELK puts them in the same layer.
  const partitionByNode = new Map<string, string>();
  let compIndex = 0;
  const visited = new Set<string>();
  for (const nodeId of sameLayerAdj.keys()) {
    if (visited.has(nodeId)) continue;
    const queue = [nodeId];
    const compId = `same_right_${compIndex++}`;
    visited.add(nodeId);
    partitionByNode.set(nodeId, compId);
    while (queue.length) {
      const cur = queue.shift()!;
      for (const nei of sameLayerAdj.get(cur) || []) {
        if (!visited.has(nei)) {
          visited.add(nei);
          partitionByNode.set(nei, compId);
          queue.push(nei);
        }
      }
    }
  }

  // Build explicit same-layer constraints using inLayerSuccOf (force target to be in the same layer as source)
  const inLayerSuccOfByNode = new Map<string, string>();
  edges.forEach((e: any) => {
    if (typeof e.sourceHandle === 'string' && e.sourceHandle.endsWith('-source-right')) {
      // target must be in the same layer as source
      inLayerSuccOfByNode.set(e.target, e.source);
    }
  });

  // --- DEBUG: print the intended same-layer constraints (target -> source) ---
  try {
    const debugPairs = Array.from(inLayerSuccOfByNode.entries()).map(([t, s]) => ({ target: t, source: s }));
    if (debugPairs.length) {
      // Log once in a compact table
      console.table(debugPairs);
    } else {
      console.log('[ELK] No inLayerSuccOf constraints computed for this run.');
    }
  } catch (_) { }

  const buildGraph = (layerChoiceByNode?: Map<string, number>) => ({
    id: 'root',
    layoutOptions: baseOptions,
    children: nodes.map((node) => ({
      ...node,
      // Adjust the target and source handle positions based on the layout
      // direction.
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',

      // use measured size from React Flow if available; fall back to safe defaults
      width: node.measured?.width ?? 250,
      height: node.measured?.height ?? 80,
      layoutOptions: (() => {
        const lo: any = {};
        if (partitionByNode.has(node.id)) {
          lo['org.eclipse.elk.partitioning.partition'] = partitionByNode.get(node.id)!;
        }
        // HARD same-layer constraint: make this node successor-in-layer of its source
        if (inLayerSuccOfByNode.has(node.id)) {
          lo['org.eclipse.elk.layered.crossingMinimization.inLayerSuccOf'] = inLayerSuccOfByNode.get(node.id)!;
        }
        // second pass: force exact layer via layerChoiceConstraint (if provided)
        if (layerChoiceByNode && layerChoiceByNode.has(node.id)) {
          lo['org.eclipse.elk.layered.layering.layerChoiceConstraint'] = layerChoiceByNode.get(node.id)!;
        }
        return Object.keys(lo).length ? lo : undefined;
      })(),
    })),
    edges: edges.map((e: any) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
      sourceHandle: e.sourceHandle ? e.sourceHandle : undefined,
      targetHandle: e.targetHandle ? e.targetHandle : undefined,
    })),
  });


try {
  console.log('[ELK] Root layoutOptions:', JSON.stringify(baseOptions, null, 2));
} catch (_) { }
  // ---- PASS 1: get provisional layers to compute exact layer indices
  const firstGraph = buildGraph();
  const firstResult = await elk.layout(firstGraph);
  const layerIdKey = 'org.eclipse.elk.layered.layering.layerId';
  const firstLayers = new Map<string, number>();
  (firstResult.children || []).forEach((n: any) => {
    const lid =
      (n.properties && typeof n.properties[layerIdKey] === 'number' ? n.properties[layerIdKey] : undefined);
    if (typeof lid === 'number') firstLayers.set(n.id, lid);
  });
  try {
    console.table(Array.from(firstLayers.entries()).map(([id, layer]) => ({ id, layer })));
  } catch (_) {}

  const layerChoiceByNode = new Map<string, number>();
  inLayerSuccOfByNode.forEach((srcId, trgId) => {
    const srcLayer = firstLayers.get(srcId);
    if (typeof srcLayer === 'number') {
      layerChoiceByNode.set(trgId, srcLayer);
    }
  });

  // ---- PASS 2: run layout with exact layer constraints
  const secondGraph = buildGraph(layerChoiceByNode);
  const layoutedGraph = await elk.layout(secondGraph);

  // --- DEBUG: verify resulting layers for constrained pairs (pass 2)
  try {
    const constrainedIds = new Set<string>();
    inLayerSuccOfByNode.forEach((src, trg) => { constrainedIds.add(src); constrainedIds.add(trg); });
    if (constrainedIds.size) {
      const layerRows: any[] = [];
      (layoutedGraph.children || []).forEach((n: any) => {
        if (constrainedIds.has(n.id)) {
          const lid = n.properties ? n.properties[layerIdKey] : undefined;
          layerRows.push({ id: n.id, x: n.x, y: n.y, layerId: lid });
        }
      });
            if (layerRows.length) console.table(layerRows);
    }
  } catch (_) {}
  console.log('ELK layout result (pass 2):', layoutedGraph);
  return {
    nodes: (layoutedGraph.children || []).map((node: any) => ({
      id: node.id,
      type: node.type,
      data: node.data,
      measure: node.measure,
      position: { x: node.x, y: node.y },
    })),
    edges: (layoutedGraph.edges || []).map((edge: any) => ({
      id: edge.id,
      target: Array.isArray(edge.targets) ? edge.targets[0] : edge.target,
      targetHandle: edge.targetHandle ? edge.targetHandle : undefined,
      source: Array.isArray(edge.sources) ? edge.sources[0] : edge.source,
      sourceHandle: edge.sourceHandle ? edge.sourceHandle : undefined,
      type: 'default',
    })),
  };
};