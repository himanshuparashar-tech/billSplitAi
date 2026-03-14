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
    "bg-[color:var(--bg-card-strong)] text-[color:var(--text-primary)] ring-1 ring-accent/15 hover:bg-[color:var(--bg-muted)] focus-visible:outline-accent/40 dark:ring-white/10",
  ghost:
    "bg-transparent text-[color:var(--text-primary)] hover:bg-[color:var(--bg-muted)] focus-visible:outline-accent/40",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-500"
};

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-[17px] py-[11px] text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

