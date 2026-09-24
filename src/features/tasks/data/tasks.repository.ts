import type { DateRange } from "@/shared/lib/date-utils";
import type {
  CreateTaskCategoryInput,
  CreateTaskInput,
  Task,
  TaskCategory,
  UpdateTaskInput,
} from "../domain/task.schema";

export interface TasksRepository {
  /** Sem `range`, retorna todas as tarefas. */
  list(range?: DateRange): Promise<Task[]>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, patch: UpdateTaskInput): Promise<Task>;
  remove(id: string): Promise<void>;
}

export interface TaskCategoriesRepository {
  list(): Promise<TaskCategory[]>;
  create(input: CreateTaskCategoryInput): Promise<TaskCategory>;
  /** Tarefas da categoria removida ficam sem categoria (`categoryId: null`). */
  remove(id: string): Promise<void>;
}
