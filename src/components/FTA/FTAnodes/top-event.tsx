import { useCallback, useEffect, } from 'react';
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
  const { setNodes, setEdges, updateNodeData } = useReactFlow();
    const handleText = useCallback(
    (content: string) => {
      updateNodeData(id, { content });  // set content directly
    },
    [id, updateNodeData]
  );
  useEffect(() => {
    setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, deletable: false } : n))
    );
  }, [id, setNodes]);
  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  }, [id, setNodes, setEdges]);



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