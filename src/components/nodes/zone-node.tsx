import { useCallback, useMemo, useRef, useState, } from 'react';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { NodeHeader } from "@/components/nodes/subComponents/node-header";
import { Globe, Plus } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow, type ConnectionState, NodeToolbar } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { BaseHandle } from '../base-handle';
import { nodeTypes, type NodeKey, getNextNodeType } from '@/common/node-type';
import {
  NodeTooltip,
  NodeTooltipContent,
  NodeTooltipTrigger,
} from "@/components/node-tooltip";
export type ZoneNode = Node<{
  content: string;
}>;
import { motion } from 'motion/react';
import { getGraphStoreHook } from '@/store/graph-registry';
import { useZoneStore } from '@/store/zone-store';
import { Button } from '../ui/button';
import { getId } from '@/common/utils/uuid';
import { elkOptions, getLayoutedElements } from '@/common/layout-func';
const selector = (connection: ConnectionState) => {
  return connection.inProgress;
};

export function ZoneNode({ id, data }: NodeProps<ZoneNode>) {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const zoneId = useZoneStore((s) => s.selectedId);
  const storeHook = useMemo(() => (getGraphStoreHook(zoneId)), [zoneId]);
  const updateNodeText = storeHook((state) => state.updateNodeText);
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
      console.warn('ZoneNode: source node not found', id);
      return;
    }

    const targetType = getNextNodeType(sourceNode.type as NodeKey);
    if (!targetType) {
      console.warn('ZoneNode: cannot determine target type for', sourceNode.type);
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
            Tip: Briefly describe what happens in this zone and what hazards may occur.
            <br />
            e.g. “Area for attachments and lifting tools; risk of collision or crush injury.”
          </NodeTooltipContent>
          <BaseNode className="w-40 border-violet-200 bg-violet-50 nodrag">
            <NodeTooltipTrigger>
              <NodeHeader
                icon={Globe}
                title="Zone"
                bgColor="bg-violet-200"
                textColor="text-violet-900"
                onDelete={() => {}}
              />

              <BaseNodeContent key={data.content}>
                <EditableText
                  content={data.content}
                  onChange={(value) => updateNodeText(id, value)}
                />
                {/* <ButtonHandle
          type="target"
          position={Position.Bottom}
          showButton={!connectionInProgress}
        >
          <Button
            onClick={onClick}
            size="sm"
            variant="secondary"
            className="rounded-full"
          >
            <Plus size={10} />
          </Button>
        </ButtonHandle> */}
              </BaseNodeContent>
            </NodeTooltipTrigger>
          </BaseNode>
        </NodeTooltip>
      </motion.div>
      <BaseHandle id={`${id}-source`} type="source" position={Position.Bottom} className="nodrag" />
    </div>
  );
}
ZoneNode.displayName = "ZoneNode";