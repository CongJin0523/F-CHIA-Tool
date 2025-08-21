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
import { motion } from 'motion/react';
export type BasicEventNode = Node<{
  content: string;
}>;

export function BasicEventNode({ id, data }: NodeProps<BasicEventNode>) {
  const { setNodes, setEdges, updateNodeData } = useReactFlow();
  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  }, [id, setNodes, setEdges]);

  const handleText = useCallback(
    (content: string) => {
      updateNodeData(id, { content });  // set content directly
    },
    [id, updateNodeData]
  );

  return (
    <div>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "tween", ease: "easeInOut", duration: 0.4 }} >
        <BaseNode className="w-20 h-20 rounded-full border-red-200 bg-red-50 flex items-center justify-center">

          <BaseNodeContent>
            <EditableText
              content={data.content}
              onChange={handleText}
            />
          </BaseNodeContent>
        </BaseNode >
      </motion.div>
      <BaseHandle id={`${id}-target`} type="target" position={Position.Top} className="nodrag" />
    </div>
  );
}
BasicEventNode.displayName = "BasicEventNode";