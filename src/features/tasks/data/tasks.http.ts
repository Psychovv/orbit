import type { TasksRepository, TaskCategoriesRepository } from "./tasks.repository";
import type { DateRange } from "@/shared/lib/date-utils";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export function createHttpTasksRepository(): TasksRepository {
  return {
    async list(range?: DateRange) {
      const params = new URLSearchParams();
      if (range) {
        params.set("from", range.from);
        params.set("to", range.to);
      }
      return fetchJson(`/api/tasks/crud?${params}`);
    },
    async create(input) {
      return fetchJson("/api/tasks/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
    async update(id, patch) {
      return fetchJson(`/api/tasks/crud/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    },
    async remove(id) {
      const res = await fetch(`/api/tasks/crud/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
    },
    async restore(task) {
      return fetchJson(`/api/tasks/crud/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
    },
  };
}

export function createHttpTaskCategoriesRepository(): TaskCategoriesRepository {
  return {
    async list() {
      return fetchJson("/api/tasks/categories");
    },
    async create(input) {
      return fetchJson("/api/tasks/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
    async remove(id) {
      const res = await fetch(`/api/tasks/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
    },
  };
}
