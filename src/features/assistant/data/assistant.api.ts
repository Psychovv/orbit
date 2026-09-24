import type { z } from "zod";
import {
  FinanceCommandResponseSchema,
  TaskCommandResponseSchema,
  type FinanceCommandRequest,
  type TaskCommandRequest,
} from "../domain/actions";

export class AssistantError extends Error {}

async function post<S extends z.ZodType>(url: string, body: unknown, schema: S): Promise<z.infer<S>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AssistantError("Sem conexão com o servidor.");
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new AssistantError(payload?.error ?? "Não foi possível processar o pedido.");
  }

  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) throw new AssistantError("A resposta da IA veio em um formato inesperado.");
  return parsed.data;
}

export function requestTaskCommand(body: TaskCommandRequest) {
  return post("/api/tasks/parse-voice", body, TaskCommandResponseSchema);
}

export function requestFinanceCommand(body: FinanceCommandRequest) {
  return post("/api/finance/parse-voice", body, FinanceCommandResponseSchema);
}
