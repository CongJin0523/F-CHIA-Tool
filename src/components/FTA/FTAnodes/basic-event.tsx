import { useCallback, } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from '@/components/nodes/subComponents/editable-text';
export type BasicEventNode = Node<{
  content: string;
}>;

export function BasicEventNode({ id, data }: NodeProps<BasicEventNode>) {
  const {  updateNodeData } = useReactFlow();
  const handleText = useCallback(
    (content: string) => {
      updateNodeData(id, { content });  // set content directly
    },
    [id, updateNodeData]
  );

  return (
    <div>
        <BaseNode className="w-30 h-30 rounded-full border-red-200 bg-red-50 flex items-center justify-center">
          <BaseNodeContent>
            <EditableText
              content={data.content}
              onChange={handleText}
            />
          </BaseNodeContent>
        </BaseNode >
      <BaseHandle id={`${id}-target`} type="target" position={Position.Top} className="nodrag" />
    </div>
  );
}
BasicEventNode.displayName = "BasicEventNode";