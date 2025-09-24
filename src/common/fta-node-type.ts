import type { NodeTypes } from '@xyflow/react';
import { BasicEventNode } from '@/components/FTA/FTAnodes/basic-event';
import { InterEventNode } from '@/components/FTA/FTAnodes/inter-event';
import { LogicNode } from '@/components/FTA/FTAnodes/logic-node';
import { TopEventNode } from '@/components/FTA/FTAnodes/top-event';
import { ConEventNode } from '@/components/FTA/FTAnodes/conditioning-event';

export type FtaNodeTypes = BasicEventNode | InterEventNode | LogicNode | TopEventNode | ConEventNode;
export const nodeTypes = {
  basicEvent: BasicEventNode,
  interEvent: InterEventNode,
  logic: LogicNode,
  topEvent: TopEventNode,
  conditioningEvent: ConEventNode,
} satisfies NodeTypes;