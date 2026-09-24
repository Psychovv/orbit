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

  buildPrompt: ({ text, currentDate, categories }) =>
    `Extraia transações p/ JSON Array: [{description:string, amount:number, type:"income"|"expense", date?:YYYY-MM-DD, categoryId?:string, paymentMethod?:"pix"|"cartao"|"dinheiro"|"boleto"|"transferencia"}]. Hoje: ${currentDate ?? formatDateKey(new Date())}
Cats: ${categories.map((c) => `${c.id}:${c.name}(${c.type})`).join(", ")}
Texto: "${text}"`,

  resolveLocally: ({ text, currentDate }) => localFinanceCommand(text, currentDate ?? formatDateKey(new Date())),
});
