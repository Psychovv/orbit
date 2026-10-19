import type { DateRange } from "@/shared/lib/date-utils";
import type { HabitCheckinsRepository, HabitsRepository } from "./habits.repository";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

export function createHttpHabitsRepository(): HabitsRepository {
  return {
    async list(includeArchived = false) {
      const params = new URLSearchParams();
      if (includeArchived) params.set("includeArchived", "1");
      const qs = params.toString();
      return fetchJson(`/api/habits${qs ? `?${qs}` : ""}`);
    },
    async create(input) {
      return fetchJson("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
    async update(id, patch) {
      return fetchJson(`/api/habits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    },
    async remove(id) {
      const res = await fetch(`/api/habits/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
    },
  };
}

export function createHttpHabitCheckinsRepository(): HabitCheckinsRepository {
  return {
    async list(range: DateRange) {
      const params = new URLSearchParams({ from: range.from, to: range.to });
      return fetchJson(`/api/habits/checkins?${params}`);
    },
    async upsert(input) {
      return fetchJson("/api/habits/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
  };
}
