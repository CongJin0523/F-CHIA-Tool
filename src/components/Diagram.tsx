import '@xyflow/react/dist/style.css';

import {
  Background,
  ReactFlowProvider,
  ReactFlow,
  type OnConnect,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  type Edge,
  type Node,
  useReactFlow,
} from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { nodeTypes } from '@/common/node-type';


import ELK from 'elkjs/lib/elk.bundled.js';
import React, { useCallback, useLayoutEffect } from 'react';
import { Button } from '@/components/ui/button';
import useStore from '@/common/store';


const elk = new ELK();
const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
};
const getLayoutedElements = (nodes, edges, options = {}) => {
  const isHorizontal = options?.['elk.direction'] === 'RIGHT';
  const graph = {
    id: 'root',
    layoutOptions: options,
    children: nodes.map((node) => ({
      ...node,
      // Adjust the target and source handle positions based on the layout
      // direction.
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',

      // Hardcode a width and height for elk to use when layouting.
      width: 150,
      height: 50,
    })),
    edges: edges,
  };
  return elk
    .layout(graph)
    .then((layoutedGraph) => ({
      nodes: layoutedGraph.children.map((node) => ({
        ...node,
        // React Flow expects a position property on the node instead of `x`
        // and `y` fields.
        position: { x: node.x, y: node.y },
      })),

      edges: layoutedGraph.edges,
    }))
    .catch(console.error);
};





const selector = (state) => ({
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
function Diagram() {
  return (
    <ReactFlowProvider>
      <LayoutFlow />
    </ReactFlowProvider>
  );
}
export default Diagram;