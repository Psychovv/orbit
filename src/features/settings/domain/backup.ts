import { z } from "zod";
import { FinanceCategorySchema, TransactionSchema } from "@/features/finance/domain/finance.schema";
import { HabitCheckinSchema, HabitSchema } from "@/features/habits/domain/habit.schema";
import { TaskCategorySchema, TaskSchema } from "@/features/tasks/domain/task.schema";
import { ProfileBioSchema, ProfileNameSchema, ProfilePhotoSchema } from "@/features/profile/domain/profile.schema";

export const BACKUP_VERSION = 1 as const;

export const ProfileBackupSchema = z.object({
  id: z.string().min(1),
  name: ProfileNameSchema.nullable(),
  // Foto fora do formato aceito é descartada em vez de recusar o backup inteiro.
  photo: ProfilePhotoSchema.nullable().catch(null),
  bio: ProfileBioSchema.nullable(),
});

export const OrbitBackupSchema = z.object({
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.iso.datetime(),
  tasks: z.array(TaskSchema),
  taskCategories: z.array(TaskCategorySchema).min(1),
  transactions: z.array(TransactionSchema),
  financeCategories: z.array(FinanceCategorySchema).min(1),
  habits: z.array(HabitSchema).default([]),
  habitCheckins: z.array(HabitCheckinSchema).default([]),
  profile: ProfileBackupSchema,
});

export type OrbitBackup = z.infer<typeof OrbitBackupSchema>;

export function parseOrbitBackup(raw: unknown): OrbitBackup {
  return OrbitBackupSchema.parse(raw);
}
