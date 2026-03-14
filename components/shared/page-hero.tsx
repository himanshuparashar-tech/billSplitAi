import type { ReactNode } from "react";

import { Card } from "@/components/shared/card";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  className,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Card className={cn("animate-fade-up overflow-hidden bg-brand-hero text-white dark:bg-brand-hero-dark", className)}>
      <div className="surface-grid relative -m-6 p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/90 sm:text-base">{description}</p>
            {children ? <div className="mt-5">{children}</div> : null}
          </div>
          {actions ? <div className="relative flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </div>
    </Card>
  );
}
