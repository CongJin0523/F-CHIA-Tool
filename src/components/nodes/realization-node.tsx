import { useCallback, useState } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { Sparkles } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";

export type RealizationNode = Node<{
  content: string;
}>;



export function RealizationNode({ id, data }: NodeProps<RealizationNode>) {
  const { updateNodeData, setNodes } = useReactFlow();


  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  }, [id, setNodes]);
  
  const [content, setContent] = useState(data.content);

  return (
    <BaseNode className="w-40 border-sky-200 bg-sky-50">
      <NodeHeader
        icon={Sparkles}
        title="Realization"
        bgColor="bg-sky-200"
        textColor="text-sky-900"
        onDelete={handleDelete}
      />
      <BaseHandle id={`${id}-source`} type="source" position={Position.Top} className="nodrag" /> 
      <BaseNodeContent>
        <EditableText
          content={content}
          onChange={(value) => setContent(value)}
        /> 
      </BaseNodeContent>
      <BaseHandle id={`${id}-target`} type="target" position={Position.Bottom} className="nodrag" />
    </BaseNode>
  );
}
RealizationNode.displayName = "RealizationNode";