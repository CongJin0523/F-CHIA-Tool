import { type ZoneNode } from '@/components/nodes/zone-node';
import { type TaskNode } from '@/components/nodes/task-node';
import { type FunctionNode } from '@/components/nodes/function-node';
import { type RealizationNode } from '@/components/nodes/realization-node';
import { type PropertyNode } from '@/components/nodes/property-node';
import { type GuideWordNode } from '@/components/nodes/guideword-node';
import { type DeviationNode } from '@/components/nodes/deviation-node';
import { type CauseNode } from '@/components/nodes/cause-node';
import { type ConsequenceNode } from '@/components/nodes/consequence-node';
import { type RequirementNode } from '@/components/nodes/requirement-node';
import {
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';


export type AppNode = ZoneNode | TaskNode | FunctionNode | RealizationNode | PropertyNode | GuideWordNode | DeviationNode | CauseNode | ConsequenceNode | RequirementNode;

export interface AppState {
  nodes: AppNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateNodeText: (nodeId: string, text: string) => void;
  onLayout: (direction?: 'DOWN' | 'RIGHT') => Promise<void>;
  getFormValues: () => FormValues;
};

// export interface FormValue {
//   zoneName: string;
//     tasks: {
//       taskName: string;
//       functions: {
//         functionName: string;
//         realizations: {
//           realizationName: string;
//           properties: {
//             propertyName: string;
//             guideWords: {
//               guideWord: string;
//               deviations: string[];
//               causes: string[];
//               consequences: string[];
//               requirements: string[];
//             }[];
//           }[];
//         }[];
//       }[];
//     }[];
// }

// 更通用的小类型
export type IdText = { id: string; text: string };

export interface Interpretation {
  guideWordId: string;                          // ✅ 新增：对应 guideword 节点 ID
  guideWord: "Part of" | "Other than" | "No";
  deviations: IdText[];                         // ✅ string[] -> IdText[]
  causes: IdText[];                             // ✅
  consequences: IdText[];                       // ✅
  requirements: IdText[];                       // ✅
}

export interface Property {
  id: string;                                   // ✅ 新增：property 节点 ID
  properties: string[];                         // 仍然是 string[]（标题一般用第一个）
  rowSpan: number;
  interpretations: Interpretation[];
}

export interface Realization {
  id: string;                                   // ✅ 新增
  realizationName: string;
  rowSpan: number;
  properties: Property[];
}

export interface Func {
  id: string;                                   // ✅ 新增
  functionName: string;
  rowSpan: number;
  realizations: Realization[];
}

export interface Task  {
  id: string;                                   // ✅ 新增
  taskName: string;
  rowSpan: number;
  functions: Func[];
}

export interface FormValues {
  tasks: Task[];
}



