import { z } from "zod";

export const createGoalSchema = z.object({
  title: z.string().trim().min(3).max(200),
  category: z.enum(["transport", "electricity", "water", "food", "waste", "shopping", "general"]),
  goalType: z.enum(["reduce_percent", "weekly_frequency", "absolute_target"]),
  targetValue: z.coerce.number().positive(),
  baselineValue: z.coerce.number().min(0).default(0),
  unit: z.string().trim().min(1).max(50),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format").optional()
});

export const updateGoalProgressSchema = z.object({
  currentValue: z.coerce.number().min(0)
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalProgressInput = z.infer<typeof updateGoalProgressSchema>;
