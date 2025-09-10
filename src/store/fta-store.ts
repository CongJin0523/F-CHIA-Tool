import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';
import type { FtaNodeTypes } from '@/common/fta-node-type';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { elkOptions, getLayoutedElements } from '@/common/layout-func';

type FtaState = {
  nodes: FtaNodeTypes[];
  edges: Edge[];
  setNodes: (nodes: FtaNodeTypes[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange<FtaNodeTypes>;
  onEdgesChange: OnEdgesChange;
  // 可选：布局、更新内容等
  onLayout: (dir: 'DOWN' | 'RIGHT') => Promise<void>;
};

export function createFtaStore(id: string, initial?: { nodes: FtaNodeTypes[]; edges: Edge[] }) {
  return create<FtaState>()(persist((set, get) => ({
    nodes: initial?.nodes ?? [],
    edges: initial?.edges ?? [],
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    onNodesChange: (changes) => set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),
    onEdgesChange: (changes) => set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
    onLayout: async (direction: 'DOWN' | 'RIGHT' = 'DOWN') => {
      const { nodes, edges, setNodes, setEdges } = get();
      const opts = { 'elk.direction': direction, ...elkOptions };

      try {
        const result = await getLayoutedElements(nodes, edges, opts);
        if (result) {
          // Type cast the result to maintain AppNode types
          setNodes(result.nodes as FtaNodeTypes[]);
          setEdges(result.edges);
        }
      } catch (error) {
        console.error('Layout failed:', error);
      }
    },
  })
    , { name: `fta-${id}` }))
    ;
}