import { useCallback, useMemo, } from 'react';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { NodeHeader } from "@/components/nodes/subComponents/node-header";
import { Globe, } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow, type ConnectionState, useConnection } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { BaseHandle } from '../base-handle';
import { useDgStore } from '@/store/dg-store';
export type ZoneNode = Node<{
  content: string;
}>;
import { motion } from 'motion/react';
import { getGraphStoreHook } from '@/store/graph-registry';
import { useZoneStore } from '@/store/zone-store';


const selector = (connection: ConnectionState) => {
  return connection.inProgress;
};

export function ZoneNode({ id, data }: NodeProps<ZoneNode>) {
  const { setNodes, setEdges } = useReactFlow();
  const zoneId = useZoneStore((s) => s.selectedId);
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
        <BaseNode className="w-40 border-violet-200 bg-violet-50 nodrag">
          <NodeHeader
            icon={Globe}
            title="Zone"
            bgColor="bg-violet-200"
            textColor="text-violet-900"
            onDelete={handleDelete}
          />
          <BaseNodeContent key={data.content}>
            <EditableText
              content={data.content}
              onChange={(value) => updateNodeText(id, value)}
            />
            {/* <ButtonHandle
          type="target"
          position={Position.Bottom}
          showButton={!connectionInProgress}
        >
          <Button
            onClick={onClick}
            size="sm"
            variant="secondary"
            className="rounded-full"
          >
            <Plus size={10} />
          </Button>
        </ButtonHandle> */}
          </BaseNodeContent>
        </BaseNode>
      </motion.div>
      <BaseHandle id={`${id}-source`} type="source" position={Position.Bottom} className="nodrag" />
    </div>
  );
}
ZoneNode.displayName = "ZoneNode";