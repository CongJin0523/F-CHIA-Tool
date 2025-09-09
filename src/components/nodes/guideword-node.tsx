import { useCallback, useMemo } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { Quote } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";
import { useDgStore } from '@/store/dg-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion } from 'motion/react';
import { useZoneStore } from '@/store/zone-store';
import { getGraphStoreHook } from '@/store/graph-registry';
import type { IsoMatch } from '@/common/types';
export type GuideWordNode = Node<{
  content: string;
  isoMatches?: IsoMatch[];
}>;



export function GuideWordNode({ id, data }: NodeProps<GuideWordNode>) {
  // console.log('CauseNode props:', { id, data });
  const { setNodes, setEdges } = useReactFlow();
  const zoneId: string = useZoneStore((s) => s.selectedId);
  // console.log('CauseNode render, zoneId:', zoneId);
  const storeHook = useMemo(() => (getGraphStoreHook(zoneId)), [zoneId]);
  const updateNodeText = storeHook((state) => state.updateNodeText);

  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  }, [id, setNodes, setEdges]);


  return (
    <div>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "tween", ease: "easeInOut", duration: 0.4 }} >
        <BaseNode className="w-40 border-fuchsia-200 bg-fuchsia-50 nodrag">
          <NodeHeader
            icon={Quote}
            title="Guide Word"
            bgColor="bg-fuchsia-200"
            textColor="text-fuchsia-900"
            onDelete={handleDelete}
          />
          <BaseNodeContent key={data.content}>
            <Select value={data.content} onValueChange={(value) => updateNodeText(id, value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a guide word" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="No">No</SelectItem>
                <SelectItem value="Other than">Other than</SelectItem>
                <SelectItem value="Part of">Part of</SelectItem>
              </SelectContent>
            </Select>
          </BaseNodeContent>
        </BaseNode>
      </motion.div>
      <BaseHandle id={`${id}-target`} type="target" position={Position.Top} className="nodrag" />
      <BaseHandle id={`${id}-source`} type="source" position={Position.Bottom} className="nodrag" />
    </div>
  );
}
GuideWordNode.displayName = "GuideWordNode";