// src/common/graphToIR.ts
import type { Edge } from "@xyflow/react";
import type { AppNode } from "./types";
import { IRSchema, type IR } from "./ir";

// 小写 → 标准化
function normalizeGuideWord(value: string): "Part of" | "Other than" | "No" {
  const lower = (value || "").toLowerCase();
  if (lower === "part of") return "Part of";
  if (lower === "other than") return "Other than";
  return "No";
}

export function graphToIR(nodes: AppNode[], edges: Edge[]): IR {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const childrenMap = new Map<string, AppNode[]>();

  edges.forEach((e) => {
    const target = nodeMap.get(e.target);
    if (!target) return;
    const list = childrenMap.get(e.source) ?? [];
    list.push(target);
    childrenMap.set(e.source, list);
  });

  const getChildren = (id: string, type: string): AppNode[] =>
    (childrenMap.get(id) || []).filter((n) => n.type === type);

  const tasks = nodes
    .filter((n) => n.type === "task")
    .map((taskNode) => {
      const functions = getChildren(taskNode.id, "function").map((fnNode) => {
        const realizations = getChildren(fnNode.id, "realization").map((realNode) => {
          const properties = getChildren(realNode.id, "property").map((propNode) => {
            const guidewordNodes = getChildren(propNode.id, "guideword");
            const interpretations = guidewordNodes.map((gwNode) => {
              const deviationNodes = getChildren(gwNode.id, "deviation");
              const deviations = deviationNodes.map((d) => ({
                id: d.id,
                text: d.data.content ?? "",
              }));

              const causeNodes = deviationNodes.flatMap((d) => getChildren(d.id, "cause"));
              const causes = causeNodes.map((c) => ({
                id: c.id,
                text: c.data.content ?? "",
              }));

              const consequenceNodes = causeNodes.flatMap((c) => getChildren(c.id, "consequence"));
              const consequences = consequenceNodes.map((c) => ({
                id: c.id,
                text: c.data.content ?? "",
              }));

              const requirementNodes = consequenceNodes.flatMap((c) => getChildren(c.id, "requirement"));
              const requirements = requirementNodes.map((r) => ({
                id: r.id,
                text: r.data.content ?? "",
              }));


              return {
                guideWordId: gwNode.id,
                guideWord: normalizeGuideWord(gwNode.data.content),
                isoMatches: gwNode.data?.isoMatches ??  [],
                deviations,
                causes,
                consequences,
                requirements,
              };
            });

            // properties 字段：沿用你之前的“取第一个内容”为主属性名
            return {
              id: propNode.id,
              properties: [propNode.data.content ?? ""],
              interpretations,
            };
          });

          return {
            id: realNode.id,
            realizationName: realNode.data.content ?? "",
            properties,
          };
        });

        return {
          id: fnNode.id,
          functionName: fnNode.data.content ?? "",
          realizations,
        };
      });

      return {
        id: taskNode.id,
        taskName: taskNode.data.content ?? "",
        functions,
      };
    });
  console.log("Tasks constructed:", tasks);
  // 用 Zod 做一次 parse，顺便填默认值/校验
  return IRSchema.parse({ tasks });
}