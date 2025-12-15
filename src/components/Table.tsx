import { useEffect, useMemo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type FormValues, type IsoMatch } from "@/common/types";
import { graphToIR } from "@/common/graphToIR";
import { deriveRowSpans } from "@/common/deriveRowSpans";
import { useZoneStore } from "@/store/zone-store";
import { getGraphStoreHook } from '@/store/graph-registry';
import IsoMatchingDialog from "@/components/iso-matching-dialog";
import type { IR } from "@/common/ir";
import DMM from "@/components/DMM";
type Update = { id: string; content: string };
import AddIsoDialog, { EditIsoDialog } from "@/components/manually-add-iso";
import { type Edge } from '@xyflow/react';
import { type FtaNodeTypes } from '@/common/fta-node-type';
import { getFtaStoreHook } from '@/store/fta-registry';
import { useNavigate } from "react-router-dom";
import { toast } from "sonner"
import ExportTextPDFButton from "@/components/ExportTablePDFButton.tsx";

// --- Helper: dedupe array of items by `id`, preserving first occurrence order ---
function dedupeById<T extends { id?: string }>(arr: T[] | undefined): T[] {
  if (!Array.isArray(arr)) return [] as T[];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const key = (item && typeof item.id === 'string') ? item.id : '';
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    out.push(item);
  }
  return out;
}
function collectGraphUpdatesFromForm(data: FormValues): Update[] {
  const updates: Update[] = [];

  for (const task of data.tasks ?? []) {
    if (task.id) updates.push({ id: task.id, content: task.taskName ?? "" });

    for (const fn of task.functions ?? []) {
      if (fn.id) updates.push({ id: fn.id, content: fn.functionName ?? "" });

      for (const real of fn.realizations ?? []) {
        if (real.id) updates.push({ id: real.id, content: real.realizationName ?? "" });

        for (const prop of real.properties ?? []) {
          // Property title: we keep using the first item in `properties[]` as the displayed/edited title.
          if (prop.id) updates.push({ id: prop.id, content: prop.properties?.[0] ?? "" });

          for (const inter of prop.interpretations ?? []) {
            // Guide word node: if this value is editable, write the selected enum value back to the graph node.
            if (inter.guideWordId) {
              updates.push({ id: inter.guideWordId, content: inter.guideWord });
            }
            // Deviations / causes / consequences / requirements are arrays of `{ id, text }` objects.
            for (const d of inter.deviations ?? []) {
              if (d.id) updates.push({ id: d.id, content: d.text ?? "" });
            }
            for (const c of inter.causes ?? []) {
              if (c.id) updates.push({ id: c.id, content: c.text ?? "" });
            }
            for (const s of inter.consequences ?? []) {
              if (s.id) updates.push({ id: s.id, content: s.text ?? "" });
            }
            for (const r of inter.requirements ?? []) {
              if (r.id) updates.push({ id: r.id, content: r.text ?? "" });
            }
          }
        }
      }
    }
  }

  return updates;
}

// --- Helper: dedupe ISO matches by iso_number and title (first-wins) ---
function dedupeIsoMatches(list: IsoMatch[] | undefined): IsoMatch[] {
  if (!Array.isArray(list)) return [];
  const m = new Map<string, IsoMatch>();
  for (const it of list) {
    if (!it) continue;
    const key = `${it.iso_number}::${it.title}`;
    if (!m.has(key)) m.set(key, it);
  }
  return Array.from(m.values());
}

function collectIsoMatchesFromForm(data: FormValues) {
  const map = new Map<string, IsoMatch[]>();

  for (const task of data.tasks ?? []) {
    for (const fn of task.functions ?? []) {
      for (const real of fn.realizations ?? []) {
        for (const prop of real.properties ?? []) {
          for (const inter of prop.interpretations ?? []) {
            if (!inter?.guideWordId) continue;
            const key = inter.guideWordId as string;

            // IMPORTANT: for merged-property cells there can be multiple
            // interpretations with the same guideWordId. We only want to
            // take the first occurrence (the one the UI actually edits),
            // otherwise later duplicates with stale isoMatches will
            // overwrite the user edits and look like a "rollback".
            if (map.has(key)) continue;

            const list = dedupeIsoMatches(inter.isoMatches);
            map.set(key, list);
          }
        }
      }
    }
  }

  return map;
}
// Ensure the FTA store for (zoneId, taskId) has an initial Top Event node.
// We only create it when the store is empty, so existing FTAs are not overwritten.
function ensureTopEvent(zoneId: string, taskId: string, taskName: string) {
  const hook = getFtaStoreHook(zoneId, taskId);
  const st = hook.getState();
  if (!st.nodes || st.nodes.length === 0) {
    const topId = `top-${taskId}`;
    const nodes: FtaNodeTypes[] = [
      {
        id: topId,
        type: 'topEvent',               // Node type defined in `fta-node-type`
        position: { x: 0, y: 0 },
        data: { content: taskName || `Top of ${taskId}` },
      },
    ];
    const edges: Edge[] = [];
    st.setNodes(nodes);
    st.setEdges(edges);

  }
}



const uniqIso = (list: IsoMatch[]) => {
  const m = new Map<string, IsoMatch>();
  for (const it of list) m.set(`${it.iso_number}::${it.title}`, it);
  return Array.from(m.values());
};

export default function EditableNestedTable() {
  const navigate = useNavigate();
  const zoneId: string = useZoneStore((s) => s.selectedId);
  const setSelectedFta = useZoneStore((s) => s.setSelectedFta);
  const label = useZoneStore((s) =>
    s.zones.find(z => z.id === s.selectedId)?.label
  );

  console.log("Rendering Table for zone:", zoneId, "label:", label);
  // console.log('CauseNode render, zoneId:', zoneId);
  const storeHook = useMemo(() => (getGraphStoreHook(zoneId)), [zoneId]);
  const nodes = storeHook((state) => state.nodes);
  const edges = storeHook((state) => state.edges);
  console.log("Graph nodes:", nodes);

  const zoneNode = useMemo(() => nodes.filter(n => n.type === 'zone'), [nodes]);
  let zoneDescription = "";
  if (!zoneNode || zoneNode.length === 0) {
    console.warn("No zone node found in the graph.");
  } else if (zoneNode.length > 1) {
    console.warn("Multiple zone nodes found in the graph.");
  } else {
    zoneDescription = zoneNode[0].data.content;
  }
  // Build table form default values from the current graph (nodes/edges).
  // We derive an IR, then compute row-spans for a nested table rendering.
  const defaultValues = useMemo(() => {
    const ir: IR = graphToIR(nodes, edges);
    console.log("Derived IR:", ir);
    const dv = deriveRowSpans(ir);

    // Deep clone to avoid mutating memoized/form state by reference
    const out = JSON.parse(JSON.stringify(dv));

    try {
      // Walk the derived IR and dedupe `requirements` and `consequences` by `id` (prevents duplicated rows in the UI).
      out?.tasks?.forEach((task: any) => {
        task?.functions?.forEach((fn: any) => {
          fn?.realizations?.forEach((real: any) => {
            real?.properties?.forEach((prop: any) => {
              prop?.interpretations?.forEach((inter: any) => {
                if (Array.isArray(inter?.requirements)) {
                  inter.requirements = dedupeById(inter.requirements);
                }
                if (Array.isArray(inter?.consequences)) {
                  inter.consequences = dedupeById(inter.consequences);
                }
              });
            });
          });
        });
      });
    } catch (e) {
      console.warn('[Table] dedupe requirements/consequences by id failed:', e);
    }

    return out;
  }, [nodes, edges]);
  const { control, handleSubmit, reset, getValues } = useForm<FormValues>({
    defaultValues,
  });
  useEffect(() => {
    console.log("defaultValues", defaultValues);
  }, [defaultValues]);
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const { fields: taskFields } = useFieldArray({
    control,
    name: "tasks",
    keyName: "fieldId",
  });



  function taskHasWarnings(task: any): boolean {
    const fns = task?.functions ?? [];
    if (!fns.length) return true; // Missing functions

    for (const fn of fns) {
      const reals = fn?.realizations ?? [];
      if (!reals.length) return true; // Missing realizations

      for (const real of reals) {
        const props = real?.properties ?? [];
        if (!props.length) return true; // Missing properties

        for (const prop of props) {
          const inters = prop?.interpretations ?? [];
          if (!inters.length) return true; // Missing interpretations
        }
      }
    }

    return false; // All required parts exist; no warnings
  }

  // --- Merge helpers: if all guide words in a realization's properties are the same, merge property cell ---
  function calcPropRowSpan(prop: any): number {
    if (typeof prop?.rowSpan === 'number' && prop.rowSpan > 0) return prop.rowSpan;
    const n = Array.isArray(prop?.interpretations) ? prop.interpretations.length : 0;
    return Math.max(1, n);
  }

  function canMergeAllPropsByGuideWord(properties: any[] | undefined): { ok: boolean; guide?: string } {
    if (!Array.isArray(properties) || properties.length < 2) return { ok: false };
    const set = new Set<string>();
    for (const p of properties) {
      const inters = Array.isArray(p?.interpretations) ? p.interpretations : [];
      if (inters.length === 0) return { ok: false };
      for (const it of inters) {
        const g = (it?.guideWord ?? '').trim();
        if (!g) return { ok: false };
        set.add(g);
        if (set.size > 1) return { ok: false };
      }
    }
    const [only] = Array.from(set.values());
    return { ok: true, guide: only };
  }

  // --- Dynamic rowSpan helpers (respect merged-properties logic) ---
  function countUniqueInterpretationsByGuideWordIdAcrossProps(properties: any[] | undefined): number {
    if (!Array.isArray(properties) || properties.length === 0) return 1;
    const seen = new Set<string>();
    let any = false;
    for (const p of properties) {
      const inters = Array.isArray(p?.interpretations) ? p.interpretations : [];
      for (const it of inters) {
        any = true;
        const k = (typeof it?.guideWordId === 'string' && it.guideWordId)
          ? it.guideWordId
          : `__noid__${(it?.guideWord ?? '').trim()}::${Math.random()}`; // Fallback key: keep rows distinct even without a guideWordId
        seen.add(k);
      }
    }
    return Math.max(1, (any ? seen.size : 0) || 1);
  }

  function calcRealizationRowSpan(realization: any): number {
    const propsArr = Array.isArray(realization?.properties) ? realization.properties : [];
    if (propsArr.length === 0) return 1;

    const mergeCheck = canMergeAllPropsByGuideWord(propsArr);
    // If all properties share the same guide word set, we render a merged Property cell.
    // In that case, row-span equals the number of unique interpretations across all properties.
    if (mergeCheck.ok) {
      return countUniqueInterpretationsByGuideWordIdAcrossProps(propsArr);
    }
    // sum of each property's rowSpan (interpretations count fallback)
    return Math.max(
      1,
      propsArr.reduce((sum: number, p: any) => sum + calcPropRowSpan(p), 0)
    );
  }

  function calcFunctionRowSpan(fn: any): number {
    const reals = Array.isArray(fn?.realizations) ? fn.realizations : [];
    if (reals.length === 0) return 1;
    return Math.max(1, reals.reduce((sum: number, r: any) => sum + calcRealizationRowSpan(r), 0));
  }

  function calcTaskRowSpan(task: any): number {
    const fns = Array.isArray(task?.functions) ? task.functions : [];
    if (fns.length === 0) return 1;
    return Math.max(1, fns.reduce((sum: number, f: any) => sum + calcFunctionRowSpan(f), 0));
  }

  // --- TaskCell component to unify Task cell rendering and FTA button ---
  function TaskCell({
    control,
    taskIndex,
    rowSpan,
    hasWarnings,
    taskId,
    getTaskName,
  }: {
    control: any;
    taskIndex: number;
    rowSpan?: number;
    hasWarnings: boolean;
    taskId: string;
    getTaskName?: () => string;
  }) {
    console.log("Rendering TaskCell - taskId:", taskId);
    return (
      <TableCell rowSpan={rowSpan || 1}>

        <Controller
          control={control}
          name={`tasks.${taskIndex}.taskName`}
          render={({ field }) => <Textarea {...field} />}
        />
        <div className="mt-2">
          <Button
            type="button"
            disabled={hasWarnings}
            title={
              hasWarnings
                ? "This task has missing items. Complete the graph first."
                : "All good! You can proceed."
            }
            onClick={() => {
              const taskName = getTaskName(); // Current task name from the form state
              // zoneId must be available to create / open the correct FTA store.
              if (!zoneId) {
                console.warn("No zone selected.");
                return;
              }
              ensureTopEvent(zoneId, taskId, taskName);
              setSelectedFta({ zoneId, taskId });
              navigate(`/fta?zone=${encodeURIComponent(zoneId)}&task=${encodeURIComponent(taskId)}`);
            }}
          >
            Create FTA
          </Button>
        </div>
      </TableCell>
    );
  }
  // Persist table edits back into the graph store:
  // 1) text content updates (task/function/realization/property/deviation/cause/consequence/requirement)
  // 2) ISO matches stored on guideWord nodes
  const onSubmit = (data: FormValues) => {
    try {
      const updates = collectGraphUpdatesFromForm(data);
      const isoMap = collectIsoMatchesFromForm(data);

      if (!updates.length && isoMap.size === 0) {
        toast.info("No changes to save.");
        return;
      }

      const mapContent = new Map<string, string>(updates.map(u => [u.id, u.content]));

      // Read current zone nodes and build the updated node list to write back.
      const graphState = storeHook.getState(); // Zustand store snapshot
      const nextNodes = graphState.nodes.map(n => {
        let next = n;

        // Write back content
        if (mapContent.has(n.id)) {
          next = { ...next, data: { ...next.data, content: mapContent.get(n.id)! } };
        }

        // Write back isoMatches to guideWord node
        if (isoMap.has(n.id)) {
          const isoMatches = isoMap.get(n.id)!;
          next = { ...next, data: { ...next.data, isoMatches } };
        }

        return next;
      });

      // Write back in one shot to avoid partial updates.
      graphState.setNodes(nextNodes);

      const textCount = updates.length;
      const isoCount = isoMap.size;

      toast.success(`Saved successfully`);

      console.log("Saved updates:", {
        textUpdates: textCount,
        isoPairs: isoCount,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (

    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-20" key={zoneId}>
      <header className="text-center mb-4">
        <h2 className="text-xl font-bold tracking-tight">
          Function-Centric Hazard Identification
        </h2>
      </header>
      <div className="w-full overflow-x-auto">
        <div className="mx-auto max-w-[2600px]">
          <div className="rounded-md border bg-background [&_th]:border [&_td]:border [&_th]:border-gray-200 [&_td]:border-gray-200">
            <Table className="table-auto border-collapse w-full min-w-[2000px]">
              <TableHeader>
                <TableRow>
                  <TableHead colSpan={10} className="text-center text-lg font-semibold bg-gray-200">
                    Hazard Zone: {label ?? "Unnamed Zone"}
                  </TableHead>
                </TableRow>
                <TableRow>
                  <TableHead colSpan={10} className="bg-gray-100">
                    <div className="text-left text-sm text-muted-foreground px-2 py-1">
                      {zoneDescription
                        ? <>Zone Description: {zoneDescription}</>
                        : <>Zone Description: <span className="italic">No description provided.</span></>}
                    </div>
                  </TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className=" bg-gray-50">Task</TableHead>
                  <TableHead className=" bg-gray-50">Function</TableHead>
                  <TableHead className=" bg-gray-50">Realization</TableHead>
                  <TableHead className=" bg-gray-50">Property</TableHead>
                  <TableHead className=" bg-gray-50">Guide Word</TableHead>
                  <TableHead className=" bg-gray-50">Deviations</TableHead>
                  <TableHead className=" bg-gray-50">Causes</TableHead>
                  <TableHead className=" bg-gray-50">Consequences</TableHead>
                  <TableHead className=" bg-gray-50 min-w-[600px]">Requirements</TableHead>
                  <TableHead className="bg-gray-50 w-[120px] min-w-[120px]">Standard</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {taskFields.map((task, taskIndex) => {
                  const functionFields = task.functions;
                  const hasWarnings = taskHasWarnings(task);
                  let taskRendered = false;
                  const taskRowSpanDyn = calcTaskRowSpan(task);

                  if (!functionFields?.length) {
                    return (
                      <TableRow key={`${task.fieldId}-empty`}>
                        <TaskCell
                          control={control}
                          taskIndex={taskIndex}
                          rowSpan={taskRowSpanDyn}
                          hasWarnings={true}
                          taskId={task.id}
                          getTaskName={() => getValues(`tasks.${taskIndex}.taskName`)}
                        />
                        <TableCell colSpan={9} className="text-amber-600">
                          No function found, please complete in the graph editor.
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return functionFields.map((fn, functionIndex) => {
                    let functionRendered = false;
                    const functionRowSpanDyn = calcFunctionRowSpan(fn);

                    // Case 1: Function has no realizations -> render a single warning row.
                    if (!fn.realizations || fn.realizations.length === 0) {
                      return (
                        <TableRow key={`${task.fieldId}-${functionIndex}-no-real`}>
                          {/* Task (row-spanned) */}
                          {!taskRendered && (
                            <TaskCell
                              control={control}
                              taskIndex={taskIndex}
                              rowSpan={taskRowSpanDyn}
                              hasWarnings={true}
                              taskId={task.id}
                              getTaskName={() => getValues(`tasks.${taskIndex}.taskName`)}
                            />
                          )}
                          {/* Function (row-spanned) */}
                          {!functionRendered && (
                            <TableCell rowSpan={functionRowSpanDyn}>
                              <Controller
                                control={control}
                                name={`tasks.${taskIndex}.functions.${functionIndex}.functionName`}
                                render={({ field }) => <Textarea {...field} />}
                              />
                            </TableCell>
                          )}
                          {/* Warning takes the remaining 8 columns */}
                          <TableCell colSpan={8} className="text-amber-600">
                            No realization found, please complete in the graph editor.
                          </TableCell>

                          {taskRendered = true}
                          {functionRendered = true}
                        </TableRow>
                      );
                    }

                    return fn.realizations.map((realization, realizationIndex) => {
                      let realizationRendered = false;
                      const propsArr = realization.properties ?? [];
                      const mergeCheck = canMergeAllPropsByGuideWord(propsArr);
                      const realizationRowSpanDyn =
                        mergeCheck.ok
                          ? countUniqueInterpretationsByGuideWordIdAcrossProps(propsArr)
                          : Math.max(1, propsArr.reduce((sum: number, p: any) => sum + calcPropRowSpan(p), 0));

                      // Case 2: Realization has no properties -> render a single warning row.
                      if (!realization.properties || realization.properties.length === 0) {
                        return (
                          <TableRow key={`${task.fieldId}-${functionIndex}-${realizationIndex}-no-prop`}>
                            {/* Task (row-spanned) */}
                            {!taskRendered && (
                              <TaskCell
                                control={control}
                                taskIndex={taskIndex}
                                rowSpan={taskRowSpanDyn}
                                hasWarnings={true}
                                taskId={task.id}
                                getTaskName={() => getValues(`tasks.${taskIndex}.taskName`)}
                              />
                            )}
                            {/* Function (row-spanned) */}
                            {!functionRendered && (
                              <TableCell rowSpan={functionRowSpanDyn}>
                                <Controller
                                  control={control}
                                  name={`tasks.${taskIndex}.functions.${functionIndex}.functionName`}
                                  render={({ field }) => <Textarea {...field} />}
                                />
                              </TableCell>
                            )}
                            {/* Realization (row-spanned) */}
                            {!realizationRendered && (
                              <TableCell rowSpan={realizationRowSpanDyn}>
                                <Controller
                                  control={control}
                                  name={`tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.realizationName`}
                                  render={({ field }) => <Textarea {...field} />}
                                />
                              </TableCell>
                            )}
                            {/* Warning takes the remaining 7 columns */}
                            <TableCell colSpan={7} className="text-amber-600">
                              No property found, please complete in the graph editor.
                            </TableCell>

                            {taskRendered = true}
                            {functionRendered = true}
                            {realizationRendered = true}
                          </TableRow>
                        );
                      }

                      if (!mergeCheck.ok) {
                        // --- original per-property rendering (no merge) ---
                        return propsArr.map((property, propertyIndex) => {
                          let propertyRendered = false;

                          // Case 3: Property has no interpretations -> render a single warning row.
                          if (!property.interpretations || property.interpretations.length === 0) {
                            return (
                              <TableRow key={`${task.fieldId}-${functionIndex}-${realizationIndex}-${propertyIndex}-no-inter`}>
                                {/* Task */}
                                {!taskRendered && (
                                  <TaskCell
                                    control={control}
                                    taskIndex={taskIndex}
                                    rowSpan={taskRowSpanDyn}
                                    hasWarnings={true}
                                    taskId={task.id}
                                    getTaskName={() => getValues(`tasks.${taskIndex}.taskName`)}
                                  />
                                )}
                                {/* Function */}
                                {!functionRendered && (
                                  <TableCell rowSpan={functionRowSpanDyn}>
                                    <Controller
                                      control={control}
                                      name={`tasks.${taskIndex}.functions.${functionIndex}.functionName`}
                                      render={({ field }) => <Textarea {...field} />}
                                    />
                                  </TableCell>
                                )}
                                {/* Realization */}
                                {!realizationRendered && (
                                  <TableCell rowSpan={realizationRowSpanDyn}>
                                    <Controller
                                      control={control}
                                      name={`tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.realizationName`}
                                      render={({ field }) => <Textarea {...field} />}
                                    />
                                  </TableCell>
                                )}
                                {/* Property */}
                                {!propertyRendered && (
                                  <TableCell rowSpan={property.rowSpan || 1}>
                                    <Controller
                                      control={control}
                                      name={`tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.properties.${propertyIndex}.properties`}
                                      render={({ field }) => (
                                        <ul>
                                          {field.value.map((prop, idx) => (
                                            <li key={idx}>
                                              <Textarea
                                                value={prop}
                                                onChange={(e) => {
                                                  const newProperties = [...field.value];
                                                  newProperties[idx] = e.target.value;
                                                  field.onChange(newProperties);
                                                }}
                                              />
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    />
                                  </TableCell>
                                )}
                                {/* Warning takes the remaining 6 columns (GuideWord + 4 text-array columns + ISO) */}
                                <TableCell colSpan={6} className="text-amber-600">
                                  No interpretation found, please complete in the graph editor.
                                </TableCell>

                                {taskRendered = true}
                                {functionRendered = true}
                                {realizationRendered = true}
                                {propertyRendered = true}
                              </TableRow>
                            );
                          }

                          // Case 4: Normal interpretation rendering (no inline “Add …” buttons; editing only).
                          return property.interpretations.map((interpretation, interpretationIndex) => {
                            const hasRequirements = Array.isArray(interpretation.requirements) && interpretation.requirements.length > 0;
                            return (
                              <TableRow
                                key={`${task.fieldId}-${functionIndex}-${realizationIndex}-${propertyIndex}-${interpretationIndex}`}
                              >
                                {/* Task */}
                                {!taskRendered && (
                                  <TaskCell
                                    control={control}
                                    taskIndex={taskIndex}
                                    rowSpan={taskRowSpanDyn}
                                    hasWarnings={hasWarnings}
                                    taskId={task.id}
                                    getTaskName={() => getValues(`tasks.${taskIndex}.taskName`)}
                                  />
                                )}

                                {/* Function */}
                                {!functionRendered && (
                                  <TableCell rowSpan={functionRowSpanDyn}>
                                    <Controller
                                      control={control}
                                      name={`tasks.${taskIndex}.functions.${functionIndex}.functionName`}
                                      render={({ field }) => <Textarea {...field} />}
                                    />
                                  </TableCell>
                                )}

                                {/* Realization */}
                                {!realizationRendered && (
                                  <TableCell rowSpan={realizationRowSpanDyn}>
                                    <Controller
                                      control={control}
                                      name={`tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.realizationName`}
                                      render={({ field }) => <Textarea {...field} />}
                                    />
                                  </TableCell>
                                )}

                                {/* Property */}
                                {!propertyRendered && (
                                  <TableCell rowSpan={property.rowSpan || 1}>
                                    <Controller
                                      control={control}
                                      name={`tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.properties.${propertyIndex}.properties`}
                                      render={({ field }) => (
                                        <ul>
                                          {field.value.map((prop, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                              <span className="text-sm text-gray-500 mt-1">{idx + 1}.</span>
                                              <Textarea
                                                value={prop}
                                                onChange={(e) => {
                                                  const newProperties = [...field.value];
                                                  newProperties[idx] = e.target.value;
                                                  field.onChange(newProperties);
                                                }}
                                              />
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    />
                                  </TableCell>
                                )}

                                {/* Guide Word */}
                                <TableCell>
                                  <Controller
                                    control={control}
                                    name={`tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.properties.${propertyIndex}.interpretations.${interpretationIndex}.guideWord`}
                                    render={({ field }) => (
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                          <SelectValue>{field.value}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Part of">Part of</SelectItem>
                                          <SelectItem value="Other than">Other than</SelectItem>
                                          <SelectItem value="No">No</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                  />
                                </TableCell>

                                {/* Deviations */}
                                <TableCell>
                                  <Controller
                                    control={control}
                                    name={`tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.properties.${propertyIndex}.interpretations.${interpretationIndex}.deviations`}
                                    render={({ field }) => (
                                      <ul>
                                        {field.value.map((prop, idx) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <span className="text-sm text-gray-500 mt-1">{idx + 1}.</span>
                                            <Textarea
                                              value={prop.text}
                                              onChange={(e) => {
                                                const newProperties = [...field.value];
                                                newProperties[idx] = { id: prop.id, text: e.target.value };
                                                field.onChange(newProperties);
                                              }}
                                            />
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  />
                                </TableCell>

                                {/* Causes */}
                                <TableCell>
                                  <Controller
                                    control={control}
                                    name={`tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.properties.${propertyIndex}.interpretations.${interpretationIndex}.causes`}
                                    render={({ field }) => (
                                      <ul>
                                        {field.value.map((prop, idx) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <span className="text-sm text-gray-500 mt-1">{idx + 1}.</span>
                                            <Textarea
                                              value={prop.text}
                                              onChange={(e) => {
                                                const newProperties = [...field.value];
                                                newProperties[idx] = { id: prop.id, text: e.target.value };
                                                field.onChange(newProperties);
                                              }}
                                            />
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  />
                                </TableCell>

                                {/* Consequences */}
                                <TableCell>
                                  <Controller
                                    control={control}
                                    name={`tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.properties.${propertyIndex}.interpretations.${interpretationIndex}.consequences`}
                                    render={({ field }) => (
                                      <ul>
                                        {field.value.map((prop, idx) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <span className="text-sm text-gray-500 mt-1">{idx + 1}.</span>
                                            <Textarea
                                              value={prop.text}
                                              onChange={(e) => {
                                                const newProperties = [...field.value];
                                                newProperties[idx] = { id: prop.id, text: e.target.value };
                                                field.onChange(newProperties);
                                              }}
                                            />
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  />
                                </TableCell>

                                {/* Requirements */}
                                <TableCell className="align-top w-[600px] min-w-[600px] whitespace-pre-wrap">
                                  <Controller
                                    control={control}
                                    name={`tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.properties.${propertyIndex}.interpretations.${interpretationIndex}.requirements`}
                                    render={({ field }) => (
                                      <ul>
                                        {field.value.map((prop, idx) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <span className="text-sm text-gray-500 mt-1">{idx + 1}.</span>
                                            <Textarea
                                              className="w-[600px]"
                                              value={prop.text}
                                              onChange={(e) => {
                                                const newProperties = [...field.value];
                                                newProperties[idx] = { id: prop.id, text: e.target.value };
                                                field.onChange(newProperties);
                                              }}
                                            />
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  />
                                </TableCell>

                                {/* ISO Standard */}
                                <TableCell className="align-top w-[120px] min-w-[120px]">
                                  <Controller
                                    control={control}
                                    name={`tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.properties.${propertyIndex}.interpretations.${interpretationIndex}.isoMatches`}
                                    render={({ field }) => {
                                      const selectedIso = field.value ?? [];
                                      const removeAt = (idx: number) => {
                                        const next = selectedIso.slice();
                                        next.splice(idx, 1);
                                        field.onChange(next);
                                      };

                                      const addManual = (item: IsoMatch) => {
                                        field.onChange(uniqIso([...(field.value ?? []), item]));
                                      };

                                      const addFromAI = (items: IsoMatch[]) => {
                                        field.onChange(uniqIso([...(field.value ?? []), ...items]));
                                      };

                                      return (
                                        <div className="space-y-2 flex flex-col">
                                          {selectedIso.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                              {selectedIso.map((it: IsoMatch, idx: number) => (
                                                <EditIsoDialog
                                                  key={`${it.iso_number}-${idx}`}
                                                  value={it}
                                                  onSave={(updated) => {
                                                    const next = selectedIso.slice();
                                                    next[idx] = updated;
                                                    field.onChange(uniqIso(next));
                                                  }}
                                                  trigger={
                                                    <span
                                                      className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200 cursor-pointer"
                                                      title={it.title}
                                                      onDoubleClick={(e) => {
                                                        // Let double-click open the edit dialog (DialogTrigger).
                                                        e.preventDefault();
                                                        (e.currentTarget as HTMLElement).click();
                                                      }}
                                                    >
                                                      {it.iso_number}
                                                      <button
                                                        type="button"
                                                        aria-label="Remove"
                                                        className="rounded-full px-1.5 py-0.5 text-blue-700 hover:bg-blue-100"
                                                        onClick={(event) => {
                                                          event.stopPropagation(); // Prevent delete-click from also opening the dialog
                                                          removeAt(idx);
                                                        }}
                                                        title="remove this ISO"
                                                      >
                                                        ×
                                                      </button>
                                                    </span>
                                                  }
                                                />
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-xs text-muted-foreground">No ISO selected.</div>
                                          )}

                                          <IsoMatchingDialog
                                            trigger={
                                              <Button type="button" disabled={!hasRequirements} size="sm" className="px-1.5 py-1.5 text-xs font-normal leading-none h-auto w-auto mx-5">
                                                Matching(AI)
                                              </Button>
                                            }
                                            defaultRequirement={(interpretation.requirements ?? []).map((r, i) => `${i + 1}. ${r.text}`).join("\n")}
                                            onConfirm={addFromAI}
                                         
                                          />

                                          <AddIsoDialog
                                            trigger={
                                              <Button type="button" disabled={!hasRequirements} size="sm" className="px-1.5 py-1.5 text-xs font-normal leading-none h-auto w-auto mx-5">
                                                Add Manually
                                              </Button>
                                            }
                                            onAdd={addManual}
                                          />
                                        </div>
                                      );
                                    }}
                                  />
                                </TableCell>

                                {taskRendered = true}
                                {functionRendered = true}
                                {realizationRendered = true}
                                {propertyRendered = true}
                              </TableRow>
                            );
                          });
                        });
                      }

                      // --- MERGED PROPERTY CELL (all guide words are the same across properties) ---
                      {
                        let propertyCellRendered = false; // render merged Property cell once
                        let localTaskRendered = taskRendered;
                        let localFunctionRendered = functionRendered;
                        let localRealizationRendered = realizationRendered;

                        // Build unique interpretation rows by guideWordId (stable order). We render one row per unique guide word.
                        type KeyRec = { key: string; pIdx: number; iIdx: number };
                        const uniqRows: KeyRec[] = [];
                        const seenKeys = new Set<string>();
                        propsArr.forEach((p, pIdx) => {
                          const inters = Array.isArray(p?.interpretations) ? p.interpretations : [];
                          inters.forEach((it, iIdx) => {
                            const k = typeof it?.guideWordId === 'string' && it.guideWordId
                              ? it.guideWordId
                              : `__noid__${(it?.guideWord ?? '').trim()}::${pIdx}::${iIdx}`;
                            if (seenKeys.has(k)) return;
                            seenKeys.add(k);
                            uniqRows.push({ key: k, pIdx, iIdx });
                          });
                        });

                        // The merged Property cell should span exactly the number of unique interpretation rows.
                        const propertyRowSpan = Math.max(1, uniqRows.length);

                        // Flatten all property text items so numbering stays continuous across merged properties.
                        const flatPropItems: { pIdx: number; idx: number }[] = [];
                        propsArr.forEach((p, pIdx) => {
                          const items = Array.isArray(p?.properties) ? p.properties : [];
                          items.forEach((_text: string, idx: number) => {
                            flatPropItems.push({ pIdx, idx });
                          });
                        });

                        const mergedPropertyCell = (
                          <TableCell rowSpan={propertyRowSpan}>
                            <ul>
                              {flatPropItems.map(({ pIdx, idx }, seq) => (
                                <li key={`m-${pIdx}-${idx}`} className="flex items-start gap-2">
                                  <span className="text-sm text-gray-500 mt-1">{seq + 1}.</span>
                                  <Controller
                                    control={control}
                                    name={`tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.properties.${pIdx}.properties.${idx}`}
                                    render={({ field }) => (
                                      <Textarea
                                        value={field.value}
                                        onChange={(e) => field.onChange(e.target.value)}
                                      />
                                    )}
                                  />
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                        );

                        const rows: JSX.Element[] = [];

                        if (uniqRows.length === 0) {
                          // Safety fallback: after merging, no interpretations exist (graph is incomplete).
                          const rowKey = `${task.fieldId}-${functionIndex}-${realizationIndex}-merged-empty-fallback`;
                          rows.push(
                            <TableRow key={rowKey}>
                              {!localTaskRendered && (
                                <TaskCell
                                  control={control}
                                  taskIndex={taskIndex}
                                  rowSpan={taskRowSpanDyn}
                                  hasWarnings={true}
                                  taskId={task.id}
                                  getTaskName={() => getValues(`tasks.${taskIndex}.taskName`)}
                                />
                              )}
                              {!localFunctionRendered && (
                                <TableCell rowSpan={functionRowSpanDyn}>
                                  <Controller
                                    control={control}
                                    name={`tasks.${taskIndex}.functions.${functionIndex}.functionName`}
                                    render={({ field }) => <Textarea {...field} />}
                                  />
                                </TableCell>
                              )}
                              {!localRealizationRendered && (
                                <TableCell rowSpan={realizationRowSpanDyn}>
                                  <Controller
                                    control={control}
                                    name={`tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.realizationName`}
                                    render={({ field }) => <Textarea {...field} />}
                                  />
                                </TableCell>
                              )}
                              {!propertyCellRendered && mergedPropertyCell}
                              <TableCell colSpan={6} className="text-amber-600">No interpretation found, please complete in the graph editor.</TableCell>
                              {localTaskRendered = true}
                              {localFunctionRendered = true}
                              {localRealizationRendered = true}
                              {propertyCellRendered = true}
                            </TableRow>
                          );
                        } else {
                          uniqRows.forEach(({ pIdx, iIdx }) => {
                            const pathBase = `tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.properties.${pIdx}.interpretations.${iIdx}`;
                            // Determine whether this row has any requirements (used to enable/disable ISO matching buttons).
                            const repInterp: any = Array.isArray(propsArr[pIdx]?.interpretations)
                              ? (propsArr[pIdx] as any).interpretations?.[iIdx]
                              : undefined;
                            const hasReq = Array.isArray(repInterp?.requirements) && repInterp.requirements.length > 0;

                            const rowKey = `${task.fieldId}-${functionIndex}-${realizationIndex}-muniq-${pIdx}-${iIdx}`;

                            rows.push(
                              <TableRow key={rowKey}>
                                {!localTaskRendered && (
                                  <TaskCell
                                    control={control}
                                    taskIndex={taskIndex}
                                    rowSpan={taskRowSpanDyn}
                                    hasWarnings={hasReq}
                                    taskId={task.id}
                                    getTaskName={() => getValues(`tasks.${taskIndex}.taskName`)}
                                  />
                                )}
                                {!localFunctionRendered && (
                                  <TableCell rowSpan={functionRowSpanDyn}>
                                    <Controller
                                      control={control}
                                      name={`tasks.${taskIndex}.functions.${functionIndex}.functionName`}
                                      render={({ field }) => <Textarea {...field} />}
                                    />
                                  </TableCell>
                                )}
                                {!localRealizationRendered && (
                                  <TableCell rowSpan={realizationRowSpanDyn}>
                                    <Controller
                                      control={control}
                                      name={`tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.realizationName`}
                                      render={({ field }) => <Textarea {...field} />}
                                    />
                                  </TableCell>
                                )}

                                {!propertyCellRendered && mergedPropertyCell}

                                {/* Guide Word */}
                                <TableCell>
                                  <Controller
                                    control={control}
                                    name={`${pathBase}.guideWord`}
                                    render={({ field }) => (
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                          <SelectValue>{field.value}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Part of">Part of</SelectItem>
                                          <SelectItem value="Other than">Other than</SelectItem>
                                          <SelectItem value="No">No</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                  />
                                </TableCell>

                                {/* Deviations */}
                                <TableCell>
                                  <Controller
                                    control={control}
                                    name={`${pathBase}.deviations`}
                                    render={({ field }) => (
                                      <ul>
                                        {field.value.map((prop: any, idx: number) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <span className="text-sm text-gray-500 mt-1">{idx + 1}.</span>
                                            <Textarea
                                              value={prop.text}
                                              onChange={(e) => {
                                                const newProperties = [...field.value];
                                                newProperties[idx] = { id: prop.id, text: e.target.value };
                                                field.onChange(newProperties);
                                              }}
                                            />
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  />
                                </TableCell>

                                {/* Causes */}
                                <TableCell>
                                  <Controller
                                    control={control}
                                    name={`${pathBase}.causes`}
                                    render={({ field }) => (
                                      <ul>
                                        {field.value.map((prop: any, idx: number) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <span className="text-sm text-gray-500 mt-1">{idx + 1}.</span>
                                            <Textarea
                                              value={prop.text}
                                              onChange={(e) => {
                                                const newProperties = [...field.value];
                                                newProperties[idx] = { id: prop.id, text: e.target.value };
                                                field.onChange(newProperties);
                                              }}
                                            />
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  />
                                </TableCell>

                                {/* Consequences */}
                                <TableCell>
                                  <Controller
                                    control={control}
                                    name={`${pathBase}.consequences`}
                                    render={({ field }) => (
                                      <ul>
                                        {field.value.map((prop: any, idx: number) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <span className="text-sm text-gray-500 mt-1">{idx + 1}.</span>
                                            <Textarea
                                              value={prop.text}
                                              onChange={(e) => {
                                                const newProperties = [...field.value];
                                                newProperties[idx] = { id: prop.id, text: e.target.value };
                                                field.onChange(newProperties);
                                              }}
                                            />
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  />
                                </TableCell>

                                {/* Requirements */}
                                <TableCell className="align-top w-[600px] min-w-[600px] whitespace-pre-wrap">
                                  <Controller
                                    control={control}
                                    name={`${pathBase}.requirements`}
                                    render={({ field }) => (
                                      <ul>
                                        {field.value.map((prop: any, idx: number) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <span className="text-sm text-gray-500 mt-1">{idx + 1}.</span>
                                            <Textarea
                                              className="w-[600px]"
                                              value={prop.text}
                                              onChange={(e) => {
                                                const newProperties = [...field.value];
                                                newProperties[idx] = { id: prop.id, text: e.target.value };
                                                field.onChange(newProperties);
                                              }}
                                            />
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  />
                                </TableCell>

                                {/* ISO Standard */}
                                <TableCell className="align-top w-[120px] min-w-[120px]">
                                  <Controller
                                    control={control}
                                    name={`${pathBase}.isoMatches`}
                                    render={({ field }) => {
                                      const selectedIso = field.value ?? [];
                                      const removeAt = (idx: number) => {
                                        const next = selectedIso.slice();
                                        next.splice(idx, 1);
                                        field.onChange(next);
                                      };
                                      const addManual = (item: IsoMatch) => {
                                        field.onChange(uniqIso([...(field.value ?? []), item]));
                                      };
                                      const addFromAI = (items: IsoMatch[]) => {
                                        field.onChange(uniqIso([...(field.value ?? []), ...items]));
                                      };
                                      return (
                                        <div className="space-y-2 flex flex-col">
                                          {selectedIso.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                              {selectedIso.map((it: IsoMatch, idx: number) => (
                                                <EditIsoDialog
                                                  key={`${it.iso_number}-${idx}`}
                                                  value={it}
                                                  onSave={(updated) => {
                                                    const next = selectedIso.slice();
                                                    next[idx] = updated;
                                                    field.onChange(uniqIso(next));
                                                  }}
                                                  trigger={
                                                    <span
                                                      className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200 cursor-pointer"
                                                      title={it.title}
                                                      onDoubleClick={(e) => {
                                                        e.preventDefault();
                                                        (e.currentTarget as HTMLElement).click();
                                                      }}
                                                    >
                                                      {it.iso_number}
                                                      <button
                                                        type="button"
                                                        aria-label="Remove"
                                                        className="rounded-full px-1.5 py-0.5 text-blue-700 hover:bg-blue-100"
                                                        onClick={(event) => {
                                                          event.stopPropagation();
                                                          removeAt(idx);
                                                        }}
                                                        title="remove this ISO"
                                                      >
                                                        ×
                                                      </button>
                                                    </span>
                                                  }
                                                />
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-xs text-muted-foreground">No ISO selected.</div>
                                          )}

                                          <IsoMatchingDialog
                                            trigger={
                                              <Button
                                                type="button"
                                                disabled={!hasReq}
                                                size="sm"
                                                className="px-1.5 py-1.5 text-xs font-normal leading-none h-auto w-auto mx-5"
                                              >
                                                Matching(AI)
                                              </Button>
                                            }
                                            defaultRequirement={(repInterp?.requirements ?? []).map((r: any, i: number) => `${i + 1}. ${r.text}`).join("\n")}
                                            onConfirm={addFromAI}
                                          />

                                          <AddIsoDialog
                                            trigger={
                                              <Button
                                                type="button"
                                                disabled={!hasReq}
                                                size="sm"
                                                className="px-1.5 py-1.5 text-xs font-normal leading-none h-auto w-auto mx-5"
                                              >
                                                Add Manually
                                              </Button>
                                            }
                                            onAdd={addManual}
                                          />
                                        </div>
                                      );
                                    }}
                                  />
                                </TableCell>

                                {localTaskRendered = true}
                                {localFunctionRendered = true}
                                {localRealizationRendered = true}
                                {propertyCellRendered = true}
                              </TableRow>
                            );
                          });
                        }

                        // Sync outer render flags so later rows don't re-render Task/Function/Realization cells.
                        taskRendered = localTaskRendered;
                        functionRendered = localFunctionRendered;
                        realizationRendered = localRealizationRendered;

                        return rows;
                      }
                    });
                  });
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Button type="submit">Save Changes</Button>
      </div>
      <div className="mt-4">
        {/* DMM visualization for debugging or cross-reference */}
        <DMM data={defaultValues} />
      </div>
      <ExportTextPDFButton
        zoneDescription={zoneDescription}
        data={defaultValues}
        projectName={useZoneStore.getState().projectName}
        zoneLabel={label ?? "Unnamed Zone"}
      />
    </form >
  );
}