import { describe, expect, it } from "vitest";
import { addCalendarDays, bulkTaskIds, prefersStrongerTaskModel } from "./bulk-commands";
import type { ExistingTaskRef } from "./actions";

const TODAY = "2026-10-20";

const tasks: ExistingTaskRef[] = [
  { id: "a", title: "Ler", date: "2026-10-20", completed: false },
  { id: "b", title: "Treinar", date: "2026-10-20", completed: true },
  { id: "c", title: "Estudar", date: "2026-10-19", completed: false },
  { id: "d", title: "Mercado", date: "2026-10-21", completed: false },
  { id: "e", title: "Dentista", date: "2026-10-18", completed: false },
];

describe("addCalendarDays", () => {
  it("moves across month and year boundaries", () => {
    expect(addCalendarDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addCalendarDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addCalendarDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("bulkTaskIds", () => {
  it("deletes every task of the mentioned day, completed or not", () => {
    expect(bulkTaskIds("apague todas as tarefas de hoje", TODAY, tasks, "delete")).toEqual(["a", "b"]);
  });

  it("completes only pending tasks of the day", () => {
    expect(bulkTaskIds("conclua todas as tarefas de hoje", TODAY, tasks, "complete")).toEqual(["a"]);
  });

  it("resolves relative days ignoring accents", () => {
    expect(bulkTaskIds("exclua tudo de ontem", TODAY, tasks, "delete")).toEqual(["c"]);
    expect(bulkTaskIds("remova tudo de amanhã", TODAY, tasks, "delete")).toEqual(["d"]);
    expect(bulkTaskIds("apague tudo de anteontem", TODAY, tasks, "delete")).toEqual(["e"]);
  });

  it("accepts an explicit ISO date", () => {
    expect(bulkTaskIds("finalize todas as tarefas de 2026-10-19", TODAY, tasks, "complete")).toEqual(["c"]);
  });

  it("returns null when the verb does not match the action", () => {
    expect(bulkTaskIds("apague todas as tarefas de hoje", TODAY, tasks, "complete")).toBeNull();
    expect(bulkTaskIds("conclua todas as tarefas de hoje", TODAY, tasks, "delete")).toBeNull();
  });

  it("returns null without a bulk quantifier or a target day", () => {
    expect(bulkTaskIds("apague ler de hoje", TODAY, tasks, "delete")).toBeNull();
    expect(bulkTaskIds("apague todas as tarefas", TODAY, tasks, "delete")).toBeNull();
  });

  it("returns an empty list when the day has nothing to change", () => {
    expect(bulkTaskIds("apague tudo de 2026-12-25", TODAY, tasks, "delete")).toEqual([]);
  });
});

describe("prefersStrongerTaskModel", () => {
  it("stays on the cheap model for short task lists", () => {
    expect(prefersStrongerTaskModel("mova ler para amanhã", 10)).toBe(false);
  });

  it("upgrades long lists with relative dates", () => {
    expect(prefersStrongerTaskModel("mova ler para amanhã", 40)).toBe(true);
    expect(prefersStrongerTaskModel("o que tenho na sexta", 40)).toBe(true);
    expect(prefersStrongerTaskModel("coloque academia no dia 5", 40)).toBe(true);
  });

  it("keeps the cheap model without relative dates", () => {
    expect(prefersStrongerTaskModel("crie a tarefa ler", 100)).toBe(false);
  });

  it("keeps bulk requests on the cheap model", () => {
    expect(prefersStrongerTaskModel("apague tudo de hoje", 100)).toBe(false);
    expect(prefersStrongerTaskModel("conclua todas as tarefas de amanhã", 100)).toBe(false);
  });
});
