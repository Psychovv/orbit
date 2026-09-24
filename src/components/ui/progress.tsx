"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  indicatorColor?: string;
  showGlow?: boolean;
}

export function Progress({
  value,
  max = 100,
  indicatorColor,
  showGlow = true,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-purple-200/50 dark:bg-purple-950/60 border border-purple-200/40 dark:border-purple-800/40",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500",
          indicatorColor,
          showGlow && "shadow-[0_0_12px_rgba(168,85,247,0.7)]"
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
