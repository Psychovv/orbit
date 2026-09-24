import type {
  FinanceCategoriesRepository,
  TransactionsRepository,
} from "@/features/finance/data/finance.repository";
import {
  createLocalFinanceCategoriesRepository,
  createLocalTransactionsRepository,
  FINANCE_STORAGE_KEYS,
} from "@/features/finance/data/finance.local";
import type {
  TaskCategoriesRepository,
  TasksRepository,
} from "@/features/tasks/data/tasks.repository";
import {
  createLocalTaskCategoriesRepository,
  createLocalTasksRepository,
  TASKS_STORAGE_KEYS,
} from "@/features/tasks/data/tasks.local";
import { removeKeys } from "@/shared/lib/local-store";

export type DataSource = "local" | "http";

export interface Repositories {
  tasks: TasksRepository;
  taskCategories: TaskCategoriesRepository;
  transactions: TransactionsRepository;
  financeCategories: FinanceCategoriesRepository;
}

export const dataSource: DataSource =
  process.env.NEXT_PUBLIC_DATA_SOURCE === "http" ? "http" : "local";

function createRepositories(source: DataSource): Repositories {
  if (source === "http") {
    throw new Error(
      "NEXT_PUBLIC_DATA_SOURCE=http ainda não tem implementação. Crie os repositórios *.http.ts em cada feature."
    );
  }
  return {
    tasks: createLocalTasksRepository(),
    taskCategories: createLocalTaskCategoriesRepository(),
    transactions: createLocalTransactionsRepository(),
    financeCategories: createLocalFinanceCategoriesRepository(),
  };
}

export const repositories = createRepositories(dataSource);

/** Apaga os dados locais; a próxima leitura grava os dados de demonstração. Só existe no modo local. */
export function resetLocalData(): void {
  removeKeys(...Object.values(TASKS_STORAGE_KEYS), ...Object.values(FINANCE_STORAGE_KEYS));
}
