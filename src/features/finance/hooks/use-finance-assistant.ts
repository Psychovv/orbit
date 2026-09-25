"use client";

import { useQueryClient } from "@tanstack/react-query";
import { requestFinanceCommand, notifyLocalFallback } from "@/features/assistant/data/assistant.api";
import type { ReviewItem } from "@/features/assistant/components/assistant-review-dialog";
import type { FinanceDraft } from "@/features/assistant/domain/actions";
import {
  addMonths,
  formatShortDate,
  getYearMonthKey,
  monthRange,
  todayKey,
} from "@/shared/lib/date-utils";
import { pluralSummary } from "@/shared/lib/utils";
import { toast } from "@/shared/ui/toast";
import type { Transaction, UpdateTransactionInput } from "../domain/finance.schema";
import { formatBRL, toCents } from "../domain/money";
import {
  financeCategoriesQuery,
  transactionsQuery,
  useCreateFinanceCategory,
  useCreateTransaction,
  useDeleteFinanceCategory,
  useDeleteTransaction,
  useRestoreTransaction,
  useUpdateTransaction,
} from "./use-finance";

const MAX_CONTEXT_TRANSACTIONS = 200;

const FINANCE_CATEGORY_PRESETS = [
  { icon: "🏷️", color: "#844DFE" },
  { icon: "🍔", color: "#f59e0b" },
  { icon: "🎮", color: "#3b82f6" },
  { icon: "📱", color: "#06b6d4" },
  { icon: "🏠", color: "#10b981" },
  { icon: "🚗", color: "#ec4899" },
];

interface Options {
  /** Um único lançamento: abre o formulário para o usuário revisar. */
  onSingleDraft: (draft: FinanceDraft) => void;
  review: (items: ReviewItem[]) => Promise<Set<string> | null>;
  showAnswer: (text: string) => Promise<void>;
}

/** Envia o texto para a Orbit AI e aplica as ações retornadas. */
export function useFinanceAssistant({ onSingleDraft, review, showAnswer }: Options) {
  const queryClient = useQueryClient();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const restoreTransaction = useRestoreTransaction();
  const createCategory = useCreateFinanceCategory();
  const deleteCategory = useDeleteFinanceCategory();

  return async (text: string) => {
    const today = todayKey();
    const thisMonth = getYearMonthKey(new Date());
    const prevMonth = getYearMonthKey(addMonths(new Date(), -1));

    const [categories, currentTx, previousTx] = await Promise.all([
      queryClient.fetchQuery(financeCategoriesQuery()),
      queryClient.fetchQuery(transactionsQuery(monthRange(thisMonth))),
      queryClient.fetchQuery(transactionsQuery(monthRange(prevMonth))),
    ]);

    const byId = new Map<string, Transaction>();
    for (const tx of [...previousTx, ...currentTx]) byId.set(tx.id, tx);
    const recent = [...byId.values()]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, MAX_CONTEXT_TRANSACTIONS);

    const { data: result, source } = await requestFinanceCommand({
      text,
      currentDate: today,
      categories: categories.map((c) => ({ id: c.id, name: c.name, type: c.type })),
      recentTransactions: recent.map((t) => ({
        id: t.id,
        description: t.description,
        amountCents: t.amountCents,
        type: t.type,
        date: t.date,
        categoryId: t.categoryId,
      })),
    });
    if (source === "local") notifyLocalFallback();

    let deleting = [...new Set(result.deleteIds)].flatMap((id) => byId.get(id) ?? []);
    const deletingIds = new Set(deleting.map((t) => t.id));

    let updating = result.updates.flatMap((u) => {
      const tx = byId.get(u.id);
      if (!tx || deletingIds.has(u.id)) return [];
      const patch: UpdateTransactionInput = {};
      if (u.description !== undefined) patch.description = u.description;
      if (u.amount !== undefined) patch.amountCents = toCents(u.amount);
      if (u.type !== undefined) patch.type = u.type;
      if (u.date !== undefined) patch.date = u.date;
      if (u.paymentMethod !== undefined) patch.paymentMethod = u.paymentMethod;
      if (u.categoryId !== undefined) {
        const type = u.type ?? tx.type;
        const cat = categories.find((c) => c.id === u.categoryId && c.type === type);
        if (cat) patch.categoryId = cat.id;
      }
      if (Object.keys(patch).length === 0) return [];
      return [{ tx, patch }];
    });

    let drafts = result.create;
    let categoryDrafts = result.createCategories.filter(
      (c) => !categories.some((existing) => existing.name.toLowerCase() === c.name.toLowerCase())
    );

    const hasMutations =
      drafts.length > 0 || updating.length > 0 || deleting.length > 0 || categoryDrafts.length > 0;

    if (!hasMutations) {
      if (result.answer) {
        await showAnswer(result.answer);
        return;
      }
      throw new Error("Não encontrei nenhum lançamento no texto. Tente incluir descrição e valor.");
    }

    if (drafts.length === 1 && updating.length === 0 && deleting.length === 0 && categoryDrafts.length === 0) {
      onSingleDraft(drafts[0]);
      return;
    }

    const needsReview = deleting.length > 0 || updating.length > 0 || categoryDrafts.length > 0;
    if (needsReview) {
      const approved = await review([
        ...drafts.flatMap((d, i) =>
          d.description && d.amount !== undefined
            ? [
                {
                  id: `create:${i}`,
                  group: "create" as const,
                  label: d.description,
                  detail: `${formatBRL(toCents(d.amount))} · ${formatShortDate(d.date ?? today)}`,
                },
              ]
            : []
        ),
        ...updating.map(({ tx, patch }) => ({
          id: `update:${tx.id}`,
          group: "update" as const,
          label: patch.description ?? tx.description,
          detail: [
            patch.amountCents !== undefined ? formatBRL(patch.amountCents) : formatBRL(tx.amountCents),
            patch.date ? formatShortDate(patch.date) : formatShortDate(tx.date),
          ].join(" · "),
        })),
        ...deleting.map((tx) => ({
          id: `delete:${tx.id}`,
          group: "delete" as const,
          label: tx.description,
          detail: `${formatBRL(tx.amountCents)} · ${formatShortDate(tx.date)}`,
        })),
        ...categoryDrafts.map((c, i) => ({
          id: `category:${i}`,
          group: "createCategory" as const,
          label: c.name,
          detail: (c.type ?? "expense") === "income" ? "Receita" : "Despesa",
        })),
      ]);
      if (!approved) return;
      drafts = drafts.filter((_, i) => approved.has(`create:${i}`));
      updating = updating.filter(({ tx }) => approved.has(`update:${tx.id}`));
      deleting = deleting.filter((tx) => approved.has(`delete:${tx.id}`));
      categoryDrafts = categoryDrafts.filter((_, i) => approved.has(`category:${i}`));
    }

    const validCreates = drafts.flatMap((draft) =>
      draft.description && draft.amount !== undefined
        ? [{ ...draft, description: draft.description, amount: draft.amount }]
        : []
    );
    if (
      validCreates.length === 0 &&
      updating.length === 0 &&
      deleting.length === 0 &&
      categoryDrafts.length === 0
    ) {
      throw new Error("Os lançamentos vieram sem descrição ou valor. Tente reformular.");
    }

    const previousSnapshots = updating.map(({ tx }) => tx);

    const [createdCategories, created] = await Promise.all([
      Promise.all(
        categoryDrafts.map((draft, i) => {
          const preset = FINANCE_CATEGORY_PRESETS[i % FINANCE_CATEGORY_PRESETS.length];
          return createCategory.mutateAsync({
            name: draft.name,
            type: draft.type ?? "expense",
            icon: preset.icon,
            color: preset.color,
          });
        })
      ),
      Promise.all(
        validCreates.map((draft) => {
          const type = draft.type ?? "expense";
          const category =
            categories.find((c) => c.id === draft.categoryId && c.type === type) ??
            categories.find((c) => c.type === type);
          return createTransaction.mutateAsync({
            description: draft.description,
            amountCents: toCents(draft.amount),
            type,
            categoryId: category?.id ?? null,
            date: draft.date ?? today,
            paymentMethod: draft.paymentMethod ?? "pix",
          });
        })
      ),
      Promise.all(updating.map(({ tx, patch }) => updateTransaction.mutateAsync({ id: tx.id, patch }))),
      Promise.all(deleting.map((tx) => deleteTransaction.mutateAsync(tx.id))),
    ]);

    const summary = pluralSummary([
      [createdCategories.length, "categoria", "categorias"],
      [created.length, "lançamento", "lançamentos"],
      [updating.length, "editado", "editados"],
      [deleting.length, "excluído", "excluídos"],
    ]);
    if (!summary) return;

    const total = created.reduce((acc, tx) => acc + (tx.type === "income" ? tx.amountCents : -tx.amountCents), 0);

    toast({
      tone: "success",
      message: "Orbit AI aplicou as alterações",
      description: `${summary}${created.length > 0 ? ` · saldo ${formatBRL(total)}` : ""}`,
      action: {
        label: "Desfazer",
        onClick: () => {
          created.forEach((tx) => deleteTransaction.mutate(tx.id));
          deleting.forEach((tx) => restoreTransaction.mutate(tx));
          previousSnapshots.forEach((tx) =>
            updateTransaction.mutate({
              id: tx.id,
              patch: {
                description: tx.description,
                amountCents: tx.amountCents,
                type: tx.type,
                date: tx.date,
                categoryId: tx.categoryId,
                paymentMethod: tx.paymentMethod,
                notes: tx.notes ?? null,
              },
            })
          );
          createdCategories.forEach((c) => deleteCategory.mutate(c.id));
        },
      },
    });
  };
}
