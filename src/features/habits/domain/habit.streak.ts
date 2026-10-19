import {
  addDays,
  formatDateKey,
  getStartOfWeek,
  parseDateKey,
  todayKey,
} from "@/shared/lib/date-utils";
import type { Habit, HabitCheckin } from "./habit.schema";

export type HabitStreakStatus = "active" | "at_risk" | "broken";

export interface HabitStreakStats {
  current: number;
  best: number;
  status: HabitStreakStatus;
}

/** Dia local em que o hábito passou a existir (não agenda antes disso). */
export function habitStartDate(habit: Habit): string {
  return formatDateKey(new Date(habit.createdAt));
}

/** O hábito está agendado neste dia do calendário? */
export function isHabitScheduledOn(habit: Habit, dateKey: string): boolean {
  if (habit.archivedAt) return false;
  // Não aparece em dias anteriores à criação.
  if (dateKey < habitStartDate(habit)) return false;

  switch (habit.frequencyType) {
    case "daily":
      return true;
    case "specific_days": {
      const day = parseDateKey(dateKey).getDay();
      return (habit.frequencyDays ?? []).includes(day);
    }
    case "weekly_target":
      // Visível todos os dias; a meta é semanal.
      return true;
    default:
      return false;
  }
}

/** Check-in conta como conclusão do hábito naquele dia. */
export function isCheckinComplete(habit: Habit, checkin: HabitCheckin | undefined): boolean {
  if (!checkin) return false;
  if (habit.type === "numeric") {
    const target = habit.targetValue ?? 0;
    const value = checkin.currentValue ?? 0;
    return checkin.completed || (target > 0 && value >= target);
  }
  return checkin.completed;
}

export function findCheckin(
  checkins: HabitCheckin[],
  habitId: string,
  dateKey: string
): HabitCheckin | undefined {
  return checkins.find((c) => c.habitId === habitId && c.date === dateKey);
}

function wasCompletedOn(
  habit: Habit,
  checkins: HabitCheckin[],
  dateKey: string
): boolean {
  return isCheckinComplete(habit, findCheckin(checkins, habit.id, dateKey));
}

/** Dias agendados de `from` até `to` (inclusive), do mais antigo ao mais recente. */
export function scheduledDatesInRange(habit: Habit, from: string, to: string): string[] {
  const dates: string[] = [];
  let cursor = parseDateKey(from);
  const end = parseDateKey(to);
  while (cursor.getTime() <= end.getTime()) {
    const key = formatDateKey(cursor);
    if (isHabitScheduledOn(habit, key)) dates.push(key);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

/**
 * Streak diário com tolerância *Never Miss Twice*:
 * um dia falho isolado (vizinhos concluídos) não zera o streak — marca `at_risk`.
 * Dois dias falhos seguidos (agendados) quebram o streak.
 */
export function computeHabitStreak(
  habit: Habit,
  checkins: HabitCheckin[],
  asOf = todayKey()
): HabitStreakStats {
  if (habit.frequencyType === "weekly_target") {
    return computeWeeklyTargetStreak(habit, checkins, asOf);
  }

  const lookbackDays = 365;
  const from = formatDateKey(addDays(parseDateKey(asOf), -(lookbackDays - 1)));
  const scheduled = scheduledDatesInRange(habit, from, asOf);
  if (scheduled.length === 0) {
    return { current: 0, best: 0, status: "broken" };
  }

  const completedFlags = scheduled.map((date) => wasCompletedOn(habit, checkins, date));

  const best = computeBestDailyStreak(completedFlags);
  const { current, status } = computeCurrentDailyStreak(completedFlags, scheduled, asOf);

  return { current, best, status };
}

function computeBestDailyStreak(completed: boolean[]): number {
  let best = 0;
  let run = 0;
  let forgivenessUsed = false;

  for (const ok of completed) {
    if (ok) {
      run += 1;
      if (run > best) best = run;
      continue;
    }
    if (!forgivenessUsed && run > 0) {
      forgivenessUsed = true;
      continue;
    }
    run = 0;
    forgivenessUsed = false;
  }

  return best;
}

function computeCurrentDailyStreak(
  completed: boolean[],
  scheduled: string[],
  asOf: string
): { current: number; status: HabitStreakStatus } {
  let i = completed.length - 1;
  let status: HabitStreakStatus = "active";
  let forgivenessUsed = false;
  let streak = 0;

  // Hoje ainda aberto não quebra o streak de ontem.
  if (scheduled[i] === asOf && !completed[i]) {
    status = "at_risk";
    i -= 1;
  }

  for (; i >= 0; i -= 1) {
    if (completed[i]) {
      streak += 1;
      continue;
    }

    // Never Miss Twice: um miss isolado (com dia anterior concluído) é perdoado.
    const prevCompleted = i - 1 >= 0 && completed[i - 1];
    const nextCompleted = i + 1 < completed.length && completed[i + 1];
    const canForgive =
      !forgivenessUsed &&
      ((prevCompleted && nextCompleted) || (prevCompleted && scheduled[i + 1] === asOf));

    if (canForgive) {
      forgivenessUsed = true;
      status = "at_risk";
      continue;
    }

    break;
  }

  if (streak === 0 && status !== "at_risk") status = "broken";
  return { current: streak, status };
}

/** Streak de metas semanais: semanas (Seg–Dom) com ≥ weeklyTargetCount check-ins. */
function computeWeeklyTargetStreak(
  habit: Habit,
  checkins: HabitCheckin[],
  asOf: string
): HabitStreakStats {
  const target = habit.weeklyTargetCount ?? 1;
  const asOfDate = parseDateKey(asOf);
  const weeks: boolean[] = [];

  for (let w = 51; w >= 0; w -= 1) {
    const weekStart = getStartOfWeek(addDays(asOfDate, -w * 7));
    const weekEnd = addDays(weekStart, 6);
    const from = formatDateKey(weekStart);
    const to = formatDateKey(weekEnd);
    if (to > asOf) {
      // Semana atual ainda aberta: conta só até asOf.
      const count = countCompletionsInRange(habit, checkins, from, asOf);
      weeks.push(count >= target);
    } else {
      const count = countCompletionsInRange(habit, checkins, from, to);
      weeks.push(count >= target);
    }
  }

  let best = 0;
  let run = 0;
  for (const ok of weeks) {
    if (ok) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }

  let current = 0;
  let status: HabitStreakStatus = "active";
  let i = weeks.length - 1;

  if (!weeks[i]) {
    status = "at_risk";
    i -= 1;
  }

  for (; i >= 0; i -= 1) {
    if (!weeks[i]) break;
    current += 1;
  }

  if (current === 0 && status !== "at_risk") status = "broken";
  return { current, best, status };
}

function countCompletionsInRange(
  habit: Habit,
  checkins: HabitCheckin[],
  from: string,
  to: string
): number {
  return checkins.filter(
    (c) =>
      c.habitId === habit.id &&
      c.date >= from &&
      c.date <= to &&
      isCheckinComplete(habit, c)
  ).length;
}

/** Maior streak atual entre hábitos ativos. */
export function maxActiveStreak(
  habits: Habit[],
  checkins: HabitCheckin[],
  asOf = todayKey()
): number {
  let max = 0;
  for (const habit of habits) {
    if (habit.archivedAt) continue;
    const { current } = computeHabitStreak(habit, checkins, asOf);
    if (current > max) max = current;
  }
  return max;
}

export function habitsScheduledOn(habits: Habit[], dateKey: string): Habit[] {
  return habits.filter((h) => !h.archivedAt && isHabitScheduledOn(h, dateKey));
}

export function countCompletedHabitsOn(
  habits: Habit[],
  checkins: HabitCheckin[],
  dateKey: string
): { total: number; completed: number } {
  const scheduled = habitsScheduledOn(habits, dateKey);
  const completed = scheduled.filter((h) =>
    isCheckinComplete(h, findCheckin(checkins, h.id, dateKey))
  ).length;
  return { total: scheduled.length, completed };
}
