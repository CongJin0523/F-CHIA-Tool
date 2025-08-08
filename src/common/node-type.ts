import type { NodeTypes } from '@xyflow/react';
import { ZoneNode } from '@/components/nodes/zone-node';
import { TaskNode } from '@/components/nodes/task-node';
import { FunctionNode } from '@/components/nodes/function-node';
import { RealizationNode } from '@/components/nodes/realization-node';
import { PropertyNode } from '@/components/nodes/property-node';
import { GuideWordNode } from '@/components/nodes/guideword-node';
import { DeviationNode } from '@/components/nodes/deviation-node';
import { CauseNode } from '@/components/nodes/cause-node';
import { ConsequenceNode } from '@/components/nodes/consequence-node';
import { RequirementNode } from '@/components/nodes/requirement-node';

const nodeTypes = {
  zone: ZoneNode,
  task: TaskNode,
  function: FunctionNode,
  realization: RealizationNode,
  property: PropertyNode,
  guideword: GuideWordNode,
  deviation: DeviationNode,
  cause: CauseNode,
  consequence: ConsequenceNode,
  requirement: RequirementNode,
} satisfies NodeTypes;

// 显式定义顺序
const nodeOrder = [
  "zone",
  "task",
  "function",
  "realization",
  "properties",
  "guideword",
  "deviation",
  "cause",
  "consequence",
  "requirement",
] as const;

type NodeKey = typeof nodeOrder[number];

function getNextNodeType(current: NodeKey): NodeKey | null {
  const index = nodeOrder.indexOf(current);
  if (index >= 0 && index < nodeOrder.length - 1) {
    return nodeOrder[index + 1];
  }
  return null;
}


export { nodeTypes, getNextNodeType, NodeKey };