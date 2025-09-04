import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { type FtaNodeTypes, nodeTypes } from '@/common/fta-node-type';
import TaskSelector from '@/components/FTA/component/taskSelecter';
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

export default function FtaDiagram() {
  return (
    <div className="h-screen w-screen p-8">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
      >
        <Background />
        <Controls />
        <TaskSelector />
      </ReactFlow>
    </div>
  );
}