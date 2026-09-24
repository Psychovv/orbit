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
import type { CreateTransactionInput, Transaction } from "../domain/finance.schema";

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
