import { z } from "zod";
import { PaymentMethodSchema, TransactionTypeSchema } from "@/features/finance/domain/finance.schema";
import { PrioritySchema } from "@/features/tasks/domain/task.schema";
import { DateKeySchema, TimeSchema } from "@/shared/lib/schemas";

export const ASSISTANT_TEXT_MAX = 500;
export const ASSISTANT_ANSWER_MAX = 800;

const AssistantTextSchema = z.string().trim().min(1).max(ASSISTANT_TEXT_MAX);
const AnswerSchema = z.string().trim().min(1).max(ASSISTANT_ANSWER_MAX);

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

export const TaskUpdateSchema = z.object({
  id: z.coerce.string().min(1),
  title: loose(z.string().trim().min(1).max(200)),
  date: loose(DateKeySchema),
  time: loose(TimeSchema),
  categoryId: loose(z.string().min(1)),
  priority: loose(PrioritySchema),
});
export type TaskUpdate = z.infer<typeof TaskUpdateSchema>;

export const CategoryDraftSchema = z.object({
  name: z.string().trim().min(1).max(60),
});
export type CategoryDraft = z.infer<typeof CategoryDraftSchema>;

export const TaskCommandResponseSchema = z.preprocess(
  (value) => (Array.isArray(value) ? { create: value } : value),
  z.object({
    create: lenientArray(TaskDraftSchema).default([]),
    updates: lenientArray(TaskUpdateSchema).default([]),
    completeIds: lenientArray(z.coerce.string()).default([]),
    deleteIds: lenientArray(z.coerce.string()).default([]),
    createCategories: lenientArray(CategoryDraftSchema).default([]),
    answer: loose(AnswerSchema),
  })
);
export type TaskCommandResponse = z.infer<typeof TaskCommandResponseSchema>;

// --- Finanças ---

export const ExistingTransactionRefSchema = z.object({
  id: z.string(),
  description: z.string(),
  amountCents: z.number().int().positive(),
  type: TransactionTypeSchema,
  date: z.string(),
  categoryId: z.string().nullable().optional(),
});
export type ExistingTransactionRef = z.infer<typeof ExistingTransactionRefSchema>;

export const FinanceCommandRequestSchema = z.object({
  text: AssistantTextSchema,
  currentDate: DateKeySchema.optional(),
  categories: z
    .array(z.object({ id: z.string(), name: z.string(), type: TransactionTypeSchema }))
    .max(100)
    .default([]),
  recentTransactions: z.array(ExistingTransactionRefSchema).max(200).default([]),
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

export const FinanceUpdateSchema = z.object({
  id: z.coerce.string().min(1),
  description: loose(z.string().trim().min(1).max(200)),
  amount: loose(z.number().positive()),
  type: loose(TransactionTypeSchema),
  date: loose(DateKeySchema),
  categoryId: loose(z.string().min(1)),
  paymentMethod: loose(PaymentMethodSchema),
});
export type FinanceUpdate = z.infer<typeof FinanceUpdateSchema>;

export const FinanceCategoryDraftSchema = z.object({
  name: z.string().trim().min(1).max(60),
  type: loose(TransactionTypeSchema),
});
export type FinanceCategoryDraft = z.infer<typeof FinanceCategoryDraftSchema>;

function preprocessFinanceResponse(value: unknown): unknown {
  if (Array.isArray(value)) return { create: value };
  if (!value || typeof value !== "object") return { create: [] };

  const obj = value as Record<string, unknown>;
  if ("create" in obj || "updates" in obj || "deleteIds" in obj || "createCategories" in obj || "answer" in obj) {
    return obj;
  }

  const nested = Object.values(obj).find(Array.isArray);
  if (nested) return { create: nested };
  return { create: [value] };
}

export const FinanceCommandResponseSchema = z.preprocess(
  preprocessFinanceResponse,
  z.object({
    create: lenientArray(FinanceDraftSchema).default([]),
    updates: lenientArray(FinanceUpdateSchema).default([]),
    deleteIds: lenientArray(z.coerce.string()).default([]),
    createCategories: lenientArray(FinanceCategoryDraftSchema).default([]),
    answer: loose(AnswerSchema),
  })
);
export type FinanceCommandResponse = z.infer<typeof FinanceCommandResponseSchema>;
