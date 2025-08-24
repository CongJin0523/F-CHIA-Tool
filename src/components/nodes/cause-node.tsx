import { useCallback, useMemo, } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { Zap } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";
import { motion } from 'motion/react';
import { getGraphStoreHook } from '@/store/graph-registry';
import { useZoneStore } from '@/store/zone-store';
export type CauseNode = Node<{
  content: string;
}>;

export function CauseNode({ id, data }: NodeProps<CauseNode>) {
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
        <BaseNode className="w-40 border-red-200 bg-red-50">
          <NodeHeader
            icon={Zap}
            title="Cause"
            bgColor="bg-red-200"
            textColor="text-red-900"
            onDelete={handleDelete}
          />

          <BaseNodeContent  key={data.content}>
            <EditableText
              content={data.content}
              onChange={(value) => updateNodeText(id, value)}
            />
          </BaseNodeContent>
        </BaseNode >
      </motion.div>
      <BaseHandle id={`${id}-target`} type="target" position={Position.Top} className="nodrag" />
      <BaseHandle id={`${id}-source`} type="source" position={Position.Bottom} className="nodrag" />
    </div>
  );
}
CauseNode.displayName = "CauseNode";