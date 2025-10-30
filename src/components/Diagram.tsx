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
  getNodesBounds, getViewportForBounds
} from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { nodeTypes, type NodeKey, getNextNodeType } from '@/common/node-type';
import DownloadButton from '@/components/DownloadButton';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import useDgStore from '@/store/dg-store';
import { toast } from "sonner"
import { useStore } from 'zustand';
import ShortUniqueId from 'short-uuid';

import type { AppNode, AppState } from '@/common/types';

import { useZoneStore } from '@/store/zone-store';
import { getGraphStoreHook } from '@/store/graph-registry';

import { Workflow } from 'lucide-react';
import Tooltip from '@mui/material/Tooltip';
import Fab from "@mui/material/Fab";
import { grey } from '@mui/material/colors';
const buttonColor = grey[500];

//toPng
import { useLocation, useNavigate } from "react-router";
import { toPng } from "html-to-image";

declare global {
  interface Window {
    FlowCapture?: {
      zoneId?: string;
      ready: boolean;
      capture: (opts?: {
        width?: number;
        height?: number;
        pixelRatio?: number;
        bg?: string;
      }) => Promise<string>;
    };
  }
}
const raf = () => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(r)));
const waitFor = async (check: () => boolean, timeout = 8000, every = 50) => {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeout) return false;
    await new Promise(r => setTimeout(r, every));
  }
  return true;
};
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
  const { fitView, getEdges } = useReactFlow();
  const rf = useReactFlow();
  const selectedId = zoneId;
  useEffect(() => {
    let alive = true;

    // (re)arm FlowCapture for the currently selected zone
    window.FlowCapture = {
      zoneId: selectedId,
      ready: false,
      capture: async (opts) => {
        const {
          width = 1920,
          height = 1080,
          pixelRatio = Math.min(3, window.devicePixelRatio || 1),
          bg = "#ffffff",
        } = opts || {};

        // ensure nodes are measured before computing viewport
        await raf();
        await waitFor(() => {
          const ns = rf.getNodes();
          return ns.length > 0 && ns.every(n => !!n.width && !!n.height);
        }, 3000, 60);

        // IMPORTANT: use hooks API values so subflows/handles are correct
        const nodes = rf.getNodes();
        const bounds = getNodesBounds(nodes);
        const vp = getViewportForBounds(bounds, width, height, 0.5, 2);

        const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement | null;
        if (!viewportEl) throw new Error("Flow viewport not found");

        // // optional small badge
        const prevPos = viewportEl.style.position;
        if (!prevPos) viewportEl.style.position = "relative";

        try {
          const dataUrl = await toPng(viewportEl, {
            backgroundColor: bg,
            width,
            height,
            pixelRatio,
            cacheBust: true,
            style: {
              width: `${width}px`,
              height: `${height}px`,
              transformOrigin: "0 0",
              transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`,
            } as any,
          });
          return dataUrl;
        } finally {
          // cleanup
          try { viewportEl.removeChild(badge); } catch {}
          if (!prevPos) viewportEl.style.position = "";
        }
      },
    };

    (async () => {
      // let React Flow mount twice
      await raf();
      await raf();

      // wait until nodes are mounted & measured (width/height present)
      await waitFor(() => {
        const ns = rf.getNodes();
        // edges presence isn't strictly required for capture, focus on node measurement
        return ns.length > 0 && ns.every(n => !!n.width && !!n.height);
      }, 3000, 80);

      if (!alive) return;

      if (window.FlowCapture) {
        window.FlowCapture.zoneId = selectedId;
        window.FlowCapture.ready = true;
      }
      // signal to the outside world that this zone is capture-ready
      window.dispatchEvent(new CustomEvent("flow:ready", { detail: { zoneId: selectedId } }));
    })();

    return () => {
      alive = false;
      // mark not-ready; leave the object so listeners don't crash during route swaps
      if (window.FlowCapture?.zoneId === selectedId) {
        window.FlowCapture.ready = false;
      }
    };
  }, [rf, selectedId]);
  const onLayout = useCallback(
    ({ direction }: { direction: 'DOWN' | 'RIGHT' }) => {
      storeOnLayout(direction);
      // Fit view after layout
      setTimeout(() => fitView(), 100);
    },
    [storeOnLayout, fitView],
  );


  const onConnect = useCallback((params) => {
    const ns = rf.getNodes();
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
  }, [rf, getEdges, setEdges]);

  const onBeforeDelete = useCallback(
    ({ nodes, edges }: { nodes: AppNode[]; edges: Edge[] }) => {
      console.log('onBeforeDelete called with nodes:', nodes, 'edges:', edges);
      if (nodes?.length) {
        // Inform the user that nodes cannot be deleted
        toast.warning("Deleting nodes is disabled. You can only delete edges.");
        return { nodes: [], edges: [] };
      }
      // Block node deletions but allow edge deletions
      return { nodes: [], edges };
    },
    []
  );

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
        onBeforeDelete={onBeforeDelete}
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