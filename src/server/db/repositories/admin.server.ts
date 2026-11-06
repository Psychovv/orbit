import "server-only";
import { and, count, eq, gt, inArray, like, max, sql } from "drizzle-orm";
import { db } from "../index";
import {
  financeCategories,
  habitCheckins,
  habits,
  rateLimits,
  taskCategories,
  tasks,
  transactions,
  users,
} from "../schema";
import { deleteUserAccount } from "./account.server";
import { sessionVersionsRepository } from "./session-versions.server";
import { ASSISTANT_DAILY_LIMIT, ASSISTANT_DAILY_PREFIX, assistantDailyKey } from "@/server/assistant-limits";
import { inviteRequired } from "@/server/signup-policy";
import type { AdminOverview, AdminUser, AdminUserDetail } from "@/features/admin/domain/admin.types";

const DAY_MS = 24 * 60 * 60 * 1000;

type UserOwnedTable = typeof tasks | typeof habits | typeof transactions;

async function countsByUser(table: UserOwnedTable): Promise<Map<string, number>> {
  const rows = await db.select({ userId: table.userId, total: count() }).from(table).groupBy(table.userId);
  return new Map(rows.map((r) => [r.userId, r.total]));
}

async function lastActivityByUser(): Promise<Map<string, string>> {
  const [taskRows, habitRows, checkinRows] = await Promise.all([
    db.select({ userId: tasks.userId, at: max(tasks.updatedAt) }).from(tasks).groupBy(tasks.userId),
    db.select({ userId: habits.userId, at: max(habits.updatedAt) }).from(habits).groupBy(habits.userId),
    db.select({ userId: habitCheckins.userId, at: max(habitCheckins.createdAt) }).from(habitCheckins).groupBy(habitCheckins.userId),
  ]);
  const result = new Map<string, string>();
  for (const row of [...taskRows, ...habitRows, ...checkinRows]) {
    if (row.at && row.at > (result.get(row.userId) ?? "")) result.set(row.userId, row.at);
  }
  return result;
}

/** Uso do assistente de IA na janela atual, por usuário. Janelas vencidas contam zero. */
async function aiUsageByUser(): Promise<Map<string, number>> {
  const rows = await db
    .select({ key: rateLimits.key, count: rateLimits.count })
    .from(rateLimits)
    .where(and(like(rateLimits.key, `${ASSISTANT_DAILY_PREFIX}%`), gt(rateLimits.resetAt, Date.now())));
  return new Map(rows.map((r) => [r.key.slice(ASSISTANT_DAILY_PREFIX.length), r.count]));
}

function buildSignupsByDay(users: AdminUser[], days: number): AdminOverview["signupsByDay"] {
  const today = new Date();
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    buckets.set(new Date(today.getTime() - i * DAY_MS).toISOString().slice(0, 10), 0);
  }
  for (const user of users) {
    const day = user.createdAt.slice(0, 10);
    if (buckets.has(day)) buckets.set(day, (buckets.get(day) ?? 0) + 1);
  }
  return [...buckets].map(([date, total]) => ({ date, count: total }));
}

export const adminRepository = {
  /** Usuários cadastrados (não inclui o dono), mais recentes primeiro, com o volume de dados de cada um. */
  async listUsers(): Promise<AdminUser[]> {
    const [rows, taskCounts, habitCounts, txCounts, activity, ai] = await Promise.all([
      db.select().from(users).orderBy(sql`${users.createdAt} desc`),
      countsByUser(tasks),
      countsByUser(habits),
      countsByUser(transactions),
      lastActivityByUser(),
      aiUsageByUser(),
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
      lastActivityAt: activity.get(u.id) ?? null,
      aiUsedToday: ai.get(u.id) ?? 0,
    }));
  },

  overview(list: AdminUser[]): AdminOverview {
    const now = Date.now();
    const since = (days: number) => new Date(now - days * DAY_MS).toISOString();
    const sevenDays = since(7);
    const thirtyDays = since(30);
    return {
      totalUsers: list.length,
      newLast7Days: list.filter((u) => u.createdAt >= sevenDays).length,
      newLast30Days: list.filter((u) => u.createdAt >= thirtyDays).length,
      withPassword: list.filter((u) => u.hasPassword).length,
      withGoogle: list.filter((u) => u.hasGoogle).length,
      activeLast7Days: list.filter((u) => u.lastActivityAt !== null && u.lastActivityAt >= sevenDays).length,
      totals: {
        tasks: list.reduce((sum, u) => sum + u.tasks, 0),
        habits: list.reduce((sum, u) => sum + u.habits, 0),
        transactions: list.reduce((sum, u) => sum + u.transactions, 0),
      },
      signupsByDay: buildSignupsByDay(list, 14),
      system: {
        inviteRequired: inviteRequired(),
        googleLogin: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        aiConfigured: Boolean(process.env.GEMINI_API_KEY),
        pluggyConfigured: Boolean(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET),
        aiDailyLimit: ASSISTANT_DAILY_LIMIT.limit,
      },
    };
  },

  async exists(id: string): Promise<boolean> {
    const [row] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));
    return Boolean(row);
  },

  async detail(id: string): Promise<AdminUserDetail | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return null;

    const [[taskTotals], [habitTotals], [checkinTotals], [txTotals], [financeCats], [taskCats], ai] = await Promise.all([
      db
        .select({ total: count(), completed: sql<number>`coalesce(sum(case when ${tasks.completedAt} is not null then 1 else 0 end), 0)` })
        .from(tasks)
        .where(eq(tasks.userId, id)),
      db
        .select({ total: count(), archived: sql<number>`coalesce(sum(case when ${habits.archivedAt} is not null then 1 else 0 end), 0)` })
        .from(habits)
        .where(eq(habits.userId, id)),
      db.select({ total: count() }).from(habitCheckins).where(eq(habitCheckins.userId, id)),
      db
        .select({
          total: count(),
          income: sql<number>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amountCents} else 0 end), 0)`,
          expense: sql<number>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amountCents} else 0 end), 0)`,
        })
        .from(transactions)
        .where(eq(transactions.userId, id)),
      db.select({ total: count() }).from(financeCategories).where(eq(financeCategories.userId, id)),
      db.select({ total: count() }).from(taskCategories).where(eq(taskCategories.userId, id)),
      aiUsageByUser(),
    ]);

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      tasks: { total: taskTotals.total, completed: Number(taskTotals.completed) },
      habits: { total: habitTotals.total, archived: Number(habitTotals.archived), checkins: checkinTotals.total },
      finance: {
        transactions: txTotals.total,
        incomeCents: Number(txTotals.income),
        expenseCents: Number(txTotals.expense),
        categories: financeCats.total,
      },
      taskCategories: taskCats.total,
      aiUsedToday: ai.get(id) ?? 0,
    };
  },

  /** Apaga o usuário e todos os dados dele. */
  deleteUser: deleteUserAccount,

  /** Apaga vários usuários, um por vez. Devolve os ids apagados (ids que não existem são ignorados). */
  async deleteUsers(ids: string[]): Promise<string[]> {
    const existing = await db.select({ id: users.id }).from(users).where(inArray(users.id, ids));
    const deleted: string[] = [];
    for (const { id } of existing) {
      await deleteUserAccount(id);
      deleted.push(id);
    }
    return deleted;
  },

  /** Invalida todas as sessões do usuário sem apagar a conta. */
  revokeSessions: (id: string) => sessionVersionsRepository.bump(id),

  /** Zera a cota diária do assistente de IA do usuário. */
  async resetAiLimit(id: string): Promise<void> {
    await db.delete(rateLimits).where(eq(rateLimits.key, assistantDailyKey(id)));
  },
};
