// components/FTA/CausesListSidebarGroup.tsx
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar";
import { getGraphStoreHook } from "@/store/graph-registry";
import { getFtaStoreHook } from "@/store/fta-registry";
import { graphToIR } from "@/common/graphToIR";
import type { IR } from "@/common/ir";

type CauseItem = { id?: string; text: string };

// small hash fallback if an id is missing
function keyOf(c: CauseItem) {
  if (c.id) return c.id;
  let h = 0;
  for (let i = 0; i < c.text.length; i++) h = (h * 31 + c.text.charCodeAt(i)) | 0;
  return `text-${Math.abs(h)}`;
}

function useTaskCauses(zoneId?: string | null, taskId?: string | null) {
  return useMemo<CauseItem[]>(() => {
    if (!zoneId || !taskId) return [];
    const { nodes, edges } = getGraphStoreHook(zoneId).getState();
    const ir: IR = graphToIR(nodes, edges);
    const task = ir.tasks?.find((t) => t.id === taskId);
    if (!task) return [];

    const out: CauseItem[] = [];
    const seen = new Set<string>();
    for (const fn of task.functions ?? []) {
      for (const real of fn.realizations ?? []) {
        for (const prop of real.properties ?? []) {
          for (const inter of prop.interpretations ?? []) {
            for (const c of inter.causes ?? []) {
              const k = `${c.id ?? ""}|${c.text}`;
              if (seen.has(k)) continue;
              seen.add(k);
              out.push({ id: c.id, text: c.text });
            }
          }
        }
      }
    }
    return out;
  }, [zoneId, taskId]);
}

export default function CausesListSidebarGroup() {
  const [params] = useSearchParams();
  const zoneId = params.get("zone");
  const taskId = params.get("task");

  const causes = useTaskCauses(zoneId, taskId);

  // Bind to the related FTA store (per zone+task)
  const ftaHook = useMemo(() => {
    if (!zoneId || !taskId) return null;
    return getFtaStoreHook(zoneId, taskId);
  }, [zoneId, taskId]);

  const causeChecks = ftaHook ? ftaHook((s) => s.causeChecks) : {};
  const setCauseChecked = ftaHook ? ftaHook((s) => s.setCauseChecked) : undefined;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xl font-bold flex justify-center">
        Causes in Task
      </SidebarGroupLabel>

      <SidebarGroupContent>
        {!zoneId || !taskId ? (
          <div className="text-xs text-neutral-500 px-1 py-1">Select a task first.</div>
        ) : causes.length === 0 ? (
          <div className="text-xs text-neutral-500 px-1 py-1">No causes found in this task.</div>
        ) : (
          <ul className="space-y-1">
            {causes.map((c, idx) => {
              const k = keyOf(c);
              const checkboxId = `cause-${k}`;
              const checked = !!causeChecks[k];

              return (
                <li key={checkboxId} className="flex items-start gap-2">
                  <Checkbox
                    id={checkboxId}
                    checked={checked}
                    onCheckedChange={(v) => setCauseChecked?.(k, !!v)}
                  />
                  <label
                    htmlFor={checkboxId}
                    className="text-sm leading-snug"
                    title={c.text}
                  >
                    <span className="font-medium mr-1">C{idx + 1}:</span>
                    <span>{c.text || "(empty)"}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}