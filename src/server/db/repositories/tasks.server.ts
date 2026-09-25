import { db } from '../index';
import { tasks, taskCategories } from '../schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { TasksRepository, TaskCategoriesRepository } from '@/features/tasks/data/tasks.repository';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskCategory, CreateTaskCategoryInput } from '@/features/tasks/domain/task.schema';
import { createId, nowIso } from '@/shared/lib/id';

export function createServerTasksRepository(): TasksRepository {
  return {
    async list(range) {
      let query = db.select().from(tasks).$dynamic();
      if (range) {
        query = query.where(and(gte(tasks.date, range.from), lte(tasks.date, range.to)));
      }
      const result = await query;
      return result.map(t => ({
        ...t,
        description: t.description ?? undefined,
        time: t.time ?? undefined,
        completedAt: t.completedAt ?? null,
        focusStartedAt: t.focusStartedAt ?? null,
        categoryId: t.categoryId ?? null,
      })) as Task[];
    },
    
    async create(input: CreateTaskInput) {
      const now = nowIso();
      const task: Task = {
        ...input,
        description: input.description ?? undefined,
        time: input.time ?? undefined,
        id: createId(),
        completedAt: null,
        focusSeconds: 0,
        focusStartedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      
      await db.insert(tasks).values({
        ...task,
        description: task.description ?? null,
        time: task.time ?? null,
      });
      
      return task;
    },
    
    async update(id: string, patch: UpdateTaskInput) {
      const now = nowIso();
      
      const currentArr = await db.select().from(tasks).where(eq(tasks.id, id));
      if (currentArr.length === 0) throw new Error(`Task ${id} not found`);
      const current = currentArr[0];

      const updated = {
        ...current,
        ...patch,
        description: patch.description !== undefined ? patch.description : current.description,
        time: patch.time !== undefined ? patch.time : current.time,
        updatedAt: now,
      };

      await db.update(tasks).set(updated).where(eq(tasks.id, id));
      
      return {
        ...updated,
        description: updated.description ?? undefined,
        time: updated.time ?? undefined,
        completedAt: updated.completedAt ?? null,
        focusStartedAt: updated.focusStartedAt ?? null,
        categoryId: updated.categoryId ?? null,
      } as Task;
    },
    
    async remove(id: string) {
      await db.delete(tasks).where(eq(tasks.id, id));
    },
    
    async restore(task: Task) {
      await db.insert(tasks).values({
        ...task,
        description: task.description ?? null,
        time: task.time ?? null,
      }).onConflictDoUpdate({
        target: tasks.id,
        set: {
          ...task,
          description: task.description ?? null,
          time: task.time ?? null,
        }
      });
      return task;
    }
  };
}

export function createServerTaskCategoriesRepository(): TaskCategoriesRepository {
  return {
    async list() {
      const result = await db.select().from(taskCategories);
      return result as TaskCategory[];
    },
    
    async create(input: CreateTaskCategoryInput) {
      const category: TaskCategory = {
        ...input,
        id: createId(),
      };
      await db.insert(taskCategories).values(category);
      return category;
    },
    
    async remove(id: string) {
      await db.transaction(async (tx) => {
        await tx.delete(taskCategories).where(eq(taskCategories.id, id));
        await tx.update(tasks).set({ categoryId: null, updatedAt: nowIso() }).where(eq(tasks.categoryId, id));
      });
    }
  };
}

export const tasksRepository = createServerTasksRepository();
export const taskCategoriesRepository = createServerTaskCategoriesRepository();
