import { z } from "zod";
import { DateKeySchema } from "@/shared/lib/schemas";

export const HabitTypeSchema = z.enum(["boolean", "numeric"]);
export type HabitType = z.infer<typeof HabitTypeSchema>;

export const HabitPeriodSchema = z.enum(["morning", "afternoon", "evening", "anytime"]);
export type HabitPeriod = z.infer<typeof HabitPeriodSchema>;

export const HABIT_PERIOD_LABELS: Record<HabitPeriod, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  evening: "Noite",
  anytime: "Qualquer horário",
};

export const HabitFrequencyTypeSchema = z.enum(["daily", "specific_days", "weekly_target"]);
export type HabitFrequencyType = z.infer<typeof HabitFrequencyTypeSchema>;

export const HABIT_FREQUENCY_LABELS: Record<HabitFrequencyType, string> = {
  daily: "Todos os dias",
  specific_days: "Dias específicos",
  weekly_target: "Meta semanal",
};

/** 0 = Domingo … 6 = Sábado (mesmo índice de `Date#getDay`). */
export const WeekdaySchema = z.number().int().min(0).max(6);
export type Weekday = z.infer<typeof WeekdaySchema>;

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

export const HabitSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000).optional(),
  icon: z.string().min(1).max(8),
  color: z.string().min(1),
  period: HabitPeriodSchema,
  type: HabitTypeSchema,
  targetValue: z.number().positive().optional(),
  unit: z.string().trim().max(20).optional(),
  step: z.number().positive().optional(),
  frequencyType: HabitFrequencyTypeSchema,
  frequencyDays: z.array(WeekdaySchema).optional(),
  weeklyTargetCount: z.number().int().min(1).max(7).optional(),
  archivedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Habit = z.infer<typeof HabitSchema>;

const HabitFieldsSchema = HabitSchema.omit({
  id: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
});

function refineHabitFields(
  data: z.infer<typeof HabitFieldsSchema>,
  ctx: z.RefinementCtx
) {
  if (data.type === "numeric") {
    if (data.targetValue == null) {
      ctx.addIssue({ code: "custom", message: "Meta obrigatória", path: ["targetValue"] });
    }
    if (!data.unit?.trim()) {
      ctx.addIssue({ code: "custom", message: "Unidade obrigatória", path: ["unit"] });
    }
    if (data.step == null) {
      ctx.addIssue({ code: "custom", message: "Passo obrigatório", path: ["step"] });
    }
  }
  if (data.frequencyType === "specific_days") {
    if (!data.frequencyDays?.length) {
      ctx.addIssue({
        code: "custom",
        message: "Selecione ao menos um dia",
        path: ["frequencyDays"],
      });
    }
  }
  if (data.frequencyType === "weekly_target" && data.weeklyTargetCount == null) {
    ctx.addIssue({
      code: "custom",
      message: "Informe quantas vezes por semana",
      path: ["weeklyTargetCount"],
    });
  }
}

export const CreateHabitSchema = HabitFieldsSchema.superRefine(refineHabitFields);
export type CreateHabitInput = z.infer<typeof CreateHabitSchema>;

export const UpdateHabitSchema = HabitFieldsSchema.partial()
  .extend({
    description: z.string().max(2000).nullable().optional(),
    targetValue: z.number().positive().nullable().optional(),
    unit: z.string().trim().max(20).nullable().optional(),
    step: z.number().positive().nullable().optional(),
    frequencyDays: z.array(WeekdaySchema).nullable().optional(),
    weeklyTargetCount: z.number().int().min(1).max(7).nullable().optional(),
    archivedAt: z.iso.datetime().nullable().optional(),
  });
export type UpdateHabitInput = z.infer<typeof UpdateHabitSchema>;

export const HabitCheckinSchema = z.object({
  id: z.string().min(1),
  habitId: z.string().min(1),
  date: DateKeySchema,
  completed: z.boolean(),
  currentValue: z.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
  createdAt: z.iso.datetime(),
});
export type HabitCheckin = z.infer<typeof HabitCheckinSchema>;

export const UpsertHabitCheckinSchema = z.object({
  habitId: z.string().min(1),
  date: DateKeySchema,
  completed: z.boolean().optional(),
  currentValue: z.number().nonnegative().optional(),
  notes: z.string().max(2000).nullable().optional(),
  /** Quando true, remove o check-in (desmarca). */
  clear: z.boolean().optional(),
});
export type UpsertHabitCheckinInput = z.infer<typeof UpsertHabitCheckinSchema>;

export const HABIT_COLOR_PRESETS = [
  "#f59e0b",
  "#ef4444",
  "#844DFE",
  "#3b82f6",
  "#10b981",
  "#06b6d4",
  "#ec4899",
  "#8b5cf6",
] as const;

export const HABIT_ICON_PRESETS = [
  "💧",
  "📖",
  "🏋️",
  "🧘",
  "🏃",
  "🥗",
  "😴",
  "✍️",
  "🎸",
  "🧠",
  "☀️",
  "🎯",
] as const;
