// src/common/deriveRowSpans.ts
import type { IR } from "./ir";
import type { FormValues } from "./types";

// 这里沿用你项目里的 FormValues/Task/Func/... 定义，带 rowSpan 字段
export function deriveRowSpans(ir: IR): FormValues {
  const tasks = ir.tasks.map((t) => ({
    taskName: t.taskName,
    rowSpan: 1, // 初始值
    functions: t.functions.map((f) => ({
      functionName: f.functionName,
      rowSpan: 1,
      realizations: f.realizations.map((r) => ({
        realizationName: r.realizationName,
        rowSpan: 1,
        properties: r.properties.map((p) => ({
          properties: p.properties,
          interpretations: p.interpretations.length
            ? p.interpretations
            : [
                {
                  guideWord: "No" as const,
                  deviations: [],
                  causes: [],
                  consequences: [],
                  requirements: [],
                },
              ],
          rowSpan: 1,
        })),
      })),
    })),
  }));

  // 按规则自底向上设置 rowSpan
  tasks.forEach((task) => {
    task.functions.forEach((fn) => {
      fn.realizations.forEach((real) => {
        real.properties.forEach((prop) => {
          prop.rowSpan = prop.interpretations.length || 1;
        });
        real.rowSpan =
          real.properties.reduce((sum, p) => sum + (p.rowSpan || 0), 0) || 1;
      });
      fn.rowSpan =
        fn.realizations.reduce((sum, r) => sum + (r.rowSpan || 0), 0) || 1;
    });
    task.rowSpan =
      task.functions.reduce((sum, f) => sum + (f.rowSpan || 0), 0) || 1;
  });

  return { tasks };
}