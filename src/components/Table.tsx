"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type FormValues } from "@/common/types";
import { computeRowSpans, ensureRenderableStructure, graphToFormValues } from "@/common/graphToFormValues";
import { useDgStore } from "@/store/dg-store";
import { graphToIR } from "@/common/graphToIR";
import { deriveRowSpans } from "@/common/deriveRowSpans";
// export interface Realization {
//   realizationName: string;
// }

// export interface Func {
//   functionName: string;
//   realizations: Realization[];
// }

// export interface Task {
//   taskName: string;
//   functions: Func[];
// }

// interface FormValues {
//   tasks: Task[];
// }

// const defaultValues: FormValues = {
//   tasks: [
//     {
//       taskName: "Task 1",
//       functions: [
//         {
//           functionName: "Function 1",
//           realizations: [
//             { realizationName: "Realization 1" },
//             { realizationName: "Realization 2" },
//           ],
//         },
//         {
//           functionName: "Function 2",
//           realizations: [
//             { realizationName: "Realization 3" },
//             { realizationName: "Realization 4" },
//           ],
//         },
//       ],
//     },
//     {
//       taskName: "Task 2",
//       functions: [
//         {
//           functionName: "Function 3",
//           realizations: [
//             { realizationName: "Realization 5" },
//             { realizationName: "Realization 6" },
//           ],
//         },
//         {
//           functionName: "Function 4",
//           realizations: [
//             { realizationName: "Realization 7" },
//             { realizationName: "Realization 8" },
//           ],
//         },
//       ],
//     },
//   ],
// };

export default function EditableNestedTable() {
  const nodes = useDgStore((state) => state.nodes);
  const edges = useDgStore((state) => state.edges);
  const defaultValues = useMemo(() => {
  const ir = graphToIR(nodes, edges);
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
    console.log("Updated Data:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-20">
      <Table className="table-fixed w-full">
        <TableHeader>
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
      <div className="mt-4">
        <Button>add task</Button>
      </div>
      <div className="mt-4">
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
}