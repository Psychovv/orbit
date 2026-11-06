import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "../index";
import {
  financeCategories,
  habitCheckins,
  habits,
  profiles,
  sessionVersions,
  taskCategories,
  tasks,
  transactions,
  users,
} from "../schema";

/**
 * Exclui a conta e todos os dados do usuário (transação única).
 * A versão de sessão sobe em vez de sumir: sessões antigas desse id continuam inválidas.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(habitCheckins).where(eq(habitCheckins.userId, userId));
    await tx.delete(habits).where(eq(habits.userId, userId));
    await tx.delete(tasks).where(eq(tasks.userId, userId));
    await tx.delete(taskCategories).where(eq(taskCategories.userId, userId));
    await tx.delete(transactions).where(eq(transactions.userId, userId));
    await tx.delete(financeCategories).where(eq(financeCategories.userId, userId));
    await tx.delete(profiles).where(eq(profiles.id, userId));
    await tx.delete(users).where(eq(users.id, userId));
    await tx
      .insert(sessionVersions)
      .values({ userId, version: 1 })
      .onConflictDoUpdate({ target: sessionVersions.userId, set: { version: sql`${sessionVersions.version} + 1` } });
  });
}
