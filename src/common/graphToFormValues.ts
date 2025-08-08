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

const emptyInterpretation = (): Interpretation => ({
  guideWord: 'No',
  deviations: [''],
  causes: [''],
  consequences: [''],
  requirements: [''],
});

const emptyProperty = (): Property => ({
  properties: [''],
  interpretations: [emptyInterpretation()],
  rowSpan: 1,
});

const emptyRealization = (): Realization => ({
  realizationName: '',
  properties: [emptyProperty()],
  rowSpan: 1,
});

const emptyFunc = (): Func => ({
  functionName: '',
  realizations: [emptyRealization()],
  rowSpan: 1,
});

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
      let functions: Func[] = getChildren(taskNode.id, 'function').map((fnNode) => {
        let realizations: Realization[] = getChildren(fnNode.id, 'realization').map((realNode) => {
          let properties: Property[] = getChildren(realNode.id, 'properties').map((propNode) => {
            const guidewordNodes = getChildren(propNode.id, 'guideword');
            let interpretations: Interpretation[] = guidewordNodes.map((gwNode) => {
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
                deviations: deviations.length ? deviations : [''],
                causes: causes.length ? causes : [''],
                consequences: consequences.length ? consequences : [''],
                requirements: requirements.length ? requirements : [''],
              };
            });
            if (interpretations.length === 0) interpretations = [emptyInterpretation()];
            const rowSpan = interpretations.length;
            return {
              properties: [propNode.data.content],
              interpretations,
              rowSpan,
            };
          });
          if (properties.length === 0) properties = [emptyProperty()];
          const rowSpan = properties.reduce((sum, p) => sum + p.rowSpan, 0);
          return {
            realizationName: realNode.data.content,
            properties,
            rowSpan,
          };
        });
        if (realizations.length === 0) realizations = [emptyRealization()];
        const rowSpan = realizations.reduce((sum, r) => sum + r.rowSpan, 0);
        return {
          functionName: fnNode.data.content,
          realizations,
          rowSpan,
        };
      });
      if (functions.length === 0) functions = [emptyFunc()];
      const rowSpan = functions.reduce((sum, f) => sum + f.rowSpan, 0);
      return {
        taskName: taskNode.data.content,
        functions,
        rowSpan,
      };
    });

  return { tasks };
}

export default graphToFormValues;
