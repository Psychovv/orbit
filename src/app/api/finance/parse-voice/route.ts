import {
  FinanceCommandRequestSchema,
  FinanceCommandResponseSchema,
} from "@/features/assistant/domain/actions";
import { localFinanceCommand } from "@/features/assistant/domain/local-commands";
import { formatDateKey } from "@/shared/lib/date-utils";
import { createAssistantRoute } from "../../_lib/assistant-route";

export const POST = createAssistantRoute({
  name: "finance/parse-voice",
  request: FinanceCommandRequestSchema,
  response: FinanceCommandResponseSchema,

  buildPrompt: ({ text, currentDate, categories, recentTransactions }) => {
    const today = currentDate ?? formatDateKey(new Date());
    return `Retorne um JSON EXATO: { "create": [{description:string, amount:number, type:"income"|"expense", date?:YYYY-MM-DD, categoryId?:string, paymentMethod?:"pix"|"cartao"|"dinheiro"|"boleto"|"transferencia"}], "updates": [{id:string, description?:string, amount?:number, type?:"income"|"expense", date?:YYYY-MM-DD, categoryId?:string, paymentMethod?:"pix"|"cartao"|"dinheiro"|"boleto"|"transferencia"}], "deleteIds": [string], "createCategories": [{name:string, type?:"income"|"expense"}], "answer"?: string }.
Regras:
1. 'create' registra lançamentos novos. Hoje: ${today}.
2. 'updates' altera lançamentos existentes (corrigir valor, descrição, data, categoria, método). Use o ID exato. Não invente IDs.
3. 'deleteIds' exclui lançamentos existentes pelo ID exato.
4. Lançamentos existentes: id|data|tipo|centavos|categoria|descrição.
5. 'createCategories' cria categorias (nome + type opcional; default expense).
6. 'answer' é texto curto (pt-BR) para consultas ("quanto gastei?", "qual o saldo?"). Em consulta, deixe create/updates/deleteIds/createCategories vazios.
7. O mesmo ID não pode estar em updates e deleteIds.
Cats: ${categories.map((c) => `${c.id}:${c.name}(${c.type})`).join(", ")}
Lançamentos: ${recentTransactions.map((t) => `${t.id}|${t.date}|${t.type}|${t.amountCents}|${t.categoryId ?? "-"}|${t.description}`).join(" || ")}
Texto: "${text}"`;
  },

  resolveLocally: ({ text, currentDate, categories, recentTransactions }) =>
    localFinanceCommand(text, currentDate ?? formatDateKey(new Date()), {
      transactions: recentTransactions,
      categories,
    }),

  postProcess: (output, { recentTransactions }) => {
    const known = new Set(recentTransactions.map((t) => t.id));
    const deleteIds = output.deleteIds.filter((id) => known.has(id));
    const deleting = new Set(deleteIds);
    const updates = output.updates.filter((u) => known.has(u.id) && !deleting.has(u.id));
    return { ...output, deleteIds, updates };
  },
});
