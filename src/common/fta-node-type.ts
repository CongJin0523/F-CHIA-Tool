import type { NodeTypes } from '@xyflow/react';
import { BasicEventNode } from '@/components/FTAnodes/basic-event';
import { ResultEventNode } from '@/components/FTAnodes/result-event';
import { LogicNode } from '@/components/FTAnodes/logic-node';

export type FtaNodeTypes = BasicEventNode | ResultEventNode | LogicNode;
export const nodeTypes = {
  basicEvent: BasicEventNode,
  resultEvent: ResultEventNode,
  logic: LogicNode,
} satisfies NodeTypes;