"use client";

import { useQueryClient } from "@tanstack/react-query";
import { requestFinanceCommand } from "@/features/assistant/data/assistant.api";
import type { FinanceDraft } from "@/features/assistant/domain/actions";
import { todayKey } from "@/shared/lib/date-utils";
import { toCents } from "../domain/money";
import { financeCategoriesQuery, useCreateTransaction } from "./use-finance";

interface Options {
  /** Um único lançamento: abre o formulário para o usuário revisar. */
  onSingleDraft: (draft: FinanceDraft) => void;
}

/** Envia o texto para a Orbit AI e registra os lançamentos retornados. */
export function useFinanceAssistant({ onSingleDraft }: Options) {
  const queryClient = useQueryClient();
  const createTransaction = useCreateTransaction();

  return async (text: string) => {
    const categories = await queryClient.fetchQuery(financeCategoriesQuery());
    const drafts = await requestFinanceCommand({
      text,
      currentDate: todayKey(),
      categories: categories.map((c) => ({ id: c.id, name: c.name, type: c.type })),
    });

    if (drafts.length === 0) return;
    if (drafts.length === 1) {
      onSingleDraft(drafts[0]);
      return;
    }

    for (const draft of drafts) {
      if (!draft.description || draft.amount === undefined) continue;
      const type = draft.type ?? "expense";
      const category =
        categories.find((c) => c.id === draft.categoryId && c.type === type) ??
        categories.find((c) => c.type === type);

      await createTransaction.mutateAsync({
        description: draft.description,
        amountCents: toCents(draft.amount),
        type,
        categoryId: category?.id ?? null,
        date: draft.date ?? todayKey(),
        paymentMethod: draft.paymentMethod ?? "pix",
      });
    }
  };
}
