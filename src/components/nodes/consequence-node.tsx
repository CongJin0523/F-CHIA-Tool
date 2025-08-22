import { useCallback, } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { Blocks } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";
import { useDgStore } from '@/store/dg-store';
import { motion } from 'motion/react';
export type ConsequenceNode = Node<{
  content: string;
}>;



export function ConsequenceNode({ id, data }: NodeProps<ConsequenceNode>) {
  const { setNodes, setEdges } = useReactFlow();
  const updateNodeText = useDgStore((state) => state.updateNodeText);

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
        <BaseNode className="w-40 border-indigo-200 bg-indigo-50">
          <NodeHeader
            icon={Blocks}
            title="Consequence"
            bgColor="bg-indigo-200"
            textColor="text-indigo-900"
            onDelete={handleDelete}
          />
          <BaseNodeContent>
            <EditableText
              content={data.content}
              onChange={(value) => updateNodeText(id, value)}
            />
          </BaseNodeContent>
        </BaseNode>
      </motion.div>
      <BaseHandle id={`${id}-target`} type="target" position={Position.Top} className="nodrag" />
      <BaseHandle id={`${id}-source`} type="source" position={Position.Bottom} className="nodrag" />
    </div>
  );
}
ConsequenceNode.displayName = "ConsequenceNode";