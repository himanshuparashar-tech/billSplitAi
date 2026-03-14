import Link from "next/link";
import { notFound } from "next/navigation";

import { BillingWorkspace } from "@/components/billing/billing-workspace";
import { Card } from "@/components/shared/card";
import { DemoBanner } from "@/components/shared/demo-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHero } from "@/components/shared/page-hero";
import { getHouseBillingData } from "@/lib/data";
import { formatCurrency, formatMonthLabel } from "@/lib/utils";

export default async function BillingPage({ params }: { params: { houseId: string } }) {
  const data = await getHouseBillingData(params.houseId);

  if (!data.house) {
    notFound();
  }

  const latestMonth = data.latestBill ? formatMonthLabel(data.latestBill.billing_month) : "No month yet";
  const latestTotal = data.latestBill ? formatCurrency(data.latestBill.main_bill_amount) : "Start with a new draft";

  return (
    <div className="space-y-6">
      {data.viewer.isDemo ? <DemoBanner /> : null}

      <PageHero
        eyebrow="Billing"
        title={`Run ${data.house.name} month by month`}
        description="Start with the official bill details, enter each room reading, and use the live review panel to save a draft or finalize the month without losing context on mobile."
        actions={
          <Link
            href={`/houses/${data.house.id}/members`}
            className="inline-flex items-center justify-center rounded-2xl bg-white/14 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/20"
          >
            Manage rooms
          </Link>
        }
      >
        <div className="flex flex-wrap gap-3 text-sm text-blue-50/90">
          <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">{data.members.length} active rooms</span>
          <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">Latest month: {latestMonth}</span>
          <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">Latest total: {latestTotal}</span>
        </div>
      </PageHero>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="animate-fade-up border-brand/10 bg-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">1. Set the bill</p>
          <h2 className="mt-3 text-lg font-semibold text-ink">Keep the month and main meter first</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Users should see the billing month, total bill amount, and total units before they touch individual room readings.
          </p>
        </Card>

        <Card className="animate-fade-up border-accent/10 bg-white" style={{ animationDelay: "90ms" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">2. Fill each room</p>
          <h2 className="mt-3 text-lg font-semibold text-ink">Use prefilled previous readings</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            The latest month feeds the previous values so most users only need to enter current readings and attach photos when needed.
          </p>
        </Card>

        <Card className="animate-fade-up border-brand/10 bg-white" style={{ animationDelay: "180ms" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">3. Review and lock</p>
          <h2 className="mt-3 text-lg font-semibold text-ink">Check the split before finalizing</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            The side summary keeps price per unit, motor share, and each room total visible so the final action feels safe.
          </p>
        </Card>
      </section>

      {!data.members.length ? (
        <EmptyState
          title="Add rooms before creating a bill"
          description="This house does not have any active rooms yet. Add them first so the billing workspace can calculate a split."
          action={
            <Link
              href={`/houses/${data.house.id}/members`}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-brand via-brand-dark to-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:from-brand-dark hover:via-accent hover:to-ink"
            >
              Add rooms
            </Link>
          }
        />
      ) : null}

      <BillingWorkspace
        houseId={data.house.id}
        members={data.members}
        latestBill={data.latestBill}
        disabled={data.viewer.isDemo || !data.members.length}
      />
    </div>
  );
}
