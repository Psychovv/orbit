import { addDays, addWeeks, addMonths, formatDateKey, parseDateKey } from "@/shared/lib/date-utils";

export type RecurrencePattern = "daily" | "weekly" | "monthly";

export interface Recurrence {
  pattern: RecurrencePattern;
  count: number;
}

export function generateRecurrentTasks<T extends { date: string }>(base: T, recurrence?: Recurrence): T[] {
  if (!recurrence || recurrence.count <= 1) return [base];

  const result: T[] = [base];
  let currentDate = parseDateKey(base.date);

  for (let i = 1; i < recurrence.count; i++) {
    if (recurrence.pattern === "daily") {
      currentDate = addDays(currentDate, 1);
    } else if (recurrence.pattern === "weekly") {
      currentDate = addWeeks(currentDate, 1);
    } else if (recurrence.pattern === "monthly") {
      currentDate = addMonths(currentDate, 1);
    }
    result.push({ ...base, date: formatDateKey(currentDate) });
  }

  return result;
}
