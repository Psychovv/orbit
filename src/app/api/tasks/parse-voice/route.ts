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

type ExistingTask = { id: string; title: string; date?: string; completed?: boolean };

function dayTarget(normalized: string, today: string): string | null {
  if (/\banteontem\b/.test(normalized)) return addCalendarDays(today, -2);
  if (/\bontem\b/.test(normalized)) return addCalendarDays(today, -1);
  if (/\bamanha\b/.test(normalized)) return addCalendarDays(today, 1);
  if (/\bhoje\b/.test(normalized)) return today;
  const match = normalized.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  return match ? match[1] : null;
}

function bulkTaskIds(
  text: string,
  today: string,
  tasks: ExistingTask[],
  action: "complete" | "delete"
): string[] | null {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  const wantsAction =
    action === "delete"
      ? /\b(exclu\w*|apag\w*|remov\w*|delet\w*|delete\w*|cancel\w*)\b/.test(normalized)
      : /\b(encerr\w*|conclu\w*|finaliz\w*|complet\w*|marque|marcar|fecha\w*)\b/.test(normalized);
  const allOfDay = /\b(tarefas|todas|tudo|pendencias)\b/.test(normalized);
  if (!wantsAction || !allOfDay) return null;

  const target = dayTarget(normalized, today);
  if (!target) return null;

  return tasks
    .filter((task) => task.date === target && (action === "delete" || !task.completed))
    .map((task) => String(task.id));
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
    const tasks = (pendingTasks || []) as ExistingTask[];

    const prompt = `Retorne um JSON EXATO: { "create": [{title:string, date?:YYYY-MM-DD, time?:HH:MM, categoryId?:string}], "completeIds": [string], "deleteIds": [string] }.
Regras:
1. 'create' tem tarefas novas. Datas relativas: hoje=${today}, ontem=${yesterday}, amanhã=${tomorrow}.
2. 'completeIds' tem os IDs exatos das tarefas que o usuário pediu para finalizar/concluir. Não invente IDs.
3. 'deleteIds' tem os IDs exatos das tarefas que o usuário pediu para excluir, apagar, remover ou deletar. Excluir não é concluir. Não invente IDs.
4. Cada tarefa existente está no formato id|data|concluida|título. Se o pedido for concluir ou excluir as tarefas de um dia (ontem, hoje, amanhã ou uma data), inclua TODOS os IDs dessa data na lista correspondente.
5. O mesmo ID não pode estar em completeIds e deleteIds. Se for só concluir ou só excluir, deixe 'create' vazio e a outra lista vazia.
Hoje: ${today}
Ontem: ${yesterday}
Cats: ${(categories || []).map((c: { id: string; name: string }) => `${c.id}:${c.name}`).join(", ")}
Tarefas Existentes: ${tasks.map((t) => `${t.id}|${t.date || "?"}|${t.completed ? "sim" : "nao"}|${t.title}`).join(" || ")}
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
    const known = new Set(tasks.map((t) => String(t.id)));
    const keepKnown = (ids: unknown) =>
      (Array.isArray(ids) ? ids : [])
        .map((id: unknown) => String(id))
        .filter((id: string) => known.has(id));

    const deleteBulk = bulkTaskIds(text, today, tasks, "delete");
    const completeBulk = deleteBulk ? null : bulkTaskIds(text, today, tasks, "complete");

    if (deleteBulk) {
      parsed.deleteIds = deleteBulk;
      parsed.completeIds = [];
    } else if (completeBulk) {
      parsed.completeIds = completeBulk;
      parsed.deleteIds = [];
    } else {
      parsed.deleteIds = keepKnown(parsed.deleteIds);
      const deleting = new Set(parsed.deleteIds);
      parsed.completeIds = keepKnown(parsed.completeIds).filter((id: string) => !deleting.has(id));
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
