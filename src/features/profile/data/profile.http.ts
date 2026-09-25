import type { Profile, ProfileRepository } from "./profile.repository";

export function createHttpProfileRepository(): ProfileRepository {
  return {
    async get() {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    async update(data) {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
  };
}
