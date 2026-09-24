import type { Task } from "./task.schema";

type FocusFields = Pick<Task, "focusSeconds" | "focusStartedAt">;

/** Segundos já pausados mais o trecho da sessão aberta, se houver. */
export function focusElapsedSeconds(task: FocusFields, now = Date.now()): number {
  if (!task.focusStartedAt) return task.focusSeconds;
  const started = Date.parse(task.focusStartedAt);
  if (Number.isNaN(started)) return task.focusSeconds;
  return task.focusSeconds + Math.max(0, Math.floor((now - started) / 1000));
}

/** Fecha a sessão aberta e devolve o total a gravar. */
export function pausedFocusPatch(task: FocusFields, now = Date.now()) {
  return { focusSeconds: focusElapsedSeconds(task, now), focusStartedAt: null };
}

/** A sessão mais recente, quando mais de uma ficou aberta. */
export function activeFocusTask(tasks: readonly Task[]): Task | null {
  let active: Task | null = null;
  let activeAt = Number.NEGATIVE_INFINITY;
  for (const task of tasks) {
    if (!task.focusStartedAt) continue;
    const started = Date.parse(task.focusStartedAt);
    if (Number.isNaN(started) || started < activeAt) continue;
    active = task;
    activeAt = started;
  }
  return active;
}

/** Rótulo curto: `45s`, `32 min`, `1h 04min`. */
export function formatFocusDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (rem === 0) return `${hours}h`;
  return `${hours}h ${String(rem).padStart(2, "0")}min`;
}

/** Relógio grande: `mm:ss` até uma hora, depois `h:mm:ss`. */
export function formatFocusClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}
