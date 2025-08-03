import { type ZoneNode } from '@/components/nodes/zone-node';
import { type TaskNode } from '@/components/nodes/task-node';
import { type FunctionNode } from '@/components/nodes/function-node';
import { type RealizationNode } from '@/components/nodes/realization-node';
import { type PropertiesNode } from '@/components/nodes/properties';
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


export type AppNode = ZoneNode | TaskNode | FunctionNode | RealizationNode | PropertiesNode | GuideWordNode | DeviationNode | CauseNode | ConsequenceNode | RequirementNode;

export interface AppState {
  nodes: AppNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateNodeText: (nodeId: string, text: string) => void;
};

export interface FormValue {
  zoneName: string;
    tasks: {
      taskName: string;
      functions: {
        functionName: string;
        realizations: {
          realizationName: string;
          properties: {
            propertyName: string;
            guideWords: {
              guideWord: string;
              deviations: string[];
              causes: string[];
              consequences: string[];
              requirements: string[];
            }[];
          }[];
        }[];
      }[];
    }[];
}

export interface Task {
  taskName: string;
      functions: {
        functionName: string;
        realizations: {
          realizationName: string;
          properties: {
            propertyName: string;
            guideWords: {
              guideWord: string;
              deviations: string[];
              causes: string[];
              consequences: string[];
              requirements: string[];
            }[];
          }[];
        }[];
      }[];
}

