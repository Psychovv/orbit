import { z } from "zod";

export const PluggyItemSchema = z.object({
  id: z.uuid(),
  status: z.string(),
  executionStatus: z.string().nullish(),
  connector: z.object({ name: z.string() }).nullish(),
  error: z.object({ code: z.string().nullish() }).nullish(),
  consentExpiresAt: z.string().nullish(),
});
export type PluggyItem = z.infer<typeof PluggyItemSchema>;

export const PluggyAccountSchema = z.object({
  id: z.uuid(),
  itemId: z.uuid().nullish(),
  type: z.string(),
  subtype: z.string().nullish(),
  name: z.string().nullish(),
  marketingName: z.string().nullish(),
  number: z.string().nullish(),
  balance: z.number().nullish(),
  creditData: z
    .object({
      creditLimit: z.number().nullish(),
      availableCreditLimit: z.number().nullish(),
      balanceDueDate: z.string().nullish(),
    })
    .nullish(),
});
export type PluggyAccount = z.infer<typeof PluggyAccountSchema>;

export const PluggyTransactionSchema = z.object({
  id: z.uuid(),
  accountId: z.uuid().nullish(),
  description: z.string().nullish(),
  amount: z.number(),
  amountInAccountCurrency: z.number().nullish(),
  currencyCode: z.string().nullish(),
  date: z.string(),
  type: z.enum(["DEBIT", "CREDIT"]),
  status: z.string().nullish(),
  operationType: z.string().nullish(),
  paymentData: z.object({ paymentMethod: z.string().nullish() }).nullish(),
  creditCardMetadata: z
    .object({
      installmentNumber: z.number().nullish(),
      totalInstallments: z.number().nullish(),
    })
    .nullish(),
});
export type PluggyTransaction = z.infer<typeof PluggyTransactionSchema>;

export const PluggyTransactionsPageSchema = z.object({
  results: z.array(z.unknown()),
  next: z.string().nullish(),
});

export const PluggyAccountsPageSchema = z.object({
  results: z.array(z.unknown()),
});

export const PluggyBillSchema = z.object({
  id: z.uuid(),
  dueDate: z.string(),
  billClosingDate: z.string().nullish(),
  totalAmount: z.number(),
  payments: z
    .array(
      z.object({
        paymentDate: z.string().nullish(),
        amount: z.number(),
      })
    )
    .nullish(),
});
export type PluggyBill = z.infer<typeof PluggyBillSchema>;

export const PluggyBillsPageSchema = z.object({
  results: z.array(z.unknown()),
});
