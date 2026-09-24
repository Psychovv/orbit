import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

function calendarDate(value: unknown): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addCalendarDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function bulkCompleteIds(
  text: string,
  today: string,
  tasks: Array<{ id: string; date?: string }>
): string[] | null {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  const wantsComplete = /\b(encerr\w*|conclu\w*|finaliz\w*|complet\w*|marque|marcar|fecha\w*)\b/.test(normalized);
  const allOfDay = /\b(tarefas|todas|tudo|pendencias)\b/.test(normalized);
  if (!wantsComplete || !allOfDay) return null;

  let target: string | null = null;
  if (/\banteontem\b/.test(normalized)) target = addCalendarDays(today, -2);
  else if (/\bontem\b/.test(normalized)) target = addCalendarDays(today, -1);
  else if (/\bamanha\b/.test(normalized)) target = addCalendarDays(today, 1);
  else if (/\bhoje\b/.test(normalized)) target = today;
  else {
    const match = normalized.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (match) target = match[1];
  }
  if (!target) return null;

  return tasks.filter((task) => task.date === target).map((task) => String(task.id));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, currentDate, categories, pendingTasks } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

    const today = calendarDate(currentDate);
    const yesterday = addCalendarDays(today, -1);
    const tomorrow = addCalendarDays(today, 1);
    const tasks = (pendingTasks || []) as Array<{ id: string; title: string; date?: string }>;

    const prompt = `Retorne um JSON EXATO: { "create": [{title:string, date?:YYYY-MM-DD, time?:HH:MM, categoryId?:string}], "completeIds": [string] }.
Regras:
1. 'create' tem tarefas novas. Datas relativas: hoje=${today}, ontem=${yesterday}, amanhã=${tomorrow}.
2. 'completeIds' tem os IDs exatos das tarefas existentes que o usuário pediu para finalizar/concluir. Não invente IDs.
3. Cada tarefa existente está no formato id|data|título. Se o pedido for encerrar/concluir as tarefas de um dia (ontem, hoje, amanhã ou uma data), inclua TODOS os IDs dessa data.
4. Se o pedido for só concluir tarefas, deixe 'create' vazio.
Hoje: ${today}
Ontem: ${yesterday}
Cats: ${(categories || []).map((c: { id: string; name: string }) => `${c.id}:${c.name}`).join(", ")}
Tarefas Existentes: ${tasks.map((t) => `${t.id}|${t.date || "?"}|${t.title}`).join(" || ")}
Texto: "${text}"`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    let responseText = result.response.text();
    // Strip markdown formatting if the model still returns it
    responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(responseText);
    const bulkIds = bulkCompleteIds(text, today, tasks);
    if (bulkIds) {
      parsed.completeIds = bulkIds;
    } else {
      const known = new Set(tasks.map((t) => String(t.id)));
      parsed.completeIds = (Array.isArray(parsed.completeIds) ? parsed.completeIds : [])
        .map((id: unknown) => String(id))
        .filter((id: string) => known.has(id));
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Error parsing voice task:", error);
    return NextResponse.json(
      { error: "Failed to parse voice task", details: error.message || String(error) },
      { status: 500 }
    );
  }
}
