// pages/FtaDiagram.tsx
import { useRef, useCallback, useEffect, useMemo } from 'react';
import { ReactFlow, ReactFlowProvider, addEdge, Controls, useReactFlow, Background, Panel, type Edge } from '@xyflow/react';
import Tooltip from '@mui/material/Tooltip';
import Fab from '@mui/material/Fab';
import { Workflow } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { DnDProvider, useDnD } from '@/components/FTA/component/DnDContext';
import { type FtaNodeTypes, nodeTypes } from '@/common/fta-node-type';
import { getFtaStoreHook } from '@/store/fta-registry';
import { useSearchParams } from 'react-router-dom';
import { listAllFtaTasks } from '@/common/fta-storage';
import type { FtaState } from '@/store/fta-store';
import DownloadButton from '@/components/DownloadButton';
import { grey } from '@mui/material/colors';
const buttonColor = grey[500];
const selector = (s: FtaState) => ({
  nodes: s.nodes,
  edges: s.edges,
  setNodes: s.setNodes,
  setEdges: s.setEdges,
  onNodesChange: s.onNodesChange,
  onEdgesChange: s.onEdgesChange,
  onLayout: s.onLayout,
});

import ShortUniqueId from 'short-uuid';
const translator = ShortUniqueId();
const getId = () => translator.new();

function ensureTopIfEmpty(hook: any, taskId: string, fitView?: () => void) {
  const st = hook.getState();
  if (!st.nodes || st.nodes.length === 0) {
    const topId = `top-${taskId}`;
    const seed: FtaNodeTypes[] = [{
      id: topId,
      type: 'topEvent',
      position: { x: 0, y: 0 },
      data: { content: `Top Event of ${taskId}` },
    }];
    st.setNodes(seed);
    st.setEdges([]);
    st.onLayout?.('DOWN');
    requestAnimationFrame(() => fitView?.());
  }
}

function FtaCanvas({ zoneId, taskId }: { zoneId: string; taskId: string }) {
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const rf = useReactFlow();
  // store hook is always created because zoneId/taskId are guaranteed by wrapper
  const ftaHook = useMemo(() => getFtaStoreHook(zoneId, taskId), [zoneId, taskId]);

  const { nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges, onLayout: storeOnLayout } =
    useStore(ftaHook, useShallow(selector));

  const { screenToFlowPosition, fitView } = useReactFlow();
  const [type, setType] = useDnD();

  // 初次/切换时，若为空自动建 topEvent
  useEffect(() => {
    ensureTopIfEmpty(ftaHook, taskId, fitView);
  }, [ftaHook, taskId, fitView]);

  const onConnect = useCallback((params: any) => {
    setEdges(addEdge(params, edges));
  }, [edges, setEdges]);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    (event.dataTransfer as DataTransfer).dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: any) => {
    event.preventDefault();
    if (!type) return;

    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const newNode: FtaNodeTypes = { id: getId(), type, position, data: { content: `${type} node` } };
    setNodes(nodes.concat(newNode));
  }, [type, screenToFlowPosition, nodes, setNodes]);

  const onDragStart = (event: any, nodeType: string) => {
    setType(nodeType);
    event.dataTransfer.setData('text/plain', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onLayout = useCallback(
    ({ direction }: { direction: 'DOWN' | 'RIGHT' }) => {
      storeOnLayout(direction);
      setTimeout(() => fitView(), 100);
    },
    [storeOnLayout, fitView],
  );
  const onBeforeDelete = useCallback((params: { nodes?: FtaNodeTypes[]; edges?: Edge[] }) => {
    console.log("onBeforeDelete", params);
    const nodesToDelete = params?.nodes ?? [];
    // allow edge-only deletions
    if (!nodesToDelete.length) return true;

    const es = rf.getEdges();
    // If any node has an outgoing edge, block deletion
    const blocked = nodesToDelete.filter((n: any) => es.some((e) => e.source === n.id));
    if (blocked.length > 0) {
      // Optional: show which nodes caused the block
      try {
        const names = blocked
          .map((n: any) => n?.data?.label || n?.data?.text || n?.id)
          .filter(Boolean)
          .join(", ");
        toast.error(
          names ? `Cannot delete: ${names}. Remove outgoing connections first.` : "Cannot delete node with outgoing connections. Remove outgoing edges first."
        );
      } catch {
        toast.error("Cannot delete node with outgoing connections. Remove outgoing edges first.");
      }
      return false;
    }
    return true;
  }, [rf]);
  return (
    <div className="h-[calc(100vh-52px)] w-full flex">
      {/* <aside className="w-80 border-l bg-white overflow-auto">
d
        <TaskSelectorLocal />
        <NodeSelector />
      </aside> */}

      <div className="flex-1 p-2" ref={reactFlowWrapper}>
        <ReactFlow
          key={`${zoneId}:${taskId}`}
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
          onBeforeDelete={onBeforeDelete}
        >

          <Controls />
          <Background />
          <DownloadButton />
          <Panel>
            <Tooltip title="Auto Layout" >
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
        </ReactFlow>
      </div>
    </div>
  );
}

function FtaFlow() {
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const [params] = useSearchParams();

  // 1) 读取所有 zone 下的 FTA
  const all = useMemo(() => listAllFtaTasks(), []);
  // 2) URL params 优先，没有就用列表第一个兜底
  const zoneParam = params.get('zone');
  const taskParam = params.get('task');
  const zoneId = zoneParam ?? all[0]?.zoneId ?? null;
  const taskId = taskParam ?? (zoneId ? all.find(a => a.zoneId === zoneId)?.taskId : null) ?? null;

  // 3) 没有任何 FTA —— 空态
  if (!zoneId || !taskId) {
    return (
      <div className="h-screen w-screen flex">
        <div className="flex-1 p-8 flex items-center justify-center text-sm text-muted-foreground">
          No FTA found. Please create one from the table, then come back.
        </div>
      </div>
    );
  }

  // 4) 有了 zoneId/taskId 再渲染真正的画布组件（内部再使用 hooks）
  return <FtaCanvas zoneId={zoneId} taskId={taskId} />;
}
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/FTA/component/app-sidebar"
import { toast } from 'sonner';

export default function FtaDiagram() {
  return (
    <ReactFlowProvider>
      <DnDProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarTrigger />
          <FtaFlow />
        </SidebarProvider>
      </DnDProvider>
    </ReactFlowProvider >
  );
}