"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Flame, Plus, Sun } from "lucide-react";
import {
  addDays,
  addWeeks,
  formatDateKey,
  formatLongDate,
  formatWeekRange,
  getWeekDays,
  parseDateKey,
  todayKey,
  weekRange,
} from "@/shared/lib/date-utils";
import { triggerCosmicCelebration } from "@/shared/effects/confetti";
import { Button } from "@/shared/ui/button";
import { PeriodNavigator, pickerInputClass } from "@/shared/ui/period-navigator";
import { SegmentedControl } from "@/shared/ui/segmented-control";
import { ViewSkeleton } from "@/shared/ui/view-skeleton";
import type { CreateHabitInput, Habit } from "../domain/habit.schema";
import {
  countCompletedHabitsOn,
  findCheckin,
  habitsScheduledOn,
  isHabitScheduledOn,
} from "../domain/habit.streak";
import {
  useCreateHabit,
  useDeleteHabit,
  useHabitCheckins,
  useHabits,
  useToggleHabitCheckin,
  useUpdateHabit,
  useUpdateHabitValue,
} from "../hooks/use-habits";
import { AddHabitModal } from "./add-habit-modal";
import { HabitCard } from "./habit-card";
import { HabitsWeeklyMatrix } from "./habits-weekly-matrix";

type HabitsTab = "today" | "week";

const TAB_OPTIONS = [
  { value: "today" as const, label: "Hoje", icon: Sun },
  { value: "week" as const, label: "Semana", icon: CalendarDays },
];

const PERIOD_ORDER = ["morning", "afternoon", "evening", "anytime"] as const;

export function HabitsView() {
  const [tab, setTab] = useState<HabitsTab>("today");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [weekBase, setWeekBase] = useState(() => parseDateKey(todayKey()));
  const [modal, setModal] = useState<
    | { mode: "create" }
    | { mode: "edit"; habit: Habit }
    | null
  >(null);

  const today = todayKey();
  const isToday = selectedDate === today;
  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase]);
  const isCurrentWeek = weekDays.some((d) => d.isToday);

  const activeWeekRange = useMemo(() => weekRange(weekBase), [weekBase]);
  // Histórico para streaks nos cards (últimos ~60 dias + semana).
  const historyRange = useMemo(() => {
    const anchor = tab === "today" ? selectedDate : activeWeekRange.to;
    return {
      from: formatDateKey(addDays(parseDateKey(anchor), -60)),
      to: anchor,
    };
  }, [tab, selectedDate, activeWeekRange.to]);

  const habitsQuery = useHabits();
  const checkinsQuery = useHabitCheckins(historyRange);
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const toggleCheckin = useToggleHabitCheckin();
  const updateValue = useUpdateHabitValue();

  const habits = useMemo(() => habitsQuery.data ?? [], [habitsQuery.data]);
  const checkins = useMemo(() => checkinsQuery.data ?? [], [checkinsQuery.data]);
  const dayStats = countCompletedHabitsOn(habits, checkins, selectedDate);
  const percent =
    dayStats.total > 0 ? Math.round((dayStats.completed / dayStats.total) * 100) : 0;

  const scheduledToday = useMemo(
    () => habitsScheduledOn(habits, selectedDate),
    [habits, selectedDate]
  );

  const grouped = useMemo(() => {
    const groups = PERIOD_ORDER.map((period) => ({
      period,
      habits: scheduledToday.filter((h) => h.period === period),
    })).filter((g) => g.habits.length > 0);
    return groups;
  }, [scheduledToday]);

  const weekHabits = useMemo(
    () =>
      habits.filter((h) =>
        weekDays.some((d) => isHabitScheduledOn(h, d.date))
      ),
    [habits, weekDays]
  );

  const celebratedRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      isToday &&
      dayStats.total > 0 &&
      dayStats.completed === dayStats.total &&
      celebratedRef.current !== selectedDate
    ) {
      celebratedRef.current = selectedDate;
      triggerCosmicCelebration();
    }
  }, [isToday, dayStats.total, dayStats.completed, selectedDate]);

  const handleSubmit = (input: CreateHabitInput) => {
    if (modal?.mode === "edit") {
      updateHabit.mutate({ id: modal.habit.id, patch: input });
    } else {
      createHabit.mutate(input);
    }
  };

  const shiftDay = (delta: number) => {
    setSelectedDate(formatDateKey(addDays(parseDateKey(selectedDate), delta)));
  };

  const shiftWeek = (delta: number) => {
    setWeekBase((prev) => addWeeks(prev, delta));
  };

  if (habitsQuery.isPending || checkinsQuery.isPending) return <ViewSkeleton />;

  const longDate = formatLongDate(selectedDate);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <span>Hábitos</span>
            </h2>
            {dayStats.total > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-400/30">
                {dayStats.completed} de {dayStats.total} · {percent}%
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {dayStats.total === 0
              ? "Nenhum hábito agendado para este dia."
              : `${dayStats.completed} de ${dayStats.total} hábitos concluídos${isToday ? " hoje" : ""} — ${percent}%.`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SegmentedControl
            label="Visão"
            value={tab}
            options={TAB_OPTIONS}
            onChange={setTab}
          />
          <Button variant="primary" onClick={() => setModal({ mode: "create" })} className="h-9.5 text-xs px-4">
            <Plus className="w-4 h-4" />
            <span>Novo Hábito</span>
          </Button>
        </div>
      </div>

      {tab === "today" ? (
        <>
          <PeriodNavigator
            label={`${longDate.dayName}, ${longDate.date}`}
            prevTitle="Dia anterior"
            nextTitle="Próximo dia"
            onPrev={() => shiftDay(-1)}
            onNext={() => shiftDay(1)}
            isCurrent={isToday}
            resetLabel="Hoje"
            currentLabel="Hoje"
            onReset={() => setSelectedDate(today)}
          >
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className={pickerInputClass}
              aria-label="Escolher data"
            />
          </PeriodNavigator>

          {scheduledToday.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-10 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Nenhum hábito para este dia.
              </p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => setModal({ mode: "create" })}
              >
                <Plus className="w-4 h-4" />
                Criar hábito
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(({ period, habits: periodHabits }) => (
                <section key={period} className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
                    {period === "morning"
                      ? "Manhã"
                      : period === "afternoon"
                        ? "Tarde"
                        : period === "evening"
                          ? "Noite"
                          : "Qualquer horário"}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {periodHabits.map((habit) => (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        date={selectedDate}
                        checkins={checkins}
                        onToggle={() =>
                          toggleCheckin.mutate({
                            habit,
                            date: selectedDate,
                            checkin: findCheckin(checkins, habit.id, selectedDate),
                          })
                        }
                        onStep={(delta) =>
                          updateValue.mutate({
                            habit,
                            date: selectedDate,
                            delta,
                            checkin: findCheckin(checkins, habit.id, selectedDate),
                          })
                        }
                        onEdit={() => setModal({ mode: "edit", habit })}
                        onDelete={() => deleteHabit.mutate(habit.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <PeriodNavigator
            label={formatWeekRange(weekBase)}
            prevTitle="Semana anterior"
            nextTitle="Próxima semana"
            onPrev={() => shiftWeek(-1)}
            onNext={() => shiftWeek(1)}
            isCurrent={isCurrentWeek}
            resetLabel="Esta semana"
            currentLabel="Esta semana"
            onReset={() => setWeekBase(parseDateKey(today))}
          />
          <HabitsWeeklyMatrix
            habits={weekHabits}
            weekDays={weekDays}
            checkins={checkins}
            onToggle={(habit, date) =>
              toggleCheckin.mutate({
                habit,
                date,
                checkin: findCheckin(checkins, habit.id, date),
              })
            }
          />
        </>
      )}

      <AddHabitModal
        isOpen={modal !== null}
        onClose={() => setModal(null)}
        mode={modal?.mode === "edit" ? "edit" : "create"}
        habit={modal?.mode === "edit" ? modal.habit : null}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
