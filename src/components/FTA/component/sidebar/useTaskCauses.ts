import { useMemo } from "react";
import { getGraphStoreHook } from "@/store/graph-registry";
import { graphToIR } from "@/common/graphToIR";
import type { IR } from "@/common/ir";

export type CauseItem = { id: string; text: string };

export function useTaskCauses(zoneId?: string | null, taskId?: string | null) {
  return useMemo<CauseItem[]>(() => {
    if (!zoneId || !taskId) return [];

    const { nodes, edges } = getGraphStoreHook(zoneId).getState();
    const ir: IR = graphToIR(nodes, edges);
    const task = ir.tasks?.find(t => t.id === taskId);
    if (!task) return [];

    const out: CauseItem[] = [];
    const seen = new Set<string>(); // dedupe by id|text

    for (const fn of task.functions ?? []) {
      for (const real of fn.realizations ?? []) {
        for (const prop of real.properties ?? []) {
          for (const inter of prop.interpretations ?? []) {
            for (const c of inter.causes ?? []) {
              const key = `${c.id}|${c.text}`;
              if (seen.has(key)) continue;
              seen.add(key);
              out.push({ id: c.id, text: c.text });
            }
          }
        }
      }
    }
    return out;
  }, [zoneId, taskId]);
}