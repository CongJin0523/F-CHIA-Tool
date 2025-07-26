import { useCallback, useState } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { ClipboardCheck } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";

export type TaskNode = Node<{
  content: string;
}>;



export function TaskNode({ id, data }: NodeProps<TaskNode>) {
  const { updateNodeData, setNodes } = useReactFlow();


  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  }, [id, setNodes]);
  
  const [content, setContent] = useState(data.content);

  return (
    <BaseNode className="w-40 border-green-200 bg-green-50">
      <NodeHeader
        icon={ClipboardCheck}
        title="Task"
        bgColor="bg-green-200"
        textColor="text-green-900"
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
TaskNode.displayName = "TaskNode";