import { useCallback, useState } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { BadgeCheck } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";

export type RequirementNode = Node<{
  content: string;
}>;



export function RequirementNode({ id, data }: NodeProps<RequirementNode>) {
  const { updateNodeData, setNodes } = useReactFlow();


  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  }, [id, setNodes]);
  
  const [content, setContent] = useState(data.content);

  return (
    <BaseNode className="w-40 border-rose-200 bg-rose-50">
      <NodeHeader
        icon={BadgeCheck}
        title="Requirement"
        bgColor="bg-rose-200"
        textColor="text-rose-900"
        onDelete={handleDelete}
      />
      <BaseHandle id={`${id}-source`} type="source" position={Position.Top} className="nodrag" /> 
      <BaseNodeContent>
        <EditableText
          content={content}
          onChange={(value) => setContent(value)}
        /> 
      </BaseNodeContent>
    </BaseNode>
  );
}
RequirementNode.displayName = "RequirementNode";