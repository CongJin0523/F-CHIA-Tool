import '@xyflow/react/dist/style.css';
 
import {
  ReactFlow,
  type OnConnect,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  type Edge,
  type Node,
} from '@xyflow/react';
 
import { NumNode } from '@/components/nodes/num-node';
import { SumNode } from '@/components/nodes/sum-node';
import { ZoneNode } from '@/components/nodes/zone-node';
import { useCallback } from 'react';
import { TaskNode } from './components/nodes/task-node';
 
const nodeTypes = {
  num: NumNode,
  sum: SumNode,
  zone: ZoneNode, 
  task: TaskNode,
};
 
const initialNodes: Node[] = [
  { id: 'a', type: 'zone', data: { content: 'apple, river, glow' }, position: { x: 0, y: 0 } },
  { id: 'b', type: 'task', data: { content: 'task node' }, position: { x: 200, y: 0 } },
];

const initialEdges: Edge[] = [
  
];
 
function App() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
 
  const onConnect: OnConnect = useCallback(
    (params) => 
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot))
    ,
    [],
  );
 
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
      />
    </div>
  );
}
export default App;