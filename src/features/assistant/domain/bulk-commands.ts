import type { ExistingTaskRef } from "./actions";

export function addCalendarDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function dayTarget(normalized: string, today: string): string | null {
  if (/\banteontem\b/.test(normalized)) return addCalendarDays(today, -2);
  if (/\bontem\b/.test(normalized)) return addCalendarDays(today, -1);
  if (/\bamanha\b/.test(normalized)) return addCalendarDays(today, 1);
  if (/\bhoje\b/.test(normalized)) return today;
  const match = normalized.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  return match ? match[1] : null;
}

/**
 * Detecta pedidos como "conclua todas as tarefas de hoje" / "apague tudo de ontem"
 * e retorna os IDs afetados. `null` quando o texto não é um pedido em lote.
 */
export function bulkTaskIds(
  text: string,
  today: string,
  tasks: ExistingTaskRef[],
  action: "complete" | "delete"
): string[] | null {
  const normalized = normalize(text);
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
    .map((task) => task.id);
}

/** A partir daqui o Flash-Lite barato erra mais data e ID do que o 3.5. */
const STRONGER_MODEL_TASK_COUNT = 40;

function hasRelativeDate(normalized: string): boolean {
  return (
    /\b(hoje|ontem|amanha|anteontem)\b/.test(normalized) ||
    /\b(segunda|terca|quarta|quinta|sexta|sabado|domingo)\b/.test(normalized) ||
    /\b(semana|mes)\b/.test(normalized) ||
    /\bdia\s+\d{1,2}\b/.test(normalized)
  );
}

/**
 * Pedidos com data relativa e lista longa vão para o modelo mais capaz.
 * Lote ("apague tudo de hoje") continua no modelo barato: o servidor resolve os IDs.
 */
export function prefersStrongerTaskModel(text: string, taskCount: number): boolean {
  if (taskCount < STRONGER_MODEL_TASK_COUNT) return false;
  if (!hasRelativeDate(normalize(text))) return false;
  return bulkTaskIds(text, "2026-01-01", [], "delete") === null && bulkTaskIds(text, "2026-01-01", [], "complete") === null;
}
