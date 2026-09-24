import type { ExistingTaskRef, FinanceCommandResponse, TaskCommandResponse } from "./actions";
import { addCalendarDays, bulkTaskIds } from "./bulk-commands";

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function emptyTaskCommand(): TaskCommandResponse {
  return { create: [], completeIds: [], deleteIds: [] };
}

function dayOfMonth(today: string, day: number): string | null {
  if (day < 1 || day > 31) return null;
  const [year, month, currentDay] = today.split("-").map(Number);
  let nextMonth = month;
  let nextYear = year;
  if (day < currentDay) {
    nextMonth += 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
  }
  const date = new Date(Date.UTC(nextYear, nextMonth - 1, day));
  if (date.getUTCFullYear() !== nextYear || date.getUTCMonth() !== nextMonth - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function mentionedDate(text: string, today: string): string | undefined {
  const normalized = normalize(text);
  if (/\banteontem\b/.test(normalized)) return addCalendarDays(today, -2);
  if (/\bontem\b/.test(normalized)) return addCalendarDays(today, -1);
  if (/\bamanha\b/.test(normalized)) return addCalendarDays(today, 1);
  if (/\bhoje\b/.test(normalized)) return today;
  const iso = normalized.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  const day = normalized.match(/\bdia\s+(\d{1,2})\b/);
  if (!day) return undefined;
  return dayOfMonth(today, Number(day[1])) ?? undefined;
}

function createTitle(text: string): string | null {
  const title = text
    .replace(/^(?:por favor|pfv|favor)[, ]+/i, "")
    .replace(/^(?:crie|cria|criar|adicione|adiciona|adicionar|coloque|coloca|agende|agenda)\s+/i, "")
    .replace(/^(?:uma\s+)?(?:nova\s+)?(?:tarefa|task|compromisso)\s+/i, "")
    .replace(/\bpara\s+(?:o|a)\s+/gi, "")
    .replace(/\b(?:no|na|em)\s+dia\s+\d{1,2}\b/gi, "")
    .replace(/\bdia\s+\d{1,2}\b/gi, "")
    .replace(/\b(?:hoje|amanh[ãa]|ontem|anteontem)\b/gi, "")
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, "")
    .trim();
  return title.length >= 2 ? title.slice(0, 200) : null;
}

function uniqueTaskId(text: string, tasks: ExistingTaskRef[], action: "complete" | "delete"): string | null {
  const normalized = normalize(text);
  const wants =
    action === "delete"
      ? /\b(exclu\w*|apag\w*|remov\w*|delet\w*|delete\w*|cancel\w*)\b/.test(normalized)
      : /\b(encerr\w*|conclu\w*|finaliz\w*|complet\w*|marque|marcar|fecha\w*)\b/.test(normalized);
  if (!wants) return null;

  const matches = tasks.filter((task) => {
    const title = normalize(task.title).trim();
    return title.length >= 3 && normalized.includes(title);
  });
  return matches.length === 1 ? matches[0].id : null;
}

/**
 * Interpreta pedidos óbvios sem o Gemini. Usado quando os modelos estão fora.
 * `null` quando a frase não é segura de resolver localmente.
 */
export function localTaskCommand(text: string, today: string, tasks: ExistingTaskRef[]): TaskCommandResponse | null {
  const deleteBulk = bulkTaskIds(text, today, tasks, "delete");
  if (deleteBulk) return { ...emptyTaskCommand(), deleteIds: deleteBulk };

  const completeBulk = bulkTaskIds(text, today, tasks, "complete");
  if (completeBulk) return { ...emptyTaskCommand(), completeIds: completeBulk };

  const deleteId = uniqueTaskId(text, tasks, "delete");
  if (deleteId) return { ...emptyTaskCommand(), deleteIds: [deleteId] };

  const completeId = uniqueTaskId(text, tasks, "complete");
  if (completeId) return { ...emptyTaskCommand(), completeIds: [completeId] };

  const normalized = normalize(text);
  const wantsCreate = /\b(cri\w*|adicion\w*|coloc\w*|agend\w*|nov[ao])\b/.test(normalized);
  const wantsOther =
    /\b(exclu\w*|apag\w*|remov\w*|delet\w*|encerr\w*|conclu\w*|finaliz\w*|complet\w*)\b/.test(normalized);
  if (!wantsCreate || wantsOther) return null;

  const title = createTitle(text);
  if (!title) return null;
  return { ...emptyTaskCommand(), create: [{ title, date: mentionedDate(text, today) }] };
}

const PAYMENT_METHODS = ["pix", "cartao", "dinheiro", "boleto", "transferencia"] as const;

/** Um lançamento simples ("gastei 45 no almoço no pix") quando a IA não responde. */
export function localFinanceCommand(text: string, today: string): FinanceCommandResponse | null {
  const normalized = normalize(text);
  const income = /\b(recebi|ganhei|salario|receita)\b/.test(normalized);
  const expense = /\b(gastei|paguei|comprei|despesa)\b/.test(normalized);
  if (income === expense) return null;

  const amountMatch = text.match(/(\d{1,6}(?:[.,]\d{1,2})?)/);
  if (!amountMatch) return null;
  const amount = Number(amountMatch[1].replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const paymentMethod = PAYMENT_METHODS.find((method) => normalized.includes(method));
  const description = text
    .replace(amountMatch[1], " ")
    .replace(/\b(recebi|ganhei|sal[aá]rio|receita|gastei|paguei|comprei|despesa)\b/gi, " ")
    .replace(/\b(no|na|em|de|do|da|pix|cart[aã]o|dinheiro|boleto|transfer[eê]ncia|reais|real|r\$)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return [
    {
      description: description.length >= 2 ? description.slice(0, 200) : undefined,
      amount,
      type: income ? "income" : "expense",
      date: today,
      paymentMethod,
    },
  ];
}
