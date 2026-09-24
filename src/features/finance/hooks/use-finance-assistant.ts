"use client";

import { useQueryClient } from "@tanstack/react-query";
import { requestFinanceCommand } from "@/features/assistant/data/assistant.api";
import type { FinanceDraft } from "@/features/assistant/domain/actions";
import { todayKey } from "@/shared/lib/date-utils";
import { pluralSummary } from "@/shared/lib/utils";
import { toast } from "@/shared/ui/toast";
import { formatBRL, toCents } from "../domain/money";
import { financeCategoriesQuery, useCreateTransaction, useDeleteTransaction } from "./use-finance";

interface Options {
  /** Um único lançamento: abre o formulário para o usuário revisar. */
  onSingleDraft: (draft: FinanceDraft) => void;
}

/** Envia o texto para a Orbit AI e registra os lançamentos retornados. */
export function useFinanceAssistant({ onSingleDraft }: Options) {
  const queryClient = useQueryClient();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();

  return async (text: string) => {
    const categories = await queryClient.fetchQuery(financeCategoriesQuery());
    const drafts = await requestFinanceCommand({
      text,
      currentDate: todayKey(),
      categories: categories.map((c) => ({ id: c.id, name: c.name, type: c.type })),
    });

    if (drafts.length === 0) {
      throw new Error("Não encontrei nenhum lançamento no texto. Tente incluir descrição e valor.");
    }
    if (drafts.length === 1) {
      onSingleDraft(drafts[0]);
      return;
    }

    const valid = drafts.flatMap((draft) =>
      draft.description && draft.amount !== undefined
        ? [{ ...draft, description: draft.description, amount: draft.amount }]
        : []
    );
    if (valid.length === 0) {
      throw new Error("Os lançamentos vieram sem descrição ou valor. Tente reformular.");
    }

    const created = await Promise.all(
      valid.map((draft) => {
        const type = draft.type ?? "expense";
        const category =
          categories.find((c) => c.id === draft.categoryId && c.type === type) ??
          categories.find((c) => c.type === type);
        return createTransaction.mutateAsync({
          description: draft.description,
          amountCents: toCents(draft.amount),
          type,
          categoryId: category?.id ?? null,
          date: draft.date ?? todayKey(),
          paymentMethod: draft.paymentMethod ?? "pix",
        });
      })
    );

    const total = created.reduce((acc, tx) => acc + (tx.type === "income" ? tx.amountCents : -tx.amountCents), 0);
    toast({
      tone: "success",
      message: "Orbit AI registrou os lançamentos",
      description: `${pluralSummary([[created.length, "lançamento", "lançamentos"]])} · saldo ${formatBRL(total)}`,
      action: { label: "Desfazer", onClick: () => created.forEach((tx) => deleteTransaction.mutate(tx.id)) },
    });
  };
}
