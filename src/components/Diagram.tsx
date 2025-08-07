import '@xyflow/react/dist/style.css';

import {
  Background,
  ReactFlowProvider,
  ReactFlow,
  Panel,
  useReactFlow,
  type Edge,
} from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { nodeTypes } from '@/common/node-type';


import React, { useCallback, useLayoutEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import useStore from '@/common/store';


import ShortUniqueId from 'short-uuid';



import { elkOptions, getLayoutedElements } from '@/common/layout-func';
import type { AppState, AppNode } from '@/common/types';



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
const translator = ShortUniqueId();

const getId = () => translator.new();
const nodeOrigin: [number, number] = [0.5, 0];
function LayoutFlow() {
  const reactFlowWrapper = useRef(null);
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, setEdges, updateNodeText } = useStore(
    useShallow(selector),
  );
  const { fitView, screenToFlowPosition } = useReactFlow();

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

  const onConnectEnd = useCallback(
    (event, connectionState) => {
      console.log('onConnectEnd', event, connectionState);
      // when a connection is dropped on the pane it's not valid
      if (!connectionState.isValid) {
        // we need to remove the wrapper bounds, in order to get the correct position
        const id = getId();
        const { clientX, clientY } =
          'changedTouches' in event ? event.changedTouches[0] : event;
        const newNode: AppNode = {
          id,
          type: 'task',
          position: screenToFlowPosition({
            x: clientX,
            y: clientY,
          }),
          data: { content: `Node ${id}` },
        };
        const newEdges = edges.concat({ id, source: connectionState.fromNode.id, target: id });
        const newNodes = nodes.concat(newNode);
        console.log('newNodes', newNodes);
        console.log('newEdges', newEdges);
        setNodes(newNodes);
        setEdges(newEdges);
      }
    },
    [screenToFlowPosition, nodes, edges, setNodes, setEdges],
  );

  return (
    <div className="h-screen w-screen p-8" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd} 
        nodeTypes={nodeTypes}
        fitView
        nodeOrigin={nodeOrigin}
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