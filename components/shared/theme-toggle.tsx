"use client";

import { Moon, SunMedium } from "lucide-react";

import { useTheme } from "@/components/shared/theme-provider";

export function ThemeToggle({ light = false }: { light?: boolean }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className={light
        ? "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
        : "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--bg-card)] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--bg-muted)]"}
    >
      {isDark ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
