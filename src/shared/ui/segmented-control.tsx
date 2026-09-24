"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Classes do item selecionado; o padrão é o destaque da marca. */
  activeClassName?: string;
  /** Classes do item não selecionado ao passar o mouse. */
  hoverClassName?: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  label?: string;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
  label,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex items-center p-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 text-xs font-semibold",
        className
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer",
              selected
                ? (option.activeClassName ?? "bg-white dark:bg-[#18152c] text-brand dark:text-brand-soft shadow-2xs")
                : cn(
                    "text-zinc-600 dark:text-zinc-400",
                    option.hoverClassName ?? "hover:text-zinc-900 dark:hover:text-zinc-200"
                  )
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
