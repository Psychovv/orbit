import {
  HabitCommandRequestSchema,
  HabitCommandResponseSchema,
} from "@/features/assistant/domain/actions";
import { localHabitCommand } from "@/features/assistant/domain/local-commands";
import { formatDateKey } from "@/shared/lib/date-utils";
import { createAssistantRoute } from "../../_lib/assistant-route";

export const POST = createAssistantRoute({
  name: "habits/parse-voice",
  request: HabitCommandRequestSchema,
  response: HabitCommandResponseSchema,

  buildPrompt: ({ text, currentDate, habits }) => {
    const today = currentDate ?? formatDateKey(new Date());
    return `Retorne um JSON EXATO: { "create": [{name:string, description?:string, icon?:string, color?:string, period?:"morning"|"afternoon"|"evening"|"anytime", type?:"boolean"|"numeric", targetValue?:number, unit?:string, step?:number, frequencyType?:"daily"|"specific_days"|"weekly_target", frequencyDays?:number[], weeklyTargetCount?:number}], "updates": [{id:string, name?:string, description?:string, period?:"morning"|"afternoon"|"evening"|"anytime", frequencyType?:"daily"|"specific_days"|"weekly_target", frequencyDays?:number[], weeklyTargetCount?:number, targetValue?:number, unit?:string, step?:number}], "checkinIds": [string], "clearCheckinIds": [string], "deleteIds": [string], "answer"?: string }.
Regras:
1. 'create' cria hábitos novos. Preferir type boolean e frequencyType daily quando não especificado. period: morning/afternoon/evening/anytime. frequencyDays usa 0=Dom … 6=Sáb.
2. 'updates' altera hábitos existentes pelo ID exato. Não invente IDs.
3. 'checkinIds' marca check-in de hoje (conclusão) nos IDs exatos. 'clearCheckinIds' desmarca o check-in de hoje.
4. 'deleteIds' exclui hábitos existentes pelo ID exato. Excluir não é check-in.
5. Hábitos existentes: id|periodo|freq|checkinHoje|streak|nome. Use esses IDs.
6. O mesmo ID não pode estar em checkinIds, clearCheckinIds, deleteIds e updates ao mesmo tempo.
7. 'answer' é texto curto (pt-BR) para consultas ("quais faltam?", "como está o streak?"). Em consulta, deixe create/updates/checkinIds/clearCheckinIds/deleteIds vazios.
Hoje: ${today}
Hábitos: ${habits.map((h) => `${h.id}|${h.period}|${h.frequencyType}|${h.checkedInToday ? "sim" : "nao"}|${h.currentStreak ?? 0}|${h.name}`).join(" || ")}
Texto: "${text}"`;
  },

  resolveLocally: ({ text, habits }) => localHabitCommand(text, habits),

  postProcess: (output, { habits }) => {
    const known = new Set(habits.map((h) => h.id));
    const deleteIds = output.deleteIds.filter((id) => known.has(id));
    const deleting = new Set(deleteIds);
    const checkinIds = output.checkinIds.filter((id) => known.has(id) && !deleting.has(id));
    const clearing = new Set(checkinIds);
    const clearCheckinIds = output.clearCheckinIds.filter(
      (id) => known.has(id) && !deleting.has(id) && !clearing.has(id)
    );
    const updates = output.updates.filter((u) => known.has(u.id) && !deleting.has(u.id));
    return { ...output, deleteIds, checkinIds, clearCheckinIds, updates };
  },
});
