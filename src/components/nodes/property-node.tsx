import { useCallback, useMemo, } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { Settings } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { NodeHeader } from "@/components/nodes/subComponents/node-header";
import { useDgStore } from '@/store/dg-store';
export type PropertyNode = Node<{
  content: string;
}>;
import { motion } from 'motion/react';
import { getGraphStoreHook } from '@/store/graph-registry';
import { useZoneStore } from '@/store/zone-store';


export function PropertyNode({ id, data }: NodeProps<PropertyNode>) {
  // console.log('CauseNode props:', { id, data });
  const { setNodes, setEdges } = useReactFlow();
  const zoneId: string = useZoneStore((s) => s.selectedId);
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
        <BaseNode className="w-40 border-pink-200 bg-pink-50 nodrag">
          <NodeHeader
            icon={Settings}
            title="Property"
            bgColor="bg-pink-200"
            textColor="text-pink-900"
            onDelete={handleDelete}
          />
          <BaseNodeContent key={data.content}>
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
PropertyNode.displayName = "PropertyNode";