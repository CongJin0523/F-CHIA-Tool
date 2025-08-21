import ELK from 'elkjs/lib/elk.bundled.js';


import type { AppNode } from '@/common/types';
import {
  type Edge,
} from '@xyflow/react';

const elk = new ELK();
export const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
};

export const getLayoutedElements = (nodes : AppNode[], edges: Edge[], options = {}) => {
  const isHorizontal = options?.['elk.direction'] === 'RIGHT';
  const graph = {
    id: 'root',
    layoutOptions: options,
    children: nodes.map((node) => ({
      ...node,
      // Adjust the target and source handle positions based on the layout
      // direction.
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',

      // Hardcode a width and height for elk to use when layouting.
      width: 150,
      height: 50,
    })),
    edges: edges,
  };
  return elk
    .layout(graph)
    .then((layoutedGraph) => {
      console.log('ELK layout result:', layoutedGraph);
        return ({
          nodes: layoutedGraph.children.map((node) => ({
            id: node.id,
            type: node.type,
            data: node.data,
            // React Flow expects a position property on the node instead of `x`
            // and `y` fields.
            position: { x: node.x, y: node.y },
                        // preserve handle positions so edges follow nodes when layout direction changes

          })),

      edges: layoutedGraph.edges.map((edge) => ({
        id: edge.id,
        target: edge.target,
        source: edge.source,
        type: edge.type,

      })),
    });
  })
    .catch(console.error);
};