"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: "purple" | "indigo" | "emerald" | "amber" | "rose" | "cyan";
}

export function GlowCard({
  children,
  className,
  glowColor = "purple",
  ...props
}: GlowCardProps) {
  const glowStyles = {
    purple: "hover:border-[#844DFE]/50 hover:shadow-[0_0_20px_-5px_rgba(132,77,254,0.22)] dark:hover:shadow-[0_0_25px_-5px_rgba(132,77,254,0.2)]",
    indigo: "hover:border-indigo-500/40 hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.2)] dark:hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.2)]",
    emerald: "hover:border-emerald-500/40 hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)] dark:hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.2)]",
    amber: "hover:border-amber-500/40 hover:shadow-[0_0_20px_-5px_rgba(245,158,11,0.2)] dark:hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.2)]",
    rose: "hover:border-rose-500/40 hover:shadow-[0_0_20px_-5px_rgba(244,63,94,0.2)] dark:hover:shadow-[0_0_25px_-5px_rgba(244,63,94,0.2)]",
    cyan: "hover:border-cyan-500/40 hover:shadow-[0_0_20px_-5px_rgba(6,182,212,0.2)] dark:hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.2)]",
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl p-5 transition-all duration-200",
        "bg-white/80 dark:bg-[#100e1e]/80 backdrop-blur-xl",
        "border border-zinc-200/70 dark:border-zinc-800/70",
        "shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)]",
        glowStyles[glowColor],
        className
      )}
      {...props}
    >
      {/* Subtle top border highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#844DFE]/20 to-transparent rounded-t-2xl pointer-events-none" />
      {children}
    </div>
  );
}
