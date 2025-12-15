// GraphFlow.tsx: Reusable subcomponent extracted from LayoutFlow for graph editing and visualization
import { ReactFlow, Panel, Background, useReactFlow } from '@xyflow/react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { nodeTypes, type NodeKey, getNextNodeType } from '@/common/node-type';
import { elkOptions, getLayoutedElements } from '@/common/layout-func';
import type { AppState, AppNode } from '@/common/types';
import ShortUniqueId from 'short-uuid';
import React, { useCallback, useEffect } from 'react';

const selector = (s: AppState) => ({
  nodes: s.nodes,
  edges: s.edges,
  onNodesChange: s.onNodesChange,
  onEdgesChange: s.onEdgesChange,
  onConnect: s.onConnect,
  setNodes: s.setNodes,
  setEdges: s.setEdges,
  updateNodeText: s.updateNodeText,
});

const translator = ShortUniqueId();
const getId = () => translator.new();
const nodeOrigin: [number, number] = [0.5, 0];

export default function GraphFlow(storeHook) {
  const { fitView, screenToFlowPosition, getEdges, getNodes } = useReactFlow();

  // ✅ Key: use the current hook store instance for state management
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, setEdges } =
    useStore(storeHook, useShallow(selector));

  const onLayout = useCallback(
    async ({ direction }: { direction: 'DOWN' | 'RIGHT' }) => {
      const opts = { 'elk.direction': direction, ...elkOptions };
      const ns = getNodes();
      const es = getEdges();
      const { nodes: N, edges: E } = await getLayoutedElements(ns, es, opts);
      setNodes(N);
      setEdges(E);
      fitView();
    },
    [getNodes, getEdges, setNodes, setEdges, fitView]
  );

  // If using persist: re-run layout after rehydration to ensure correct node positions (optional)
  useEffect(() => {
  // @ts-expect-error: persist is attached by Zustand middleware if enabled
    storeHook.persist?.onFinishHydration?.(() => onLayout({ direction: 'DOWN' }));
    onLayout({ direction: 'DOWN' });
  }, [storeHook, onLayout]);

  /**
   * Handler for when a connection is attempted but not valid (e.g., dropped on empty space).
   * Creates a new node at the drop position and connects it to the source node.
   */
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: any) => {
      if (!connectionState.isValid) {
        const targetType: NodeKey = getNextNodeType(connectionState.fromNode.type);
        const id = getId();
        const { clientX, clientY } =
          'changedTouches' in event ? event.changedTouches[0] : (event as MouseEvent);

        const newNode: AppNode = {
          id,
          type: targetType,
          position: screenToFlowPosition({ x: clientX, y: clientY }),
          data: { content: `Node ${id}` },
        };
        setNodes(nodes.concat(newNode));
        setEdges(edges.concat({ id, source: connectionState.fromNode.id, target: id, type: 'smoothstep' }));
        // Re-layout the graph after adding the new node and edge
        requestAnimationFrame(() => onLayout({ direction: 'DOWN' }));
      }
    },
    [screenToFlowPosition, nodes, edges, setNodes, setEdges, onLayout]
  );

  return (
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
      onInit={() => onLayout({ direction: 'DOWN' })}
    >
      <Panel position="bottom-right">
        <Button className="xy-theme__button" onClick={() => onLayout({ direction: 'DOWN' })}>
          vertical layout
        </Button>
        <Button className="xy-theme__button" onClick={() => onLayout({ direction: 'RIGHT' })}>
          horizontal layout
        </Button>
      </Panel>
      <Background />
    </ReactFlow>
  );
}