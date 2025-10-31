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

export type ChecksMap = Record<string, boolean>;
export type FtaState = {
  nodes: FtaNodeTypes[];
  edges: Edge[];
  setNodes: (nodes: FtaNodeTypes[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange<FtaNodeTypes>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect; // ensure edges keep handle ids from UI
  onLayout: (dir: 'DOWN' | 'RIGHT') => Promise<void>;

  causeChecks: ChecksMap;
  setCauseChecked: (causeKey: string, checked: boolean) => void;
  clearCauseChecks: () => void;
  setAllCauseChecks: (map: Record<string, boolean>) => void;
};

export function createFtaStore(id: string, initial?: { nodes: FtaNodeTypes[]; edges: Edge[] }) {
  return create<FtaState>()(persist((set, get) => ({
    nodes: initial?.nodes ?? [],
    edges: initial?.edges ?? [],
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    onNodesChange: (changes) => set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),
    onEdgesChange: (changes) => set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
    onConnect: (connection) => set((state) => ({
      edges: addEdge(connection, state.edges),
    })),
    onLayout: async (direction: 'DOWN' | 'RIGHT' = 'DOWN') => {
      const { nodes, edges, setNodes, setEdges } = get();
      const opts = { ...elkOptions, 'org.eclipse.elk.direction': direction } as const;

      try {
        try {
          const withRight = edges.filter((e: any) => typeof e.sourceHandle === 'string' && e.sourceHandle.endsWith('-source-right'));
          console.log('[FTA] edges with -source-right:', withRight.length, withRight);
        } catch {}
        const result = await getLayoutedElements(nodes, edges, opts, { snapRightHandleTargets: true });
        if (result) {
          // Type cast the result to maintain AppNode types
          setNodes(result.nodes as FtaNodeTypes[]);
          setEdges(result.edges);
        }
      } catch (error) {
        console.error('Layout failed:', error);
      }
    },
    //new UI slice
    causeChecks: {},
    setCauseChecked: (causeKey, checked) =>
      set((s) => ({ causeChecks: { ...s.causeChecks, [causeKey]: checked } })),
    clearCauseChecks: () => set({ causeChecks: {} }),
    setAllCauseChecks: (map: Record<string, boolean>) => set({ causeChecks: map || {} }), 
  }),

    { name: `fta-${id}` }))
    ;
}
