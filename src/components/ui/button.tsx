"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "cosmic";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#844DFE] disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-[#844DFE] hover:bg-[#723ce6] text-white shadow-md shadow-[#844DFE]/20 hover:shadow-[#844DFE]/30",
      cosmic:
        "bg-[#844DFE] hover:bg-[#723ce6] text-white shadow-md shadow-[#844DFE]/25 hover:shadow-[#844DFE]/40",
      secondary:
        "bg-[#844DFE]/10 hover:bg-[#844DFE]/15 text-[#844DFE] dark:text-[#b494ff] border border-[#844DFE]/20 dark:border-[#844DFE]/30",
      outline:
        "border border-zinc-200 dark:border-zinc-800 hover:border-[#844DFE]/40 text-zinc-700 dark:text-zinc-200 hover:text-[#844DFE] dark:hover:text-[#b494ff]",
      ghost:
        "hover:bg-[#844DFE]/10 text-zinc-700 dark:text-zinc-200 hover:text-[#844DFE] dark:hover:text-[#b494ff]",
      destructive:
        "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
