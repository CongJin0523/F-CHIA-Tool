import { useCallback, useState, } from 'react';
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
export type LogicNode = Node<{
  content: string;
}>;
const gateTypes: Record<string, string> = {
  // FTA OR outline only (no center dot)
  or: "M -20 0 C -20 -15 -10 -30 0 -30 C 10 -30 20 -15 20 0 C 10 -6 -10 -6 -20 0 Z",
  // FTA AND outline only (no plus sign)
  and: "M -20 0 L 20 0 C 20 -24 10 -30 0 -30 C -10 -30 -20 -24 -20 0 Z",
};
export function LogicNode({ id, data }: NodeProps<LogicNode>) {
  const { setNodes, setEdges } = useReactFlow();
  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  }, [id, setNodes, setEdges]);
  const [gateType, setGateType] = useState<keyof typeof gateTypes>("or");
  const handleGateClick = () => {
    const keys = Object.keys(gateTypes) as (keyof typeof gateTypes)[];
    const index = keys.indexOf(gateType);
    const next = keys[(index + 1) % keys.length];
    setGateType(next);
  };


  return (
    <div>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "tween", ease: "easeInOut", duration: 0.4 }} >
        <BaseNode className="w-20 p-0">
          <BaseNodeContent className='p-0 flex items-center justify-center'>
            <button
              type="button"
              onClick={handleGateClick}
              title={`${gateType.toUpperCase()} Gate (click to switch)`}
              aria-label="Switch gate type"
              className='inline-flex items-center justify-center'
            >
              <svg
                className="w-full h-full"
                viewBox="-40 -40 80 60"
                preserveAspectRatio="xMidYMid meet"
              >
                <g transform="translate(0, 5)">
                <path d={gateTypes[gateType]} stroke="currentColor" fill="none" strokeWidth={2} />
                {/* OR center solid dot */}
                {gateType === 'or' && (
                  <circle cx="0" cy="-12" r="3" fill="currentColor" />
                )}
                {/* AND center plus */}
                {gateType === 'and' && (
                  <>
                    <line x1="-4" y1="-16" x2="4" y2="-16" stroke="currentColor" strokeWidth={2} />
                    <line x1="0" y1="-20" x2="0" y2="-12" stroke="currentColor" strokeWidth={2} />
                  </>
                )}
                {/* 上方立柱 */}
                <path d="M 0 -30 0 -46" stroke="currentColor" strokeWidth={2} />
                {/* 下方立柱 */}
                <path d="M 0 0 0 15" stroke="currentColor" strokeWidth={2} />
                </g>
              </svg>
            </button>
          </BaseNodeContent>
        </BaseNode >
      </motion.div>
      <BaseHandle id={`${id}-target`} type="target" position={Position.Top} className="nodrag" />
      <BaseHandle id={`${id}-source`} type="source" position={Position.Bottom} className="nodrag" />
    </div>
  );
}
LogicNode.displayName = "LogicNode";