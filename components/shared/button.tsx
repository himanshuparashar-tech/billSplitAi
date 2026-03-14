"use client";

import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

const styles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-gradient-to-r from-brand via-brand-dark to-accent text-white shadow-lg shadow-accent/20 hover:from-brand-dark hover:via-accent hover:to-ink focus-visible:outline-accent disabled:bg-slate-300 dark:disabled:bg-slate-700",
  secondary:
    "bg-white text-ink ring-1 ring-accent/15 hover:bg-accent-soft focus-visible:outline-accent/40 dark:bg-slate-900 dark:text-slate-100 dark:ring-white/10 dark:hover:bg-slate-800",
  ghost:
    "bg-transparent text-ink hover:bg-accent-soft/70 focus-visible:outline-accent/40 dark:text-slate-100 dark:hover:bg-slate-800/80",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-500"
};

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
