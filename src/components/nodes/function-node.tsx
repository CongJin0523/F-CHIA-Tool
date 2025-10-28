import { useCallback, useMemo, useRef, useState, } from 'react';
import { BaseHandle } from '@/components/base-handle';
import { toast } from 'sonner';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { Settings2, Plus } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow, type ConnectionState, NodeToolbar } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";
import { useDgStore } from '@/store/dg-store';
import { motion } from 'motion/react';
import { useZoneStore } from '@/store/zone-store';
import { getGraphStoreHook } from '@/store/graph-registry';
export type FunctionNode = Node<{
  content: string;
}>;
import { nodeTypes, type NodeKey, getNextNodeType } from '@/common/node-type';
import {
  NodeTooltip,
  NodeTooltipContent,
  NodeTooltipTrigger,
} from "@/components/node-tooltip";
import { Button } from '../ui/button';
import { getId } from '@/common/utils/uuid';
import { elkOptions, getLayoutedElements } from '@/common/layout-func';


export function FunctionNode({ id, data }: NodeProps<FunctionNode>) {
  // console.log('CauseNode props:', { id, data });
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const zoneId: string = useZoneStore((s) => s.selectedId);
  // console.log('CauseNode render, zoneId:', zoneId);
  const storeHook = useMemo(() => (getGraphStoreHook(zoneId)), [zoneId]);
  const updateNodeText = storeHook((state) => state.updateNodeText);

  const handleDelete = useCallback(() => {
    const es = getEdges?.() ?? [];
    const hasOutgoing = es.some((e) => e.source === id);

    if (hasOutgoing) {
      // Block deletion when there are connections from this node's source handle
      try {
        toast.error('Cannot delete node with outgoing connections. Remove outgoing edges first.');
      } catch {
        console.warn('Cannot delete node with outgoing connections. Remove outgoing edges first.');
      }
      return;
    }
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  }, [id, setNodes, setEdges, getEdges]);

  const [showToolbar, setShowToolbar] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowToolbar(true);
  };
  const handleAddNode = useCallback(async () => {
    const ns = getNodes();
    const es = getEdges();
    const sourceNode = ns.find((n) => n.id === id);
    if (!sourceNode) {
      console.warn('FunctionNode: source node not found', id);
      return;
    }

    const targetType = getNextNodeType(sourceNode.type as NodeKey);
    if (!targetType) {
      console.warn('FunctionNode: cannot determine target type for', sourceNode.type);
      return;
    }

    const newId = getId();

    // Create the new node and edge
    const newNode = {
      id: newId,
      type: targetType,
      position: { x: 0, y: 0 }, // Will be set by layout
      data: { content: "" },
    };

    const newEdge = {
      id: `${sourceNode.id}-${newId}`,
      source: sourceNode.id,
      target: newId,
      type: 'default' as const,
    };
    const opts = { 'elk.direction': "DOWN", ...elkOptions };
    try {
      const result = await getLayoutedElements([...ns, newNode], [...es, newEdge], opts);
      if (result) {
        // Type cast the result to maintain AppNode types
        setNodes(result.nodes);
        setEdges(result.edges);
      }
    } catch (error) {
      console.error('Layout failed:', error);
    }

  }, [getNodes, getEdges, setNodes, setEdges, id]);


  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowToolbar(false);
      hideTimeoutRef.current = null;
    }, 200); // 200ms 延迟隐藏
  };
  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      <NodeToolbar isVisible={showToolbar} position={Position.Bottom}>
        <Button size="sm" variant="secondary" className="rounded-full " onClick={handleAddNode}>
          <Plus />
        </Button>
      </NodeToolbar>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "tween", ease: "easeInOut", duration: 0.4 }} >
        <NodeTooltip>
          <NodeTooltipContent position={Position.Top} className="text-center">
            Tip: Describe the intended system behavior supporting the task.
            <br />
            e.g. “Provide steering control through hydraulic system.”
          </NodeTooltipContent>
          <BaseNode className="w-40 border-yellow-200 bg-yellow-50 nodrag">
            <NodeTooltipTrigger>
              <NodeHeader
                icon={Settings2}
                title="Function"
                bgColor="bg-yellow-200"
                textColor="text-yellow-900"
                onDelete={handleDelete}
              />
              <BaseNodeContent key={data.content}>
                <EditableText
                  content={data.content}
                  onChange={(value) => updateNodeText(id, value)}
                />
              </BaseNodeContent>
            </NodeTooltipTrigger>
          </BaseNode>
        </NodeTooltip>
      </motion.div>
      <BaseHandle id={`${id}-target`} type="target" position={Position.Top} className="nodrag" />
      <BaseHandle id={`${id}-source`} type="source" position={Position.Bottom} className="nodrag" />
    </div>
  );
}
FunctionNode.displayName = "FunctionNode";