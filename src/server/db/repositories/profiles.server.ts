import { eq, sql } from "drizzle-orm";
import { db } from "../index";
import { profiles } from "../schema";
import { nowIso } from "@/shared/lib/id";

export interface Profile {
  id: string;
  name: string | null;
  photo: string | null;
  bio: string | null;
}

let ensuredTable = false;

/** Garante a tabela em prod caso o schema tenha sido adicionado depois do último drizzle push. */
async function ensureProfilesTable() {
  if (ensuredTable) return;
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS profiles (
      id text PRIMARY KEY NOT NULL,
      name text,
      photo text,
      bio text,
      updated_at text NOT NULL
    )
  `);
  ensuredTable = true;
}

function toProfile(row: {
  id: string;
  name: string | null;
  photo: string | null;
  bio: string | null;
}): Profile {
  return {
    id: row.id,
    name: row.name,
    photo: row.photo,
    bio: row.bio,
  };
}

export const profilesRepository = {
  async get(id: string): Promise<Profile> {
    await ensureProfilesTable();
    const row = await db.query.profiles.findFirst({ where: eq(profiles.id, id) });
    if (!row) {
      const defaultProfile = {
        id,
        name: null,
        photo: null,
        bio: null,
        updatedAt: nowIso(),
      };
      await db.insert(profiles).values(defaultProfile);
      return { id, name: null, photo: null, bio: null };
    }
    return toProfile(row);
  },

  async update(id: string, data: Partial<Profile>): Promise<Profile> {
    await ensureProfilesTable();
    const patch = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.photo !== undefined ? { photo: data.photo } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      updatedAt: nowIso(),
    };

    const updated = await db
      .update(profiles)
      .set(patch)
      .where(eq(profiles.id, id))
      .returning();

    if (updated.length) return toProfile(updated[0]);

    const created = {
      id,
      name: data.name ?? null,
      photo: data.photo ?? null,
      bio: data.bio ?? null,
      updatedAt: nowIso(),
    };
    await db.insert(profiles).values(created);
    return toProfile(created);
  },
};
