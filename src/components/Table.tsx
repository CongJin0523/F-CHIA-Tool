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
import DSM from "@/components/DSM";
import jsonTest from "@/common/jsonTest";
type Update = { id: string; content: string };
import AddIsoDialog from "@/components/manually-add-iso";
import { type Edge } from '@xyflow/react';
import { type FtaNodeTypes } from '@/common/fta-node-type';
import { getFtaStoreHook } from '@/store/fta-registry';
import { useNavigate } from "react-router-dom";
import { toast } from "sonner"

function collectGraphUpdatesFromForm(data: FormValues): Update[] {
  const updates: Update[] = [];

  for (const task of data.tasks ?? []) {
    if (task.id) updates.push({ id: task.id, content: task.taskName ?? "" });

    for (const fn of task.functions ?? []) {
      if (fn.id) updates.push({ id: fn.id, content: fn.functionName ?? "" });

      for (const real of fn.realizations ?? []) {
        if (real.id) updates.push({ id: real.id, content: real.realizationName ?? "" });

        for (const prop of real.properties ?? []) {
          // 属性标题：仍然从 properties[0]
          if (prop.id) updates.push({ id: prop.id, content: prop.properties?.[0] ?? "" });

          for (const inter of prop.interpretations ?? []) {
            // guideword 节点：如果允许编辑并需要回写（内容为枚举）
            if (inter.guideWordId) {
              updates.push({ id: inter.guideWordId, content: inter.guideWord });
            }
            // deviations / causes / consequences / requirements 都是 {id, text}
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

function collectIsoMatchesFromForm(data: FormValues) {
  const map = new Map<string, IsoMatch[]>();

  for (const task of data.tasks ?? []) {
    for (const fn of task.functions ?? []) {
      for (const real of fn.realizations ?? []) {
        for (const prop of real.properties ?? []) {
          for (const inter of prop.interpretations ?? []) {
            if (!inter?.guideWordId) continue;
            const list = inter.isoMatches ?? [];
            map.set(inter.guideWordId, list);
          }
        }
      }
    }
  }
  return map;
}
function ensureTopEvent(zoneId: string, taskId: string, taskName: string) {
  const hook = getFtaStoreHook(zoneId, taskId);
  const st = hook.getState();
  if (!st.nodes || st.nodes.length === 0) {
    const topId = `top-${taskId}`;
    const nodes: FtaNodeTypes[] = [
      {
        id: topId,
        type: 'topEvent',               // 你在 fta-node-type 里定义的类型
        position: { x: 0, y: 0 },
        data: { content: taskName || `Top of ${taskId}` },
      },
    ];
    const edges: Edge[] = [];
    st.setNodes(nodes);
    st.setEdges(edges);
    // 可选：立即跑一次布局；也可放到 FTA 画布 onInit 时 fitView + layout
    // st.onLayout?.('DOWN');
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
  const defaultValues = useMemo(() => {
    const ir: IR = graphToIR(nodes, edges);
    console.log("Derived IR:", ir);
    return deriveRowSpans(ir);
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
    if (!fns.length) return true; // 无 functions

    for (const fn of fns) {
      const reals = fn?.realizations ?? [];
      if (!reals.length) return true; // 无 realizations

      for (const real of reals) {
        const props = real?.properties ?? [];
        if (!props.length) return true; // 无 properties

        for (const prop of props) {
          const inters = prop?.interpretations ?? [];
          if (!inters.length) return true; // 无 interpretations
        }
      }
    }

    return false; // 全部完整，没有告警
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
              const taskName = getTaskName(); // <-- 当前表单里的任务名
              // zoneId 也要可用
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
  const onSubmit = (data: FormValues) => {
    try {
      const updates = collectGraphUpdatesFromForm(data);
      const isoMap = collectIsoMatchesFromForm(data);

      if (!updates.length && isoMap.size === 0) {
        toast.info("No changes to save.");
        return;
      }

      const mapContent = new Map<string, string>(updates.map(u => [u.id, u.content]));

      // 读取当前 zone 的节点，并构造写回后的 nodes
      const graphState = storeHook.getState(); // Zustand getState
      const nextNodes = graphState.nodes.map(n => {
        let next = n;

        // 写回 content
        if (mapContent.has(n.id)) {
          next = { ...next, data: { ...next.data, content: mapContent.get(n.id)! } };
        }

        // 写回 isoMatches 到 guideWord 节点
        if (isoMap.has(n.id)) {
          const isoMatches = isoMap.get(n.id)!;
          next = { ...next, data: { ...next.data, isoMatches } };
        }

        return next;
      });

      // 一次性写回
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
      <div className="overflow-x-auto rounded-md border bg-background [&_th]:border [&_td]:border  [&_th]:border-gray-200 [&_td]:border-gray-200">
        <Table className="table-fixed 80vw border-collapse">
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
              <TableHead className="w-1/16 bg-gray-50">Task</TableHead>
              <TableHead className="w-1/12 bg-gray-50">Function</TableHead>
              <TableHead className="w-1/12 bg-gray-50">Realization</TableHead>
              <TableHead className="w-1/12 bg-gray-50">Property</TableHead>
              <TableHead className="w-1/16 bg-gray-50">Guide Word</TableHead>
              <TableHead className="bg-gray-50">Deviations</TableHead>
              <TableHead className="bg-gray-50">Causes</TableHead>
              <TableHead className="bg-gray-50">Consequences</TableHead>
              <TableHead className="w-1/3 bg-gray-50">Requirements</TableHead>
              <TableHead className="w-1/12 bg-gray-50">ISO Standard</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody >
            {taskFields.map((task, taskIndex) => {
              const functionFields = task.functions;
              const hasWarnings = taskHasWarnings(task);
              let taskRendered = false;


              if (!functionFields?.length) {
                return (
                  <TableRow key={`${task.fieldId}-empty`}>
                    <TaskCell
                      control={control}
                      taskIndex={taskIndex}
                      rowSpan={1}
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

                // ① Function 没有 realizations：渲染一行告警
                if (!fn.realizations || fn.realizations.length === 0) {
                  return (
                    <TableRow key={`${task.fieldId}-${functionIndex}-no-real`}>
                      {/* Task */}
                      {!taskRendered && (
                        <TaskCell
                          control={control}
                          taskIndex={taskIndex}
                          rowSpan={task.rowSpan}
                          hasWarnings={true}
                          taskId={task.id}
                          getTaskName={() => getValues(`tasks.${taskIndex}.taskName`)}
                        />
                      )}
                      {/* Function */}
                      {!functionRendered && (
                        <TableCell rowSpan={fn.rowSpan || 1}>
                          <Controller
                            control={control}
                            name={`tasks.${taskIndex}.functions.${functionIndex}.functionName`}
                            render={({ field }) => <Textarea {...field} />}
                          />
                        </TableCell>
                      )}
                      {/* 告警占 8 列 */}
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

                  // ② Realization 没有 properties：渲染一行告警
                  if (!realization.properties || realization.properties.length === 0) {
                    return (
                      <TableRow key={`${task.fieldId}-${functionIndex}-${realizationIndex}-no-prop`}>
                        {/* Task */}
                        {!taskRendered && (
                          <TaskCell
                            control={control}
                            taskIndex={taskIndex}
                            rowSpan={task.rowSpan}
                            hasWarnings={true}
                            taskId={task.id}
                            getTaskName={() => getValues(`tasks.${taskIndex}.taskName`)}
                          />
                        )}
                        {/* Function */}
                        {!functionRendered && (
                          <TableCell rowSpan={fn.rowSpan || 1}>
                            <Controller
                              control={control}
                              name={`tasks.${taskIndex}.functions.${functionIndex}.functionName`}
                              render={({ field }) => <Textarea {...field} />}
                            />
                          </TableCell>
                        )}
                        {/* Realization */}
                        {!realizationRendered && (
                          <TableCell rowSpan={realization.rowSpan || 1}>
                            <Controller
                              control={control}
                              name={`tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.realizationName`}
                              render={({ field }) => <Textarea {...field} />}
                            />
                          </TableCell>
                        )}
                        {/* 告警占 7 列 */}
                        <TableCell colSpan={7} className="text-amber-600">
                          No property found, please complete in the graph editor.
                        </TableCell>

                        {taskRendered = true}
                        {functionRendered = true}
                        {realizationRendered = true}
                      </TableRow>
                    );
                  }

                  return realization.properties.map((property, propertyIndex) => {
                    let propertyRendered = false;

                    // ③ Property 没有 interpretations：渲染一行告警
                    if (!property.interpretations || property.interpretations.length === 0) {
                      return (
                        <TableRow key={`${task.fieldId}-${functionIndex}-${realizationIndex}-${propertyIndex}-no-inter`}>
                          {/* Task */}
                          {!taskRendered && (
                            <TaskCell
                              control={control}
                              taskIndex={taskIndex}
                              rowSpan={task.rowSpan}
                              hasWarnings={true}
                              taskId={task.id}
                              getTaskName={() => getValues(`tasks.${taskIndex}.taskName`)}
                            />
                          )}
                          {/* Function */}
                          {!functionRendered && (
                            <TableCell rowSpan={fn.rowSpan || 1}>
                              <Controller
                                control={control}
                                name={`tasks.${taskIndex}.functions.${functionIndex}.functionName`}
                                render={({ field }) => <Textarea {...field} />}
                              />
                            </TableCell>
                          )}
                          {/* Realization */}
                          {!realizationRendered && (
                            <TableCell rowSpan={realization.rowSpan || 1}>
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
                          {/* 告警占 6 列（GuideWord + 4 列数组 + ISO） */}
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

                    // ④ 正常渲染 interpretations（移除所有 Add 按钮）
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
                              rowSpan={task.rowSpan}
                              hasWarnings={hasWarnings}
                              taskId={task.id}
                              getTaskName={() => getValues(`tasks.${taskIndex}.taskName`)}
                            />
                          )}

                          {/* Function */}
                          {!functionRendered && (
                            <TableCell rowSpan={fn.rowSpan || 1}>
                              <Controller
                                control={control}
                                name={`tasks.${taskIndex}.functions.${functionIndex}.functionName`}
                                render={({ field }) => <Textarea {...field} />}
                              />
                            </TableCell>
                          )}

                          {/* Realization */}
                          {!realizationRendered && (
                            <TableCell rowSpan={realization.rowSpan || 1}>
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
                          <TableCell>
                            <Controller
                              control={control}
                              name={`tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.properties.${propertyIndex}.interpretations.${interpretationIndex}.requirements`}
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



                          {/* ISO Standard */}
                          <TableCell>
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
                                    {/* 已选标签 */}
                                    {selectedIso.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {selectedIso.map((it: any, idx: number) => (
                                          <span
                                            key={`${it.iso_number}-${idx}`}
                                            className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200"
                                            title={it.title}
                                          >
                                            {it.iso_number}
                                            <button
                                              type="button"
                                              aria-label="Remove"
                                              className="rounded-full px-1.5 py-0.5 text-blue-700 hover:bg-blue-100"
                                              onClick={() => removeAt(idx)}
                                              title="remove this ISO"
                                            >
                                              ×
                                            </button>
                                          </span>
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
                                      // 可把当前行的 requirement 文本拼起来作为默认输入
                                      defaultRequirement={
                                        (interpretation.requirements ?? [])
                                          .map((r, i) => `${i + 1}. ${r.text}`)
                                          .join("\n")
                                      }
                                      onConfirm={addFromAI}
                                      mockResponse={jsonTest} // fake data
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
                });
              });
            })}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4">
        <Button type="submit">Save Changes</Button>
      </div>
      <div className="mt-4">
        <DSM data={defaultValues} />
      </div>
    </form >
  );
}