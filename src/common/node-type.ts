import type { NodeTypes } from '@xyflow/react';
import { ZoneNode } from '@/components/nodes/zone-node';
import { TaskNode } from '@/components/nodes/task-node';
import { FunctionNode } from '@/components/nodes/function-node';
import { RealizationNode } from '@/components/nodes/realization-node';
import { PropertiesNode } from '@/components/nodes/properties';
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
  properties: PropertiesNode,
  guideword: GuideWordNode,
  deviation: DeviationNode,
  cause: CauseNode,
  consequence: ConsequenceNode,
  requirement: RequirementNode,
} satisfies NodeTypes;

export { nodeTypes };