import type { NodeTypes } from '@xyflow/react';
import { BasicEventNode } from '@/components/FTA/FTAnodes/basic-event';
import { InterEventNode } from '@/components/FTA/FTAnodes/inter-event';
import { LogicNode } from '@/components/FTA/FTAnodes/logic-node';
import { TopEventNode } from '@/components/FTA/FTAnodes/top-event';

export type FtaNodeTypes = BasicEventNode | InterEventNode | LogicNode | TopEventNode;
export const nodeTypes = {
  basicEvent: BasicEventNode,
  interEvent: InterEventNode,
  logic: LogicNode,
  topEvent: TopEventNode,
} satisfies NodeTypes;