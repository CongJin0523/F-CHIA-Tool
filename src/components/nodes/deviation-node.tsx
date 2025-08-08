import { useCallback, } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { ArrowBigDownDash } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";
import { useDgStore } from '@/common/store';
export type DeviationNode = Node<{
  content: string;
}>;



export function DeviationNode({ id, data }: NodeProps<DeviationNode>) {
  const { setNodes, setEdges } = useReactFlow();
  const updateNodeText = useDgStore((state) => state.updateNodeText);

  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  }, [id, setNodes, setEdges]);
  

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
          content={data.content}
          onChange={(value) => updateNodeText(id, value)}
        />
      </BaseNodeContent>
      <BaseHandle id={`${id}-source`} type="source" position={Position.Bottom} className="nodrag" />
    </BaseNode>
  );
}
DeviationNode.displayName = "DeviationNode";