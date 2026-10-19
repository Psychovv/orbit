"use client";

import React from "react";
import { Check } from "lucide-react";
import type { CalendarDayInfo } from "@/shared/lib/date-utils";
import type { Habit, HabitCheckin } from "../domain/habit.schema";
import {
  findCheckin,
  isCheckinComplete,
  isHabitScheduledOn,
} from "../domain/habit.streak";
import { cn } from "@/shared/lib/utils";

interface HabitsWeeklyMatrixProps {
  habits: Habit[];
  weekDays: CalendarDayInfo[];
  checkins: HabitCheckin[];
  onToggle: (habit: Habit, date: string) => void;
}

export function HabitsWeeklyMatrix({
  habits,
  weekDays,
  checkins,
  onToggle,
}: HabitsWeeklyMatrixProps) {
  if (habits.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center text-sm text-zinc-500">
        Nenhum hábito ativo nesta semana.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-[#100e1e]/70 backdrop-blur-md">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80">
            <th className="sticky left-0 z-10 bg-white/95 dark:bg-[#100e1e]/95 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Hábito
            </th>
            {weekDays.map((day) => (
              <th
                key={day.date}
                className={cn(
                  "px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider",
                  day.isToday
                    ? "text-brand dark:text-brand-soft"
                    : "text-zinc-400 dark:text-zinc-500"
                )}
              >
                <div>{day.shortName}</div>
                <div className="mt-0.5 font-mono text-xs">{day.dayNumber}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {habits.map((habit) => (
            <tr
              key={habit.id}
              className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
            >
              <td className="sticky left-0 z-10 bg-white/95 dark:bg-[#100e1e]/95 px-4 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{habit.icon}</span>
                  <span className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                    {habit.name}
                  </span>
                </div>
              </td>
              {weekDays.map((day) => {
                const scheduled = isHabitScheduledOn(habit, day.date);
                const checkin = findCheckin(checkins, habit.id, day.date);
                const completed = isCheckinComplete(habit, checkin);
                const partial =
                  habit.type === "numeric" &&
                  !completed &&
                  (checkin?.currentValue ?? 0) > 0;

                return (
                  <td key={day.date} className="px-2 py-2 text-center">
                    {scheduled ? (
                      <button
                        type="button"
                        onClick={() => onToggle(habit, day.date)}
                        title={`${habit.name} · ${day.date}`}
                        aria-label={`${completed ? "Desmarcar" : "Marcar"} ${habit.name} em ${day.date}`}
                        className={cn(
                          "mx-auto flex h-8 w-8 items-center justify-center rounded-xl border transition-all cursor-pointer",
                          completed
                            ? "text-white shadow-sm"
                            : partial
                              ? "border-amber-400/50 bg-amber-500/10 text-amber-600"
                              : "border-zinc-200 dark:border-zinc-700 hover:border-brand/40 hover:bg-brand/5"
                        )}
                        style={
                          completed
                            ? { backgroundColor: habit.color, borderColor: habit.color }
                            : undefined
                        }
                      >
                        {completed ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : partial ? (
                          <span className="text-[9px] font-mono font-bold">
                            {Math.round(
                              ((checkin?.currentValue ?? 0) / (habit.targetValue ?? 1)) * 100
                            )}
                            %
                          </span>
                        ) : null}
                      </button>
                    ) : (
                      <span className="mx-auto block h-8 w-8 rounded-xl bg-zinc-50 dark:bg-zinc-900/40" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
