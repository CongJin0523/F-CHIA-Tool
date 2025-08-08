import { useCallback, } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { Sparkles } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";
import { useDgStore } from '@/common/store';
export type RealizationNode = Node<{
  content: string;
}>;



export function RealizationNode({ id, data }: NodeProps<RealizationNode>) {
  const { setNodes, setEdges } = useReactFlow();
  const updateNodeText = useDgStore((state) => state.updateNodeText);

  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  }, [id, setNodes, setEdges]);
  

  return (
    <BaseNode className="w-40 border-sky-200 bg-sky-50">
      <NodeHeader
        icon={Sparkles}
        title="Realization"
        bgColor="bg-sky-200"
        textColor="text-sky-900"
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
RealizationNode.displayName = "RealizationNode";