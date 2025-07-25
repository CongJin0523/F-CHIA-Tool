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
 


import { useCallback } from 'react';
import { ZoneNode } from '@/components/nodes/zone-node';
import { TaskNode } from '@/components/nodes/task-node';
import { FunctionNode } from '@/components/nodes/function-node';
import { RealizationNode } from '@/components/nodes/realization-node';
import { PropertiesNode } from '@/components/nodes/properties';
import { GuideWordNode } from '@/components/nodes/guideword-node';
import { DeviationNode } from '@/components/nodes/deviation-node';
import { CauseNode } from '@/components/nodes/cause-node';
import { ConsequenceNode } from '@/components/nodes/consequence-node';
import { RequirementNode } from '@/components/nodes/requirement-node';
 
const nodeTypes = {
  zone: ZoneNode, 
  task: TaskNode,
  function: FunctionNode,
  realization: RealizationNode,
  properties: PropertiesNode,
  guideword: GuideWordNode,
  deviation: DeviationNode,
  cause: CauseNode,
  consequence: ConsequenceNode,
  requirement: RequirementNode,
};
 
const initialNodes: Node[] = [
  { id: 'a', type: 'zone', data: { content: 'apple, river, glow' }, position: { x: 0, y: 0 } },
  { id: 'b', type: 'task', data: { content: 'task node' }, position: { x: 200, y: 0 } },
  { id: 'c', type: 'function', data: { content: 'function node' }, position: { x: 400, y: 0 } },
  { id: 'd', type: 'realization', data: { content: 'realization node' }, position: { x: 0, y: 200 } },
  { id: 'e', type: 'properties', data: { content: 'properties node' }, position: { x: 200, y: 200 } },
  { id: 'f', type: 'guideword', data: { content: 'guideword node' }, position: { x: 400, y: 200 } },
  { id: 'g', type: 'deviation', data: { content: 'deviation node' }, position: { x: 0, y: 400 } },
  { id: 'h', type: 'cause', data: { content: 'cause node' }, position: { x: 200, y: 400 } },
  { id: 'i', type: 'consequence', data: { content: 'consequence node' }, position: { x: 400, y: 400 } },
  { id: 'j', type: 'requirement', data: { content: 'requirement node' }, position: { x: 0, y: 600 } },

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