import '@xyflow/react/dist/style.css';

import {
  Background,
  ReactFlowProvider,
  ReactFlow,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { nodeTypes } from '@/common/node-type';


import React, { useCallback, useLayoutEffect } from 'react';
import { Button } from './components/ui/button';
import useStore from '@/common/store';






import { elkOptions, getLayoutedElements } from '@/common/layout-func';
import type { AppState } from '@/common/types';


const selector = (state: AppState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  updateNodeText: state.updateNodeText,

});

function LayoutFlow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, setEdges, updateNodeText } = useStore(
    useShallow(selector),
  );
  const { fitView } = useReactFlow();

  const onLayout = useCallback(
    ({ direction, useInitialNodes = false }) => {
      const opts = { 'elk.direction': direction, ...elkOptions };
      const ns = nodes;
      const es = edges;

      getLayoutedElements(ns, es, opts).then(
        ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
          fitView();
        },
      );
    },
    [nodes, edges],
  );
  useLayoutEffect(() => {
    onLayout({ direction: 'DOWN', useInitialNodes: true });
  }, []);

  return (
    <div className="h-screen w-screen p-8">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
      <Panel position="bottom-right">
        <Button
          className="xy-theme__button"
          onClick={() => onLayout({ direction: 'DOWN' })}
        >
          vertical layout
        </Button>

        <Button
          className="xy-theme__button"
          onClick={() => onLayout({ direction: 'RIGHT' })}
        >
          horizontal layout
        </Button>
      </Panel>
      <Background />
      </ ReactFlow>
    </div>
  );
};
function App() {
  return (
    <ReactFlowProvider>
      <LayoutFlow />
    </ReactFlowProvider>
  );
}
export default App;