import '@xyflow/react/dist/style.css';
import {
  Background,
  ReactFlowProvider,
  ReactFlow,
  Panel,
  useReactFlow,
  type Edge,
  addEdge,
  Controls,
} from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { nodeTypes, type NodeKey, getNextNodeType } from '@/common/node-type';
import DownloadButton from '@/components/DownloadButton';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import useDgStore from '@/store/dg-store';
import { toast } from "sonner"
import { useStore } from 'zustand';
import ShortUniqueId from 'short-uuid';

import type { AppState } from '@/common/types';

import { useZoneStore } from '@/store/zone-store';
import { getGraphStoreHook } from '@/store/graph-registry';

import { Workflow } from 'lucide-react';
import Tooltip from '@mui/material/Tooltip';
import Fab from "@mui/material/Fab";
import { grey } from '@mui/material/colors';
const buttonColor = grey[500];

const selector = (state: AppState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  updateNodeText: state.updateNodeText,
  onLayout: state.onLayout,
});
const translator = ShortUniqueId();

const getId = () => translator.new();
const nodeOrigin: [number, number] = [0.5, 0];
function LayoutFlow({ zoneId }: { zoneId: string }) {
  // console.log('LayoutFlow render, zoneId:', zoneId);
  const storeHook = useMemo(() => getGraphStoreHook(zoneId), [zoneId]);

  const reactFlowWrapper = useRef(null);
  const { nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges, updateNodeText, onLayout: storeOnLayout } = useStore(storeHook,
    useShallow(selector),
  );
  const { fitView, getEdges, getNodes } = useReactFlow();

  const onLayout = useCallback(
    ({ direction }: { direction: 'DOWN' | 'RIGHT' }) => {
      storeOnLayout(direction);
      // Fit view after layout
      setTimeout(() => fitView(), 100);
    },
    [storeOnLayout, fitView],
  );

  // useLayoutEffect(() => {
  //   onLayout({ direction: 'DOWN', useInitialNodes: true });
  // }, []);
  const onConnect = useCallback((params) => {
    const ns = getNodes();
    const es = getEdges(); // <— 拿到当前边数组（是真数组）

    const sourceNode = ns.find((n) => n.id === params.source);
    const targetNode = ns.find((n) => n.id === params.target);
    if (!sourceNode || !targetNode) {
      console.log("source or target not found");
      return;
    }

    const targetType: NodeKey = getNextNodeType(sourceNode.type);
    if (targetNode.type !== targetType) {
      toast.error("Invalid connection, need to change target node type");
      console.log("Invalid connection, need to change target node type");
      return;
    }

    // 计算新的边数组，然后一次性传“数组”给 zustand 的 setEdges
    const nextEdges = addEdge(params, es);
    console.log('nextEdges', nextEdges);
    setEdges(nextEdges); // <— 关键：不要传函数
  }, [getNodes, getEdges, setEdges]);

  useEffect(() => {
    const handler = () => requestAnimationFrame(() => fitView());
    window.addEventListener('graph-imported', handler);
    return () => window.removeEventListener('graph-imported', handler);
  }, [fitView]);


  return (
    <div className="h-[calc(100vh-52px)] w-full px-4" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        nodeOrigin={nodeOrigin}
        onInit={(instance) => {
          console.log("React Flow ready", instance.getNodes(), instance.getEdges());
          onLayout({ direction: 'DOWN' });
        }}
      >
        <Panel>
          <Tooltip title="Auto Layout">
            <Fab
              size="small"
              color={buttonColor}
              onClick={() => onLayout({ direction: 'DOWN' })}
              sx={{
                position: "fixed",
                right: 18,
                top: "15vh",
                zIndex: (t) => t.zIndex.tooltip + 1,
              }}
            >
              <Workflow />
            </Fab>
          </Tooltip>
        </Panel>
        <Background />
        <DownloadButton />
        <Controls />
      </ReactFlow>
    </div>
  );
};
function Diagram() {
  const zoneId = useZoneStore((s) => s.selectedId);
  console.log('Diagram render, zoneId:', zoneId);
  return (
    <ReactFlowProvider>
      <LayoutFlow key={zoneId} zoneId={zoneId} />
    </ReactFlowProvider>
  );
}
export default Diagram;