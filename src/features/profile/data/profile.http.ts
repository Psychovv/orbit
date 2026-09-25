import type { Profile, ProfileRepository } from "./profile.repository";

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) return body.error;
  } catch {
    // ignore non-JSON bodies
  }
  return fallback;
}

export function createHttpProfileRepository(): ProfileRepository {
  return {
    async get() {
      const res = await fetch("/api/profile");
      if (!res.ok) {
        throw new Error(await readError(res, "Falha ao carregar o perfil"));
      }
      return res.json() as Promise<Profile>;
    },
    async update(data) {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error(await readError(res, "Falha ao salvar o perfil"));
      }
      return res.json() as Promise<Profile>;
    },
  };
}
