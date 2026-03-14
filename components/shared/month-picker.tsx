"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

import { cn, formatMonthLabel, monthInputValue } from "@/lib/utils";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function getYearFromValue(value: string) {
  const year = Number(value.split("-")[0]);
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

function getMonthIndex(value: string) {
  const month = Number(value.split("-")[1]);
  return Number.isFinite(month) ? month - 1 : new Date().getMonth();
}

export function MonthPicker({
  value,
  onChange,
  disabled
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [displayYear, setDisplayYear] = useState(getYearFromValue(value));

  useEffect(() => {
    setDisplayYear(getYearFromValue(value));
  }, [value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const selectedMonthIndex = getMonthIndex(value);
  const currentMonth = useMemo(() => monthInputValue(new Date()), []);
  const previousMonth = useMemo(() => monthInputValue(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)), []);

  return (
    <div ref={rootRef} className={cn("relative", open && "z-[2147483647]")}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">Billing month</span>
          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
            Pick the month this invoice belongs to.
          </span>
        </div>
        <span className="hidden rounded-full bg-brand-soft px-3 py-1 text-[11px] font-semibold text-brand-dark dark:bg-brand/15 dark:text-brand sm:inline-flex">
          Snapshot month
        </span>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "group w-full rounded-[24px] border border-slate-200 bg-gradient-to-br from-white via-brand-soft/25 to-accent-soft/35 p-4 text-left shadow-sm transition hover:border-brand/35 hover:shadow-md dark:border-white/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 dark:hover:border-brand/35",
          disabled && "cursor-not-allowed opacity-60"
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white p-3 text-accent shadow-sm ring-1 ring-slate-200 transition group-hover:scale-[1.02] dark:bg-slate-900 dark:ring-white/10 dark:text-blue-200">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent dark:text-blue-200">Selected period</p>
              <p className="mt-2 text-xl font-semibold text-ink dark:text-slate-50">{formatMonthLabel(value)}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Tap to switch month with a cleaner picker than the native browser control.
              </p>
            </div>
          </div>
          <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900/80 dark:text-slate-300 dark:ring-white/10">
            {displayYear}
          </div>
        </div>
      </button>

      {open ? (
        <div className="animate-pop-in absolute left-0 top-full z-[2147483647] mt-3 w-full min-w-[300px] rounded-[28px] border border-slate-200 bg-white/96 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-950/96 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent dark:text-blue-200">Choose month</p>
              <p className="mt-1 text-lg font-semibold text-ink dark:text-slate-50">{displayYear}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDisplayYear((year) => year - 1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-accent hover:text-accent dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                aria-label="Previous year"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDisplayYear((year) => year + 1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-accent hover:text-accent dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                aria-label="Next year"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onChange(currentMonth);
                setOpen(false);
              }}
              className="inline-flex items-center rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft/80 dark:bg-brand/15 dark:text-brand"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              This month
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(previousMonth);
                setOpen(false);
              }}
              className="inline-flex rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent-soft/80 dark:bg-accent/15 dark:text-blue-200"
            >
              Last month
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {monthNames.map((monthName, index) => {
              const monthValue = `${displayYear}-${`${index + 1}`.padStart(2, "0")}`;
              const selected = value === monthValue;
              const currentYearMonth = currentMonth === monthValue;
              const sameSelectedYear = selected && selectedMonthIndex === index;

              return (
                <button
                  key={monthValue}
                  type="button"
                  onClick={() => {
                    onChange(monthValue);
                    setOpen(false);
                  }}
                  className={cn(
                    "rounded-[20px] border px-3 py-3 text-left transition",
                    selected
                      ? "border-accent bg-brand-hero text-white shadow-lg dark:bg-brand-hero-dark"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-accent/35 hover:bg-accent-soft/45 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{monthName.slice(0, 3)}</span>
                    {sameSelectedYear ? (
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Selected
                      </span>
                    ) : currentYearMonth ? (
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-dark dark:bg-brand/15 dark:text-brand">
                        Now
                      </span>
                    ) : null}
                  </div>
                  <p className={cn("mt-2 text-xs", selected ? "text-blue-50" : "text-slate-500 dark:text-slate-400")}>{displayYear}</p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
