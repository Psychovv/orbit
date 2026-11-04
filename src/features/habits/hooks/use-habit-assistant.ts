"use client";

import { useQueryClient } from "@tanstack/react-query";
import { requestHabitCommand, notifyLocalFallback } from "@/features/assistant/data/assistant.api";
import type { ReviewItem } from "@/features/assistant/components/assistant-review-dialog";
import type { HabitDraft } from "@/features/assistant/domain/actions";
import { addDays, formatDateKey, parseDateKey, todayKey } from "@/shared/lib/date-utils";
import { pluralSummary } from "@/shared/lib/utils";
import { toast } from "@/shared/ui/toast";
import {
  HABIT_COLOR_PRESETS,
  HABIT_ICON_PRESETS,
  type CreateHabitInput,
  type Habit,
  type UpdateHabitInput,
} from "../domain/habit.schema";
import {
  computeHabitStreak,
  findCheckin,
  isCheckinComplete,
  isHabitScheduledOn,
} from "../domain/habit.streak";
import {
  habitCheckinsQuery,
  habitsQuery,
  useCreateHabit,
  useDeleteHabit,
  useToggleHabitCheckin,
  useUpdateHabit,
} from "./use-habits";

interface Options {
  /** Um único hábito novo: abre o formulário para revisar. */
  onSingleDraft: (draft: HabitDraft) => void;
  review: (items: ReviewItem[]) => Promise<Set<string> | null>;
  showAnswer: (text: string) => Promise<void>;
}

function toCreateInput(draft: HabitDraft, index: number): CreateHabitInput {
  const type = draft.type ?? "boolean";
  const frequencyType = draft.frequencyType ?? "daily";
  const input: CreateHabitInput = {
    name: draft.name,
    icon: draft.icon ?? HABIT_ICON_PRESETS[index % HABIT_ICON_PRESETS.length],
    color: draft.color ?? HABIT_COLOR_PRESETS[index % HABIT_COLOR_PRESETS.length],
    period: draft.period ?? "anytime",
    type,
    frequencyType,
  };
  if (draft.description) input.description = draft.description;
  if (type === "numeric") {
    input.targetValue = draft.targetValue ?? 1;
    input.unit = draft.unit ?? "x";
    input.step = draft.step ?? 1;
  }
  if (frequencyType === "specific_days") {
    input.frequencyDays = draft.frequencyDays?.length ? draft.frequencyDays : [1, 2, 3, 4, 5];
  }
  if (frequencyType === "weekly_target") {
    input.weeklyTargetCount = draft.weeklyTargetCount ?? 3;
  }
  return input;
}

/** Envia o texto para a Orbit AI e aplica as ações retornadas. */
export function useHabitAssistant({ onSingleDraft, review, showAnswer }: Options) {
  const queryClient = useQueryClient();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const toggleCheckin = useToggleHabitCheckin();

  return async (text: string) => {
    const today = todayKey();
    const historyRange = {
      from: formatDateKey(addDays(parseDateKey(today), -60)),
      to: today,
    };

    const [habits, checkins] = await Promise.all([
      queryClient.fetchQuery(habitsQuery()),
      queryClient.fetchQuery(habitCheckinsQuery(historyRange)),
    ]);

    const scheduledToday = habits.filter((h) => isHabitScheduledOn(h, today));
    const { data: result, source } = await requestHabitCommand({
      text,
      currentDate: today,
      habits: scheduledToday.map((h) => {
        const checkin = findCheckin(checkins, h.id, today);
        return {
          id: h.id,
          name: h.name,
          type: h.type,
          period: h.period,
          frequencyType: h.frequencyType,
          checkedInToday: isCheckinComplete(h, checkin),
          currentStreak: computeHabitStreak(h, checkins, today).current,
        };
      }),
    });
    if (source === "local") notifyLocalFallback();

    const byId = new Map(habits.map((h) => [h.id, h]));
    let deleting = [...new Set(result.deleteIds)].flatMap((id) => byId.get(id) ?? []);
    const deletingIds = new Set(deleting.map((h) => h.id));

    let checkingIn = [...new Set(result.checkinIds)].flatMap((id) => {
      const habit = byId.get(id);
      if (!habit || deletingIds.has(id)) return [];
      const checkin = findCheckin(checkins, id, today);
      if (isCheckinComplete(habit, checkin)) return [];
      return [{ habit, checkin }];
    });

    let clearing = [...new Set(result.clearCheckinIds)].flatMap((id) => {
      const habit = byId.get(id);
      if (!habit || deletingIds.has(id)) return [];
      const checkin = findCheckin(checkins, id, today);
      if (!isCheckinComplete(habit, checkin)) return [];
      return [{ habit, checkin }];
    });

    let updating = result.updates.flatMap((u) => {
      const habit = byId.get(u.id);
      if (!habit || deletingIds.has(u.id)) return [];
      const patch: UpdateHabitInput = {};
      if (u.name !== undefined) patch.name = u.name;
      if (u.description !== undefined) patch.description = u.description;
      if (u.period !== undefined) patch.period = u.period;
      if (u.frequencyType !== undefined) patch.frequencyType = u.frequencyType;
      if (u.frequencyDays !== undefined) patch.frequencyDays = u.frequencyDays;
      if (u.weeklyTargetCount !== undefined) patch.weeklyTargetCount = u.weeklyTargetCount;
      if (u.targetValue !== undefined) patch.targetValue = u.targetValue;
      if (u.unit !== undefined) patch.unit = u.unit;
      if (u.step !== undefined) patch.step = u.step;
      if (Object.keys(patch).length === 0) return [];
      return [{ habit, patch }];
    });

    let drafts = result.create;

    const hasMutations =
      drafts.length > 0 ||
      checkingIn.length > 0 ||
      clearing.length > 0 ||
      deleting.length > 0 ||
      updating.length > 0;

    if (!hasMutations) {
      if (result.answer) {
        await showAnswer(result.answer);
        return;
      }
      throw new Error("Não encontrei nada para fazer. Tente reformular o pedido.");
    }

    if (
      drafts.length === 1 &&
      checkingIn.length === 0 &&
      clearing.length === 0 &&
      deleting.length === 0 &&
      updating.length === 0
    ) {
      onSingleDraft(drafts[0]);
      return;
    }

    const needsReview = deleting.length > 0 || updating.length > 0 || drafts.length > 1;
    if (needsReview) {
      const approved = await review([
        ...drafts.map((d, i) => ({
          id: `create:${i}`,
          group: "create" as const,
          label: d.name,
          detail: d.period ?? "daily",
        })),
        ...updating.map(({ habit, patch }) => ({
          id: `update:${habit.id}`,
          group: "update" as const,
          label: habit.name,
          detail: [
            patch.name && patch.name !== habit.name ? `→ ${patch.name}` : null,
            patch.period ?? null,
            patch.frequencyType ?? null,
          ]
            .filter(Boolean)
            .join(" · "),
        })),
        ...checkingIn.map(({ habit }) => ({
          id: `checkin:${habit.id}`,
          group: "complete" as const,
          label: habit.name,
          detail: "check-in hoje",
        })),
        ...clearing.map(({ habit }) => ({
          id: `clear:${habit.id}`,
          group: "update" as const,
          label: habit.name,
          detail: "desmarcar hoje",
        })),
        ...deleting.map((h) => ({
          id: `delete:${h.id}`,
          group: "delete" as const,
          label: h.name,
        })),
      ]);
      if (!approved) return;
      drafts = drafts.filter((_, i) => approved.has(`create:${i}`));
      updating = updating.filter(({ habit }) => approved.has(`update:${habit.id}`));
      checkingIn = checkingIn.filter(({ habit }) => approved.has(`checkin:${habit.id}`));
      clearing = clearing.filter(({ habit }) => approved.has(`clear:${habit.id}`));
      deleting = deleting.filter((h) => approved.has(`delete:${h.id}`));
    }

    const previousSnapshots = updating.map(({ habit }) => habit);

    const [created] = await Promise.all([
      Promise.all(drafts.map((draft, i) => createHabit.mutateAsync(toCreateInput(draft, i)))),
      Promise.all(
        checkingIn.map(({ habit, checkin }) =>
          toggleCheckin.mutateAsync({ habit, date: today, checkin })
        )
      ),
      Promise.all(
        clearing.map(({ habit, checkin }) =>
          toggleCheckin.mutateAsync({ habit, date: today, checkin })
        )
      ),
      Promise.all(updating.map(({ habit, patch }) => updateHabit.mutateAsync({ id: habit.id, patch }))),
      Promise.all(deleting.map((h) => deleteHabit.mutateAsync(h.id))),
    ]);

    const summary = pluralSummary([
      [created.length, "criado", "criados"],
      [updating.length, "editado", "editados"],
      [checkingIn.length, "check-in", "check-ins"],
      [clearing.length, "desmarcado", "desmarcados"],
      [deleting.length, "excluído", "excluídos"],
    ]);
    if (!summary) return;

    const undo = (
      createdHabits: Habit[],
      checkedIn: typeof checkingIn,
      cleared: typeof clearing,
      deletedHabits: Habit[],
      previous: Habit[]
    ) => {
      createdHabits.forEach((h) => deleteHabit.mutate(h.id));
      checkedIn.forEach(({ habit }) =>
        toggleCheckin.mutate({
          habit,
          date: today,
          checkin: findCheckin(
            queryClient.getQueryData(habitCheckinsQuery(historyRange).queryKey) ?? [],
            habit.id,
            today
          ),
        })
      );
      cleared.forEach(({ habit }) => toggleCheckin.mutate({ habit, date: today }));
      deletedHabits.forEach((h) => {
        const { id: _id, archivedAt: _a, createdAt: _c, updatedAt: _u, ...fields } = h;
        createHabit.mutate(fields);
      });
      previous.forEach((h) =>
        updateHabit.mutate({
          id: h.id,
          patch: {
            name: h.name,
            description: h.description ?? null,
            period: h.period,
            frequencyType: h.frequencyType,
            frequencyDays: h.frequencyDays ?? null,
            weeklyTargetCount: h.weeklyTargetCount ?? null,
            targetValue: h.targetValue ?? null,
            unit: h.unit ?? null,
            step: h.step ?? null,
          },
        })
      );
    };

    toast({
      tone: "success",
      message: "Orbit AI aplicou as alterações",
      description: `Hábitos: ${summary}`,
      action: {
        label: "Desfazer",
        onClick: () => undo(created, checkingIn, clearing, deleting, previousSnapshots),
      },
    });
  };
}
