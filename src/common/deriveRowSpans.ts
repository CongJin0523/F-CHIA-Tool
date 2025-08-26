// src/common/deriveRowSpans.ts
// src/common/deriveRowSpans.ts
import type { IR } from "./ir";
import type { FormValues } from "./types";

/**
 * 如果某个 property 没有 interpretations，生成一个占位 interpretation。
 * 注意：这是 UI 占位，不代表真实图节点；guideWordId 为稳定伪ID（基于 propertyId）。
 */
function makePlaceholderInterpretation(propertyId: string) {
  return {
    guideWordId: `${propertyId}::gw-placeholder`,
    guideWord: "No" as const,
    deviations: [] as { id: string; text: string }[],
    causes: [] as { id: string; text: string }[],
    consequences: [] as { id: string; text: string }[],
    requirements: [] as { id: string; text: string }[],
  };
}

// 这里沿用你项目里的 FormValues/Task/Func/... 定义，带 rowSpan 字段，并且补充 id、IdText 结构
export function deriveRowSpans(ir: IR): FormValues {
  const tasks = ir.tasks.map((t) => ({
    id: t.id,                           // ✅ 透传 Task ID
    taskName: t.taskName,
    rowSpan: 1, // 初始值
    functions: t.functions.map((f) => ({
      id: f.id,                         // ✅ 透传 Function ID
      functionName: f.functionName,
      rowSpan: 1,
      realizations: f.realizations.map((r) => ({
        id: r.id,                       // ✅ 透传 Realization ID
        realizationName: r.realizationName,
        rowSpan: 1,
        properties: r.properties.map((p) => {
          const hasInter = p.interpretations && p.interpretations.length > 0;
          return {
            id: p.id,                   // ✅ 透传 Property ID
            properties: p.properties,   // 仍然是 string[]（主显示名通常用第一个）
            interpretations: hasInter
              ? p.interpretations.map((it) => ({
                  // ✅ 完整保留 interpretation 的 ID 化结构
                  guideWordId: it.guideWordId,
                  guideWord: it.guideWord,
                  deviations: it.deviations.map(d => ({ id: d.id, text: d.text })),
                  causes: it.causes.map(c => ({ id: c.id, text: c.text })),
                  consequences: it.consequences.map(cs => ({ id: cs.id, text: cs.text })),
                  requirements: it.requirements.map(rq => ({ id: rq.id, text: rq.text })),
                }))
              : [makePlaceholderInterpretation(p.id)],
            rowSpan: 1,
          };
        }),
      })),
    })),
  }));

  // 按规则自底向上设置 rowSpan（保持你原有逻辑）
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