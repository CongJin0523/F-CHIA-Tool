import { useCallback,  } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from '@/components/nodes/subComponents/editable-text';
export type TopEventNode = Node<{
  content: string;
}>;

export function TopEventNode({ id, data }: NodeProps<TopEventNode>) {
  const {  updateNodeData } = useReactFlow();
    const handleText = useCallback(
    (content: string) => {
      updateNodeData(id, { content });  // set content directly
    },
    [id, updateNodeData]
  );




  return (
    <div>
        <BaseNode className="w-40 border-green-200 bg-green-50">
          <BaseNodeContent>
            <EditableText
              content={data.content}
              onChange={handleText}
            />
          </BaseNodeContent>
        </BaseNode >
      <BaseHandle id={`${id}-source`} type="source" position={Position.Bottom} className="nodrag" />
    </div>
  );
}
TopEventNode.displayName = "TopEventNode";