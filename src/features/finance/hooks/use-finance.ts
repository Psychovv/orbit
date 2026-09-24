"use client";

import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { repositories } from "@/config/data-source";
import { isInRange, type DateRange } from "@/shared/lib/date-utils";
import { createId, nowIso } from "@/shared/lib/id";
import { patchRangedLists, rangedListKey } from "@/shared/lib/query-cache";
import { toast } from "@/shared/ui/toast";
import type {
  CreateFinanceCategoryInput,
  CreateTransactionInput,
  FinanceCategory,
  Transaction,
  UpdateFinanceCategoryInput,
  UpdateTransactionInput,
} from "../domain/finance.schema";
import { formatBRL } from "../domain/money";

const TRANSACTIONS = "transactions";
const FINANCE_CATEGORIES = "finance-categories";

export const transactionsQuery = (range?: DateRange) =>
  queryOptions({
    queryKey: rangedListKey(TRANSACTIONS, range),
    queryFn: () => repositories.transactions.list(range),
  });

export const financeCategoriesQuery = () =>
  queryOptions({
    queryKey: [FINANCE_CATEGORIES],
    queryFn: () => repositories.financeCategories.list(),
  });

export function useTransactions(range?: DateRange) {
  return useQuery({ ...transactionsQuery(range), placeholderData: keepPreviousData });
}

export function useFinanceCategories() {
  return useQuery(financeCategoriesQuery());
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => repositories.transactions.create(input),
    onMutate: (input) => {
      const now = nowIso();
      const optimistic: Transaction = { ...input, id: `temp-${createId()}`, createdAt: now, updatedAt: now };
      return patchRangedLists<Transaction>(queryClient, TRANSACTIONS, (txs, range) =>
        !range || isInRange(input.date, range) ? [optimistic, ...txs] : txs
      );
    },
    onError: (_error, _input, rollback) => rollback?.(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [TRANSACTIONS] }),
  });
}

function applyTransactionPatch(tx: Transaction, patch: UpdateTransactionInput, updatedAt: string): Transaction {
  const { notes, ...rest } = patch;
  const next: Transaction = { ...tx, ...rest, updatedAt };
  if (notes === null || notes === "") delete next.notes;
  else if (notes !== undefined) next.notes = notes;
  return next;
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateTransactionInput }) =>
      repositories.transactions.update(id, patch),
    onMutate: ({ id, patch }) => {
      const updatedAt = nowIso();
      const cached = queryClient
        .getQueriesData<Transaction[]>({ queryKey: [TRANSACTIONS, "list"] })
        .flatMap(([, items]) => items ?? []);
      const current = cached.find((tx) => tx.id === id);
      if (!current) return;
      const next = applyTransactionPatch(current, patch, updatedAt);
      return patchRangedLists<Transaction>(queryClient, TRANSACTIONS, (txs, range) => {
        const without = txs.filter((tx) => tx.id !== id);
        return !range || isInRange(next.date, range) ? [next, ...without] : without;
      });
    },
    onError: (_error, _vars, rollback) => rollback?.(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [TRANSACTIONS] }),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repositories.transactions.remove(id),
    onMutate: (id) =>
      patchRangedLists<Transaction>(queryClient, TRANSACTIONS, (txs) => txs.filter((tx) => tx.id !== id)),
    onError: (_error, _id, rollback) => rollback?.(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [TRANSACTIONS] }),
  });
}

export function useRestoreTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tx: Transaction) => repositories.transactions.restore(tx),
    onMutate: (tx) =>
      patchRangedLists<Transaction>(queryClient, TRANSACTIONS, (txs, range) =>
        !range || isInRange(tx.date, range) ? [tx, ...txs.filter((t) => t.id !== tx.id)] : txs
      ),
    onError: (_error, _tx, rollback) => rollback?.(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [TRANSACTIONS] }),
  });
}

/** Exclui o lançamento e mostra um toast com "Desfazer". */
export function useDeleteTransactionWithUndo() {
  const deleteTransaction = useDeleteTransaction();
  const restoreTransaction = useRestoreTransaction();
  return (tx: Transaction) =>
    deleteTransaction.mutate(tx.id, {
      onSuccess: () =>
        toast({
          message: "Lançamento excluído",
          description: `${tx.description} · ${formatBRL(tx.amountCents)}`,
          action: { label: "Desfazer", onClick: () => restoreTransaction.mutate(tx) },
        }),
    });
}

export function useCreateFinanceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFinanceCategoryInput) => repositories.financeCategories.create(input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [FINANCE_CATEGORIES] }),
  });
}

export function useUpdateFinanceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateFinanceCategoryInput }) =>
      repositories.financeCategories.update(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: [FINANCE_CATEGORIES] });
      const previous = queryClient.getQueryData<FinanceCategory[]>([FINANCE_CATEGORIES]);
      queryClient.setQueryData<FinanceCategory[]>([FINANCE_CATEGORIES], (categories) =>
        categories?.map((c) => {
          if (c.id !== id) return c;
          const { monthlyBudgetCents, ...rest } = patch;
          const next: FinanceCategory = { ...c, ...rest };
          if (monthlyBudgetCents === null) delete next.monthlyBudgetCents;
          else if (monthlyBudgetCents !== undefined) next.monthlyBudgetCents = monthlyBudgetCents;
          return next;
        })
      );
      return () => queryClient.setQueryData([FINANCE_CATEGORIES], previous);
    },
    onError: (_error, _vars, rollback) => rollback?.(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [FINANCE_CATEGORIES] }),
  });
}

export function useDeleteFinanceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repositories.financeCategories.remove(id),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [FINANCE_CATEGORIES] }),
        queryClient.invalidateQueries({ queryKey: [TRANSACTIONS] }),
      ]),
  });
}
