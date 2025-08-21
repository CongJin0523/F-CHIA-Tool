import { useCallback, } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { Zap } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from '@/components/nodes/subComponents/editable-text';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";
import { useDgStore } from '@/common/store';
import { motion } from 'motion/react';
export type ResultEventNode = Node<{
  content: string;
}>;

export function ResultEventNode({ id, data }: NodeProps<ResultEventNode>) {
  const { setNodes, setEdges, updateNodeData } = useReactFlow();
  const updateNodeText = useDgStore((state) => state.updateNodeText);
    const handleText = useCallback(
    (content: string) => {
      updateNodeData(id, { content });  // set content directly
    },
    [id, updateNodeData]
  );
  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  }, [id, setNodes, setEdges]);



  return (
    <div>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "tween", ease: "easeInOut", duration: 0.4 }} >
        <BaseNode className="w-40 border-red-200 bg-red-50">

          <BaseNodeContent>
            <EditableText
              content={data.content}
              onChange={handleText}
            />
          </BaseNodeContent>
        </BaseNode >
      </motion.div>
      <BaseHandle id={`${id}-target`} type="target" position={Position.Top} className="nodrag" />
      <BaseHandle id={`${id}-source`} type="source" position={Position.Bottom} className="nodrag" />
    </div>
  );
}
ResultEventNode.displayName = "ResultEventNode";