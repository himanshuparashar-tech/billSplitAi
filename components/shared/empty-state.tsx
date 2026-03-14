import type { ReactNode } from "react";

import { Sparkles } from "lucide-react";

import { Card } from "@/components/shared/card";

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="animate-pop-in border-dashed border-accent/15 bg-gradient-to-br from-[color:var(--bg-card-strong)] via-accent-soft/40 to-brand-soft/60 text-center dark:via-accent/10 dark:to-brand/10">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-[color:var(--text-secondary)]">
        <div className="rounded-full bg-[color:var(--bg-card-strong)] p-3 text-accent shadow-sm ring-1 ring-accent/10 dark:ring-white/10">
          <Sparkles className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">{title}</h3>
        <p className="text-sm leading-6">{description}</p>
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </Card>
  );
}
