import { formatBRL } from "@/features/finance/domain/money";
import type { BudgetUsage } from "@/features/finance/domain/metrics";

export type HomeAlertTone = "warning" | "danger" | "info";

export interface HomeAlert {
  id: string;
  tone: HomeAlertTone;
  message: string;
  href: string;
}

export interface HabitsAlertInput {
  total: number;
  completed: number;
  atRiskCount: number;
  bestActiveStreak: number;
}

export interface TasksAlertInput {
  /** Pendentes com data de hoje. */
  pendingToday: number;
  /** Pendentes com data anterior a hoje. */
  overdue: number;
}

/** Monta alertas curtos do hub a partir de orçamento, tarefas e hábitos do dia. */
export function buildHomeAlerts(input: {
  budgetItems?: BudgetUsage[];
  habits?: HabitsAlertInput | null;
  tasks?: TasksAlertInput | null;
}): HomeAlert[] {
  const alerts: HomeAlert[] = [];

  const tasks = input.tasks;
  if (tasks) {
    if (tasks.overdue > 0) {
      alerts.push({
        id: "tasks-overdue",
        tone: "danger",
        message:
          tasks.overdue === 1
            ? "1 tarefa atrasada — vale remarcar ou concluir."
            : `${tasks.overdue} tarefas atrasadas — vale remarcar ou concluir.`,
        href: "/tasks",
      });
    } else if (tasks.pendingToday > 0) {
      alerts.push({
        id: "tasks-today",
        tone: "info",
        message:
          tasks.pendingToday === 1
            ? "1 tarefa pendente hoje."
            : `${tasks.pendingToday} tarefas pendentes hoje.`,
        href: "/tasks",
      });
    }
  }

  for (const item of input.budgetItems ?? []) {
    if (item.isOver) {
      alerts.push({
        id: `budget-over-${item.category.id}`,
        tone: "danger",
        message: `${item.category.name} estourou o teto (${formatBRL(item.spentCents)} de ${formatBRL(item.budgetCents)}).`,
        href: "/finance",
      });
    } else if (item.isWarning) {
      alerts.push({
        id: `budget-warn-${item.category.id}`,
        tone: "warning",
        message: `${item.category.name} já usou ${Math.round(item.ratio)}% do teto do mês.`,
        href: "/finance",
      });
    }
  }

  const habits = input.habits;
  if (habits && habits.total > 0 && habits.completed < habits.total) {
    const pending = habits.total - habits.completed;
    if (habits.atRiskCount > 0) {
      alerts.push({
        id: "habits-at-risk",
        tone: "warning",
        message:
          habits.atRiskCount === 1
            ? `1 hábito com streak em risco — ainda falta check-in hoje.`
            : `${habits.atRiskCount} hábitos com streak em risco — ainda falta check-in hoje.`,
        href: "/habits",
      });
    } else if (habits.bestActiveStreak >= 3) {
      alerts.push({
        id: "habits-pending",
        tone: "info",
        message: `${pending} hábito${pending === 1 ? "" : "s"} pendente${pending === 1 ? "" : "s"} hoje · streak ${habits.bestActiveStreak}d.`,
        href: "/habits",
      });
    }
  }

  return alerts;
}
