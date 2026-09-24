import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { clientKey, rateLimit } from "./rate-limit";

const MODEL = "gemini-3.5-flash-lite";
const RATE_LIMIT = { limit: 20, windowMs: 60_000 };

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

async function generateJson(prompt: string): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new HttpError(500, "GEMINI_API_KEY não configurada no servidor.");

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: MODEL });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  const text = result.response
    .text()
    .replace(/^```json\s*/, "")
    .replace(/\s*```$/, "");
  return JSON.parse(text);
}

interface AssistantRouteOptions<Req extends z.ZodType, Res extends z.ZodType> {
  name: string;
  request: Req;
  response: Res;
  buildPrompt: (input: z.infer<Req>) => string;
  /** Ajustes determinísticos sobre a resposta já validada. */
  postProcess?: (output: z.infer<Res>, input: z.infer<Req>) => z.infer<Res>;
}

/** Route Handler padrão da Orbit AI: rate limit, validação da entrada, chamada ao Gemini e validação da saída. */
export function createAssistantRoute<Req extends z.ZodType, Res extends z.ZodType>({
  name,
  request,
  response,
  buildPrompt,
  postProcess,
}: AssistantRouteOptions<Req, Res>) {
  return async function POST(req: Request) {
    try {
      if (!rateLimit(`${name}:${clientKey(req)}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs)) {
        throw new HttpError(429, "Muitas requisições. Aguarde um minuto e tente de novo.");
      }

      const body = request.safeParse(await req.json().catch(() => null));
      if (!body.success) throw new HttpError(400, "Pedido inválido.");

      const raw = await generateJson(buildPrompt(body.data));
      const output = response.safeParse(raw);
      if (!output.success) throw new HttpError(502, "A IA respondeu em um formato inesperado.");

      return NextResponse.json(postProcess ? postProcess(output.data, body.data) : output.data);
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error(`[${name}]`, error);
      return NextResponse.json({ error: "Não foi possível processar o pedido." }, { status: 500 });
    }
  };
}
