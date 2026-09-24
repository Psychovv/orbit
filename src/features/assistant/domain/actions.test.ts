import { describe, expect, it } from "vitest";
import { FinanceCommandResponseSchema, TaskCommandRequestSchema, TaskCommandResponseSchema } from "./actions";
import { bulkTaskIds, prefersStrongerTaskModel } from "./bulk-commands";
import { localFinanceCommand, localTaskCommand } from "./local-commands";

describe("TaskCommandResponseSchema", () => {
  it("accepts the legacy array format as creations", () => {
    const parsed = TaskCommandResponseSchema.parse([{ title: "Ler" }]);
    expect(parsed).toEqual({ create: [{ title: "Ler" }], completeIds: [], deleteIds: [] });
  });

  it("drops invalid drafts and nullish fields instead of failing", () => {
    const parsed = TaskCommandResponseSchema.parse({
      create: [{ title: "Treinar", date: null, time: "8h" }, { date: "2026-09-24" }],
      completeIds: [42, "abc"],
    });
    expect(parsed.create).toEqual([{ title: "Treinar", date: undefined, time: undefined, categoryId: undefined }]);
    expect(parsed.completeIds).toEqual(["42", "abc"]);
    expect(parsed.deleteIds).toEqual([]);
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
  it("accepts arrays, wrapped arrays and single objects", () => {
    const item = { description: "Almoço", amount: 45, type: "expense", paymentMethod: "cartao" };
    expect(FinanceCommandResponseSchema.parse([item])).toHaveLength(1);
    expect(FinanceCommandResponseSchema.parse({ transactions: [item, item] })).toHaveLength(2);
    expect(FinanceCommandResponseSchema.parse(item)[0]).toMatchObject({ amount: 45 });
  });

  it("clears invalid enum values", () => {
    const [draft] = FinanceCommandResponseSchema.parse([{ description: "X", amount: 10, paymentMethod: "cheque" }]);
    expect(draft.paymentMethod).toBeUndefined();
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
      completeIds: [],
      deleteIds: [],
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
});

describe("localFinanceCommand", () => {
  it("reads a single expense", () => {
    expect(localFinanceCommand("gastei 45 no almoço no pix", "2026-09-24")).toEqual([
      { description: "almoço", amount: 45, type: "expense", date: "2026-09-24", paymentMethod: "pix" },
    ]);
  });

  it("ignores text without a clear type", () => {
    expect(localFinanceCommand("almoço 45", "2026-09-24")).toBeNull();
  });
});
