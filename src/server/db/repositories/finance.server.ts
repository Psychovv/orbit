import { db } from '../index';
import { transactions, financeCategories, OWNER_USER_ID } from '../schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { TransactionsRepository, FinanceCategoriesRepository } from '@/features/finance/data/finance.repository';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput, FinanceCategory, CreateFinanceCategoryInput, UpdateFinanceCategoryInput } from '@/features/finance/domain/finance.schema';
import { createId, nowIso } from '@/shared/lib/id';
import { omitUserId } from './omit-user-id';
import { dismissExternalTransaction, undismissExternalTransaction } from './bank.server';

type TransactionRow = typeof transactions.$inferSelect;

function toTransaction(t: TransactionRow): Transaction {
  const { externalId, notes, institution, countsInBalance, pending, ...rest } = omitUserId(t);
  return {
    ...rest,
    categoryId: rest.categoryId ?? null,
    ...(notes != null ? { notes } : {}),
    ...(externalId != null ? { externalId } : {}),
    ...(institution != null ? { institution } : {}),
    ...(countsInBalance === false ? { countsInBalance: false } : {}),
    ...(pending ? { pending: true } : {}),
  };
}

export function createServerTransactionsRepository(userId: string): TransactionsRepository {
  const own = eq(transactions.userId, userId);
  const byId = (id: string) => and(eq(transactions.id, id), own);
  /** Só o dono importa do banco (Pluggy); os campos de importação não vêm de outros usuários. */
  const isOwner = userId === OWNER_USER_ID;

  return {
    async list(range) {
      const result = await db
        .select()
        .from(transactions)
        .where(range ? and(own, gte(transactions.date, range.from), lte(transactions.date, range.to)) : own);
      return result.map(toTransaction);
    },
    
    async create(input: CreateTransactionInput) {
      const now = nowIso();
      const tx: Transaction = {
        ...input,
        notes: input.notes ?? undefined,
        id: createId(),
        createdAt: now,
        updatedAt: now,
      };
      
      await db.insert(transactions).values({
        ...tx,
        userId,
        notes: tx.notes ?? null,
      });
      
      return tx;
    },
    
    async update(id: string, patch: UpdateTransactionInput) {
      const now = nowIso();
      
      const currentArr = await db.select().from(transactions).where(byId(id));
      if (currentArr.length === 0) throw new Error(`Transaction ${id} not found`);
      const current = currentArr[0];

      const updated = {
        ...current,
        ...patch,
        notes: patch.notes !== undefined ? patch.notes : current.notes,
        updatedAt: now,
      };

      await db.update(transactions).set(updated).where(byId(id));
      
      return toTransaction(updated);
    },
    
    async remove(id: string) {
      const [row] = await db.delete(transactions).where(byId(id)).returning({ externalId: transactions.externalId });
      if (isOwner && row?.externalId) await dismissExternalTransaction(row.externalId);
    },
    
    async restore(input: Transaction) {
      const transaction: Transaction = isOwner
        ? input
        : { ...input, externalId: undefined, institution: undefined, pending: undefined };
      const values = {
        ...transaction,
        notes: transaction.notes ?? null,
        externalId: transaction.externalId ?? null,
        institution: transaction.institution ?? null,
        countsInBalance: transaction.countsInBalance !== false,
        pending: transaction.pending === true,
      };
      // `setWhere` impede que um id de outro usuário seja sobrescrito.
      await db.insert(transactions).values({ ...values, userId }).onConflictDoUpdate({
        target: transactions.id,
        set: values,
        setWhere: own,
      });
      if (isOwner && transaction.externalId) await undismissExternalTransaction(transaction.externalId);
      return toTransaction({ ...values, userId });
    }
  };
}

function toFinanceCategory(row: typeof financeCategories.$inferSelect): FinanceCategory {
  const c = omitUserId(row);
  return { ...c, monthlyBudgetCents: c.monthlyBudgetCents ?? undefined } as FinanceCategory;
}

export function createServerFinanceCategoriesRepository(userId: string): FinanceCategoriesRepository {
  const own = eq(financeCategories.userId, userId);
  const byId = (id: string) => and(eq(financeCategories.id, id), own);

  return {
    async list() {
      const result = await db.select().from(financeCategories).where(own);
      return result.map(toFinanceCategory);
    },
    
    async create(input: CreateFinanceCategoryInput) {
      const category: FinanceCategory = {
        ...input,
        monthlyBudgetCents: input.monthlyBudgetCents ?? undefined,
        id: createId(),
      };
      
      await db.insert(financeCategories).values({
        ...category,
        userId,
        monthlyBudgetCents: category.monthlyBudgetCents ?? null,
      });
      
      return category;
    },
    
    async update(id: string, patch: UpdateFinanceCategoryInput) {
      const currentArr = await db.select().from(financeCategories).where(byId(id));
      if (currentArr.length === 0) throw new Error(`Finance category ${id} not found`);
      const current = currentArr[0];

      const updated = {
        ...current,
        ...patch,
        monthlyBudgetCents: patch.monthlyBudgetCents !== undefined ? patch.monthlyBudgetCents : current.monthlyBudgetCents,
      };

      await db.update(financeCategories).set(updated).where(byId(id));

      return toFinanceCategory(updated);
    },
    
    async remove(id: string) {
      await db.transaction(async (tx) => {
        await tx.delete(financeCategories).where(byId(id));
        await tx
          .update(transactions)
          .set({ categoryId: null, updatedAt: nowIso() })
          .where(and(eq(transactions.categoryId, id), eq(transactions.userId, userId)));
      });
    }
  };
}

