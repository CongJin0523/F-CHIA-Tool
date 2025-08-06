"use client";

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { initialTasks } from "@/common/initialTasks";
import { type FormValues } from "@/common/types";
import { Textarea } from "@/components/ui/textarea";
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

const defaultValues: FormValues = initialTasks;

export default function EditableNestedTable() {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues,
  });

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
          {/* Render task rows */}
          {taskFields.map((task, taskIndex) => {
            const functionFields = task.functions;

            let taskRendered = false;
            {/* Render functions for each task */ }
            return functionFields.map((fn, functionIndex) => {
              let functionRendered = false;

              return fn.realizations.map((realization, realizationIndex) => {
                let realizationRendered = false;

                return realization.properties.map((property, propertyIndex) => {
                  let propertyRendered = false;
                  return property.interpretations.map((interpretation, interpretationIndex) => {
                    return (
                      <TableRow key={`${task.id}-${functionIndex}-${realizationIndex}-${propertyIndex}-${interpretationIndex}`}>
                        {/* Task Name */}
                        {!taskRendered && (
                          <TableCell rowSpan={task.rowSpan || 1}>
                            <Controller
                              control={control}
                              name={`tasks.${taskIndex}.taskName`}
                              render={({ field }) => <Textarea {...field} />}
                            />
                          </TableCell>
                        )}

                        {/* Function Name */}
                        {!functionRendered && (
                          <TableCell rowSpan={fn.rowSpan || 1}>
                            <Controller
                              control={control}
                              name={`tasks.${taskIndex}.functions.${functionIndex}.functionName`}
                              render={({ field }) => <Textarea {...field} />}
                            />
                          </TableCell>
                        )}

                        {/* Realization Name */}
                        {!realizationRendered && (
                          <TableCell rowSpan={realization.rowSpan || 1}>
                            <Controller
                              control={control}
                              name={`tasks.${taskIndex}.functions.${functionIndex}.realizations.${realizationIndex}.realizationName`}
                              render={({ field }) => <Textarea {...field} />}
                            />
                          </TableCell>
                        )}

                        {/* Property Name */}
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
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      const newProperties = [...field.value, ""];
                                      field.onChange(newProperties);
                                    }}
                                  >
                                    Add Property
                                  </Button>
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
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
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
                                <Button
                                  type="button"
                                  onClick={() => {
                                    const newProperties = [...field.value, ""];
                                    field.onChange(newProperties);
                                  }}
                                >
                                  Add deviation
                                </Button>
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
                                <Button
                                  type="button"
                                  onClick={() => {
                                    const newProperties = [...field.value, ""];
                                    field.onChange(newProperties);
                                  }}
                                >
                                  Add causes
                                </Button>
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
                                    {idx + 1}
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
                                <Button
                                  type="button"
                                  onClick={() => {
                                    const newProperties = [...field.value, ""];
                                    field.onChange(newProperties);
                                  }}
                                >
                                  Add consequences
                                </Button>
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
                                <Button
                                  type="button"
                                  onClick={() => {
                                    const newProperties = [...field.value, ""];
                                    field.onChange(newProperties);
                                  }}
                                >
                                  Add Requirements
                                </Button>
                              </ul>
                            )}
                          />
                        </TableCell>
                        {/* Set rendered flags after rendering the row */}
                        {taskRendered = true}
                        {functionRendered = true}
                        {realizationRendered = true}
                        {propertyRendered = true}
                      </TableRow>
                    );
                  });
                });
              });
            })
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