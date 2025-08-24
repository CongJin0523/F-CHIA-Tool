import { useCallback, useMemo, } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { BadgeCheck } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";
import { useDgStore } from '@/store/dg-store';
export type RequirementNode = Node<{
  content: string;
}>;import { motion } from 'motion/react';
import { useZoneStore } from '@/store/zone-store';
import { getGraphStoreHook } from '@/store/graph-registry';



export function RequirementNode({ id, data }: NodeProps<RequirementNode>) {
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
    <BaseNode className="w-40 border-rose-200 bg-rose-50">
      <NodeHeader
        icon={BadgeCheck}
        title="Requirement"
        bgColor="bg-rose-200"
        textColor="text-rose-900"
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
    </div>
  );
}
RequirementNode.displayName = "RequirementNode";