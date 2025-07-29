import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { immer } from 'zustand/middleware/immer'

import { initialNodes } from './initialNodes';
import { initialEdges } from './initialEdges';
import type {  AppState, AppNode } from './types';

const useStore = create<AppState>()(
  immer((set) => ({
    nodes: initialNodes,
    edges: initialEdges,
    onNodesChange: (changes) => set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),
    onEdgesChange: (changes) => set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
    onConnect: (params) => set((state) => ({ edges: addEdge(params, state.edges) })),
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    updateNodeText: (nodeId, text) => set((state) => {
      const node: AppNode | undefined = state.nodes.find((n) => n.id === nodeId);
      if (node) {
        node.data.content = text;
      }
      }),
  }))
);

export default useStore;
export { useStore };