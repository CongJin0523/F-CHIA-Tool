import { useCallback, useMemo, } from 'react';
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
import { useZoneStore } from '@/store/zone-store';
import { getGraphStoreHook } from '@/store/graph-registry';
export type ConsequenceNode = Node<{
  content: string;
}>;



export function ConsequenceNode({ id, data }: NodeProps<ConsequenceNode>) {
    // console.log('CauseNode props:', { id, data });
  const { setNodes, setEdges } = useReactFlow();
  const zoneId : string = useZoneStore((s) => s.selectedId);
  // console.log('CauseNode render, zoneId:', zoneId);
  const storeHook = useMemo(() => (getGraphStoreHook(zoneId)), [zoneId]);
  const updateNodeText = storeHook((state) => state.updateNodeText);

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
        <BaseNode className="w-40 border-indigo-200 bg-indigo-50 nodrag">
          <NodeHeader
            icon={Blocks}
            title="Consequence"
            bgColor="bg-indigo-200"
            textColor="text-indigo-900"
            onDelete={handleDelete}
          />
          <BaseNodeContent  key={data.content}>
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