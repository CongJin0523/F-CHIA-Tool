// src/store/graph-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { initialNodes } from '@/common/initialNodes';
import { initialEdges } from '@/common/initialEdges';
import type { AppState } from '@/common/types';

import { graphToFormValues } from '@/common/graphToFormValues';


// Factory that returns a vanilla Zustand store API,
// wrapped with persist using a PER-ZONE key.
export const createGraphStore = (zoneId: string) => {
  return create<AppState>()(
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
      { name: `graph-${zoneId}` }
    )
  );
};

export type GraphStore = ReturnType<typeof createGraphStore>;