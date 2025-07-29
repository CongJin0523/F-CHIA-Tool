import { type Edge } from '@xyflow/react';

export const initialEdges: Edge[] = [
  { id: 'a-b1', source: 'a', target: 'b-1', type: 'smoothstep' },
  { id: 'a-b2', source: 'a', target: 'b-2', type: 'smoothstep' },
  { id: 'b1-c1', source: 'b-1', target: 'c-1', type: 'smoothstep' },
  { id: 'b1-c2', source: 'b-1', target: 'c-2', type: 'smoothstep' },
  { id: 'b2-c3', source: 'b-2', target: 'c-3', type: 'smoothstep' },
  { id: 'b2-c4', source: 'b-2', target: 'c-4', type: 'smoothstep' },
  { id: 'c-d', source: 'c-1', target: 'd', type: 'smoothstep' },
  { id: 'd-e', source: 'd', target: 'e', type: 'smoothstep' },
  { id: 'e-f', source: 'e', target: 'f', type: 'smoothstep' },
  { id: 'f-g', source: 'f', target: 'g', type: 'smoothstep' },
  { id: 'g-h', source: 'g', target: 'h', type: 'smoothstep' },
  { id: 'h-i', source: 'h', target: 'i', type: 'smoothstep' },
  { id: 'i-j', source: 'i', target: 'j', type: 'smoothstep' },
];