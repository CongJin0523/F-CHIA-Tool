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

    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-20 pr-50" key={zoneId}>
      <div className="overflow-x-auto">
        <Table className="table-fixed w-[1600px]">
          <TableHeader>
            <TableRow>
              <TableHead colSpan={9} className="text-center text-lg font-semibold bg-gray-100">
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {taskFields.map((task, taskIndex) => {
              const functionFields = task.functions;
              let taskRendered = false;


              if (!functionFields?.length) {
                return (
                  <TableRow key={`${task.id}-empty`}>
                    <TableCell rowSpan={1}>
                      <Controller
                        control={control}
                        name={`tasks.${taskIndex}.taskName`}
                        render={({ field }) => <Textarea {...field} />}
                      />
                    </TableCell>
                    <TableCell colSpan={8} className="text-amber-600">
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
                        <TableCell rowSpan={task.rowSpan || 1}>
                          <Controller
                            control={control}
                            name={`tasks.${taskIndex}.taskName`}
                            render={({ field }) => <Textarea {...field} />}
                          />
                        </TableCell>
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
                      {/* 告警占 7 列 */}
                      <TableCell colSpan={7} className="text-amber-600">
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
                          <TableCell rowSpan={task.rowSpan || 1}>
                            <Controller
                              control={control}
                              name={`tasks.${taskIndex}.taskName`}
                              render={({ field }) => <Textarea {...field} />}
                            />
                          </TableCell>
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
                        {/* 告警占 6 列 */}
                        <TableCell colSpan={6} className="text-amber-600">
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
                            <TableCell rowSpan={task.rowSpan || 1}>
                              <Controller
                                control={control}
                                name={`tasks.${taskIndex}.taskName`}
                                render={({ field }) => <Textarea {...field} />}
                              />
                            </TableCell>
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
                          {/* 告警占 5 列（GuideWord + 4 列数组） */}
                          <TableCell colSpan={5} className="text-amber-600">
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
                    return property.interpretations.map((interpretation, interpretationIndex) => (
                      <TableRow
                        key={`${task.id}-${functionIndex}-${realizationIndex}-${propertyIndex}-${interpretationIndex}`}
                      >
                        {/* Task */}
                        {!taskRendered && (
                          <TableCell rowSpan={task.rowSpan || 1}>
                            <Controller
                              control={control}
                              name={`tasks.${taskIndex}.taskName`}
                              render={({ field }) => <Textarea {...field} />}
                            />
                          </TableCell>
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

                        {taskRendered = true}
                        {functionRendered = true}
                        {realizationRendered = true}
                        {propertyRendered = true}
                      </TableRow>
                    ));
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
    </form>
  );
}