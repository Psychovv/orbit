import { describe, expect, it } from "vitest";
import { emptyTaskCommand, localTaskCommand } from "./local-commands";
import type { ExistingTaskRef } from "./actions";

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
