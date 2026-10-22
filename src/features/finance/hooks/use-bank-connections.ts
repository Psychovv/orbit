"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bankApi } from "../data/bank.http";

const BANK_CONNECTIONS = "bank-connections";
const CARD_BILLS = "card-bills";
const TRANSACTIONS = "transactions";

export function useBankConnections(enabled = true) {
  return useQuery({ queryKey: [BANK_CONNECTIONS], queryFn: bankApi.listConnections, enabled, retry: false });
}

export function useCardBills(enabled = true) {
  return useQuery({ queryKey: [CARD_BILLS], queryFn: bankApi.listBills, enabled, retry: false });
}

function useInvalidateBankData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [BANK_CONNECTIONS] }),
      queryClient.invalidateQueries({ queryKey: [CARD_BILLS] }),
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS] }),
    ]);
}

export function useAddBankConnection() {
  const invalidate = useInvalidateBankData();
  return useMutation({ mutationFn: bankApi.addConnection, onSettled: invalidate });
}

export function useRemoveBankConnection() {
  const invalidate = useInvalidateBankData();
  return useMutation({ mutationFn: bankApi.removeConnection, onSettled: invalidate });
}

export function useSyncBankConnections() {
  const invalidate = useInvalidateBankData();
  return useMutation({ mutationFn: bankApi.syncAll, onSettled: invalidate });
}
