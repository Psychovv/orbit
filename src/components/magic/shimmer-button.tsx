"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ShimmerButton({
  shimmerColor = "#e5dcff",
  shimmerSize = "0.05em",
  shimmerDuration = "3s",
  borderRadius = "14px",
  background = "#844DFE",
  className,
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      style={
        {
          "--spread": "90deg",
          "--shimmer-color": shimmerColor,
          "--radius": borderRadius,
          "--speed": shimmerDuration,
          "--cut": shimmerSize,
          "--bg": background,
        } as React.CSSProperties
      }
      className={cn(
        "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-4 py-2.5 text-white font-medium [border-radius:var(--radius)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
        "shadow-[0_0_16px_-3px_rgba(132,77,254,0.45)] hover:shadow-[0_0_20px_0_rgba(132,77,254,0.6)]",
        className
      )}
      {...props}
    >
      {/* Spark glow border */}
      <div className="absolute inset-0 -z-30 overflow-visible [container-type:size]">
        <div className="absolute inset-0 h-[100cqh] animate-spin [aspect-ratio:1] [border-radius:0] [mask:none]">
          <div className="absolute inset-[-100%] w-auto rotate-0 [background:conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] opacity-60" />
        </div>
      </div>

      {/* Button background */}
      <div className="absolute inset-[1px] -z-20 rounded-[inherit] bg-[#844DFE] hover:bg-[#753ceb] transition-colors" />

      {/* Subtle shine highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <span className="relative z-10 flex items-center gap-2 text-sm font-semibold tracking-wide">
        {children}
      </span>
    </button>
  );
}
