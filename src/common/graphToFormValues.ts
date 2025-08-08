import type { Edge } from '@xyflow/react';
import type {
  AppNode,
  Task,
  Func,
  Realization,
  Property,
  Interpretation,
  FormValues,
} from './types';

function normalizeGuideWord(value: string): Interpretation['guideWord'] {
  const lower = value.toLowerCase();
  if (lower === 'part of') return 'Part of';
  if (lower === 'other than') return 'Other than';
  return 'No';
}

export function graphToFormValues(nodes: AppNode[], edges: Edge[]): FormValues {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const childrenMap = new Map<string, AppNode[]>();

  edges.forEach((e) => {
    const target = nodeMap.get(e.target);
    if (!target) return;
    const list = childrenMap.get(e.source) ?? [];
    list.push(target);
    childrenMap.set(e.source, list);
  });

  const getChildren = (id: string, type: string): AppNode[] => {
    return (childrenMap.get(id) || []).filter((n) => n.type === type);
  };

  const tasks: Task[] = nodes
    .filter((n) => n.type === 'task')
    .map((taskNode) => {
      const functions: Func[] = getChildren(taskNode.id, 'function').map((fnNode) => {
        const realizations: Realization[] = getChildren(fnNode.id, 'realization').map((realNode) => {
          const properties: Property[] = getChildren(realNode.id, 'properties').map((propNode) => {
            const guidewordNodes = getChildren(propNode.id, 'guideword');
            const interpretations: Interpretation[] = guidewordNodes.map((gwNode) => {
              const deviationNodes = getChildren(gwNode.id, 'deviation');
              const deviations = deviationNodes.map((d) => d.data.content);
              const causeNodes = deviationNodes.flatMap((d) => getChildren(d.id, 'cause'));
              const causes = causeNodes.map((c) => c.data.content);
              const consequenceNodes = causeNodes.flatMap((c) => getChildren(c.id, 'consequence'));
              const consequences = consequenceNodes.map((c) => c.data.content);
              const requirementNodes = consequenceNodes.flatMap((c) => getChildren(c.id, 'requirement'));
              const requirements = requirementNodes.map((r) => r.data.content);

              return {
                guideWord: normalizeGuideWord(gwNode.data.content),
                deviations,
                causes,
                consequences,
                requirements,
              };
            });
            return {
              properties: [propNode.data.content],
              interpretations,
            };
          });
          return {
            realizationName: realNode.data.content,
            properties,
          };
        });
        return {
          functionName: fnNode.data.content,
          realizations,
        };
      });
      return {
        taskName: taskNode.data.content,
        functions,
      };
    });

  return { tasks };
}

export default graphToFormValues;
