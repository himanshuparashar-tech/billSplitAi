import { BadgeAlert } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="animate-pop-in rounded-2xl border border-brand/20 bg-gradient-to-r from-brand-soft via-white to-accent-soft px-4 py-3 text-sm text-ink shadow-sm">
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
