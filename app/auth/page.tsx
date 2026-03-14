import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthPanel } from "@/components/auth/auth-panel";
import { DemoBanner } from "@/components/shared/demo-banner";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { getViewer } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  const viewer = await getViewer();

  if (viewer && !viewer.isDemo) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/70 bg-gradient-to-br from-white/92 via-blue-50/80 to-white/88 shadow-[0_30px_80px_-32px_rgba(15,23,42,0.3)] backdrop-blur dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-950/95 dark:via-slate-900/80 dark:to-slate-950/90 sm:p-0">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <div className="surface-grid bg-brand-hero px-6 py-10 text-white dark:bg-brand-hero-dark sm:px-10">
            <div className="flex items-start justify-between gap-4">
              <Logo tone="light" />
            </div>
            <h1 className="mt-10 text-4xl font-semibold tracking-tight text-blue-900">Admin login for multi-house billing</h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-blue-900">
              Keep the sign-in screen simple: one action area, one message area, and a clear explanation of what happens after login.
            </p>
            <div className="mt-8 grid gap-3 text-sm text-blue-900">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">Create houses and members without extra account setup.</div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">Enter readings, review the split, then finalize the month.</div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">Export or share finalized bills publicly in one click.</div>
            </div>
            {!isSupabaseConfigured ? <div className="mt-6"><DemoBanner /></div> : null}
          </div>
          <div className="flex items-center justify-center bg-white px-6 py-10 dark:bg-slate-950 sm:px-10">
            <Suspense fallback={<div className="h-[400px] w-full max-w-lg animate-pulse rounded-2xl bg-slate-200/50 dark:bg-slate-800/50" />}>
              <AuthPanel />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
