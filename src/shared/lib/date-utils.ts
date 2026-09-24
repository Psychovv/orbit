export type DayOfWeek = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

export interface CalendarDayInfo {
  date: string; // YYYY-MM-DD
  dateObj: Date;
  dayOfWeek: DayOfWeek;
  dayNumber: number;
  dayName: string;
  shortName: string;
  monthName: string;
  isToday: boolean;
}

export interface MonthGridDay {
  date: string; // YYYY-MM-DD
  dateObj: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const MONTH_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const DAY_NAMES = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado"
];

const DAY_KEYS: DayOfWeek[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseDateKey(value).getTime());
}

export function getDayOfWeek(dateKey: string): DayOfWeek {
  return DAY_KEYS[parseDateKey(dateKey).getDay()];
}

export function todayKey(): string {
  return formatDateKey(new Date());
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// Get the Monday of the week containing `date`
export function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay(); // 0 is Sunday, 1 is Monday
  // In Monday-first calendar: if day is 0 (Sunday), diff is -6; else 1 - day
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

// Get the 7 days of the week starting from Monday
export function getWeekDays(baseDate: Date): CalendarDayInfo[] {
  const monday = getStartOfWeek(baseDate);
  const today = new Date();
  const days: CalendarDayInfo[] = [];

  const shortDayNames = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

  for (let i = 0; i < 7; i++) {
    const current = addDays(monday, i);
    const dayIndex = current.getDay(); // 0: Sun, 1: Mon, ...
    const key = DAY_KEYS[dayIndex];
    const isToday = isSameDay(current, today);

    days.push({
      date: formatDateKey(current),
      dateObj: current,
      dayOfWeek: key,
      dayNumber: current.getDate(),
      dayName: DAY_NAMES[dayIndex],
      shortName: shortDayNames[i],
      monthName: MONTH_SHORT[current.getMonth()],
      isToday,
    });
  }

  return days;
}

// Generate the 35 or 42 grid cells for the monthly calendar view
export function getMonthGrid(year: number, month: number): MonthGridDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const today = new Date();
  
  // Find Monday of the first week
  const startDay = getStartOfWeek(firstDayOfMonth);
  const grid: MonthGridDay[] = [];

  // Always 42 days (6 weeks) to maintain stable layout
  for (let i = 0; i < 42; i++) {
    const current = addDays(startDay, i);
    grid.push({
      date: formatDateKey(current),
      dateObj: current,
      dayNumber: current.getDate(),
      isCurrentMonth: current.getMonth() === month,
      isToday: isSameDay(current, today),
    });
  }

  return grid;
}

export function formatWeekRange(baseDate: Date): string {
  const monday = getStartOfWeek(baseDate);
  const sunday = addDays(monday, 6);

  const startDay = monday.getDate();
  const endDay = sunday.getDate();
  const startMonth = MONTH_SHORT[monday.getMonth()];
  const endMonth = MONTH_SHORT[sunday.getMonth()];
  const year = sunday.getFullYear();

  if (monday.getMonth() === sunday.getMonth()) {
    return `${startDay} a ${endDay} de ${MONTH_NAMES[monday.getMonth()]} de ${year}`;
  }

  return `${startDay} de ${startMonth} a ${endDay} de ${endMonth} de ${year}`;
}

export function formatMonthYear(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} de ${date.getFullYear()}`;
}

export function getYearMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function parseYearMonthKey(key: string): Date {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

export function isSameMonth(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

export function isYearMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function formatShortDate(dateKey: string): string {
  const [, month, day] = dateKey.split("-");
  return `${day} ${MONTH_SHORT[Number(month) - 1]}`;
}

export function formatLongDate(dateKey: string): { dayName: string; date: string } {
  const d = parseDateKey(dateKey);
  return {
    dayName: DAY_NAMES[d.getDay()],
    date: `${d.getDate()} de ${MONTH_NAMES[d.getMonth()]} de ${d.getFullYear()}`,
  };
}

export interface DateRange {
  from: string;
  to: string;
}

export function weekRange(baseDate: Date): DateRange {
  const monday = getStartOfWeek(baseDate);
  return { from: formatDateKey(monday), to: formatDateKey(addDays(monday, 6)) };
}

export function monthGridRange(baseDate: Date): DateRange {
  const start = getStartOfWeek(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
  return { from: formatDateKey(start), to: formatDateKey(addDays(start, 41)) };
}

export function monthRange(monthKey: string): DateRange {
  const first = parseYearMonthKey(monthKey);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  return { from: formatDateKey(first), to: formatDateKey(last) };
}

export function isInRange(dateKey: string, range: DateRange): boolean {
  return dateKey >= range.from && dateKey <= range.to;
}
