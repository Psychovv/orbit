import type { z } from "zod";
import {
  FinanceCommandResponseSchema,
  TaskCommandResponseSchema,
  type FinanceCommandRequest,
  type FinanceCommandResponse,
  type TaskCommandRequest,
  type TaskCommandResponse,
} from "../domain/actions";
import { ASSISTANT_SOURCE_HEADER, type AssistantSource } from "../domain/source";
import { toast } from "@/shared/ui/toast";

export class AssistantError extends Error {}

export type { AssistantSource };

export interface AssistantCommandResult<T> {
  data: T;
  source: AssistantSource;
}

/** Avisa que o Gemini falhou e o pedido foi resolvido no servidor. */
export function notifyLocalFallback() {
  toast({
    tone: "default",
    message: "Pedido entendido localmente",
    description: "A Orbit AI estava indisponível; o sistema interpretou o que você pediu.",
    durationMs: 6000,
  });
}

async function post<S extends z.ZodType>(
  url: string,
  body: unknown,
  schema: S
): Promise<AssistantCommandResult<z.infer<S>>> {
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

  const source: AssistantSource =
    response.headers.get(ASSISTANT_SOURCE_HEADER) === "local" ? "local" : "model";
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) throw new AssistantError("A resposta da IA veio em um formato inesperado.");
  return { data: parsed.data, source };
}

export function requestTaskCommand(
  body: TaskCommandRequest
): Promise<AssistantCommandResult<TaskCommandResponse>> {
  return post("/api/tasks/parse-voice", body, TaskCommandResponseSchema);
}

export function requestFinanceCommand(
  body: FinanceCommandRequest
): Promise<AssistantCommandResult<FinanceCommandResponse>> {
  return post("/api/finance/parse-voice", body, FinanceCommandResponseSchema);
}
