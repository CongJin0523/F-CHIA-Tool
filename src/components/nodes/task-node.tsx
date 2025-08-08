import { useCallback, } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { ClipboardCheck } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";
import { useDgStore } from '@/common/store';
export type TaskNode = Node<{
  content: string;
}>;



export function TaskNode({ id, data }: NodeProps<TaskNode>) {
  const { setNodes, setEdges } = useReactFlow();
  const updateNodeText = useDgStore((state) => state.updateNodeText);

  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  }, [id, setNodes, setEdges]);
  
  return (
    <BaseNode className="w-40 border-green-200 bg-green-50">
      <NodeHeader
        icon={ClipboardCheck}
        title="Task"
        bgColor="bg-green-200"
        textColor="text-green-900"
        onDelete={handleDelete}
      />
      <BaseHandle id={`${id}-target`} type="target" position={Position.Top} className="nodrag" /> 
      <BaseNodeContent>
        <EditableText
          content={data.content}
          onChange={(value) => updateNodeText(id, value)}
        />
      </BaseNodeContent>
      <BaseHandle id={`${id}-source`} type="source" position={Position.Bottom} className="nodrag" />
    </BaseNode>
  );
}
TaskNode.displayName = "TaskNode";