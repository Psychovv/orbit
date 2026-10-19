import "server-only";
import { db } from "../index";
import {
  financeCategories,
  habitCheckins,
  habits,
  profiles,
  taskCategories,
  tasks,
  transactions,
} from "../schema";
import { nowIso } from "@/shared/lib/id";
import type { OrbitBackup } from "@/features/settings/domain/backup";

/** Substitui todos os dados do banco pelo conteúdo do backup (transação única). */
export async function replaceAllFromBackup(backup: OrbitBackup): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(habitCheckins);
    await tx.delete(habits);
    await tx.delete(tasks);
    await tx.delete(taskCategories);
    await tx.delete(transactions);
    await tx.delete(financeCategories);
    await tx.delete(profiles);

    if (backup.taskCategories.length) {
      await tx.insert(taskCategories).values(backup.taskCategories);
    }

    if (backup.tasks.length) {
      await tx.insert(tasks).values(
        backup.tasks.map((t) => ({
          ...t,
          description: t.description ?? null,
          time: t.time ?? null,
        }))
      );
    }

    if (backup.financeCategories.length) {
      await tx.insert(financeCategories).values(
        backup.financeCategories.map((c) => ({
          ...c,
          monthlyBudgetCents: c.monthlyBudgetCents ?? null,
        }))
      );
    }

    if (backup.transactions.length) {
      await tx.insert(transactions).values(
        backup.transactions.map((t) => ({
          ...t,
          notes: t.notes ?? null,
        }))
      );
    }

    if (backup.habits.length) {
      await tx.insert(habits).values(
        backup.habits.map((h) => ({
          id: h.id,
          name: h.name,
          description: h.description ?? null,
          icon: h.icon,
          color: h.color,
          period: h.period,
          type: h.type,
          targetValue: h.targetValue ?? null,
          unit: h.unit ?? null,
          step: h.step ?? null,
          frequencyType: h.frequencyType,
          frequencyDays: h.frequencyDays ? JSON.stringify(h.frequencyDays) : null,
          weeklyTargetCount: h.weeklyTargetCount ?? null,
          archivedAt: h.archivedAt,
          createdAt: h.createdAt,
          updatedAt: h.updatedAt,
        }))
      );
    }

    if (backup.habitCheckins.length) {
      await tx.insert(habitCheckins).values(
        backup.habitCheckins.map((c) => ({
          id: c.id,
          habitId: c.habitId,
          date: c.date,
          completed: c.completed,
          currentValue: c.currentValue ?? null,
          notes: c.notes ?? null,
          createdAt: c.createdAt,
        }))
      );
    }

    await tx.insert(profiles).values({
      id: backup.profile.id || "owner",
      name: backup.profile.name,
      photo: backup.profile.photo,
      bio: backup.profile.bio,
      updatedAt: nowIso(),
    });
  });
}
