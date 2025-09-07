import React, { useRef, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  useReactFlow,
  Background,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DnDProvider, useDnD } from '@/components/FTA/component/DnDContext';
import { type FtaNodeTypes, nodeTypes } from '@/common/fta-node-type';
import TaskSelector from '@/components/FTA/component/taskSelecter';
import Sidebar from '@/components/FTA/component/Sidebar';
import { set } from 'zod';
const initialNodes: FtaNodeTypes[] = [
  {
    id: 't1',
    position: { x: -100, y: -100 },
    data: { content: 'apple, river, glow' },
    type: 'topEvent',
  },
  {
    id: 'n1',
    position: { x: 0, y: 0 },
    data: { content: 'apple, river, glow' },
    type: 'interEvent',
  },

  {
    id: 'n2',
    position: { x: 100, y: 100 },
    data: { content: 'Node 2' },
    type: 'logic',
  },
  {
    id: 'n3',
    position: { x: 200, y: 200 },
    data: { content: 'Node 3' },
    type: 'basicEvent',
  },
];

const initialEdges = [
  {
    id: 't1-n1',
    source: 't1',
    target: 'n1',
    type: 'smoothstep',
  },
  {
    id: 'n1-n2',
    source: 'n1',
    target: 'n2',
    type: 'smoothstep',
  },
  {
    id: 'n2-n3',
    source: 'n2',
    target: 'n3',
    type: 'smoothstep',
  },
];
let id = 0;
const getId = () => `dndnode_${id++}`;
function FtaFlow() {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();
  const [type, setType] = useDnD();
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      // check if the dropped element is valid
      if (!type) {
        return;
      }

      // project was renamed to screenToFlowPosition
      // and you don't need to subtract the reactFlowBounds.left/top anymore
      // details: https://reactflow.dev/whats-new/2023-11-10
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = {
        id: getId(),
        type,
        position,
        data: { content: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, type, setNodes],
  );

  const onDragStart = (event, nodeType) => {
    setType(nodeType);
    event.dataTransfer.setData('text/plain', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };


  return (
    <div className="h-screen w-screen flex">
      <aside className="w-80 border-l bg-white overflow-auto">
        <Sidebar />
      </aside>
      <div className="flex-1 p-8" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>

    </div>
  );
}


export default function FtaDiagram() {
  return (
    <ReactFlowProvider>
      <DnDProvider>
        <FtaFlow />
      </DnDProvider>
    </ReactFlowProvider>
  );
}