import { type AppNode } from "./types";
export const initialNodes: AppNode[] = [
  { id: 'zone', type: 'zone', data: { content: 'Double-click to describe the zone' }, position: { x: 0, y: 0 } },
  { id: 'task-1', type: 'task', data: { content: 'Double-click to name the task…' }, position: { x: 200, y: -50 } },
  { id: 'fn-1', type: 'function', data: { content: 'Add a function that supports the task…' }, position: { x: 400, y: -100 } },
  { id: 'real-1', type: 'realization', data: { content: 'What realization implements the function?' }, position: { x: 0, y: 200 } },
  { id: 'prop-1', type: 'property', data: { content: 'List a key property to check…' }, position: { x: 200, y: 200 } },
  { id: 'gw-1', type: 'guideword', data: { content: 'Part of' }, position: { x: 0, y: 400 } },
  // { id: 'h', type: 'cause', data: { content: 'cause node' }, position: { x: 200, y: 400 } },
  // { id: 'i', type: 'consequence', data: { content: 'consequence node' }, position: { x: 400, y: 400 } },
  // { id: 'j', type: 'requirement', data: { content: 'requirement node' }, position: { x: 0, y: 600 } },
];


