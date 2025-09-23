import { useCallback } from 'react';
import { BaseHandle } from '@/components/base-handle';
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { NodeTooltip, NodeTooltipContent, NodeTooltipTrigger } from '@/components/node-tooltip';
export type LogicNode = Node<{
  content: string;
  gateType?: 'or' | 'xor' | 'and' | 'priority_and' | 'inhibit' | 'transfer';
}>;
const gateTypes: Record<string, string> = {
  or: 'M -20 0 C -20 -15 -10 -30 0 -30 C 10 -30 20 -15 20 0 C 10 -6 -10 -6 -20 0',
  xor: 'M -20 0 C -20 -15 -10 -30 0 -30 C 10 -30 20 -15 20 0 C 10 -6 -10 -6 -20 0 M -20 0 0 -30 M 0 -30 20 0',
  and: 'M -20 0 C -20 -25 -10 -30 0 -30 C 10 -30 20 -25 20 0 Z',
  priority_and:
    'M -20 0 C -20 -25 -10 -30 0 -30 C 10 -30 20 -25 20 0 Z M -20 0 0 -30 20 0',
  inhibit: 'M -10 0 -20 -15 -10 -30 10 -30 20 -15 10 0 Z',
  transfer: 'M -20 0 20 0 0 -30 z',
};
export function LogicNode({ id, data }: NodeProps<LogicNode>) {
  const { setNodes, setEdges, updateNodeData } = useReactFlow();
  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  }, [id, setNodes, setEdges]);

  // derive gateType from node.data (persisted)
  const gateType = (data.gateType ?? 'or') as keyof typeof gateTypes;

  const handleGateClick = () => {
    const keys = Object.keys(gateTypes) as (keyof typeof gateTypes)[];
    const index = keys.indexOf(gateType);
    const next = keys[(index + 1) % keys.length];
    // persist to store instead of local state
    updateNodeData(id, { gateType: next });
  };


  return (
    <div>

      <NodeTooltip>
        <NodeTooltipContent position={Position.Right} className="text-center">
          {gateType.replace(/_+/g, ' ').replace(/\w\S*/g, (w) =>                // 匹配每个单词
            w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
          )} Gate
        </NodeTooltipContent>
        <BaseNode className="w-20 p-0">
          <NodeTooltipTrigger>
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

                    {/* 上方立柱 */}
                    <path d="M 0 -30 0 -46" stroke="currentColor" strokeWidth={2} />
                    {/* 下方立柱 */}
                    <path d="M 0 0 0 15" stroke="currentColor" strokeWidth={2} />
                  </g>
                </svg>
              </button>
            </BaseNodeContent>
          </NodeTooltipTrigger>
        </BaseNode >
      </NodeTooltip>
      <BaseHandle id={`${id}-target`} type="target" position={Position.Top} className="nodrag" />
      <BaseHandle id={`${id}-source`} type="source" position={Position.Bottom} className="nodrag" />
      <BaseHandle id={`${id}-source-right`} type="source" position={Position.Right} className="nodrag" />
    </div>
  );
}
LogicNode.displayName = "LogicNode";