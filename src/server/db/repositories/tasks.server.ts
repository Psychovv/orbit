import { db } from '../index';
import { tasks, taskCategories } from '../schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { TasksRepository, TaskCategoriesRepository } from '@/features/tasks/data/tasks.repository';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskCategory,
  CreateTaskCategoryInput,
  UpdateTaskCategoryInput,
} from '@/features/tasks/domain/task.schema';
import { createId, nowIso } from '@/shared/lib/id';
import { omitUserId } from './omit-user-id';

type TaskRow = typeof tasks.$inferSelect;

function toTask(row: TaskRow): Task {
  const t = omitUserId(row);
  return {
    ...t,
    description: t.description ?? undefined,
    time: t.time ?? undefined,
    completedAt: t.completedAt ?? null,
    focusStartedAt: t.focusStartedAt ?? null,
    categoryId: t.categoryId ?? null,
  } as Task;
}

export function createServerTasksRepository(userId: string): TasksRepository {
  const own = eq(tasks.userId, userId);
  const byId = (id: string) => and(eq(tasks.id, id), own);

  return {
    async list(range) {
      const result = await db
        .select()
        .from(tasks)
        .where(range ? and(own, gte(tasks.date, range.from), lte(tasks.date, range.to)) : own);
      return result.map(toTask);
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
        userId,
        description: task.description ?? null,
        time: task.time ?? null,
      });
      
      return task;
    },
    
    async update(id: string, patch: UpdateTaskInput) {
      const now = nowIso();
      
      const currentArr = await db.select().from(tasks).where(byId(id));
      if (currentArr.length === 0) throw new Error(`Task ${id} not found`);
      const current = currentArr[0];

      const updated = {
        ...current,
        ...patch,
        description: patch.description !== undefined ? patch.description : current.description,
        time: patch.time !== undefined ? patch.time : current.time,
        updatedAt: now,
      };

      await db.update(tasks).set(updated).where(byId(id));

      return toTask(updated);
    },
    
    async remove(id: string) {
      await db.delete(tasks).where(byId(id));
    },
    
    async restore(task: Task) {
      const values = {
        ...task,
        description: task.description ?? null,
        time: task.time ?? null,
      };
      // `setWhere` impede que um id de outro usuário seja sobrescrito.
      await db.insert(tasks).values({ ...values, userId }).onConflictDoUpdate({
        target: tasks.id,
        set: values,
        setWhere: own,
      });
      return task;
    }
  };
}

function toTaskCategory(row: typeof taskCategories.$inferSelect): TaskCategory {
  return omitUserId(row) as TaskCategory;
}

export function createServerTaskCategoriesRepository(userId: string): TaskCategoriesRepository {
  const own = eq(taskCategories.userId, userId);
  const byId = (id: string) => and(eq(taskCategories.id, id), own);

  return {
    async list() {
      const result = await db.select().from(taskCategories).where(own);
      return result.map(toTaskCategory);
    },
    
    async create(input: CreateTaskCategoryInput) {
      const category: TaskCategory = {
        ...input,
        id: createId(),
      };
      await db.insert(taskCategories).values({ ...category, userId });
      return category;
    },

    async update(id: string, patch: UpdateTaskCategoryInput) {
      const currentArr = await db.select().from(taskCategories).where(byId(id));
      if (currentArr.length === 0) throw new Error(`Task category ${id} not found`);
      const current = currentArr[0];
      const updated = { ...current, ...patch };
      await db.update(taskCategories).set(updated).where(byId(id));
      return toTaskCategory(updated);
    },
    
    async remove(id: string) {
      await db.transaction(async (tx) => {
        await tx.delete(taskCategories).where(byId(id));
        await tx
          .update(tasks)
          .set({ categoryId: null, updatedAt: nowIso() })
          .where(and(eq(tasks.categoryId, id), eq(tasks.userId, userId)));
      });
    }
  };
}

