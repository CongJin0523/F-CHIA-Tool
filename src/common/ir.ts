// src/common/ir.ts
import { z } from "zod";

export const IdTextSchema = z.object({
  id: z.string(),
  text: z.string().default(""),
});
export type IdText = z.infer<typeof IdTextSchema>;

export const InterpretationSchema = z.object({
  guideWordId: z.string(),
  guideWord: z.enum(["Part of", "Other than", "No"]).default("No"),

  // NEW: arrays are now [{ id, text }]
  deviations: z.array(IdTextSchema).default([]),
  causes: z.array(IdTextSchema).default([]),
  consequences: z.array(IdTextSchema).default([]),
  requirements: z.array(IdTextSchema).default([]),
});

export const PropertySchema = z.object({
  id: z.string(),               // 可选稳定ID
  properties: z.array(z.string()).min(1),  // 至少一个属性名
  interpretations: z.array(InterpretationSchema).default([]),
});

export const RealizationSchema = z.object({
  id: z.string(),
  realizationName: z.string(),
  properties: z.array(PropertySchema).default([]),
});

export const FuncSchema = z.object({
  id: z.string(),
  functionName: z.string(),
  realizations: z.array(RealizationSchema).default([]),
});

export const TaskSchema = z.object({
  id: z.string(),
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