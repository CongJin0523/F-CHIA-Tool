import { useCallback, useState } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { Settings2 } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";

export type FunctionNode = Node<{
  content: string;
}>;



export function FunctionNode({ id, data }: NodeProps<FunctionNode>) {
  const { updateNodeData, setNodes } = useReactFlow();


  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  }, [id, setNodes]);
  
  const [content, setContent] = useState(data.content);

  return (
    <BaseNode className="w-40 border-yellow-200 bg-yellow-50">
      <NodeHeader
        icon={Settings2}
        title="Function"
        bgColor="bg-yellow-200"
        textColor="text-yellow-900"
        onDelete={handleDelete}
      />
      <BaseHandle id={`${id}-target`} type="target" position={Position.Top} className="nodrag" /> 
      <BaseNodeContent>
        <EditableText
          content={content}
          onChange={(value) => setContent(value)}
        /> 
      </BaseNodeContent>
      <BaseHandle id={`${id}-source`} type="source" position={Position.Bottom} className="nodrag" />
    </BaseNode>
  );
}
FunctionNode.displayName = "FunctionNode";