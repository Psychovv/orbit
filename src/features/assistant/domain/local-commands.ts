import type {
  ExistingHabitRef,
  ExistingTaskRef,
  ExistingTransactionRef,
  FinanceCommandResponse,
  HabitCommandResponse,
  TaskCommandResponse,
} from "./actions";
import { addCalendarDays, bulkTaskIds } from "./bulk-commands";
import { formatBRL } from "@/features/finance/domain/money";
import { computeMonthlyMetrics } from "@/features/finance/domain/metrics";
import type { Transaction } from "@/features/finance/domain/finance.schema";
import {
  HABIT_COLOR_PRESETS,
  HABIT_ICON_PRESETS,
  type HabitPeriod,
} from "@/features/habits/domain/habit.schema";

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

export function emptyTaskCommand(): TaskCommandResponse {
  return { create: [], updates: [], completeIds: [], deleteIds: [], createCategories: [] };
}

export function emptyFinanceCommand(): FinanceCommandResponse {
  return { create: [], updates: [], deleteIds: [], createCategories: [] };
}

export function emptyHabitCommand(): HabitCommandResponse {
  return { create: [], updates: [], checkinIds: [], clearCheckinIds: [], deleteIds: [] };
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
    .replace(/^(?:a\s+|uma\s+)?(?:nova\s+)?(?:tarefa|task|compromisso)\s+/i, "")
    .replace(/\bpara\s+(?:o|a)\s+/gi, "")
    .replace(/\b(?:no|na|em)\s+dia\s+\d{1,2}\b/gi, "")
    .replace(/\bdia\s+\d{1,2}\b/gi, "")
    .replace(/(?<!\p{L})(?:hoje|amanh[ãa]|ontem|anteontem)(?!\p{L})/giu, "")
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

function uniqueTaskByTitle(text: string, tasks: ExistingTaskRef[]): ExistingTaskRef | null {
  const normalized = normalize(text);
  const matches = tasks.filter((task) => {
    const title = normalize(task.title).trim();
    return title.length >= 3 && normalized.includes(title);
  });
  return matches.length === 1 ? matches[0] : null;
}

/** Remarca tarefa existente: "move X para amanhã", "adia ler para dia 27". */
function localReschedule(text: string, today: string, tasks: ExistingTaskRef[]): TaskCommandResponse | null {
  const normalized = normalize(text);
  const wantsMove =
    /\b(mov\w*|remarc\w*|reagend\w*|adi\w*|pass\w*|troqu\w*|mud\w*|coloqu\w*|coloc\w*)\b/.test(normalized);
  if (!wantsMove) return null;

  const date = mentionedDate(text, today);
  if (!date) return null;

  const task = uniqueTaskByTitle(text, tasks);
  if (!task) return null;

  return { ...emptyTaskCommand(), updates: [{ id: task.id, date }] };
}

/** Consulta: "o que falta hoje/amanhã". */
function localPendingQuery(text: string, today: string, tasks: ExistingTaskRef[]): TaskCommandResponse | null {
  const normalized = normalize(text);
  const wantsQuery =
    /\b(o que|oque|quais|lista|listar|mostra|mostrar|falt\w*|pendente\w*|resta\w*)\b/.test(normalized) &&
    /\b(tarefa\w*|task\w*|pendenc\w*|hoje|amanha|ontem)\b/.test(normalized);
  if (!wantsQuery) return null;

  const date = mentionedDate(text, today) ?? today;
  const pending = tasks.filter((t) => t.date === date && !t.completed);
  if (pending.length === 0) {
    return { ...emptyTaskCommand(), answer: `Nenhuma tarefa pendente em ${date}.` };
  }
  const lines = pending.map((t) => `• ${t.title}`).join("\n");
  return {
    ...emptyTaskCommand(),
    answer: `${pending.length} pendente${pending.length === 1 ? "" : "s"} em ${date}:\n${lines}`,
  };
}

/** Cria categoria: "cria a categoria Faculdade". */
function localCreateTaskCategory(text: string): TaskCommandResponse | null {
  const normalized = normalize(text);
  const match = text.match(
    /\b(?:cri\w*|adicion\w*|nov[ao])\s+(?:a\s+)?(?:categoria|cat)\s+([a-zA-ZÀ-ÿ0-9][\wÀ-ÿ\s-]{0,40})/i
  );
  if (!match || !/\bcategoria\b|\bcat\b/.test(normalized)) return null;
  const name = match[1].replace(/\s+/g, " ").trim().slice(0, 60);
  if (name.length < 2) return null;
  return { ...emptyTaskCommand(), createCategories: [{ name }] };
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

  const reschedule = localReschedule(text, today, tasks);
  if (reschedule) return reschedule;

  const pendingQuery = localPendingQuery(text, today, tasks);
  if (pendingQuery) return pendingQuery;

  const category = localCreateTaskCategory(text);
  if (category) return category;

  const normalized = normalize(text);
  const wantsCreate = /\b(cri\w*|adicion\w*|coloc\w*|agend\w*|nov[ao])\b/.test(normalized);
  const wantsOther =
    /\b(exclu\w*|apag\w*|remov\w*|delet\w*|encerr\w*|conclu\w*|finaliz\w*|complet\w*|mov\w*|remarc\w*)\b/.test(
      normalized
    );
  if (!wantsCreate || wantsOther) return null;

  const title = createTitle(text);
  if (!title) return null;
  return { ...emptyTaskCommand(), create: [{ title, date: mentionedDate(text, today) }] };
}

const PAYMENT_METHODS = ["pix", "cartao", "dinheiro", "boleto", "transferencia"] as const;

function monthPrefix(iso: string): string {
  return iso.slice(0, 7);
}

function toMetricTx(refs: ExistingTransactionRef[]): Transaction[] {
  const ts = "2026-01-01T00:00:00.000Z";
  return refs.map((ref) => ({
    id: ref.id,
    description: ref.description,
    amountCents: ref.amountCents,
    type: ref.type,
    categoryId: ref.categoryId ?? null,
    date: ref.date,
    paymentMethod: "pix",
    countsInBalance: ref.countsInBalance,
    createdAt: ts,
    updatedAt: ts,
  }));
}

/** Consulta saldo/gastos do mês com métricas determinísticas. */
function localFinanceQuery(
  text: string,
  today: string,
  transactions: ExistingTransactionRef[],
  categories: { id: string; name: string; type: "income" | "expense" }[]
): FinanceCommandResponse | null {
  const normalized = normalize(text);
  const isQueryPhrase =
    /\b(quanto\s+(gastei|recebi|foi)|qual\s+(o\s+)?saldo|saldo\s+(do\s+)?mes|resumo\s+(do\s+)?mes|gastos?\s+do\s+mes|despesas?\s+do\s+mes|como\s+(esta|estou))\b/.test(
      normalized
    ) || /\b(quanto|saldo|resumo)\b/.test(normalized);

  if (!isQueryPhrase) return null;
  if (/\b(registre|lanc[ae]|adicion|cri\w*)\b/.test(normalized) && /\d/.test(normalized)) return null;
  if (/\b(gastei|paguei|comprei)\s+\d/.test(normalized)) return null;

  const month = monthPrefix(today);
  const monthTx = transactions.filter((t) => t.date.startsWith(month));
  const metrics = computeMonthlyMetrics(toMetricTx(monthTx));
  const expenses = metrics.expenseCents;

  const categoryHint = categories.find((c) => normalized.includes(normalize(c.name)));
  if (categoryHint) {
    const spentTx = monthTx.filter(
      (t) => t.type === "expense" && t.categoryId === categoryHint.id && t.countsInBalance !== false
    );
    const spent = spentTx.reduce((acc, t) => acc + t.amountCents, 0);
    return {
      ...emptyFinanceCommand(),
      answer: `Em ${month}, ${categoryHint.name}: ${formatBRL(spent)} em despesas (${spentTx.length} lançamentos).`,
    };
  }

  return {
    ...emptyFinanceCommand(),
      answer: `Mês ${month}: receitas ${formatBRL(metrics.incomeCents)}, despesas ${formatBRL(expenses)}, saldo ${formatBRL(metrics.savedCents)}.`,
  };
}

/** Exclui lançamento por descrição (+ valor opcional) com match único. */
function localFinanceDelete(
  text: string,
  transactions: ExistingTransactionRef[]
): FinanceCommandResponse | null {
  const normalized = normalize(text);
  const wantsDelete = /\b(exclu\w*|apag\w*|remov\w*|delet\w*|delete\w*)\b/.test(normalized);
  if (!wantsDelete) return null;

  const amountMatch = text.match(/(\d{1,6}(?:[.,]\d{1,2})?)/);
  const amountCents = amountMatch ? Math.round(Number(amountMatch[1].replace(",", ".")) * 100) : null;

  const matches = transactions.filter((tx) => {
    const desc = normalize(tx.description).trim();
    if (desc.length < 3 || !normalized.includes(desc)) return false;
    if (amountCents !== null && tx.amountCents !== amountCents) return false;
    return true;
  });
  if (matches.length !== 1) return null;
  return { ...emptyFinanceCommand(), deleteIds: [matches[0].id] };
}

function localCreateFinanceCategory(text: string): FinanceCommandResponse | null {
  const normalized = normalize(text);
  const match = text.match(
    /\b(?:cri\w*|adicion\w*|nov[ao])\s+(?:a\s+)?(?:categoria|cat)\s+([a-zA-ZÀ-ÿ0-9][\wÀ-ÿ\s-]{0,40})/i
  );
  if (!match || !/\bcategoria\b|\bcat\b/.test(normalized)) return null;
  const name = match[1].replace(/\s+/g, " ").trim().slice(0, 60);
  if (name.length < 2) return null;
  const type = /\b(receita|renda|income)\b/.test(normalized) ? ("income" as const) : ("expense" as const);
  return { ...emptyFinanceCommand(), createCategories: [{ name, type }] };
}

export interface LocalFinanceContext {
  transactions?: ExistingTransactionRef[];
  categories?: { id: string; name: string; type: "income" | "expense" }[];
}

/** Um lançamento simples ("gastei 45 no almoço no pix") quando a IA não responde. */
export function localFinanceCommand(
  text: string,
  today: string,
  context: LocalFinanceContext = {}
): FinanceCommandResponse | null {
  const transactions = context.transactions ?? [];
  const categories = context.categories ?? [];

  const query = localFinanceQuery(text, today, transactions, categories);
  if (query) return query;

  const deleting = localFinanceDelete(text, transactions);
  if (deleting) return deleting;

  const category = localCreateFinanceCategory(text);
  if (category) return category;

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

  return {
    ...emptyFinanceCommand(),
    create: [
      {
        description: description.length >= 2 ? description.slice(0, 200) : undefined,
        amount,
        type: income ? "income" : "expense",
        date: today,
        paymentMethod,
      },
    ],
  };
}

function uniqueHabitByName(text: string, habits: ExistingHabitRef[]): ExistingHabitRef | null {
  const normalized = normalize(text);
  const matches = habits.filter((habit) => {
    const name = normalize(habit.name).trim();
    return name.length >= 2 && normalized.includes(name);
  });
  return matches.length === 1 ? matches[0] : null;
}

function mentionedPeriod(text: string): HabitPeriod | undefined {
  const normalized = normalize(text);
  if (/\bmanha\b/.test(normalized)) return "morning";
  if (/\btarde\b/.test(normalized)) return "afternoon";
  if (/\bnoite\b/.test(normalized)) return "evening";
  return undefined;
}

function createHabitName(text: string): string | null {
  const name = text
    .replace(/^(?:por favor|pfv|favor)[, ]+/i, "")
    .replace(/^(?:crie|cria|criar|adicione|adiciona|adicionar|novo|nova)\s+/i, "")
    .replace(/^(?:o\s+|um\s+|uma\s+)?(?:habito|hábito)\s+/i, "")
    .replace(/(?<!\p{L})(?:de\s+)?(?:manh[ãa]|tarde|noite)(?!\p{L})/giu, "")
    .replace(/(?<!\p{L})(?:todos?\s+os\s+dias|diario|di[aá]rio)(?!\p{L})/giu, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, "")
    .trim();
  return name.length >= 2 ? name.slice(0, 120) : null;
}

function localHabitQuery(text: string, habits: ExistingHabitRef[]): HabitCommandResponse | null {
  const normalized = normalize(text);
  const wantsQuery =
    /\b(o que|oque|quais|lista|listar|mostra|mostrar|falt\w*|pendente\w*|streak|sequencia)\b/.test(
      normalized
    ) && /\b(habito\w*|hábito\w*|check[- ]?in)\b/.test(normalized);
  if (!wantsQuery) return null;

  const pending = habits.filter((h) => !h.checkedInToday);
  if (pending.length === 0) {
    return { ...emptyHabitCommand(), answer: "Todos os hábitos de hoje já estão concluídos." };
  }

  const lines = pending
    .map((h) => {
      const streak = h.currentStreak && h.currentStreak > 0 ? ` · streak ${h.currentStreak}d` : "";
      return `• ${h.name}${streak}`;
    })
    .join("\n");
  return {
    ...emptyHabitCommand(),
    answer: `${pending.length} hábito${pending.length === 1 ? "" : "s"} pendente${pending.length === 1 ? "" : "s"} hoje:\n${lines}`,
  };
}

function localHabitCheckin(text: string, habits: ExistingHabitRef[]): HabitCommandResponse | null {
  const normalized = normalize(text);
  const wantsClear = /\b(desmarc\w*|desmarqu\w*|desfaz\w*|limpa\w*|remove\w*\s+check)\b/.test(normalized);
  const wantsCheckin =
    /\b(check[- ]?in|marque|marcar|marcando|conclu\w*|finaliz\w*|complet\w*|fiz|feito)\b/.test(normalized) ||
    /\b(bebi|meditei|treinei|corri|li)\b/.test(normalized);
  if (!wantsCheckin && !wantsClear) return null;

  const habit = uniqueHabitByName(text, habits);
  if (!habit) {
    if (/\b(todos?|tudo)\b/.test(normalized) && wantsCheckin && !wantsClear) {
      const pending = habits.filter((h) => !h.checkedInToday);
      if (pending.length === 0) return null;
      return { ...emptyHabitCommand(), checkinIds: pending.map((h) => h.id) };
    }
    return null;
  }

  if (wantsClear) return { ...emptyHabitCommand(), clearCheckinIds: [habit.id] };
  return { ...emptyHabitCommand(), checkinIds: [habit.id] };
}

function localHabitDelete(text: string, habits: ExistingHabitRef[]): HabitCommandResponse | null {
  const normalized = normalize(text);
  const wantsDelete = /\b(exclu\w*|apag\w*|remov\w*|delet\w*|delete\w*)\b/.test(normalized);
  if (!wantsDelete) return null;
  const habit = uniqueHabitByName(text, habits);
  if (!habit) return null;
  return { ...emptyHabitCommand(), deleteIds: [habit.id] };
}

/**
 * Interpreta pedidos óbvios de hábitos sem o Gemini.
 * `null` quando a frase não é segura de resolver localmente.
 */
export function localHabitCommand(text: string, habits: ExistingHabitRef[]): HabitCommandResponse | null {
  const query = localHabitQuery(text, habits);
  if (query) return query;

  const checkin = localHabitCheckin(text, habits);
  if (checkin) return checkin;

  const deleting = localHabitDelete(text, habits);
  if (deleting) return deleting;

  const normalized = normalize(text);
  const wantsCreate =
    /\b(cri\w*|adicion\w*|nov[ao])\b/.test(normalized) && /\b(habito|hábito)\b/.test(normalized);
  if (!wantsCreate) return null;

  const name = createHabitName(text);
  if (!name) return null;

  const iconHint = HABIT_ICON_PRESETS.find((icon) => text.includes(icon));
  const colorHint = HABIT_COLOR_PRESETS.find((color) => normalized.includes(normalize(color)));
  const period = mentionedPeriod(text);

  return {
    ...emptyHabitCommand(),
    create: [
      {
        name,
        icon: iconHint,
        color: colorHint,
        period,
        type: "boolean",
        frequencyType: "daily",
      },
    ],
  };
}
