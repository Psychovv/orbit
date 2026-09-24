import { describe, expect, it } from "vitest";
import { FinanceCommandResponseSchema, TaskCommandRequestSchema, TaskCommandResponseSchema } from "./actions";
import { bulkTaskIds } from "./bulk-commands";

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
