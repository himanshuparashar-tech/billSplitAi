import Link from "next/link";
import { ArrowRight, BarChart3, Camera, FileSpreadsheet, House } from "lucide-react";

import { Card } from "@/components/shared/card";
import { DemoBanner } from "@/components/shared/demo-banner";
import { Logo } from "@/components/shared/logo";
import { demoBills } from "@/lib/demo/seed-data";
import { getViewer } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/config";

const features = [
  {
    icon: House,
    title: "Multi-house admin",
    description: "One account manages any number of houses while rooms stay as non-authenticated billing entities."
  },
  {
    icon: BarChart3,
    title: "Immutable monthly snapshots",
    description: "Draft, finalize, and reopen months explicitly so historical bills stay stable."
  },
  {
    icon: Camera,
    title: "Meter photo capture",
    description: "Attach sub-meter photos to readings using Supabase Storage for auditability."
  },
  {
    icon: FileSpreadsheet,
    title: "Exports and public sharing",
    description: "Generate PDF, Excel, and JPG exports and share any finalized bill publicly."
  }
];

export default async function HomePage() {
  const viewer = await getViewer();
  const primaryHref = viewer ? "/dashboard" : isSupabaseConfigured ? "/auth" : "/dashboard";
  const primaryLabel = viewer ? "Open dashboard" : isSupabaseConfigured ? "Login to continue" : "Explore demo";
  const publicPreviewId = !isSupabaseConfigured ? demoBills[demoBills.length - 1]?.id ?? "" : "";

  return (
    <main className="min-h-screen px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-7xl rounded-[36px] border border-white/60 bg-white/80 px-6 py-6 shadow-[0_30px_80px_-32px_rgba(15,23,42,0.25)] backdrop-blur lg:px-10 lg:py-8 dark:border-white/10 dark:bg-slate-950/80">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Logo />
            <div className="flex items-center gap-3">
              <Link href="/history" className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-accent-soft dark:text-slate-300 dark:hover:bg-slate-800">
                View history
              </Link>
              <Link
                href={primaryHref}
                className="inline-flex items-center rounded-2xl bg-gradient-to-r from-brand via-brand-dark to-accent px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:brightness-110"
              >
                {primaryLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </header>

          {!isSupabaseConfigured ? <DemoBanner /> : null}

          <section className="grid gap-10 py-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-brand-dark ring-1 ring-brand/10 dark:bg-brand/15 dark:text-brand">
                Next.js 14 + Supabase + Recharts
              </p>
              <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-ink sm:text-6xl dark:text-slate-50">
                Split house electricity bills with audit-ready monthly snapshots.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                SplitBill AI handles room readings, equal motor sharing, finalized bill snapshots, analytics, exports,
                and public bill sharing in one responsive dashboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  {primaryLabel}
                </Link>
                {publicPreviewId ? (
                  <Link
                    href={`/bill/${publicPreviewId}`}
                    className="inline-flex items-center rounded-2xl border border-accent/15 bg-white px-5 py-3 text-sm font-semibold text-ink shadow-sm transition hover:border-accent/30 hover:bg-accent-soft/40 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Preview public bill
                  </Link>
                ) : null}
              </div>
            </div>
            <Card className="overflow-hidden border-accent/10 bg-sand p-0 dark:border-white/10 dark:bg-slate-950/70">
              <div className="grid gap-0 sm:grid-cols-2">
                <div className="surface-grid bg-brand-hero px-6 py-8 text-white dark:bg-brand-hero-dark">
                  <p className="text-sm text-blue-100/80">Core formula</p>
                  <h2 className="mt-4 text-2xl font-semibold">Room usage + equal motor share</h2>
                  <p className="mt-4 text-sm leading-7 text-blue-50/95">
                    Price per unit is calculated from the main bill amount and total main-meter units, then applied to
                    each room&apos;s own consumption plus a shared motor allocation.
                  </p>
                </div>
                <div className="space-y-4 bg-white px-6 py-8 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  <div className="rounded-3xl bg-slate-50 px-4 py-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-white/10">
                    <p className="font-semibold text-ink dark:text-slate-50">Price per unit</p>
                    <p className="mt-2">main bill amount / total units</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 px-4 py-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-white/10">
                    <p className="font-semibold text-ink dark:text-slate-50">Motor share</p>
                    <p className="mt-2">motor units / room count</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 px-4 py-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-white/10">
                    <p className="font-semibold text-ink dark:text-slate-50">Final bill</p>
                    <p className="mt-2">(room units + motor share) x price per unit</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-accent/10 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
                  <div className="mb-4 inline-flex rounded-2xl bg-accent-soft p-3 text-accent dark:bg-accent/15 dark:text-blue-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-ink dark:text-slate-50">{feature.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{feature.description}</p>
                </Card>
              );
            })}
          </section>
        </div>
      </div>
    </main>
  );
}
