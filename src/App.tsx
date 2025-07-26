import '@xyflow/react/dist/style.css';

import {
  Background,
  ReactFlowProvider,
  ReactFlow,
  type OnConnect,
  Position,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  type Edge,
  type Node,
  useReactFlow,
} from '@xyflow/react';

import { nodeTypes } from '@/common/node-type';


import ELK from 'elkjs/lib/elk.bundled.js';
import React, { useCallback, useLayoutEffect } from 'react';
import { Button } from './components/ui/button';

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



const initialNodes: Node[] = [
  { id: 'a', type: 'zone', data: { content: 'apple, river, glow' }, position: { x: 0, y: 0 } },
  { id: 'b-1', type: 'task', data: { content: 'b-1 node' }, position: { x: 200, y: -50 } },
  { id: 'b-2', type: 'task', data: { content: 'b-2 node' }, position: { x: 200, y: 50 } },
  { id: 'c-1', type: 'function', data: { content: 'c-1' }, position: { x: 400, y: -100 } },
  { id: 'c-2', type: 'function', data: { content: 'c-2' }, position: { x: 400, y: 0 } },
  { id: 'c-3', type: 'function', data: { content: 'c-3' }, position: { x: 400, y: 100 } },
  { id: 'c-4', type: 'function', data: { content: 'c-4' }, position: { x: 400, y: 200 } },
  { id: 'd', type: 'realization', data: { content: 'realization node' }, position: { x: 0, y: 200 } },
  { id: 'e', type: 'properties', data: { content: 'properties node' }, position: { x: 200, y: 200 } },
  { id: 'f', type: 'guideword', data: { content: 'guideword node' }, position: { x: 400, y: 200 } },
  { id: 'g', type: 'deviation', data: { content: 'deviation node' }, position: { x: 0, y: 400 } },
  { id: 'h', type: 'cause', data: { content: 'cause node' }, position: { x: 200, y: 400 } },
  { id: 'i', type: 'consequence', data: { content: 'consequence node' }, position: { x: 400, y: 400 } },
  { id: 'j', type: 'requirement', data: { content: 'requirement node' }, position: { x: 0, y: 600 } },
];

const initialEdges: Edge[] = [
  { id: 'a-b1', source: 'a', target: 'b-1', type: 'smoothstep' },
  { id: 'a-b2', source: 'a', target: 'b-2', type: 'smoothstep' },
  { id: 'b1-c1', source: 'b-1', target: 'c-1', type: 'smoothstep' },
  { id: 'b1-c2', source: 'b-1', target: 'c-2', type: 'smoothstep' },
  { id: 'b2-c3', source: 'b-2', target: 'c-3', type: 'smoothstep' },
  { id: 'b2-c4', source: 'b-2', target: 'c-4', type: 'smoothstep' },
  { id: 'c-d', source: 'c-1', target: 'd', type: 'smoothstep' },
  { id: 'd-e', source: 'd', target: 'e', type: 'smoothstep' },
  { id: 'e-f', source: 'e', target: 'f', type: 'smoothstep' },
  { id: 'f-g', source: 'f', target: 'g', type: 'smoothstep' },
  { id: 'g-h', source: 'g', target: 'h', type: 'smoothstep' },
  { id: 'h-i', source: 'h', target: 'i', type: 'smoothstep' },
  { id: 'i-j', source: 'i', target: 'j', type: 'smoothstep' },
];

function LayoutFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const onConnect: OnConnect = useCallback(
    (params) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot))
    ,
    [],
  );
  const onLayout = useCallback(
    ({ direction, useInitialNodes = false }) => {
      const opts = { 'elk.direction': direction, ...elkOptions };
      const ns = useInitialNodes ? initialNodes : nodes;
      const es = useInitialNodes ? initialEdges : edges;

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
      />
      <Panel position="top-right">
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