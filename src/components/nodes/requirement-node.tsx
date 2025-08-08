import { useCallback, } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { BadgeCheck } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";
import { useDgStore } from '@/common/store';
export type RequirementNode = Node<{
  content: string;
}>;



export function RequirementNode({ id, data }: NodeProps<RequirementNode>) {
  const { setNodes, setEdges } = useReactFlow();
  const updateNodeText = useDgStore((state) => state.updateNodeText);

  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  }, [id, setNodes, setEdges]);
  

  return (
    <BaseNode className="w-40 border-rose-200 bg-rose-50">
      <NodeHeader
        icon={BadgeCheck}
        title="Requirement"
        bgColor="bg-rose-200"
        textColor="text-rose-900"
        onDelete={handleDelete}
      />
      <BaseHandle id={`${id}-target`} type="target" position={Position.Top} className="nodrag" /> 
      <BaseNodeContent>
        <EditableText
          content={data.content}
          onChange={(value) => updateNodeText(id, value)}
        />
      </BaseNodeContent>
    </BaseNode>
  );
}
RequirementNode.displayName = "RequirementNode";