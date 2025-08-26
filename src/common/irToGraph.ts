// src/common/irToGraph.ts
import type { Edge } from "@xyflow/react";
import type { AppNode } from "./types";
import type { IR } from "./ir";

type NodeType =
  | "task"
  | "function"
  | "realization"
  | "property"
  | "guideword"
  | "deviation"
  | "cause"
  | "consequence"
  | "requirement";

const genId = (() => {
  let i = 0;
  return () => `n_${++i}`;
})();

export function irToGraph(ir: IR): { nodes: AppNode[]; edges: Edge[] } {
  const nodes: AppNode[] = [];
  const edges: Edge[] = [];

  const add = (type: NodeType, content: string, fixedId?: string) => {
    const id = fixedId || genId();
    nodes.push({ id, type, data: { content } } as AppNode);
    return id;
  };
  const link = (source: string, target: string) => {
    edges.push({ id: `${source}->${target}`, source, target } as Edge);
  };

  ir.tasks.forEach((t) => {
    const tId = add("task", t.taskName, t.id);
    t.functions.forEach((f) => {
      const fId = add("function", f.functionName, f.id);
      link(tId, fId);

      f.realizations.forEach((r) => {
        const rId = add("realization", r.realizationName, r.id);
        link(fId, rId);

        r.properties.forEach((p) => {
          const pId = add("property", p.properties[0] ?? "", p.id);
          link(rId, pId);

          p.interpretations.forEach((inter) => {
            // ✅ 使用 guideWordId，内容是枚举字符串
            const gId = add("guideword", inter.guideWord, inter.guideWordId);
            link(pId, gId);

            const dIds = inter.deviations.map((d) => {
              const id = add("deviation", d.text, d.id);      // ✅ IdText
              link(gId, id);
              return id;
            });

            const cIds = inter.causes.map((c) => {
              const id = add("cause", c.text, c.id);          // ✅ IdText
              dIds.forEach((d) => link(d, id));
              return id;
            });

            const sIds = inter.consequences.map((s) => {
              const id = add("consequence", s.text, s.id);    // ✅ IdText
              cIds.forEach((c) => link(c, id));
              return id;
            });

            inter.requirements.forEach((req) => {
              const id = add("requirement", req.text, req.id); // ✅ IdText
              sIds.forEach((s) => link(s, id));
            });
          });
        });
      });
    });
  });

  return { nodes, edges };
}