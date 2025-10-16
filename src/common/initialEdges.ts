import { type Edge } from '@xyflow/react';

export const initialEdges: Edge[] = [
  { id: 'e1', source: 'zone', target: 'task-1', type: 'smoothstep' },
  { id: 'e2', source: 'task-1', target: 'fn-1', type: 'smoothstep' },
  { id: 'e3', source: 'fn-1', target: 'real-1', type: 'smoothstep' },
  { id: 'e4', source: 'real-1', target: 'prop-1', type: 'smoothstep' },
  { id: 'e5', source: 'prop-1', target: 'gw-1', type: 'smoothstep' },
];