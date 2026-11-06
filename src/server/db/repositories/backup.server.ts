import "server-only";
import { db } from "../index";
import {
  financeCategories,
  habitCheckins,
  habits,
  OWNER_USER_ID,
  profiles,
  taskCategories,
  tasks,
  transactions,
} from "../schema";
import { eq } from "drizzle-orm";
import { nowIso } from "@/shared/lib/id";
import type { OrbitBackup } from "@/features/settings/domain/backup";

/** Substitui todos os dados do usuário pelo conteúdo do backup (transação única). */
export async function replaceAllFromBackup(userId: string, backup: OrbitBackup): Promise<void> {
  // Campos de importação bancária são só do dono (ver finance.server).
  const isOwner = userId === OWNER_USER_ID;

  await db.transaction(async (tx) => {
    await tx.delete(habitCheckins).where(eq(habitCheckins.userId, userId));
    await tx.delete(habits).where(eq(habits.userId, userId));
    await tx.delete(tasks).where(eq(tasks.userId, userId));
    await tx.delete(taskCategories).where(eq(taskCategories.userId, userId));
    await tx.delete(transactions).where(eq(transactions.userId, userId));
    await tx.delete(financeCategories).where(eq(financeCategories.userId, userId));
    await tx.delete(profiles).where(eq(profiles.id, userId));

    if (backup.taskCategories.length) {
      await tx.insert(taskCategories).values(backup.taskCategories.map((c) => ({ ...c, userId })));
    }

    if (backup.tasks.length) {
      await tx.insert(tasks).values(
        backup.tasks.map((t) => ({
          ...t,
          userId,
          description: t.description ?? null,
          time: t.time ?? null,
        }))
      );
    }

    if (backup.financeCategories.length) {
      await tx.insert(financeCategories).values(
        backup.financeCategories.map((c) => ({
          ...c,
          userId,
          monthlyBudgetCents: c.monthlyBudgetCents ?? null,
        }))
      );
    }

    if (backup.transactions.length) {
      await tx.insert(transactions).values(
        backup.transactions.map((t) => ({
          ...t,
          userId,
          notes: t.notes ?? null,
          ...(isOwner ? {} : { externalId: null, institution: null, pending: false }),
        }))
      );
    }

    if (backup.habits.length) {
      await tx.insert(habits).values(
        backup.habits.map((h) => ({
          id: h.id,
          userId,
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
          userId,
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
      id: userId,
      name: backup.profile.name,
      photo: backup.profile.photo,
      bio: backup.profile.bio,
      updatedAt: nowIso(),
    });
  });
}
