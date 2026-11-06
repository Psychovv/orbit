import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "../index";
import { sessionVersions } from "../schema";

export const sessionVersionsRepository = {
  async get(userId: string): Promise<number> {
    const [row] = await db
      .select({ version: sessionVersions.version })
      .from(sessionVersions)
      .where(eq(sessionVersions.userId, userId));
    return row?.version ?? 0;
  },

  /** Invalida todas as sessões já emitidas para o usuário. */
  async bump(userId: string): Promise<void> {
    await db
      .insert(sessionVersions)
      .values({ userId, version: 1 })
      .onConflictDoUpdate({ target: sessionVersions.userId, set: { version: sql`${sessionVersions.version} + 1` } });
  },
};
