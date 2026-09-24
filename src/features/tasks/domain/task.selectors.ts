import type { Task } from "./task.schema";

export const ALL_CATEGORIES = "all";

export function isCompleted(task: Pick<Task, "completedAt">): boolean {
  return task.completedAt !== null;
}

export function countCompleted(tasks: Task[]): number {
  return tasks.reduce((acc, task) => acc + (isCompleted(task) ? 1 : 0), 0);
}

export function filterByCategory(tasks: Task[], categoryId: string): Task[] {
  if (categoryId === ALL_CATEGORIES) return tasks;
  return tasks.filter((task) => task.categoryId === categoryId);
}

export function groupByDate(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    const list = map.get(task.date);
    if (list) list.push(task);
    else map.set(task.date, [task]);
  }
  return map;
}

export function countByCategory(tasks: Task[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const task of tasks) {
    if (task.categoryId) map.set(task.categoryId, (map.get(task.categoryId) ?? 0) + 1);
  }
  return map;
}

export function tasksOnDate(tasks: Task[], dateKey: string, includeCompleted = true): Task[] {
  return tasks.filter((task) => task.date === dateKey && (includeCompleted || !isCompleted(task)));
}
