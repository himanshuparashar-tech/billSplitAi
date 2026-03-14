import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: {
  className?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/70 bg-white/88 p-6 text-slate-900 shadow-panel backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-34px_rgba(23,52,111,0.34)] dark:border-white/10 dark:bg-slate-900/82 dark:text-slate-100 dark:hover:shadow-[0_28px_70px_-34px_rgba(2,6,23,0.75)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
