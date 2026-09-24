"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "purple" | "blue" | "emerald" | "amber" | "rose" | "cyan" | "outline" | "default";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/50",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800/40",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800/40",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40",
    outline: "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 bg-transparent",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
