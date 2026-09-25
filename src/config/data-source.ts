import type {
  FinanceCategoriesRepository,
  TransactionsRepository,
} from "@/features/finance/data/finance.repository";
import {
  createLocalFinanceCategoriesRepository,
  createLocalTransactionsRepository,
  FINANCE_STORAGE_KEYS,
} from "@/features/finance/data/finance.local";
import {
  createHttpFinanceCategoriesRepository,
  createHttpTransactionsRepository,
} from "@/features/finance/data/finance.http";
import type {
  TaskCategoriesRepository,
  TasksRepository,
} from "@/features/tasks/data/tasks.repository";
import {
  createLocalTaskCategoriesRepository,
  createLocalTasksRepository,
  TASKS_STORAGE_KEYS,
} from "@/features/tasks/data/tasks.local";
import {
  createHttpTaskCategoriesRepository,
  createHttpTasksRepository,
} from "@/features/tasks/data/tasks.http";
import type { ProfileRepository } from "@/features/profile/data/profile.repository";
import { createLocalProfileRepository, PROFILE_STORAGE_KEYS } from "@/features/profile/data/profile.local";
import { createHttpProfileRepository } from "@/features/profile/data/profile.http";
import { removeKeys } from "@/shared/lib/local-store";

export type DataSource = "local" | "http";

export interface Repositories {
  tasks: TasksRepository;
  taskCategories: TaskCategoriesRepository;
  transactions: TransactionsRepository;
  financeCategories: FinanceCategoriesRepository;
  profile: ProfileRepository;
}

export const dataSource: DataSource =
  process.env.NEXT_PUBLIC_DATA_SOURCE === "http" ? "http" : "local";

function createRepositories(source: DataSource): Repositories {
  if (source === "http") {
    return {
      tasks: createHttpTasksRepository(),
      taskCategories: createHttpTaskCategoriesRepository(),
      transactions: createHttpTransactionsRepository(),
      financeCategories: createHttpFinanceCategoriesRepository(),
      profile: createHttpProfileRepository(),
    };
  }
  return {
    tasks: createLocalTasksRepository(),
    taskCategories: createLocalTaskCategoriesRepository(),
    transactions: createLocalTransactionsRepository(),
    financeCategories: createLocalFinanceCategoriesRepository(),
    profile: createLocalProfileRepository(),
  };
}

export const repositories = createRepositories(dataSource);

/** Apaga os dados locais; a próxima leitura grava os dados de demonstração. Só existe no modo local. */
export function resetLocalData(): void {
  removeKeys(...Object.values(TASKS_STORAGE_KEYS), ...Object.values(FINANCE_STORAGE_KEYS), ...Object.values(PROFILE_STORAGE_KEYS));
}
