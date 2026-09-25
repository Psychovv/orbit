import { describe, expect, it } from "vitest";
import { FinanceCommandResponseSchema, TaskCommandRequestSchema, TaskCommandResponseSchema } from "./actions";
import { bulkTaskIds, prefersStrongerTaskModel } from "./bulk-commands";
import { localFinanceCommand, localTaskCommand } from "./local-commands";

describe("TaskCommandResponseSchema", () => {
  it("accepts the legacy array format as creations", () => {
    const parsed = TaskCommandResponseSchema.parse([{ title: "Ler" }]);
    expect(parsed).toEqual({
      create: [{ title: "Ler" }],
      updates: [],
      completeIds: [],
      deleteIds: [],
      createCategories: [],
      answer: undefined,
    });
  });

  it("drops invalid drafts and nullish fields instead of failing", () => {
    const parsed = TaskCommandResponseSchema.parse({
      create: [{ title: "Treinar", date: null, time: "8h" }, { date: "2026-09-24" }],
      completeIds: [42, "abc"],
      updates: [{ id: "t1", date: "2026-09-25", priority: "alta" }],
      answer: "Há 2 pendentes.",
    });
    expect(parsed.create).toEqual([{ title: "Treinar", date: undefined, time: undefined, categoryId: undefined }]);
    expect(parsed.completeIds).toEqual(["42", "abc"]);
    expect(parsed.deleteIds).toEqual([]);
    expect(parsed.updates).toEqual([
      { id: "t1", title: undefined, date: "2026-09-25", time: undefined, categoryId: undefined, priority: "alta" },
    ]);
    expect(parsed.answer).toBe("Há 2 pendentes.");
  });
});

describe("TaskCommandRequestSchema", () => {
  it("rejects empty and oversized text", () => {
    expect(TaskCommandRequestSchema.safeParse({ text: "  " }).success).toBe(false);
    expect(TaskCommandRequestSchema.safeParse({ text: "a".repeat(501) }).success).toBe(false);
    expect(TaskCommandRequestSchema.safeParse({ text: "comprar leite" }).success).toBe(true);
  });
});

describe("FinanceCommandResponseSchema", () => {
  it("accepts arrays, wrapped arrays and single objects as create", () => {
    const item = { description: "Almoço", amount: 45, type: "expense", paymentMethod: "cartao" };
    expect(FinanceCommandResponseSchema.parse([item]).create).toHaveLength(1);
    expect(FinanceCommandResponseSchema.parse({ transactions: [item, item] }).create).toHaveLength(2);
    expect(FinanceCommandResponseSchema.parse(item).create[0]).toMatchObject({ amount: 45 });
  });

  it("parses the object shape with updates and deleteIds", () => {
    const parsed = FinanceCommandResponseSchema.parse({
      create: [],
      updates: [{ id: "tx1", amount: 32 }],
      deleteIds: ["tx2"],
      answer: "Saldo positivo.",
    });
    expect(parsed.updates).toEqual([
      {
        id: "tx1",
        description: undefined,
        amount: 32,
        type: undefined,
        date: undefined,
        categoryId: undefined,
        paymentMethod: undefined,
      },
    ]);
    expect(parsed.deleteIds).toEqual(["tx2"]);
    expect(parsed.answer).toBe("Saldo positivo.");
  });

  it("clears invalid enum values", () => {
    const { create } = FinanceCommandResponseSchema.parse([
      { description: "X", amount: 10, paymentMethod: "cheque" },
    ]);
    expect(create[0].paymentMethod).toBeUndefined();
  });
});

describe("bulkTaskIds", () => {
  const tasks = [
    { id: "1", title: "a", date: "2026-09-24", completed: false },
    { id: "2", title: "b", date: "2026-09-24", completed: true },
    { id: "3", title: "c", date: "2026-09-23", completed: false },
  ];

  it("completes only pending tasks of the requested day", () => {
    expect(bulkTaskIds("conclua todas as tarefas de hoje", "2026-09-24", tasks, "complete")).toEqual(["1"]);
    expect(bulkTaskIds("finalize tudo de ontem", "2026-09-24", tasks, "complete")).toEqual(["3"]);
  });

  it("deletes every task of the day, completed or not", () => {
    expect(bulkTaskIds("apague todas as tarefas de hoje", "2026-09-24", tasks, "delete")).toEqual(["1", "2"]);
  });

  it("ignores non-bulk requests", () => {
    expect(bulkTaskIds("conclua a tarefa de ler", "2026-09-24", tasks, "complete")).toBeNull();
  });
});

describe("prefersStrongerTaskModel", () => {
  it("keeps short lists and bulk commands on the cheap model", () => {
    expect(prefersStrongerTaskModel("crie uma task para o dia 27 jogar valorant", 5)).toBe(false);
    expect(prefersStrongerTaskModel("comprar leite", 80)).toBe(false);
    expect(prefersStrongerTaskModel("apague todas as tarefas de hoje", 80)).toBe(false);
  });

  it("uses the stronger model for a relative date on a long list", () => {
    expect(prefersStrongerTaskModel("conclua a tarefa de sexta", 40)).toBe(true);
    expect(prefersStrongerTaskModel("jogar valorant dia 27", 40)).toBe(true);
  });
});

describe("localTaskCommand", () => {
  const tasks = [
    { id: "1", title: "Corrida intervalada", date: "2026-09-23", completed: false },
    { id: "2", title: "Ler", date: "2026-09-24", completed: false },
  ];

  it("creates a task on a day of the month without the model", () => {
    expect(localTaskCommand("pfv crie uma task para o dia 27 jogar valorant", "2026-09-24", [])).toEqual({
      create: [{ title: "jogar valorant", date: "2026-09-27" }],
      updates: [],
      completeIds: [],
      deleteIds: [],
      createCategories: [],
    });
  });

  it("rolls the day into the next month when it already passed", () => {
    expect(localTaskCommand("cria tarefa dia 2 pagar internet", "2026-09-24", [])?.create[0]?.date).toBe("2026-10-02");
  });

  it("completes or deletes only when one title matches", () => {
    expect(localTaskCommand("conclua a corrida intervalada", "2026-09-24", tasks)?.completeIds).toEqual(["1"]);
    expect(localTaskCommand("apaga ler", "2026-09-24", tasks)?.deleteIds).toEqual(["2"]);
    expect(localTaskCommand("conclua isso", "2026-09-24", tasks)).toBeNull();
  });

  it("reschedules a unique title to a relative date", () => {
    expect(localTaskCommand("move ler para amanhã", "2026-09-24", tasks)?.updates).toEqual([
      { id: "2", date: "2026-09-25" },
    ]);
  });

  it("lists pending tasks for today", () => {
    const result = localTaskCommand("o que falta hoje", "2026-09-24", tasks);
    expect(result?.answer).toContain("Ler");
    expect(result?.create).toEqual([]);
  });

  it("creates a category by name", () => {
    expect(localTaskCommand("cria a categoria Faculdade", "2026-09-24", [])?.createCategories).toEqual([
      { name: "Faculdade" },
    ]);
  });
});

describe("localFinanceCommand", () => {
  const transactions = [
    {
      id: "tx1",
      description: "Almoço",
      amountCents: 4500,
      type: "expense" as const,
      date: "2026-09-10",
      categoryId: "food",
    },
    {
      id: "tx2",
      description: "Salário",
      amountCents: 500000,
      type: "income" as const,
      date: "2026-09-01",
      categoryId: null,
    },
  ];

  it("reads a single expense", () => {
    expect(localFinanceCommand("gastei 45 no almoço no pix", "2026-09-24")).toEqual({
      create: [{ description: "almoço", amount: 45, type: "expense", date: "2026-09-24", paymentMethod: "pix" }],
      updates: [],
      deleteIds: [],
      createCategories: [],
    });
  });

  it("ignores text without a clear type", () => {
    expect(localFinanceCommand("almoço 45", "2026-09-24")).toBeNull();
  });

  it("answers monthly balance queries", () => {
    const result = localFinanceCommand("qual o saldo do mês", "2026-09-24", { transactions });
    expect(result?.answer).toMatch(/saldo/);
    expect(result?.create).toEqual([]);
  });

  it("deletes a unique matching transaction", () => {
    expect(localFinanceCommand("apaga o almoço de 45", "2026-09-24", { transactions })?.deleteIds).toEqual(["tx1"]);
  });

  it("creates a finance category", () => {
    expect(localFinanceCommand("cria a categoria Streaming", "2026-09-24")?.createCategories).toEqual([
      { name: "Streaming", type: "expense" },
    ]);
  });
});
