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
  'org.eclipse.elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  // merge edge connection points on nodes
  'org.eclipse.elk.layered.mergeEdges': 'true',
  'org.eclipse.elk.partitioning.activate': 'true',
  'org.eclipse.elk.validateOptions': 'true',
  'org.eclipse.elk.layered.generatePositionAndLayerIds': 'true',

};

export const getLayoutedElements = async (
  nodes: AppNode[],
  edges: Edge[],
  options = {},
  behavior?: { snapRightHandleTargets?: boolean }
) => {
  console.log('Starting ELK layout with nodes:', nodes, 'edges:', edges, 'options:', options);
  const snapRight = behavior?.snapRightHandleTargets ?? false;
  const baseOptions = { ...elkOptions, ...(options as any) };

  // infer direction
  const dir = String(baseOptions?.['org.eclipse.elk.direction'] || 'DOWN');
  const isHorizontal = dir === 'RIGHT' || dir === 'LEFT';

  // compute a conservative between-layers spacing based on tallest node we've measured
  const tallest = Math.max(0, ...nodes.map((n: any) => (typeof n.height === 'number' ? n.height : 0)));
  const desiredBetweenLayers = Math.max(
    parseInt(String(baseOptions['org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers'] || 0), 10) || 0,
    Math.round((tallest || 60) * 0.9)
  );
  baseOptions['org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers'] = String(desiredBetweenLayers);

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

  const buildGraph = (layerChoiceByNode?: Map<string, number>, rootOverrides?: Record<string, any>) => ({
    id: 'root',
    layoutOptions: { ...baseOptions, ...(rootOverrides || {}) },
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

  // Derive layer indices from coordinates (robust across elkjs builds)
  const axis = isHorizontal ? 'x' : 'y';
  const coords: Array<{ id: string, v: number }> = [];
  (firstResult.children || []).forEach((n: any) => {
    const v = typeof n[axis] === 'number' ? n[axis] : 0;
    coords.push({ id: n.id, v });
  });
  coords.sort((a, b) => a.v - b.v);
  const EPS = 1; // pixel tolerance to cluster same-layer positions
  const bands: number[] = [];
  const firstLayers = new Map<string, number>();
  coords.forEach(({ id, v }) => {
    let idx = bands.findIndex((b) => Math.abs(b - v) <= EPS);
    if (idx === -1) {
      bands.push(v);
      idx = bands.length - 1;
    } else {
      // move band center slightly toward new value for stability
      bands[idx] = (bands[idx] + v) / 2;
    }
    firstLayers.set(id, idx);
  });
  try {
    console.table(coords.map(({ id }) => ({ id, layer: firstLayers.get(id) })));
  } catch (_) { }

  const layerChoiceByNode = new Map<string, number>();
  inLayerSuccOfByNode.forEach((srcId, trgId) => {
    const srcLayer = firstLayers.get(srcId);
    if (typeof srcLayer === 'number') {
      layerChoiceByNode.set(trgId, srcLayer);
    }
  });

  // ---- PASS 2: run layout with exact layer constraints
  // Enable interactive visitors so layerChoiceConstraint / in-layer constraints are honored
  const interactiveRoot = {
    'org.eclipse.elk.interactive': 'true',
    'org.eclipse.elk.layered.layering.strategy': 'INTERACTIVE',
    'org.eclipse.elk.layered.crossingMinimization.strategy': 'INTERACTIVE',
    // (Cycle breaking may stay default; enable if you later need it)
    'org.eclipse.elk.layered.cycleBreaking.strategy': 'INTERACTIVE',
  };
  const secondGraph = buildGraph(layerChoiceByNode, interactiveRoot);
  try {
    console.log('[ELK] PASS2 root layoutOptions:', JSON.stringify(secondGraph.layoutOptions, null, 2));
  } catch { }
  const layoutedGraph = await elk.layout(secondGraph);

  // --- POST: snap right-handle targets to same visual layer as their sources
  if (snapRight) {
    try {
      const axis = isHorizontal ? 'x' : 'y';
      const byId: Map<string, any> = new Map();
      (layoutedGraph.children || []).forEach((n: any) => byId.set(n.id, n));
      inLayerSuccOfByNode.forEach((srcId, trgId) => {
        const s = byId.get(srcId);
        const t = byId.get(trgId);
        if (s && t && typeof s[axis] === 'number' && typeof t[axis] === 'number') {
          t[axis] = s[axis]; // force into same band
        }
      });
    } catch (_) { }
  }

  // --- DEBUG: verify resulting layers for constrained pairs (pass 2)
  try {
    const constrainedIds = new Set<string>();
    inLayerSuccOfByNode.forEach((src, trg) => { constrainedIds.add(src); constrainedIds.add(trg); });
    if (constrainedIds.size) {
      const layerRows: any[] = [];
      (layoutedGraph.children || []).forEach((n: any) => {
        if (constrainedIds.has(n.id)) {
          const computed = firstLayers.get(n.id);
          layerRows.push({ id: n.id, x: n.x, y: n.y, finalBand: isHorizontal ? n.x : n.y, computedLayerFromPass1: computed });
        }
      });
      if (layerRows.length) console.table(layerRows);
    }
  } catch (_) { }
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