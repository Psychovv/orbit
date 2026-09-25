import {
  TaskCommandRequestSchema,
  TaskCommandResponseSchema,
} from "@/features/assistant/domain/actions";
import { addCalendarDays, bulkTaskIds, prefersStrongerTaskModel } from "@/features/assistant/domain/bulk-commands";
import { localTaskCommand } from "@/features/assistant/domain/local-commands";
import { formatDateKey } from "@/shared/lib/date-utils";
import { createAssistantRoute } from "../../_lib/assistant-route";

export const POST = createAssistantRoute({
  name: "tasks/parse-voice",
  request: TaskCommandRequestSchema,
  response: TaskCommandResponseSchema,

  buildPrompt: ({ text, currentDate, categories, pendingTasks }) => {
    const today = currentDate ?? formatDateKey(new Date());
    const yesterday = addCalendarDays(today, -1);
    const tomorrow = addCalendarDays(today, 1);

    return `Retorne um JSON EXATO: { "create": [{title:string, date?:YYYY-MM-DD, time?:HH:MM, categoryId?:string}], "completeIds": [string], "deleteIds": [string] }.
Regras:
1. 'create' tem tarefas novas. Datas relativas: hoje=${today}, ontem=${yesterday}, amanhã=${tomorrow}.
2. 'completeIds' tem os IDs exatos das tarefas que o usuário pediu para finalizar/concluir. Não invente IDs.
3. 'deleteIds' tem os IDs exatos das tarefas que o usuário pediu para excluir, apagar, remover ou deletar. Excluir não é concluir. Não invente IDs.
4. Cada tarefa existente está no formato id|data|concluida|título. Se o pedido for concluir ou excluir as tarefas de um dia (ontem, hoje, amanhã ou uma data), inclua TODOS os IDs dessa data na lista correspondente.
5. O mesmo ID não pode estar em completeIds e deleteIds. Se for só concluir ou só excluir, deixe 'create' vazio e a outra lista vazia.
Hoje: ${today}
Ontem: ${yesterday}
Cats: ${categories.map((c) => `${c.id}:${c.name}`).join(", ")}
Tarefas Existentes: ${pendingTasks.map((t) => `${t.id}|${t.date || "?"}|${t.completed ? "sim" : "nao"}|${t.title}`).join(" || ")}
Texto: "${text}"`;
  },

  preferStrongerModel: ({ text, pendingTasks }) => prefersStrongerTaskModel(text, pendingTasks.length),

  resolveLocally: ({ text, currentDate, pendingTasks }) =>
    localTaskCommand(text, currentDate ?? formatDateKey(new Date()), pendingTasks),

  postProcess: (output, { text, currentDate, pendingTasks }) => {
    const today = currentDate ?? formatDateKey(new Date());
    const known = new Set(pendingTasks.map((t) => t.id));

    const deleteBulk = bulkTaskIds(text, today, pendingTasks, "delete");
    if (deleteBulk) return { ...output, deleteIds: deleteBulk, completeIds: [] };

    const completeBulk = bulkTaskIds(text, today, pendingTasks, "complete");
    if (completeBulk) return { ...output, completeIds: completeBulk, deleteIds: [] };

    const deleteIds = output.deleteIds.filter((id) => known.has(id));
    const deleting = new Set(deleteIds);
    const completeIds = output.completeIds.filter((id) => known.has(id) && !deleting.has(id));
    return { ...output, deleteIds, completeIds };
  },
});
