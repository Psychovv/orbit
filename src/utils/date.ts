import { Weekday, StreakInfo } from '../types';

export const WEEKDAYS: Weekday[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  domingo: 'Domingo',
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado'
};

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  domingo: 'Dom',
  segunda: 'Seg',
  terca: 'Ter',
  quarta: 'Qua',
  quinta: 'Qui',
  sexta: 'Sex',
  sabado: 'Sáb'
};

export function getTodayWeekday(): Weekday {
  const dayIndex = new Date().getDay();
  return WEEKDAYS[dayIndex];
}

export function getTomorrowWeekday(weekday: Weekday): Weekday {
  const idx = WEEKDAYS.indexOf(weekday);
  return WEEKDAYS[(idx + 1) % 7];
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Amanhã';
  if (diffDays === -1) return 'Ontem';
  if (diffDays > 1 && diffDays <= 7) return `Em ${diffDays} dias`;
  if (diffDays < -1) return `${Math.abs(diffDays)} dias atrasada`;

  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

export function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return target.getTime() < today.getTime();
}

export function isDueSoon(dateStr?: string, daysLimit = 7): boolean {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= daysLimit;
}

export function updateStreakOnTaskDone(
  currentStreak?: StreakInfo,
  todayStr: string = getTodayString()
): StreakInfo {
  if (!currentStreak) {
    return {
      current: 1,
      longest: 1,
      lastCompletedDate: todayStr
    };
  }

  if (currentStreak.lastCompletedDate === todayStr) {
    // Already counted today
    return currentStreak;
  }

  const [ly, lm, ld] = currentStreak.lastCompletedDate.split('-').map(Number);
  const lastDate = new Date(ly, lm - 1, ld);
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const todayDate = new Date(ty, tm - 1, td);

  const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    const nextCurrent = currentStreak.current + 1;
    return {
      current: nextCurrent,
      longest: Math.max(currentStreak.longest, nextCurrent),
      lastCompletedDate: todayStr
    };
  } else {
    // Broken streak, restart at 1
    return {
      current: 1,
      longest: currentStreak.longest,
      lastCompletedDate: todayStr
    };
  }
}
