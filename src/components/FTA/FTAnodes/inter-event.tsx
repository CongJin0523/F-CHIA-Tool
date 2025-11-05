import { useCallback, } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from '@/components/nodes/subComponents/editable-text';
export type InterEventNode = Node<{
  content: string;
}>;

export function InterEventNode({ id, data }: NodeProps<InterEventNode>) {
  const {  updateNodeData } = useReactFlow();
    const handleText = useCallback(
    (content: string) => {
      updateNodeData(id, { content });  // set content directly
    },
    [id, updateNodeData]
  );




  return (
    <div>
        <BaseNode className="w-40 border-yellow-200 bg-yellow-50">
          <BaseNodeContent>
            <EditableText
              content={data.content}
              onChange={handleText}
            />
          </BaseNodeContent>
        </BaseNode >
      <BaseHandle id={`${id}-target`} type="target" position={Position.Top} className="nodrag" />
      <BaseHandle id={`${id}-source`} type="source" position={Position.Bottom} className="nodrag" />
    </div>
  );
}
InterEventNode.displayName = "InterEventNode";