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
export function ensureRenderableStructure(form: FormValues): FormValues {
  const cloned: FormValues = JSON.parse(JSON.stringify(form));

  cloned.tasks.forEach((task) => {
    // 确保每个 function 至少渲染一行
    task.functions.forEach((fn) => {
      if (!fn.realizations || fn.realizations.length === 0) {
        fn.realizations = [
          {
            realizationName: "",
            rowSpan: 1,
            properties: [
              {
                properties: [""],
                rowSpan: 1,
                interpretations: [
                  {
                    guideWord: "No",
                    deviations: [],
                    causes: [],
                    consequences: [],
                    requirements: [],
                  },
                ],
              },
            ],
          },
        ];
      } else {
        // realizations 存在，但 properties/interpretations 可能还是空
        fn.realizations.forEach((real) => {
          if (!real.properties || real.properties.length === 0) {
            real.properties = [
              {
                properties: [""],
                rowSpan: 1,
                interpretations: [
                  {
                    guideWord: "No",
                    deviations: [],
                    causes: [],
                    consequences: [],
                    requirements: [],
                  },
                ],
              },
            ];
          } else {
            real.properties.forEach((prop) => {
              if (!prop.interpretations || prop.interpretations.length === 0) {
                prop.interpretations = [
                  {
                    guideWord: "No",
                    deviations: [],
                    causes: [],
                    consequences: [],
                    requirements: [],
                  },
                ];
              }
            });
          }
        });
      }
    });
  });

  return cloned;
}
export function computeRowSpans(tasks: Task[]) {
  tasks.forEach((task) => {
    task.functions.forEach((fn) => {
      fn.realizations.forEach((real) => {
        real.properties.forEach((prop) => {
          if (!prop.interpretations.length) {
            prop.interpretations.push({
              guideWord: 'No',
              deviations: [],
              causes: [],
              consequences: [],
              requirements: [],
            });
            prop.rowSpan = 1; // Default rowSpan for empty interpretations
          } else {
            prop.rowSpan = prop.interpretations.length;
          }
        });
        real.rowSpan = real.properties.reduce((sum, prop) => sum + prop.rowSpan, 0) || 1; // Ensure at least 1 rowSpan
      });
      fn.rowSpan = fn.realizations.reduce((sum, real) => sum + real.rowSpan, 0) || 1; // Ensure at least 1 rowSpan
    });
    task.rowSpan = task.functions.reduce((sum, fn) => sum + fn.rowSpan, 0) || 1; // Ensure at least 1 rowSpan
  });
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
          const properties: Property[] = getChildren(realNode.id, 'property').map((propNode) => {
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
              rowSpan: 1, // Default rowSpan, will be updated later
            };
          });
          return {
            realizationName: realNode.data.content,
            properties,
            rowSpan: 1, // Default rowSpan, will be updated later
          };
        });
        return {
          functionName: fnNode.data.content,
          realizations,
          rowSpan: 1, // Default rowSpan, will be updated later
        };
      });
      return {
        taskName: taskNode.data.content,
        functions,
        rowSpan: 1, // Default rowSpan, will be updated later
      };
    });

  computeRowSpans(tasks);

  return { tasks };
}

export default graphToFormValues;
