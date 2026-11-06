import "server-only";
import { eq, lte, sql } from "drizzle-orm";
import { db } from "./db";
import { rateLimits } from "./db/schema";
import * as memory from "./rate-limit-memory";

export { clientKey, clientKeyFromHeaders } from "./client-key";

/**
 * Limite de tentativas em janela fixa, num contador atômico no banco (Turso), compartilhado
 * entre as instâncias serverless. Se o banco falhar, cai no limite em memória (por instância).
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  try {
    const [row] = await db
      .insert(rateLimits)
      .values({ key, count: 1, resetAt: now + windowMs })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`CASE WHEN ${rateLimits.resetAt} <= ${now} THEN 1 ELSE ${rateLimits.count} + 1 END`,
          resetAt: sql`CASE WHEN ${rateLimits.resetAt} <= ${now} THEN ${now + windowMs} ELSE ${rateLimits.resetAt} END`,
        },
      })
      .returning({ count: rateLimits.count });

    // Limpa janelas vencidas de vez em quando, sem custo em toda requisição.
    if (Math.random() < 0.01) void db.delete(rateLimits).where(lte(rateLimits.resetAt, now)).catch(() => {});

    return (row?.count ?? 1) <= limit;
  } catch (error) {
    console.error("[rate-limit] store indisponível, usando memória", error instanceof Error ? error.message : "");
    return memory.rateLimit(key, limit, windowMs);
  }
}

/** Ms até a janela liberar uma vaga, ou null se ainda há cota. */
export async function rateLimitRetryAfterMs(key: string, limit: number, windowMs: number): Promise<number | null> {
  const now = Date.now();
  try {
    const [row] = await db.select().from(rateLimits).where(eq(rateLimits.key, key));
    if (!row || row.resetAt <= now || row.count < limit) return null;
    return Math.max(1000, row.resetAt - now);
  } catch {
    return memory.rateLimitRetryAfterMs(key, limit, windowMs);
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  memory.resetRateLimit(key);
  try {
    await db.delete(rateLimits).where(eq(rateLimits.key, key));
  } catch {
    // sem store: o limite em memória já foi zerado
  }
}
