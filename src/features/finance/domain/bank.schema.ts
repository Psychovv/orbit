import { z } from "zod";

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

export interface BankSyncResult {
  itemId: string;
  imported: number;
  error?: string;
}
