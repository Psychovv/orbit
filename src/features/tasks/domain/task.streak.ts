import { addDays, formatDateKey, parseDateKey, todayKey } from "@/shared/lib/date-utils";
import type { Task } from "./task.schema";
import { countCompleted, groupByDate } from "./task.selectors";

export interface DayCompletion {
  date: string;
  total: number;
  completed: number;
  /** 0–100; `null` when the day has no tasks scheduled. */
  percent: number | null;
  /** Day with tasks and all of them completed. */
  perfect: boolean;
}

export interface TaskStreakStats {
  days: DayCompletion[];
  currentStreak: number;
  bestStreak: number;
  /** Overall completion across days that had at least one task. */
  completionPercent: number;
  perfectDays: number;
  activeDays: number;
}

/** Inclusive range of the last `dayCount` calendar days ending on `endDate` (default: today). */
export function streakRange(dayCount = 28, endDate = todayKey()): { from: string; to: string } {
  const end = parseDateKey(endDate);
  return {
    from: formatDateKey(addDays(end, -(dayCount - 1))),
    to: endDate,
  };
}

export function computeDayCompletions(
  tasks: Task[],
  from: string,
  to: string
): DayCompletion[] {
  const byDate = groupByDate(tasks);
  const days: DayCompletion[] = [];
  let cursor = parseDateKey(from);
  const end = parseDateKey(to);

  while (cursor.getTime() <= end.getTime()) {
    const date = formatDateKey(cursor);
    const dayTasks = byDate.get(date) ?? [];
    const total = dayTasks.length;
    const completed = countCompleted(dayTasks);
    const percent = total > 0 ? Math.round((completed / total) * 100) : null;
    days.push({
      date,
      total,
      completed,
      percent,
      perfect: total > 0 && completed === total,
    });
    cursor = addDays(cursor, 1);
  }

  return days;
}

/** Consecutive perfect days ending on `asOf` (or the day before if today is still open). */
export function computeCurrentStreak(days: DayCompletion[], asOf = todayKey()): number {
  const index = days.findIndex((d) => d.date === asOf);
  if (index < 0) return 0;

  let streak = 0;
  let i = index;

  // Today with incomplete tasks does not break yesterday's streak yet.
  if (days[i].total > 0 && !days[i].perfect) {
    i -= 1;
  }

  for (; i >= 0; i -= 1) {
    const day = days[i];
    if (day.total === 0) continue; // empty days are skipped
    if (!day.perfect) break;
    streak += 1;
  }

  return streak;
}

export function computeBestStreak(days: DayCompletion[]): number {
  let best = 0;
  let run = 0;

  for (const day of days) {
    if (day.total === 0) continue;
    if (day.perfect) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }

  return best;
}

export function computeTaskStreakStats(
  tasks: Task[],
  dayCount = 28,
  asOf = todayKey()
): TaskStreakStats {
  const { from, to } = streakRange(dayCount, asOf);
  const days = computeDayCompletions(tasks, from, to);
  const active = days.filter((d) => d.total > 0);
  const totalTasks = active.reduce((sum, d) => sum + d.total, 0);
  const completedTasks = active.reduce((sum, d) => sum + d.completed, 0);

  return {
    days,
    currentStreak: computeCurrentStreak(days, asOf),
    bestStreak: computeBestStreak(days),
    completionPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    perfectDays: active.filter((d) => d.perfect).length,
    activeDays: active.length,
  };
}
