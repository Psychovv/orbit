import "server-only";
import { count, eq, sql } from "drizzle-orm";
import { db } from "../index";
import { habits, tasks, transactions, users } from "../schema";
import { deleteUserAccount } from "./account.server";
import { sessionVersionsRepository } from "./session-versions.server";

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  hasPassword: boolean;
  hasGoogle: boolean;
  tasks: number;
  habits: number;
  transactions: number;
}

async function countsByUser(table: typeof tasks | typeof habits | typeof transactions): Promise<Map<string, number>> {
  const rows = await db.select({ userId: table.userId, total: count() }).from(table).groupBy(table.userId);
  return new Map(rows.map((r) => [r.userId, r.total]));
}

export const adminRepository = {
  /** Usuários cadastrados (não inclui o dono), mais recentes primeiro, com o volume de dados de cada um. */
  async listUsers(): Promise<AdminUser[]> {
    const [rows, taskCounts, habitCounts, txCounts] = await Promise.all([
      db.select().from(users).orderBy(sql`${users.createdAt} desc`),
      countsByUser(tasks),
      countsByUser(habits),
      countsByUser(transactions),
    ]);
    return rows.map((u) => ({
      id: u.id,
      email: u.email,
      createdAt: u.createdAt,
      hasPassword: u.passwordHash !== "",
      hasGoogle: u.googleSub !== null,
      tasks: taskCounts.get(u.id) ?? 0,
      habits: habitCounts.get(u.id) ?? 0,
      transactions: txCounts.get(u.id) ?? 0,
    }));
  },

  async exists(id: string): Promise<boolean> {
    const [row] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));
    return Boolean(row);
  },

  /** Apaga o usuário e todos os dados dele. */
  deleteUser: deleteUserAccount,

  /** Invalida todas as sessões do usuário sem apagar a conta. */
  revokeSessions: (id: string) => sessionVersionsRepository.bump(id),
};
