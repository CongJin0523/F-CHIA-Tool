import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

import { initialNodes } from './initialNodes';
import { initialEdges } from './initialEdges';
import type { AppState, AppNode } from './types';
import { graphToFormValues } from './graphToFormValues';

const useDgStore = create<AppState>()(
  (set, get) => ({
    nodes: initialNodes,
    edges: initialEdges,
    onNodesChange: (changes) => set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),
    onEdgesChange: (changes) => set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
    onConnect: (params) => set((state) => ({ edges: addEdge(params, state.edges) })),
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    updateNodeText: (nodeId, text) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, content: text } }
          : n
      ),
    })),

    getFormValues: () => graphToFormValues(get().nodes, get().edges),
  })
);

export default useDgStore;
export { useDgStore };