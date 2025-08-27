import { type AppNode } from "./types";
export const initialNodes: AppNode[] = [
  { id: 'a', type: 'zone', data: { content: 'apple, river, glow' }, position: { x: 0, y: 0 } },
  { id: 'b-1', type: 'task', data: { content: 'b-1 node' }, position: { x: 200, y: -50 } },
  { id: 'b-2', type: 'task', data: { content: 'b-2 node' }, position: { x: 200, y: 50 } },
  { id: 'c-1', type: 'function', data: { content: 'c-1' }, position: { x: 400, y: -100 } },
  { id: 'c-2', type: 'function', data: { content: 'c-2' }, position: { x: 400, y: 0 } },
  { id: 'c-3', type: 'function', data: { content: 'c-3' }, position: { x: 400, y: 100 } },
  { id: 'c-4', type: 'function', data: { content: 'c-4' }, position: { x: 400, y: 200 } },
  { id: 'd', type: 'realization', data: { content: 'realization node' }, position: { x: 0, y: 200 } },
  { id: 'e', type: 'property', data: { content: 'properties node' }, position: { x: 200, y: 200 } },
  { id: 'f', type: 'guideword', data: { content: 'Part of' }, position: { x: 400, y: 200 } },
  { id: 'g', type: 'deviation', data: { content: 'deviation node' }, position: { x: 0, y: 400 } },
  { id: 'h', type: 'cause', data: { content: 'cause node' }, position: { x: 200, y: 400 } },
  { id: 'i', type: 'consequence', data: { content: 'consequence node' }, position: { x: 400, y: 400 } },
  { id: 'j', type: 'requirement', data: { content: 'requirement node' }, position: { x: 0, y: 600 } },
];