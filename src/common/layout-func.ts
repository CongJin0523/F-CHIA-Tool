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
  behavior?: {
    mode?: 'diagram' | 'fta';
    snapRightHandleTargets?: boolean;    // for FTA: post-snap same-layer
    useInteractivePass?: boolean;        // for FTA: enable INTERACTIVE visitors in pass2
  }
) => {
  console.log('Starting ELK layout with nodes:', nodes, 'edges:', edges, 'options:', options);
  const snapRight = behavior?.snapRightHandleTargets ?? false;
  const mode = behavior?.mode ?? 'diagram';
  const isFTA = mode === 'fta' || (behavior?.snapRightHandleTargets ?? false);
  const useInteractivePass = behavior?.useInteractivePass ?? true; // default true for FTA
  const baseOptions = { ...elkOptions, ...(options as any) };

  // infer direction
  const dir = String(
    (baseOptions as any)['org.eclipse.elk.direction'] ??
    (baseOptions as any)['elk.direction'] ??
    'DOWN'
  );
  const isHorizontal = dir === 'RIGHT' || dir === 'LEFT';

  // compute a conservative between-layers spacing based on tallest node we've measured
  const tallest = Math.max(0, ...nodes.map((n: any) => (typeof n.height === 'number' ? n.height : 0)));
  const desiredBetweenLayers = Math.max(
    parseInt(String(baseOptions['org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers'] || 0), 10) || 0,
    Math.round((tallest || 60) * 0.9)
  );
  baseOptions['org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers'] = String(desiredBetweenLayers);

  // --- FTA-only constraints: group nodes and add same-layer hints from right-handle edges
  const partitionByNode = new Map<string, string>();
  const inLayerSuccOfByNode = new Map<string, string>();

  if (isFTA) {
    // Build an undirected graph for right-handle edges to cluster by components
    const sameLayerAdj = new Map<string, Set<string>>();
    edges.forEach((e: any) => {
      if (typeof e.sourceHandle === 'string' && e.sourceHandle.endsWith('-source-right')) {
        if (!sameLayerAdj.has(e.source)) sameLayerAdj.set(e.source, new Set());
        if (!sameLayerAdj.has(e.target)) sameLayerAdj.set(e.target, new Set());
        sameLayerAdj.get(e.source)!.add(e.target);
        sameLayerAdj.get(e.target)!.add(e.source);
      }
    });
    // Connected components -> partitions
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
    // Node-level in-layer successor mapping
    edges.forEach((e: any) => {
      if (typeof e.sourceHandle === 'string' && e.sourceHandle.endsWith('-source-right')) {
        inLayerSuccOfByNode.set(e.target, e.source);
      }
    });
  }

  // --- DEBUG: print the intended same-layer constraints (target -> source) ---
  if (isFTA) {
    try {
      const debugPairs = Array.from(inLayerSuccOfByNode.entries()).map(([t, s]) => ({ target: t, source: s }));
      if (debugPairs.length) {
        // Log once in a compact table
        console.table(debugPairs);
      } else {
        console.log('[ELK] No inLayerSuccOf constraints computed for this run.');
      }
    } catch (_) { }
  }

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

  if (!isFTA) {
    // --- Diagram mode: simple single-pass layout (stable for diagram.tsx)
    const graph = buildGraph();
    const layoutedGraph = await elk.layout(graph);
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
  }

  // --- FTA mode: two-pass with optional interactive visitors
  // PASS 1: derive provisional layers (robust across elkjs builds)
  const firstGraph = buildGraph();
  const firstResult = await elk.layout(firstGraph);

  const axis = isHorizontal ? 'x' : 'y';
  const coords: Array<{ id: string, v: number }> = [];
  (firstResult.children || []).forEach((n: any) => {
    const v = typeof n[axis] === 'number' ? n[axis] : 0;
    coords.push({ id: n.id, v });
  });
  coords.sort((a, b) => a.v - b.v);
  const EPS = 1;
  const bands: number[] = [];
  const firstLayers = new Map<string, number>();
  coords.forEach(({ id, v }) => {
    let idx = bands.findIndex((b) => Math.abs(b - v) <= EPS);
    if (idx === -1) {
      bands.push(v);
      idx = bands.length - 1;
    } else {
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

  // PASS 2: re-layout with exact layer constraints
  const interactiveRoot = useInteractivePass
    ? {
      'org.eclipse.elk.interactive': 'true',
      'org.eclipse.elk.layered.layering.strategy': 'INTERACTIVE',
      'org.eclipse.elk.layered.crossingMinimization.strategy': 'INTERACTIVE',
      'org.eclipse.elk.layered.cycleBreaking.strategy': 'INTERACTIVE',

      // ↓↓↓ 关键：尽量减少边重叠
      'org.eclipse.elk.layered.mergeEdges': 'false',     // 不把多条边合并到同一点
      'org.eclipse.elk.spacing.edgeEdge': '24',          // 边-边安全距离
      'org.eclipse.elk.spacing.edgeNode': '20',          // 边-节点安全距离
      'org.eclipse.elk.layered.thoroughness': '30',      // 多试几种排列，降低交叉
      // 可选：若你最终改用 ELK 提供的轨迹，可打开样条（目前我们只取坐标，这项影响不大）
      'org.eclipse.elk.edgeRouting': 'SPLINES',
    }
    : undefined;
const secondGraph = buildGraph(layerChoiceByNode, interactiveRoot);
try {
  console.log('[ELK] PASS2 root layoutOptions:', JSON.stringify(secondGraph.layoutOptions, null, 2));
} catch { }
const layoutedGraph = await elk.layout(secondGraph);

// POST: snap targets to same band for right-handle edges (optional)
if (snapRight) {
  try {
    // bandAxis: the coordinate we force equal (same layer); moveAxis: we spread along this to avoid overlap
    const bandAxis = isHorizontal ? 'x' : 'y';
    const moveAxis = isHorizontal ? 'y' : 'x';

    const byId: Map<string, any> = new Map();
    (layoutedGraph.children || []).forEach((n: any) => byId.set(n.id, n));

    // 1) Snap targets into the same band as their sources
    inLayerSuccOfByNode.forEach((srcId, trgId) => {
      const s = byId.get(srcId);
      const t = byId.get(trgId);
      if (s && t && typeof s[bandAxis] === 'number' && typeof t[bandAxis] === 'number') {
        t[bandAxis] = s[bandAxis];
      }
    });

    // Build incoming sources per target (for barycenter sorting)
    const incomingSources = new Map<string, string[]>();
    (edges as any[]).forEach((e: any) => {
      const arr = incomingSources.get(e.target) || [];
      arr.push(e.source);
      incomingSources.set(e.target, arr);
    });

    const posOf = (id: string) => {
      const n = byId.get(id);
      return n ? (((n[moveAxis] ?? 0) as number) || 0) : 0;
    };

    const baryOf = (n: any) => {
      const srcs = incomingSources.get(n.id);
      if (!srcs || srcs.length === 0) return ((n[moveAxis] ?? 0) as number) || 0;
      let sum = 0;
      for (const s of srcs) sum += posOf(s);
      return sum / srcs.length;
    };

    // prefer larger of node-node and edge-edge spacing as packing gap
    const baseGap = parseInt(String((baseOptions as any)['org.eclipse.elk.spacing.nodeNode'] || 40), 10) || 40;
    const edgeGap = parseInt(String((baseOptions as any)['org.eclipse.elk.spacing.edgeEdge'] || baseGap), 10) || baseGap;
    const gap = Math.max(baseGap, edgeGap);

    // group nodes by their band coordinate (after snapping)
    const bands = new Map<number, any[]>();
    for (const n of byId.values()) {
      const v = (n[bandAxis] ?? 0) as number;
      let key: number | null = null;
      for (const k of bands.keys()) {
        if (Math.abs(k - v) <= EPS) { key = k; break; }
      }
      if (key === null) { key = v; bands.set(key, []); }
      bands.get(key)!.push(n);
    }

    // the set of nodes we are allowed to move along moveAxis (targets of right-handle edges)
    const movableTargets = new Set<string>();
    inLayerSuccOfByNode.forEach((_s, trg) => movableTargets.add(trg));

    // size helper along the movement axis
    const sizeOf = (n: any) => {
      const w = (n.width ?? n.measured?.width ?? 250) as number;
      const h = (n.height ?? n.measured?.height ?? 80) as number;
      return moveAxis === 'x' ? w : h;
    };

    type Interval = { left: number; right: number };
    const addInterval = (intervals: Interval[], c: number, size: number) => {
      const half = size / 2;
      intervals.push({ left: c - half, right: c + half });
      intervals.sort((a, b) => a.left - b.left);
    };

    bands.forEach((nodesInBand) => {
      // Seed obstacle intervals with NON-movable nodes in this band
      const intervals: Interval[] = [];
      nodesInBand.forEach((n) => {
        if (!movableTargets.has(n.id)) {
          const c = (n[moveAxis] ?? 0) as number;
          addInterval(intervals, c, sizeOf(n));
        }
      });
      
      // deterministically pack movables from small to large moveAxis coordinate
      const movables = nodesInBand
        .filter((n) => movableTargets.has(n.id))
        // barycenter sorting: order by average position of all predecessors to reduce edge crossings/overlaps
        .sort((a, b) => baryOf(a) - baryOf(b));
      
      movables.forEach((n) => {
        const size = sizeOf(n);
        const half = size / 2;
        let c = baryOf(n); // desired center starts from predecessors' barycenter

        // push forward (RIGHT/DOWN) until no overlap with any existing interval (+gap)
        for (const it of intervals) {
          const left = c - half;
          const right = c + half;
          const itL = it.left - gap / 2;
          const itR = it.right + gap / 2;
          const overlap = !(right < itL || left > itR);
          if (overlap && c <= itR) {
            c = itR + half; // just after this interval
          }
        }

        n[moveAxis] = c;
        addInterval(intervals, c, size);
      });
    });
  } catch (_) { }
}

// DEBUG: show final bands for constrained nodes
try {
  const constrainedIds = new Set<string>();
  inLayerSuccOfByNode.forEach((src, trg) => { constrainedIds.add(src); constrainedIds.add(trg); });
  if (constrainedIds.size) {
    const layerRows: any[] = [];
    (layoutedGraph.children || []).forEach((n: any) => {
      if (constrainedIds.has(n.id)) {
        // recompute band index from final coordinates (same EPS)
        const v = (isHorizontal ? n.x : n.y) ?? 0;
        const bandIdx = bands.findIndex((b) => Math.abs(b - v) <= EPS);
        layerRows.push({ id: n.id, x: n.x, y: n.y, finalBand: v, bandIndex: bandIdx });
      }
    });
    if (layerRows.length) console.table(layerRows);
  }
} catch (_) { }

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