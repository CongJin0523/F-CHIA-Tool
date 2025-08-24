import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

import { initialNodes } from '@/common/initialNodes';
import { initialEdges } from '@/common/initialEdges';
import type { AppState } from '@/common/types';
import { graphToFormValues } from '@/common/graphToFormValues';
import { persist } from 'zustand/middleware';
const useDgStore = create<AppState>()(
  persist(
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
    }),
    { name: 'dg-store' }
  ), 
);

export default useDgStore;
export { useDgStore };