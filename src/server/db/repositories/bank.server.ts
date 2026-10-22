import "server-only";
import { and, eq, inArray, isNotNull, isNull, ne } from "drizzle-orm";
import { db } from "../index";
import { bankAccounts, bankConnections, cardBills, dismissedBankTransactions, transactions } from "../schema";
import type { BankAccount, BankConnection, CardBill } from "@/features/finance/domain/bank.schema";
import { billPaymentIds, type BillPaymentRef, type ImportedTransaction } from "@/server/pluggy/mapping";
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
        .values(
          part.map((r) => ({
            ...r,
            notes: r.notes || null,
            id: createId(),
            categoryId: null,
            countsInBalance: r.countsInBalance,
            pending: r.pending,
            createdAt: now,
            updatedAt: now,
          }))
        )
        .onConflictDoNothing({ target: transactions.externalId })
        .returning({ id: transactions.id });
      inserted += result.length;
    }
    return inserted;
  },

  /** Atualiza os campos que vêm do banco nos lançamentos já importados. Descrição, categoria e notas editadas à mão ficam. */
  async applyBankChanges(rows: ImportedTransaction[]): Promise<number> {
    let updated = 0;
    for (const r of rows) {
      const result = await db
        .update(transactions)
        .set({
          amountCents: r.amountCents,
          type: r.type,
          date: r.date,
          paymentMethod: r.paymentMethod,
          institution: r.institution,
          countsInBalance: r.countsInBalance,
          pending: r.pending,
          updatedAt: nowIso(),
        })
        .where(eq(transactions.externalId, r.externalId))
        .returning({ id: transactions.id });
      updated += result.length;
    }
    return updated;
  },

  /** Regrava metadados de importação. Notas editadas à mão (fora de parcela) são preservadas. */
  async refreshImported(rows: ImportedTransaction[]): Promise<void> {
    for (const r of rows) {
      const [current] = await db
        .select({ notes: transactions.notes })
        .from(transactions)
        .where(eq(transactions.externalId, r.externalId));
      if (!current) continue;
      const keepNotes =
        current.notes && !current.notes.startsWith("Importado de") && !current.notes.startsWith("Parcela ");
      await db
        .update(transactions)
        .set({
          institution: r.institution,
          paymentMethod: r.paymentMethod,
          amountCents: r.amountCents,
          type: r.type,
          date: r.date,
          countsInBalance: r.countsInBalance,
          pending: r.pending,
          notes: keepNotes ? current.notes : r.notes || null,
          updatedAt: nowIso(),
        })
        .where(eq(transactions.externalId, r.externalId));
    }
  },

  /** Verdadeiro enquanto houver lançamento importado sem o banco de origem gravado. */
  async needsMetadataBackfill(): Promise<boolean> {
    const [row] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(and(isNotNull(transactions.externalId), isNull(transactions.institution)))
      .limit(1);
    return Boolean(row);
  },

  async removeByExternalIds(externalIds: string[]): Promise<void> {
    for (const part of chunks(externalIds)) {
      await db.delete(transactions).where(inArray(transactions.externalId, part));
    }
  },
};

/**
 * Tira do saldo os débitos da conta que pagam a fatura. A fatura em si já entra pelo total fechado.
 * Religa tudo antes, para um pagamento que deixou de existir voltar a contar.
 */
export async function markBillPayments(payments: BillPaymentRef[]): Promise<number> {
  await db
    .update(transactions)
    .set({ countsInBalance: true })
    .where(and(isNotNull(transactions.externalId), ne(transactions.paymentMethod, "cartao")));

  const candidates = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      amountCents: transactions.amountCents,
      type: transactions.type,
      paymentMethod: transactions.paymentMethod,
    })
    .from(transactions)
    .where(isNotNull(transactions.externalId));

  const ids = billPaymentIds(candidates, payments);
  for (const part of chunks(ids)) {
    await db
      .update(transactions)
      .set({ countsInBalance: false, updatedAt: nowIso() })
      .where(inArray(transactions.id, part));
  }
  return ids.length;
}

export const bankAccountsRepository = {
  async list(): Promise<BankAccount[]> {
    return db.select().from(bankAccounts).orderBy(bankAccounts.type, bankAccounts.name);
  },

  /** Substitui as contas de um item pelos saldos mais recentes da Pluggy. */
  async replaceForItem(itemId: string, accounts: BankAccount[]): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(bankAccounts).where(eq(bankAccounts.itemId, itemId));
      if (accounts.length === 0) return;
      await tx.insert(bankAccounts).values(accounts);
    });
  },
};

export const cardBillsRepository = {
  async list(): Promise<CardBill[]> {
    return db
      .select({
        id: cardBills.id,
        dueDate: cardBills.dueDate,
        closingDate: cardBills.closingDate,
        totalAmountCents: cardBills.totalAmountCents,
      })
      .from(cardBills)
      .orderBy(cardBills.dueDate);
  },

  async upsert(bills: CardBill[]): Promise<void> {
    const now = nowIso();
    for (const bill of bills) {
      await db
        .insert(cardBills)
        .values({ ...bill, updatedAt: now })
        .onConflictDoUpdate({
          target: cardBills.id,
          set: {
            dueDate: bill.dueDate,
            closingDate: bill.closingDate,
            totalAmountCents: bill.totalAmountCents,
            updatedAt: now,
          },
        });
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
