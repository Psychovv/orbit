import {
  GoogleGenerativeAI,
  GoogleGenerativeAIAbortError,
  type GenerationConfig,
} from "@google/generative-ai";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { clientKey, rateLimit } from "./rate-limit";
import { requireAuth } from "@/server/auth-guard";

const RATE_LIMIT = { limit: 20, windowMs: 60_000 };
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Padrão mais barato que esta chave ainda alcança.
 * O 2.5 Flash-Lite responde 404 para contas novas.
 */
const PRIMARY_MODEL = {
  id: "gemini-3.1-flash-lite",
  generationConfig: {
    responseMimeType: "application/json",
    thinkingConfig: { thinkingLevel: "MINIMAL" },
  } as GenerationConfig,
};

const STRONGER_MODEL = {
  id: "gemini-3.5-flash-lite",
  generationConfig: {
    responseMimeType: "application/json",
    thinkingConfig: { thinkingLevel: "MINIMAL" },
  } as GenerationConfig,
};

const OVERLOAD_MESSAGE = "A Orbit AI está em sobrecarga. Tente novamente em poucos minutos.";

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

function isModelOverloaded(error: unknown): boolean {
  if (error instanceof GoogleGenerativeAIAbortError) return true;
  if (!error || typeof error !== "object") return false;
  if ("status" in error && error.status === 503) return true;
  const message = error instanceof Error ? error.message : "";
  return /high demand|overloaded|unavailable|aborted|timeout|deadline/i.test(message);
}

function isRetryable(error: unknown): boolean {
  if (isModelOverloaded(error) || error instanceof GoogleGenerativeAIAbortError || error instanceof SyntaxError) {
    return true;
  }
  if (error && typeof error === "object" && "status" in error) {
    const status = Number(error.status);
    return status === 404 || status === 429 || status === 500 || status === 502 || status === 504;
  }
  const message = error instanceof Error ? error.message : "";
  return /timeout|aborted|deadline/i.test(message);
}

async function callModel(
  apiKey: string,
  model: { id: string; generationConfig: GenerationConfig },
  prompt: string
): Promise<unknown> {
  const client = new GoogleGenerativeAI(apiKey).getGenerativeModel(
    { model: model.id, generationConfig: model.generationConfig },
    { timeout: REQUEST_TIMEOUT_MS }
  );
  const result = await client.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  const text = result.response
    .text()
    .replace(/^```json\s*/, "")
    .replace(/\s*```$/, "");
  return JSON.parse(text);
}

async function generateJson(
  prompt: string,
  useStrongerModel: boolean,
  recoverLocally: () => unknown | null
): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new HttpError(500, "GEMINI_API_KEY não configurada no servidor.");

  const [first, second] = useStrongerModel ? [STRONGER_MODEL, PRIMARY_MODEL] : [PRIMARY_MODEL, STRONGER_MODEL];
  try {
    return await callModel(apiKey, first, prompt);
  } catch (error) {
    if (!isRetryable(error)) throw error;
    if (isModelOverloaded(error)) {
      const local = recoverLocally();
      if (local) return local;
    }
    console.error(`[assistant] ${first.id} falhou, tentando ${second.id}`, error);
    return callModel(apiKey, second, prompt);
  }
}

interface AssistantRouteOptions<Req extends z.ZodType, Res extends z.ZodType> {
  name: string;
  request: Req;
  response: Res;
  buildPrompt: (input: z.infer<Req>) => string;
  /** Ajustes determinísticos sobre a resposta já validada. */
  postProcess?: (output: z.infer<Res>, input: z.infer<Req>) => z.infer<Res>;
  /** Data relativa com lista longa: começa pelo 3.5 Flash-Lite. */
  useStrongerModel?: (input: z.infer<Req>) => boolean;
  /** Pedido óbvio resolvido no servidor quando o Gemini não responde. */
  resolveLocally?: (input: z.infer<Req>) => unknown | null;
}

/** Route Handler padrão da Orbit AI: rate limit, validação da entrada, chamada ao Gemini e validação da saída. */
export function createAssistantRoute<Req extends z.ZodType, Res extends z.ZodType>({
  name,
  request,
  response,
  buildPrompt,
  postProcess,
  useStrongerModel,
  resolveLocally,
}: AssistantRouteOptions<Req, Res>) {
  return async function POST(req: Request) {
    const authResponse = await requireAuth();
    if (authResponse) return authResponse;

    try {
      if (!rateLimit(`${name}:${clientKey(req)}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs)) {
        throw new HttpError(429, "Muitas requisições. Aguarde um minuto e tente de novo.");
      }

      const body = request.safeParse(await req.json().catch(() => null));
      if (!body.success) throw new HttpError(400, "Pedido inválido.");

      const respond = (raw: unknown) => {
        const output = response.safeParse(raw);
        if (!output.success) throw new HttpError(502, "A IA respondeu em um formato inesperado.");
        return NextResponse.json(postProcess ? postProcess(output.data, body.data) : output.data);
      };

      try {
        const raw = await generateJson(
          buildPrompt(body.data),
          useStrongerModel?.(body.data) ?? false,
          () => resolveLocally?.(body.data) ?? null
        );
        return respond(raw);
      } catch (error) {
        const local = resolveLocally?.(body.data);
        if (local) return respond(local);
        throw error;
      }
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error(`[${name}]`, error);
      if (isModelOverloaded(error)) {
        return NextResponse.json({ error: OVERLOAD_MESSAGE }, { status: 503 });
      }
      return NextResponse.json({ error: "Não foi possível processar o pedido." }, { status: 500 });
    }
  };
}
