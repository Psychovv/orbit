import { db } from '../index';
import { transactions, financeCategories } from '../schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { TransactionsRepository, FinanceCategoriesRepository } from '@/features/finance/data/finance.repository';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput, FinanceCategory, CreateFinanceCategoryInput, UpdateFinanceCategoryInput } from '@/features/finance/domain/finance.schema';
import { createId, nowIso } from '@/shared/lib/id';

export function createServerTransactionsRepository(): TransactionsRepository {
  return {
    async list(range) {
      let query = db.select().from(transactions).$dynamic();
      if (range) {
        query = query.where(and(gte(transactions.date, range.from), lte(transactions.date, range.to)));
      }
      const result = await query;
      return result.map(t => ({
        ...t,
        notes: t.notes ?? undefined,
        categoryId: t.categoryId ?? null,
      })) as Transaction[];
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
        notes: tx.notes ?? null,
      });
      
      return tx;
    },
    
    async update(id: string, patch: UpdateTransactionInput) {
      const now = nowIso();
      
      const currentArr = await db.select().from(transactions).where(eq(transactions.id, id));
      if (currentArr.length === 0) throw new Error(`Transaction ${id} not found`);
      const current = currentArr[0];

      const updated = {
        ...current,
        ...patch,
        notes: patch.notes !== undefined ? patch.notes : current.notes,
        updatedAt: now,
      };

      await db.update(transactions).set(updated).where(eq(transactions.id, id));
      
      return {
        ...updated,
        notes: updated.notes ?? undefined,
        categoryId: updated.categoryId ?? null,
      } as Transaction;
    },
    
    async remove(id: string) {
      await db.delete(transactions).where(eq(transactions.id, id));
    },
    
    async restore(transaction: Transaction) {
      await db.insert(transactions).values({
        ...transaction,
        notes: transaction.notes ?? null,
      }).onConflictDoUpdate({
        target: transactions.id,
        set: {
          ...transaction,
          notes: transaction.notes ?? null,
        }
      });
      return transaction;
    }
  };
}

export function createServerFinanceCategoriesRepository(): FinanceCategoriesRepository {
  return {
    async list() {
      const result = await db.select().from(financeCategories);
      return result.map(c => ({
        ...c,
        monthlyBudgetCents: c.monthlyBudgetCents ?? undefined,
      })) as FinanceCategory[];
    },
    
    async create(input: CreateFinanceCategoryInput) {
      const category: FinanceCategory = {
        ...input,
        monthlyBudgetCents: input.monthlyBudgetCents ?? undefined,
        id: createId(),
      };
      
      await db.insert(financeCategories).values({
        ...category,
        monthlyBudgetCents: category.monthlyBudgetCents ?? null,
      });
      
      return category;
    },
    
    async update(id: string, patch: UpdateFinanceCategoryInput) {
      const currentArr = await db.select().from(financeCategories).where(eq(financeCategories.id, id));
      if (currentArr.length === 0) throw new Error(`Finance category ${id} not found`);
      const current = currentArr[0];

      const updated = {
        ...current,
        ...patch,
        monthlyBudgetCents: patch.monthlyBudgetCents !== undefined ? patch.monthlyBudgetCents : current.monthlyBudgetCents,
      };

      await db.update(financeCategories).set(updated).where(eq(financeCategories.id, id));
      
      return {
        ...updated,
        monthlyBudgetCents: updated.monthlyBudgetCents ?? undefined,
      } as FinanceCategory;
    },
    
    async remove(id: string) {
      await db.transaction(async (tx) => {
        await tx.delete(financeCategories).where(eq(financeCategories.id, id));
        await tx.update(transactions).set({ categoryId: null, updatedAt: nowIso() }).where(eq(transactions.categoryId, id));
      });
    }
  };
}

export const transactionsRepository = createServerTransactionsRepository();
export const financeCategoriesRepository = createServerFinanceCategoriesRepository();
