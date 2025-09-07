"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type FormValues } from "@/common/types";
import { graphToIR } from "@/common/graphToIR";
import { deriveRowSpans } from "@/common/deriveRowSpans";
import { useZoneStore } from "@/store/zone-store";
import { getGraphStoreHook } from '@/store/graph-registry';
import IsoMatchingDialog from "@/components/iso-matching-dialog";
import type { IR } from "@/common/ir";
import DSM from "@/components/DSM";
type Update = { id: string; content: string };

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

export default function EditableNestedTable() {
  const zoneId: string = useZoneStore((s) => s.selectedId);
  const label = useZoneStore((s) =>
    s.zones.find(z => z.id === s.selectedId)?.label
  );
  console.log("Rendering Table for zone:", zoneId, "label:", label);
  // console.log('CauseNode render, zoneId:', zoneId);
  const storeHook = useMemo(() => (getGraphStoreHook(zoneId)), [zoneId]);
  const nodes = storeHook((state) => state.nodes);
  const edges = storeHook((state) => state.edges);
  
  const defaultValues = useMemo(() => {
    const ir = graphToIR(nodes, edges);
    console.log("Derived IR:", ir);
    return deriveRowSpans(ir);
  }, [nodes, edges]);
  const { control, handleSubmit, reset } = useForm<FormValues>({
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
  }: {
    control: any;
    taskIndex: number;
    rowSpan?: number;
    hasWarnings: boolean;
    taskId: string;
  }) {
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
              console.log("Proceed with task:", taskId);
            }}
          >
            Create FTA
          </Button>
        </div>
      </TableCell>
    );
  }
  const onSubmit = (data: FormValues) => {
    const updates = collectGraphUpdatesFromForm(data);

    if (!updates.length) {
      console.log("No changes to save.");
      return;
    }
    const map = new Map<string, string>(updates.map(u => [u.id, u.content]));

    // 3) 读取当前 zone 的节点，并构造写回后的 nodes
    const graphState = storeHook.getState(); // Zustand getState
    const nextNodes = graphState.nodes.map(n =>
      map.has(n.id)
        ? { ...n, data: { ...n.data, content: map.get(n.id)! } }
        : n
    );

    // 4) 一次性写回
    graphState.setNodes(nextNodes);

    console.log("Saved updates:", updates);
  };

  return (

    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-20 pr-60" key={zoneId}>
      <div className="overflow-x-auto">
        <Table className="table-fixed w-[1600px]">
          <TableHeader>
            <TableRow>
              <TableHead colSpan={10} className="text-center text-lg font-semibold bg-gray-100">
                Hazard Zone: {label ?? "Unnamed Zone"}
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="w-1/16">Task</TableHead>
              <TableHead className="w-1/12">Function</TableHead>
              <TableHead className="w-1/12">Realization</TableHead>
              <TableHead className="w-1/12">Property</TableHead>
              <TableHead className="w-1/16">Guide Word</TableHead>
              <TableHead>Deviations</TableHead>
              <TableHead>Causes</TableHead>
              <TableHead >Consequences</TableHead>
              <TableHead className="w-1/3">Requirements</TableHead>
              <TableHead className="w-1/12">ISO Standard</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taskFields.map((task, taskIndex) => {
              const functionFields = task.functions;
              const hasWarnings = taskHasWarnings(task);
              let taskRendered = false;


              if (!functionFields?.length) {
                return (
                  <TableRow key={`${task.id}-empty`}>
                    <TaskCell
                      control={control}
                      taskIndex={taskIndex}
                      rowSpan={1}
                      hasWarnings={true}
                      taskId={task.id}
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
                    <TableRow key={`${task.id}-${functionIndex}-no-real`}>
                      {/* Task */}
                      {!taskRendered && (
                        <TaskCell
                          control={control}
                          taskIndex={taskIndex}
                          rowSpan={task.rowSpan}
                          hasWarnings={true}
                          taskId={task.id}
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
                      <TableRow key={`${task.id}-${functionIndex}-${realizationIndex}-no-prop`}>
                        {/* Task */}
                        {!taskRendered && (
                          <TaskCell
                            control={control}
                            taskIndex={taskIndex}
                            rowSpan={task.rowSpan}
                            hasWarnings={true}
                            taskId={task.id}
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
                        <TableRow key={`${task.id}-${functionIndex}-${realizationIndex}-${propertyIndex}-no-inter`}>
                          {/* Task */}
                          {!taskRendered && (
                            <TaskCell
                              control={control}
                              taskIndex={taskIndex}
                              rowSpan={task.rowSpan}
                              hasWarnings={true}
                              taskId={task.id}
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
                          key={`${task.id}-${functionIndex}-${realizationIndex}-${propertyIndex}-${interpretationIndex}`}
                        >
                          {/* Task */}
                          {!taskRendered && (
                            <TaskCell
                              control={control}
                              taskIndex={taskIndex}
                              rowSpan={task.rowSpan}
                              hasWarnings={hasWarnings}
                              taskId={task.id}
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
                                    <li key={idx}>
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
                                    <li key={idx}>
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
                                    <li key={idx}>
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
                                    <li key={idx}>
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
                            <IsoMatchingDialog
                              trigger={
                                <Button type="button" disabled={!hasRequirements}>
                                  Matching
                                </Button>
                              }
                              // 可把当前行的 requirement 文本拼起来作为默认输入
                              defaultRequirement={
                                (interpretation.requirements ?? []).map(r => r.text).join("\n")
                              }
                              onConfirm={(selectedItems) => {
                                // TODO: 这里拿到选择的标准结果，写回你的状态或 edges/nodes，
                                // 或在某处保存 / 标注对应的 interpretation。
                                console.log("Selected ISO items:", selectedItems, {
                                  taskId: task.id,
                                  functionId: fn.id,
                                  realizationId: realization.id,
                                  propertyId: property.id,
                                  interpretationIndex,
                                });
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
    </form>
  );
}