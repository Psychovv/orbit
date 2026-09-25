import { eq } from "drizzle-orm";
import { db } from "../index";
import { profiles } from "../schema";
import { nowIso } from "@/shared/lib/id";

export interface Profile {
  id: string;
  name: string | null;
  photo: string | null;
  bio: string | null;
}

export const profilesRepository = {
  async get(id: string): Promise<Profile> {
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
    return row;
  },

  async update(id: string, data: Partial<Profile>): Promise<Profile> {
    const next = { ...data, updatedAt: nowIso() };
    const row = await db.update(profiles).set(next).where(eq(profiles.id, id)).returning();
    if (!row.length) {
      const newProfile = {
        id,
        name: data.name ?? null,
        photo: data.photo ?? null,
        bio: data.bio ?? null,
        updatedAt: nowIso(),
      };
      await db.insert(profiles).values(newProfile);
      return newProfile;
    }
    return row[0];
  }
};
