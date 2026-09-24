"use client";

import React from "react";
import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

interface PeriodNavigatorProps {
  label: string;
  prevTitle: string;
  nextTitle: string;
  onPrev: () => void;
  onNext: () => void;
  isCurrent: boolean;
  /** Texto do botão que volta ao período atual. */
  resetLabel: string;
  /** Selo exibido quando o período atual já está selecionado. */
  currentLabel: string;
  onReset: () => void;
  /** Controle extra à direita, como o seletor de data. */
  children?: React.ReactNode;
}

const arrowClass =
  "p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer";

export const pickerInputClass =
  "text-xs font-mono px-2 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer";

export function PeriodNavigator({
  label,
  prevTitle,
  nextTitle,
  onPrev,
  onNext,
  isCurrent,
  resetLabel,
  currentLabel,
  onReset,
  children,
}: PeriodNavigatorProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-[#100e1e]/70 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-0.5">
          <button onClick={onPrev} title={prevTitle} aria-label={prevTitle} className={arrowClass}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={onNext} title={nextTitle} aria-label={nextTitle} className={arrowClass}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 pl-1">
          <Calendar className="w-4 h-4 text-brand" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        {isCurrent ? (
          <span className="px-2.5 py-1 rounded-xl text-xs font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/50">
            {currentLabel}
          </span>
        ) : (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand/10 hover:bg-brand/20 text-brand dark:text-brand-soft border border-brand/30 transition-colors cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{resetLabel}</span>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
