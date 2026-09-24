import { z } from "zod";
import { DateKeySchema, TimeSchema } from "@/shared/lib/schemas";

export const PrioritySchema = z.enum(["baixa", "media", "alta"]);
export type Priority = z.infer<typeof PrioritySchema>;

export const TaskCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  color: z.string().min(1),
  icon: z.string().min(1),
});
export type TaskCategory = z.infer<typeof TaskCategorySchema>;

export const CreateTaskCategorySchema = TaskCategorySchema.omit({ id: true });
export type CreateTaskCategoryInput = z.infer<typeof CreateTaskCategorySchema>;

export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional(),
  date: DateKeySchema,
  time: TimeSchema.optional(),
  categoryId: z.string().nullable(),
  priority: PrioritySchema,
  completedAt: z.iso.datetime().nullable(),
  focusSeconds: z.number().int().nonnegative().default(0),
  focusStartedAt: z.iso.datetime().nullable().default(null),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskSchema = TaskSchema.pick({
  title: true,
  description: true,
  date: true,
  time: true,
  categoryId: true,
  priority: true,
});
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  completedAt: z.iso.datetime().nullable().optional(),
  focusSeconds: z.number().int().nonnegative().optional(),
  focusStartedAt: z.iso.datetime().nullable().optional(),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
