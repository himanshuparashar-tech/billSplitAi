import Link from "next/link";
import { ArrowUpRight, Lightbulb } from "lucide-react";

import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { BillSnapshotCard } from "@/components/billing/bill-snapshot-card";
import { ExportButtons } from "@/components/export/export-buttons";
import { Card } from "@/components/shared/card";
import { DemoBanner } from "@/components/shared/demo-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHero } from "@/components/shared/page-hero";
import { getDashboardData } from "@/lib/data";
import { formatMonthLabel } from "@/lib/utils";

const insightTone = {
  positive: "border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100",
  neutral: "border-accent/10 bg-accent-soft/40 text-ink dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-100",
  alert: "border-amber-200 bg-amber-50/80 text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100"
} as const;

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { house?: string };
}) {
  const data = await getDashboardData(searchParams?.house);

  return (
    <div className="space-y-6">
      {data.viewer.isDemo ? <DemoBanner /> : null}

      <PageHero
        eyebrow="Overview"
        title={data.activeHouse ? `${data.activeHouse.name} at a glance` : "Start by creating your first house"}
        description="The dashboard puts the next step first: enter this month’s readings, review trends, inspect AI-generated electricity insights, and access the latest finalized bill without digging through tables."
        actions={
          data.activeHouse ? (
            <>
              <Link href={`/houses/${data.activeHouse.id}/billing`} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-brand-soft dark:bg-slate-950/80 dark:text-slate-50 dark:hover:bg-slate-900">
                Enter readings
              </Link>
              <Link href={`/houses/${data.activeHouse.id}/members`} className="rounded-2xl border border-white/25 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Manage members
              </Link>
            </>
          ) : undefined
        }
      >
        <div className="flex flex-wrap gap-3 text-xs text-blue-100/90">
          <span className="rounded-full border border-white/20 px-3 py-1">Fast monthly workflow</span>
          <span className="rounded-full border border-white/20 px-3 py-1">Snapshot history</span>
          <span className="rounded-full border border-white/20 px-3 py-1">Shareable public bill links</span>
        </div>
      </PageHero>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric, index) => (
          <Card key={metric.label} className="animate-fade-up border-accent/10 bg-white dark:border-white/10 dark:bg-slate-900/82" style={{ animationDelay: `${index * 90}ms` }}>
            <p className="text-sm text-slate-500 dark:text-slate-400">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink dark:text-slate-50">{metric.value}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{metric.helper}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        {data.activeHouse ? (
          <AnalyticsCharts barData={data.barData} lineData={data.lineData} pieData={data.pieData} />
        ) : (
          <EmptyState title="No houses yet" description="Create a house to start storing members, readings, and finalized bills." />
        )}

        <Card className="animate-fade-up border-brand/10 bg-white dark:border-white/10 dark:bg-slate-900/82" style={{ animationDelay: "90ms" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent dark:text-blue-200">Electricity Insights</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink dark:text-slate-50">What changed this month</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                These insights are calculated from stored readings and finalized bill results.
              </p>
            </div>
            <div className="rounded-2xl bg-brand-soft p-3 text-brand-dark dark:bg-brand/15 dark:text-brand">
              <Lightbulb className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {data.insights.map((insight) => (
              <div key={insight.title} className={`rounded-3xl border p-4 ${insightTone[insight.tone]}`}>
                <p className="font-semibold">{insight.title}</p>
                <p className="mt-1 text-sm opacity-80">{insight.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {data.latestBill ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent dark:text-blue-200">Latest snapshot</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink dark:text-slate-50">{formatMonthLabel(data.latestBill.billing_month)}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Export or share the latest finalized bill directly from here.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ExportButtons bill={data.latestBill} targetId="dashboard-latest-bill" />
              <Link href={`/bill/${data.latestBill.id}`} className="inline-flex items-center justify-center rounded-2xl bg-accent-soft px-4 py-2.5 text-sm font-semibold text-accent ring-1 ring-accent/15 transition hover:bg-accent-soft/80 dark:bg-slate-900 dark:text-blue-200 dark:ring-white/10">
                View public invoice
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
          <BillSnapshotCard bill={data.latestBill} targetId="dashboard-latest-bill" />
        </section>
      ) : (
        <Card className="animate-pop-in border-brand/10 bg-gradient-to-r from-white via-brand-soft/40 to-accent-soft/50 dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <h2 className="text-xl font-semibold text-ink dark:text-slate-50">No finalized month yet</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Save a draft first, confirm the main bill and total units, then finalize the month to unlock exports,
            history, analytics, and the public bill page.
          </p>
        </Card>
      )}
    </div>
  );
}

