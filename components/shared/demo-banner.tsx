import { BadgeAlert } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="animate-pop-in rounded-2xl border border-brand/20 bg-gradient-to-r from-brand-soft via-[color:var(--bg-card-strong)] to-accent-soft px-4 py-3 text-sm text-[color:var(--text-primary)] shadow-sm dark:from-brand/10 dark:to-accent/10">
      <div className="flex items-start gap-3">
        <BadgeAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p>
          Demo mode is active because Supabase keys are not configured. Add your environment variables to switch the
          app to live data.
        </p>
      </div>
    </div>
  );
}
