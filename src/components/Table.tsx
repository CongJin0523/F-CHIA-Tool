"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { type FormValue } from "@/common/types";
import { initialFormValues } from "@/common/demoReasult";



export default function EditableTable() {
  const { control, register, handleSubmit } = useForm<FormValue>({
    defaultValues: initialFormValues,
  });

  const {
    fields: taskFields,
    append: appendTask,
    remove: removeTask,
  } = useFieldArray({ control, name: "tasks" });

  const onSubmit = (data: FormValue) => {
    console.log("Submitted:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4">
      <div>
        <label className="font-semibold">Zone Name:</label>
        <Input {...register("zoneName")} className="mt-1" />
      </div>

      {taskFields.map((task, taskIndex) => {
        const {
          fields: functionFields,
          append: appendFunction,
          remove: removeFunction,
        } = useFieldArray({
          control,
          name: `tasks.${taskIndex}.functions`,
        });

        return (
          <div
            key={task.id}
            className="border rounded p-4 space-y-4 bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Input
                placeholder="Task Name"
                {...register(`tasks.${taskIndex}.taskName`)}
              />
              <Button
                variant="destructive"
                type="button"
                onClick={() => removeTask(taskIndex)}
              >
                Delete Task
              </Button>
            </div>

            {functionFields.map((func, funcIndex) => (
              <div key={func.id} className="ml-4">
                <Input
                  placeholder="Function Name"
                  {...register(
                    `tasks.${taskIndex}.functions.${funcIndex}.functionName`
                  )}
                />
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => removeFunction(funcIndex)}
                  className="text-red-500"
                >
                  Delete Function
                </Button>
              </div>
            ))}

            <Button
              type="button"
              onClick={() => appendFunction({ functionName: "" })}
            >
              + Add Function
            </Button>
          </div>
        );
      })}

      <Button
        type="button"
        onClick={() => appendTask({ taskName: "", functions: [] })}
      >
        + Add Task
      </Button>

      <Button type="submit" className="mt-4">
        Submit
      </Button>
    </form>
  );
}