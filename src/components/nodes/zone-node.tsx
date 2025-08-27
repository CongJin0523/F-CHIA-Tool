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
import { useDgStore } from '@/store/dg-store';
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


const selector = (connection: ConnectionState) => {
  return connection.inProgress;
};

export function ZoneNode({ id, data }: NodeProps<ZoneNode>) {
  const { setNodes, setEdges } = useReactFlow();
  const zoneId = useZoneStore((s) => s.selectedId);
  const storeHook = useMemo(() => (getGraphStoreHook(zoneId)), [zoneId]);
  const updateNodeText = storeHook((state) => state.updateNodeText);
  const [showToolbar, setShowToolbar] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  }, [id, setNodes, setEdges]);
  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowToolbar(true);
  };

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
        <Button size="sm" variant="secondary" className="rounded-full">
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
          <BaseNode className="w-40 border-violet-200 bg-violet-50 nodrag">
            <NodeTooltipTrigger>
              <NodeHeader
                icon={Globe}
                title="Zone"
                bgColor="bg-violet-200"
                textColor="text-violet-900"
                onDelete={handleDelete}
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