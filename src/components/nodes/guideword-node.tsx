import { useCallback } from 'react';
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
export type GuideWordNode = Node<{
  content: string;
}>;



export function GuideWordNode({ id, data }: NodeProps<GuideWordNode>) {
  const { setNodes, setEdges } = useReactFlow();
  const updateNodeText = useDgStore((state) => state.updateNodeText);

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
    <BaseNode className="w-40 border-fuchsia-200 bg-fuchsia-50">
      <NodeHeader
        icon={Quote}
        title="Guide Word"
        bgColor="bg-fuchsia-200"
        textColor="text-fuchsia-900"
        onDelete={handleDelete}
      />
      <BaseNodeContent>
        <Select value={data.content} onValueChange={(value) => updateNodeText(id, value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a guide word" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no">no</SelectItem>
            <SelectItem value="other than">other than</SelectItem>
            <SelectItem value="part of">part of</SelectItem>
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