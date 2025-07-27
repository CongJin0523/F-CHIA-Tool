import { useCallback, useState } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { Quote } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from '@/components/nodes//subComponents/editable-text';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type GuideWordNode = Node<{
  content: string;
}>;



export function GuideWordNode({ id, data }: NodeProps<GuideWordNode>) {
  const { updateNodeData, setNodes } = useReactFlow();


  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  }, [id, setNodes]);
  
  const [content, setContent] = useState(data.content || "no");

  return (
    <BaseNode className="w-40 border-fuchsia-200 bg-fuchsia-50">
      <NodeHeader
        icon={Quote}
        title="Guide Word"
        bgColor="bg-fuchsia-200"
        textColor="text-fuchsia-900"
        onDelete={handleDelete}
      />
      <BaseHandle id={`${id}-target`} type="target" position={Position.Top} className="nodrag" /> 
      <BaseNodeContent>
        <Select value={content} onValueChange={(value) => setContent(value)}>
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
      <BaseHandle id={`${id}-source`} type="source" position={Position.Bottom} className="nodrag" />
    </BaseNode>
  );
}
GuideWordNode.displayName = "GuideWordNode";