import { z } from "zod";
import { DateKeySchema } from "@/shared/lib/schemas";

export const TransactionTypeSchema = z.enum(["income", "expense"]);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const PaymentMethodSchema = z.enum(["pix", "cartao", "dinheiro", "boleto", "transferencia"]);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: "PIX",
  cartao: "Cartão",
  boleto: "Boleto",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
};

export const FinanceCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  type: TransactionTypeSchema,
  color: z.string().min(1),
  icon: z.string().min(1),
  monthlyBudgetCents: z.number().int().positive().optional(),
});
export type FinanceCategory = z.infer<typeof FinanceCategorySchema>;

export const TransactionSchema = z.object({
  id: z.string().min(1),
  description: z.string().trim().min(1).max(200),
  amountCents: z.number().int().positive(),
  type: TransactionTypeSchema,
  categoryId: z.string().nullable(),
  date: DateKeySchema,
  paymentMethod: PaymentMethodSchema,
  notes: z.string().max(2000).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const CreateTransactionSchema = TransactionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

export const UpdateTransactionSchema = CreateTransactionSchema.partial().extend({
  notes: z.string().max(2000).nullable().optional(),
});
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
