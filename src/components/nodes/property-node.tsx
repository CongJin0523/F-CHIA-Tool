import { useCallback, useMemo, useRef, useState, } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { Settings, Plus } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow, type ConnectionState, NodeToolbar } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";
import { useDgStore } from '@/store/dg-store';
export type PropertyNode = Node<{
  content: string;
}>;
import { motion } from 'motion/react';
import { getGraphStoreHook } from '@/store/graph-registry';
import { useZoneStore } from '@/store/zone-store';
import { nodeTypes, type NodeKey, getNextNodeType } from '@/common/node-type';
import {
  NodeTooltip,
  NodeTooltipContent,
  NodeTooltipTrigger,
} from "@/components/node-tooltip";
import { Button } from '../ui/button';
import { getId } from '@/common/utils/uuid';
import { elkOptions, getLayoutedElements } from '@/common/layout-func';

export function PropertyNode({ id, data }: NodeProps<PropertyNode>) {
  // console.log('CauseNode props:', { id, data });
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const zoneId: string = useZoneStore((s) => s.selectedId);
  // console.log('CauseNode render, zoneId:', zoneId);
  const storeHook = useMemo(() => (getGraphStoreHook(zoneId)), [zoneId]);
  const updateNodeText = storeHook((state) => state.updateNodeText);

  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  }, [id, setNodes, setEdges]);
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
      console.warn('PropertyNode: source node not found', id);
      return;
    }

    const targetType = getNextNodeType(sourceNode.type as NodeKey);
    if (!targetType) {
      console.warn('PropertyNode: cannot determine target type for', sourceNode.type);
      return;
    }

    const newId = getId();

    // Create the new node and edge
    const newNode = {
      id: newId,
      type: targetType,
      position: { x: 0, y: 0 }, // Will be set by layout
      data: { content: `Node ${newId}` },
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
            This is a some tip for the node.
            <br />
            The tooltip will appear when you hover over the trigger.
          </NodeTooltipContent>
          <BaseNode className="w-40 border-pink-200 bg-pink-50 nodrag">
            <NodeTooltipTrigger>
              <NodeHeader
                icon={Settings}
                title="Property"
                bgColor="bg-pink-200"
                textColor="text-pink-900"
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
PropertyNode.displayName = "PropertyNode";