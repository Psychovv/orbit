import type { DateRange } from "@/shared/lib/date-utils";
import type {
  CreateFinanceCategoryInput,
  CreateTransactionInput,
  FinanceCategory,
  Transaction,
  UpdateFinanceCategoryInput,
  UpdateTransactionInput,
} from "../domain/finance.schema";

export interface TransactionsRepository {
  /** Sem `range`, retorna todas as transações. */
  list(range?: DateRange): Promise<Transaction[]>;
  create(input: CreateTransactionInput): Promise<Transaction>;
  update(id: string, patch: UpdateTransactionInput): Promise<Transaction>;
  remove(id: string): Promise<void>;
  /** Regrava uma transação excluída com o mesmo id (desfazer). */
  restore(transaction: Transaction): Promise<Transaction>;
}

export interface FinanceCategoriesRepository {
  list(): Promise<FinanceCategory[]>;
  create(input: CreateFinanceCategoryInput): Promise<FinanceCategory>;
  update(id: string, patch: UpdateFinanceCategoryInput): Promise<FinanceCategory>;
  /** Transações da categoria removida ficam sem categoria (`categoryId: null`). */
  remove(id: string): Promise<void>;
}
