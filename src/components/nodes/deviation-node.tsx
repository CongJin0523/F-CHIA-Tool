import { useCallback, useState } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { ArrowBigDownDash } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";

export type DeviationNode = Node<{
  content: string;
}>;



export function DeviationNode({ id, data }: NodeProps<DeviationNode>) {
  const { updateNodeData, setNodes } = useReactFlow();


  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  }, [id, setNodes]);
  
  const [content, setContent] = useState(data.content);

  return (
    <BaseNode className="w-40 border-orange-200 bg-orange-50">
      <NodeHeader
        icon={ArrowBigDownDash}
        title="Deviation"
        bgColor="bg-orange-200"
        textColor="text-orange-900"
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
DeviationNode.displayName = "DeviationNode";