import '@xyflow/react/dist/style.css';

import {
  Background,
  ReactFlowProvider,
  ReactFlow,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { nodeTypes, type NodeKey, getNextNodeType } from '@/common/node-type';


import React, { useCallback,  useRef } from 'react';
import { Button } from '@/components/ui/button';
import useDgStore from '@/common/store';


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
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, setEdges, updateNodeText } = useDgStore(
    useShallow(selector),
  );
  const { fitView, screenToFlowPosition, getEdges, getNodes } = useReactFlow();

  const onLayout = useCallback(
    ({ direction }) => {
      const opts = { 'elk.direction': direction, ...elkOptions };
      console.log('onLayout', getNodes(), getEdges());
      const ns = getNodes();
      const es = getEdges();

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

  // useLayoutEffect(() => {
  //   onLayout({ direction: 'DOWN', useInitialNodes: true });
  // }, []);

  const onConnectEnd = useCallback(
    (event, connectionState) => {
      console.log('onConnectEnd', event, connectionState);
      // when a connection is dropped on the pane it's not valid
      if (!connectionState.isValid) {
        // we need to remove the wrapper bounds, in order to get the correct position
        const targetType: NodeKey = getNextNodeType(connectionState.fromNode.type);
        console.log('sourceType', targetType);
        const id = getId();
        const { clientX, clientY } =
          'changedTouches' in event ? event.changedTouches[0] : event;
        const newNode: AppNode = {
          id,
          type: targetType,
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
        requestAnimationFrame(() => {
          console.log('updated', getNodes(), getEdges());
          onLayout({ direction: 'DOWN' });
        });
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
        onInit={(instance) => {
          console.log("React Flow ready", instance.getNodes(), instance.getEdges());
          onLayout({ direction: 'DOWN' });
        }}
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