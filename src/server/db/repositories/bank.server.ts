import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "../index";
import { bankConnections, dismissedBankTransactions, transactions } from "../schema";
import type { BankConnection } from "@/features/finance/domain/bank.schema";
import type { ImportedTransaction } from "@/server/pluggy/mapping";
import { createId, nowIso } from "@/shared/lib/id";

const CHUNK = 200;

function chunks<T>(items: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export type ConnectionInput = Pick<BankConnection, "itemId" | "institution" | "status" | "errorCode" | "consentExpiresAt">;

export const bankConnectionsRepository = {
  async list(): Promise<BankConnection[]> {
    return db.select().from(bankConnections).orderBy(bankConnections.createdAt);
  },

  async get(itemId: string): Promise<BankConnection | null> {
    const [row] = await db.select().from(bankConnections).where(eq(bankConnections.itemId, itemId));
    return row ?? null;
  },

  async upsert(input: ConnectionInput): Promise<BankConnection> {
    const now = nowIso();
    const [row] = await db
      .insert(bankConnections)
      .values({ ...input, lastSyncedAt: null, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: bankConnections.itemId,
        set: {
          institution: input.institution,
          status: input.status,
          errorCode: input.errorCode,
          consentExpiresAt: input.consentExpiresAt,
          updatedAt: now,
        },
      })
      .returning();
    return row;
  },

  async markSynced(itemId: string, at: string): Promise<void> {
    await db.update(bankConnections).set({ lastSyncedAt: at, updatedAt: nowIso() }).where(eq(bankConnections.itemId, itemId));
  },

  async remove(itemId: string): Promise<void> {
    await db.delete(bankConnections).where(eq(bankConnections.itemId, itemId));
  },
};

async function dismissedAmong(externalIds: string[]): Promise<Set<string>> {
  const dismissed = new Set<string>();
  for (const part of chunks(externalIds)) {
    const rows = await db
      .select({ externalId: dismissedBankTransactions.externalId })
      .from(dismissedBankTransactions)
      .where(inArray(dismissedBankTransactions.externalId, part));
    rows.forEach((r) => dismissed.add(r.externalId));
  }
  return dismissed;
}

export const importedTransactionsRepository = {
  /** Insere só o que ainda não existe e não foi excluído pelo usuário. Retorna quantos entraram. */
  async insertNew(rows: ImportedTransaction[]): Promise<number> {
    if (rows.length === 0) return 0;
    const dismissed = await dismissedAmong(rows.map((r) => r.externalId));
    const fresh = rows.filter((r) => !dismissed.has(r.externalId));

    let inserted = 0;
    for (const part of chunks(fresh, 50)) {
      const now = nowIso();
      const result = await db
        .insert(transactions)
        .values(part.map((r) => ({ ...r, id: createId(), categoryId: null, createdAt: now, updatedAt: now })))
        .onConflictDoNothing({ target: transactions.externalId })
        .returning({ id: transactions.id });
      inserted += result.length;
    }
    return inserted;
  },

  /** Atualiza valor, tipo e data vindos do banco, preservando descrição, categoria e notas editadas. */
  async applyBankChanges(rows: ImportedTransaction[]): Promise<number> {
    let updated = 0;
    for (const r of rows) {
      const result = await db
        .update(transactions)
        .set({ amountCents: r.amountCents, type: r.type, date: r.date, updatedAt: nowIso() })
        .where(eq(transactions.externalId, r.externalId))
        .returning({ id: transactions.id });
      updated += result.length;
    }
    return updated;
  },

  async removeByExternalIds(externalIds: string[]): Promise<void> {
    for (const part of chunks(externalIds)) {
      await db.delete(transactions).where(inArray(transactions.externalId, part));
    }
  },
};

export async function dismissExternalTransaction(externalId: string): Promise<void> {
  await db
    .insert(dismissedBankTransactions)
    .values({ externalId, dismissedAt: nowIso() })
    .onConflictDoNothing();
}

export async function undismissExternalTransaction(externalId: string): Promise<void> {
  await db.delete(dismissedBankTransactions).where(eq(dismissedBankTransactions.externalId, externalId));
}
