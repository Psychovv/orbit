import "server-only";
import { eq } from "drizzle-orm";
import { db } from "../index";
import { users } from "../schema";
import { createId, nowIso } from "@/shared/lib/id";

export interface UserRecord {
  id: string;
  email: string;
  /** Vazio quando a conta foi criada pelo Google e não tem senha. */
  passwordHash: string;
  googleSub: string | null;
}

const columns = { id: users.id, email: users.email, passwordHash: users.passwordHash, googleSub: users.googleSub };

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class EmailTakenError extends Error {
  constructor() {
    super("E-mail já cadastrado.");
  }
}

function isUniqueViolation(error: unknown): boolean {
  const text = error instanceof Error ? `${error.message} ${String(error.cause ?? "")}` : String(error);
  return /UNIQUE constraint failed/i.test(text);
}

export const usersRepository = {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const [row] = await db.select(columns).from(users).where(eq(users.email, normalizeEmail(email)));
    return row ?? null;
  },

  async findByGoogleSub(sub: string): Promise<UserRecord | null> {
    const [row] = await db.select(columns).from(users).where(eq(users.googleSub, sub));
    return row ?? null;
  },

  async linkGoogle(id: string, sub: string): Promise<void> {
    await db.update(users).set({ googleSub: sub }).where(eq(users.id, id));
  },

  /** `passwordHash` vazio para conta só com Google. */
  async create(email: string, passwordHash: string, googleSub: string | null = null): Promise<UserRecord> {
    const user = { id: createId(), email: normalizeEmail(email), passwordHash, googleSub };
    try {
      await db.insert(users).values({ ...user, createdAt: nowIso() });
    } catch (error) {
      if (isUniqueViolation(error)) throw new EmailTakenError();
      throw error;
    }
    return user;
  },
};
