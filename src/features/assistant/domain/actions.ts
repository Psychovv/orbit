import { z } from "zod";
import { PaymentMethodSchema, TransactionTypeSchema } from "@/features/finance/domain/finance.schema";
import { DateKeySchema, TimeSchema } from "@/shared/lib/schemas";

export const ASSISTANT_TEXT_MAX = 500;

const AssistantTextSchema = z.string().trim().min(1).max(ASSISTANT_TEXT_MAX);

/** Campo opcional tolerante: valores nulos ou inválidos vindos do modelo viram `undefined`. */
function loose<T extends z.ZodType>(schema: T) {
  return schema.optional().catch(undefined);
}

/** Lista tolerante: descarta itens inválidos em vez de rejeitar a resposta inteira. */
function lenientArray<T extends z.ZodType>(schema: T) {
  return z
    .array(z.unknown())
    .catch([])
    .transform((items) =>
      items.flatMap((item) => {
        const parsed = schema.safeParse(item);
        return parsed.success ? [parsed.data as z.infer<T>] : [];
      })
    );
}

// --- Tarefas ---

export const TaskCommandRequestSchema = z.object({
  text: AssistantTextSchema,
  currentDate: DateKeySchema.optional(),
  categories: z.array(z.object({ id: z.string(), name: z.string() })).max(100).default([]),
  pendingTasks: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        date: z.string().optional(),
        completed: z.boolean().optional(),
      })
    )
    .max(2000)
    .default([]),
});
export type TaskCommandRequest = z.input<typeof TaskCommandRequestSchema>;
export type ExistingTaskRef = z.infer<typeof TaskCommandRequestSchema>["pendingTasks"][number];

export const TaskDraftSchema = z.object({
  title: z.string().trim().min(1).max(200),
  date: loose(DateKeySchema),
  time: loose(TimeSchema),
  categoryId: loose(z.string().min(1)),
});
export type TaskDraft = z.infer<typeof TaskDraftSchema>;

export const TaskCommandResponseSchema = z.preprocess(
  (value) => (Array.isArray(value) ? { create: value } : value),
  z.object({
    create: lenientArray(TaskDraftSchema).default([]),
    completeIds: lenientArray(z.coerce.string()).default([]),
    deleteIds: lenientArray(z.coerce.string()).default([]),
  })
);
export type TaskCommandResponse = z.infer<typeof TaskCommandResponseSchema>;

// --- Finanças ---

export const FinanceCommandRequestSchema = z.object({
  text: AssistantTextSchema,
  currentDate: DateKeySchema.optional(),
  categories: z
    .array(z.object({ id: z.string(), name: z.string(), type: TransactionTypeSchema }))
    .max(100)
    .default([]),
});
export type FinanceCommandRequest = z.input<typeof FinanceCommandRequestSchema>;

export const FinanceDraftSchema = z.object({
  description: loose(z.string().trim().min(1).max(200)),
  amount: loose(z.number().positive()),
  type: loose(TransactionTypeSchema),
  date: loose(DateKeySchema),
  categoryId: loose(z.string().min(1)),
  paymentMethod: loose(PaymentMethodSchema),
});
export type FinanceDraft = z.infer<typeof FinanceDraftSchema>;

export const FinanceCommandResponseSchema = z.preprocess((value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const nested = Object.values(value).find(Array.isArray);
    return nested ?? [value];
  }
  return [];
}, lenientArray(FinanceDraftSchema));
export type FinanceCommandResponse = z.infer<typeof FinanceCommandResponseSchema>;
