import type { DateRange } from "@/shared/lib/date-utils";
import type { CreateTransactionInput, FinanceCategory, Transaction } from "../domain/finance.schema";

export interface TransactionsRepository {
  /** Sem `range`, retorna todas as transações. */
  list(range?: DateRange): Promise<Transaction[]>;
  create(input: CreateTransactionInput): Promise<Transaction>;
  remove(id: string): Promise<void>;
}

export interface FinanceCategoriesRepository {
  list(): Promise<FinanceCategory[]>;
}
