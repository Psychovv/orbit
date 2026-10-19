import type { Habit, HabitCheckin } from "../domain/habit.schema";
import { addDays, formatDateKey, parseDateKey, todayKey } from "@/shared/lib/date-utils";

const now = "2026-10-01T12:00:00.000Z";

export const DEMO_HABITS: Habit[] = [
  {
    id: "habit-water",
    name: "Beber 2L de água",
    description: "Manter hidratação ao longo do dia",
    icon: "💧",
    color: "#3b82f6",
    period: "anytime",
    type: "numeric",
    targetValue: 2000,
    unit: "ml",
    step: 250,
    frequencyType: "daily",
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "habit-read",
    name: "Ler 20 min",
    description: "Leitura focada, sem celular",
    icon: "📖",
    color: "#8b5cf6",
    period: "evening",
    type: "numeric",
    targetValue: 20,
    unit: "min",
    step: 5,
    frequencyType: "daily",
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "habit-strength",
    name: "Treino de força",
    description: "Musculação ou calistenia",
    icon: "🏋️",
    color: "#ef4444",
    period: "morning",
    type: "boolean",
    frequencyType: "specific_days",
    frequencyDays: [1, 3, 5],
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "habit-meditate",
    name: "Meditação",
    description: "Respiração e presença",
    icon: "🧘",
    color: "#10b981",
    period: "morning",
    type: "boolean",
    frequencyType: "daily",
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "habit-walk",
    name: "Caminhada",
    description: "Pelo menos 3x na semana",
    icon: "🏃",
    color: "#f59e0b",
    period: "afternoon",
    type: "boolean",
    frequencyType: "weekly_target",
    weeklyTargetCount: 3,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  },
];

/** Gera check-ins de demonstração nos últimos dias a partir de hoje. */
export function buildDemoCheckins(asOf = todayKey()): HabitCheckin[] {
  const checkins: HabitCheckin[] = [];
  const end = asOf;

  for (let i = 0; i < 14; i += 1) {
    const date = formatDateKey(addDays(parseDateKey(end), -i));
    const day = parseDateKey(date).getDay();

    // Água — quase todos os dias
    if (i !== 3) {
      checkins.push({
        id: `demo-water-${date}`,
        habitId: "habit-water",
        date,
        completed: true,
        currentValue: i % 4 === 0 ? 1750 : 2000,
        createdAt: `${date}T09:00:00.000Z`,
      });
    }

    // Leitura — maioria dos dias
    if (i % 5 !== 2) {
      checkins.push({
        id: `demo-read-${date}`,
        habitId: "habit-read",
        date,
        completed: true,
        currentValue: 20,
        createdAt: `${date}T21:00:00.000Z`,
      });
    }

    // Treino — Seg/Qua/Sex
    if ([1, 3, 5].includes(day) && i < 12) {
      checkins.push({
        id: `demo-strength-${date}`,
        habitId: "habit-strength",
        date,
        completed: true,
        createdAt: `${date}T07:30:00.000Z`,
      });
    }

    // Meditação — streak recente
    if (i < 8 && i !== 1) {
      checkins.push({
        id: `demo-meditate-${date}`,
        habitId: "habit-meditate",
        date,
        completed: true,
        createdAt: `${date}T07:00:00.000Z`,
      });
    }

    // Caminhada — alguns dias
    if (i % 3 === 0) {
      checkins.push({
        id: `demo-walk-${date}`,
        habitId: "habit-walk",
        date,
        completed: true,
        createdAt: `${date}T17:00:00.000Z`,
      });
    }
  }

  return checkins;
}

/** Snapshot estático para testes; em produção o seed chama `buildDemoCheckins()`. */
export const DEMO_HABIT_CHECKINS: HabitCheckin[] = buildDemoCheckins("2026-10-19");
