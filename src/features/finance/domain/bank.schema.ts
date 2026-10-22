import { z } from "zod";
import { DateKeySchema } from "@/shared/lib/schemas";

/** Ids de item, conta e transação da Pluggy são UUIDs. */
export const PluggyIdSchema = z.uuid();

export const BankConnectionSchema = z.object({
  itemId: PluggyIdSchema,
  institution: z.string(),
  status: z.string(),
  errorCode: z.string().nullable(),
  consentExpiresAt: z.string().nullable(),
  lastSyncedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BankConnection = z.infer<typeof BankConnectionSchema>;

export const AddBankConnectionSchema = z.object({ itemId: PluggyIdSchema });

export const CardBillSchema = z.object({
  id: z.uuid(),
  dueDate: DateKeySchema,
  closingDate: DateKeySchema.nullable(),
  totalAmountCents: z.number().int(),
});
export type CardBill = z.infer<typeof CardBillSchema>;

export const BankAccountSchema = z.object({
  id: z.uuid(),
  itemId: z.uuid(),
  type: z.enum(["BANK", "CREDIT"]),
  subtype: z.string().nullable(),
  name: z.string(),
  number: z.string().nullable(),
  balanceCents: z.number().int(),
  creditLimitCents: z.number().int().nullable(),
  availableLimitCents: z.number().int().nullable(),
  dueDate: DateKeySchema.nullable(),
  updatedAt: z.string(),
});
export type BankAccount = z.infer<typeof BankAccountSchema>;

export interface BankSyncResult {
  itemId: string;
  imported: number;
  error?: string;
}
