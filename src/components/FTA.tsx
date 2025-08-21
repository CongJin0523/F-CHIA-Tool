import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { type FtaNodeTypes, nodeTypes } from '@/common/fta-node-type';
const initialNodes: FtaNodeTypes[] = [
  {
    id: 'n1',
    position: { x: 0, y: 0 },
    data: { content: 'apple, river, glow' },
    type: 'resultEvent',
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
      </ReactFlow>
    </div>
  );
}