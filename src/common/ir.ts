// src/common/ir.ts
import { z } from "zod";

export const InterpretationSchema = z.object({
  guideWord: z.enum(["Part of", "Other than", "No"]).default("No"),
  deviations: z.array(z.string()).default([]),
  causes: z.array(z.string()).default([]),
  consequences: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
});

export const PropertySchema = z.object({
  id: z.string().optional(),               // 可选稳定ID
  properties: z.array(z.string()).min(1),  // 至少一个属性名
  interpretations: z.array(InterpretationSchema).default([]),
});

export const RealizationSchema = z.object({
  id: z.string().optional(),
  realizationName: z.string(),
  properties: z.array(PropertySchema).default([]),
});

export const FuncSchema = z.object({
  id: z.string().optional(),
  functionName: z.string(),
  realizations: z.array(RealizationSchema).default([]),
});

export const TaskSchema = z.object({
  id: z.string().optional(),
  taskName: z.string(),
  functions: z.array(FuncSchema).default([]),
});

export const IRSchema = z.object({
  tasks: z.array(TaskSchema).default([]),
});

export type IR = z.infer<typeof IRSchema>;
export type Interpretation = z.infer<typeof InterpretationSchema>;
export type Property = z.infer<typeof PropertySchema>;
export type Realization = z.infer<typeof RealizationSchema>;
export type Func = z.infer<typeof FuncSchema>;
export type Task = z.infer<typeof TaskSchema>;