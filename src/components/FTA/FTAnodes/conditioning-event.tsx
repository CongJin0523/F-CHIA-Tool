import { useCallback, } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from '@/components/nodes/subComponents/editable-text';
export type ConEventNode = Node<{
  content: string;
}>;

export function ConEventNode({ id, data }: NodeProps<ConEventNode>) {
  const {  updateNodeData } = useReactFlow();
  const handleText = useCallback(
    (content: string) => {
      updateNodeData(id, { content });  // set content directly
    },
    [id, updateNodeData]
  );

  return (
    <div>
        <BaseNode className="w-32 aspect-[2/1] rounded-full border-blue-200 bg-blue-50 flex items-center justify-center">
          <BaseNodeContent>
            <EditableText
              content={data.content}
              onChange={handleText}
            />
          </BaseNodeContent>
        </BaseNode >
      <BaseHandle id={`${id}-target`} type="target" position={Position.Left} className="nodrag" />
    </div>
  );
}
ConEventNode.displayName = "ConEventNode";