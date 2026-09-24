"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "cosmic";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-brand hover:bg-brand-strong text-white shadow-md shadow-brand/20 hover:shadow-brand/30",
      cosmic:
        "bg-brand hover:bg-brand-strong text-white shadow-md shadow-brand/25 hover:shadow-brand/40",
      secondary:
        "bg-brand/10 hover:bg-brand/15 text-brand dark:text-brand-soft border border-brand/20 dark:border-brand/30",
      outline:
        "border border-zinc-200 dark:border-zinc-800 hover:border-brand/40 text-zinc-700 dark:text-zinc-200 hover:text-brand dark:hover:text-brand-soft",
      ghost:
        "hover:bg-brand/10 text-zinc-700 dark:text-zinc-200 hover:text-brand dark:hover:text-brand-soft",
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
