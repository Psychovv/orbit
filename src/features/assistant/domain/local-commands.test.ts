import { describe, expect, it } from "vitest";
import { emptyFinanceCommand, emptyTaskCommand, localFinanceCommand, localTaskCommand } from "./local-commands";
import type { ExistingTaskRef, ExistingTransactionRef } from "./actions";

const TODAY = "2026-10-20";

const tasks: ExistingTaskRef[] = [
  { id: "ler", title: "Ler livro", date: "2026-10-20", completed: false },
  { id: "treino", title: "Treinar", date: "2026-10-20", completed: true },
  { id: "mercado", title: "Mercado", date: "2026-10-21", completed: false },
];

describe("localTaskCommand", () => {
  describe("bulk actions", () => {
    it("deletes every task of the day", () => {
      expect(localTaskCommand("apague tudo de hoje", TODAY, tasks)).toEqual({
        ...emptyTaskCommand(),
        deleteIds: ["ler", "treino"],
      });
    });

    it("completes the pending tasks of the day", () => {
      expect(localTaskCommand("conclua todas as tarefas de hoje", TODAY, tasks)).toEqual({
        ...emptyTaskCommand(),
        completeIds: ["ler"],
      });
    });
  });

  describe("single task by title", () => {
    it("deletes a uniquely matched task", () => {
      expect(localTaskCommand("exclua mercado", TODAY, tasks)?.deleteIds).toEqual(["mercado"]);
    });

    it("completes a uniquely matched task ignoring accents and case", () => {
      expect(localTaskCommand("CONCLUÍ ler livro", TODAY, tasks)?.completeIds).toEqual(["ler"]);
    });

    it("bails out when the title is ambiguous", () => {
      const duplicated = [...tasks, { id: "ler-2", title: "Ler livro", date: "2026-10-22", completed: false }];
      expect(localTaskCommand("exclua ler livro", TODAY, duplicated)).toBeNull();
    });
  });

  describe("reschedule", () => {
    it("moves a task to a relative day", () => {
      expect(localTaskCommand("mova mercado para amanhã", TODAY, tasks)?.updates).toEqual([
        { id: "mercado", date: "2026-10-21" },
      ]);
    });

    it("moves a task to a day later this month", () => {
      expect(localTaskCommand("remarca ler livro para dia 27", TODAY, tasks)?.updates).toEqual([
        { id: "ler", date: "2026-10-27" },
      ]);
    });

    it("rolls a past day of month into the next month", () => {
      expect(localTaskCommand("adia mercado para dia 5", TODAY, tasks)?.updates).toEqual([
        { id: "mercado", date: "2026-11-05" },
      ]);
    });

    it("ignores days that do not exist in the target month", () => {
      expect(localTaskCommand("mova mercado para dia 31", "2026-11-20", tasks)).toBeNull();
    });
  });

  describe("pending query", () => {
    it("lists the pending tasks of today by default", () => {
      expect(localTaskCommand("quais tarefas faltam?", TODAY, tasks)?.answer).toBe("1 pendente em 2026-10-20:\n• Ler livro");
    });

    it("answers when there is nothing pending", () => {
      expect(localTaskCommand("quais tarefas de ontem", TODAY, tasks)?.answer).toBe(
        "Nenhuma tarefa pendente em 2026-10-19."
      );
    });
  });

  describe("create", () => {
    it("creates a category", () => {
      expect(localTaskCommand("cria a categoria Faculdade", TODAY, tasks)?.createCategories).toEqual([
        { name: "Faculdade" },
      ]);
    });

    it("creates a task with a cleaned title and date", () => {
      expect(localTaskCommand("crie a tarefa estudar inglês amanhã", TODAY, tasks)?.create).toEqual([
        { title: "estudar inglês", date: "2026-10-21" },
      ]);
    });

    it("creates a task without a date when none is mentioned", () => {
      expect(localTaskCommand("adicione comprar pão", TODAY, tasks)?.create).toEqual([
        { title: "comprar pão", date: undefined },
      ]);
    });
  });

  it("returns null for phrases it cannot safely resolve", () => {
    expect(localTaskCommand("bom dia", TODAY, tasks)).toBeNull();
    expect(localTaskCommand("crie e conclua algo", TODAY, tasks)).toBeNull();
  });
});

const transactions: ExistingTransactionRef[] = [
  { id: "salario", description: "Salário", amountCents: 500_000, type: "income", date: "2026-10-05", categoryId: "renda" },
  { id: "almoco", description: "Almoço", amountCents: 4_500, type: "expense", date: "2026-10-10", categoryId: "comida" },
  { id: "jantar", description: "Jantar", amountCents: 8_000, type: "expense", date: "2026-10-12", categoryId: "comida" },
  { id: "uber", description: "Uber", amountCents: 2_000, type: "expense", date: "2026-10-15", categoryId: "transporte" },
  { id: "antigo", description: "Almoço", amountCents: 3_000, type: "expense", date: "2026-09-30", categoryId: "comida" },
];

const categories = [
  { id: "renda", name: "Renda", type: "income" as const },
  { id: "comida", name: "Alimentação", type: "expense" as const },
  { id: "transporte", name: "Transporte", type: "expense" as const },
];

const normalizeSpaces = (text: string | undefined) => text?.replace(/\s/g, " ");

describe("localFinanceCommand", () => {
  describe("queries", () => {
    it("summarizes the current month only", () => {
      const answer = localFinanceCommand("qual o saldo do mês?", TODAY, { transactions, categories })?.answer;
      expect(normalizeSpaces(answer)).toBe(
        "Mês 2026-10: receitas R$ 5.000,00, despesas R$ 145,00, saldo R$ 4.855,00."
      );
    });

    it("breaks down spending by a mentioned category", () => {
      const answer = localFinanceCommand("quanto gastei com alimentação?", TODAY, { transactions, categories })?.answer;
      expect(normalizeSpaces(answer)).toBe("Em 2026-10, Alimentação: R$ 125,00 em despesas (2 lançamentos).");
    });

    it("does not treat a new expense as a query", () => {
      const result = localFinanceCommand("gastei 30 quanto no uber", TODAY, { transactions, categories });
      expect(result?.answer).toBeUndefined();
      expect(result?.create).toHaveLength(1);
    });
  });

  describe("delete", () => {
    it("deletes a uniquely matched transaction", () => {
      expect(localFinanceCommand("apague o uber", TODAY, { transactions })).toEqual({
        ...emptyFinanceCommand(),
        deleteIds: ["uber"],
      });
    });

    it("uses the amount to disambiguate repeated descriptions", () => {
      expect(localFinanceCommand("exclua o almoço de 45", TODAY, { transactions })?.deleteIds).toEqual(["almoco"]);
      expect(localFinanceCommand("exclua o almoço", TODAY, { transactions })).toBeNull();
    });
  });

  describe("create", () => {
    it("creates an expense category by default", () => {
      expect(localFinanceCommand("cria a categoria Lazer", TODAY)?.createCategories).toEqual([
        { name: "Lazer", type: "expense" },
      ]);
    });

    it("creates an income category when asked", () => {
      expect(localFinanceCommand("nova categoria Freela de receita", TODAY)?.createCategories).toEqual([
        { name: "Freela de receita", type: "income" },
      ]);
    });

    it("registers an expense with payment method", () => {
      expect(localFinanceCommand("gastei 45,90 no almoço no pix", TODAY)?.create).toEqual([
        { description: "almoço", amount: 45.9, type: "expense", date: TODAY, paymentMethod: "pix" },
      ]);
    });

    it("registers an income without description", () => {
      expect(localFinanceCommand("recebi 1200", TODAY)?.create).toEqual([
        { description: undefined, amount: 1200, type: "income", date: TODAY, paymentMethod: undefined },
      ]);
    });

    it("returns null when the type is unclear or there is no amount", () => {
      expect(localFinanceCommand("recebi e gastei 50", TODAY)).toBeNull();
      expect(localFinanceCommand("paguei o aluguel", TODAY)).toBeNull();
      expect(localFinanceCommand("gastei 0 no café", TODAY)).toBeNull();
    });
  });
});
