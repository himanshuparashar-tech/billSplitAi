import Link from "next/link";
import { notFound } from "next/navigation";

import { BillSnapshotCard } from "@/components/billing/bill-snapshot-card";
import { ExportButtons } from "@/components/export/export-buttons";
import { Card } from "@/components/shared/card";
import { DemoBanner } from "@/components/shared/demo-banner";
import { PageHero } from "@/components/shared/page-hero";
import { getHouseBillingData } from "@/lib/data";
import { formatCurrency, formatMonthLabel } from "@/lib/utils";

export default async function HouseOverviewPage({ params }: { params: { houseId: string } }) {
  const data = await getHouseBillingData(params.houseId);

  if (!data.house) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {data.viewer.isDemo ? <DemoBanner /> : null}

      <PageHero
        eyebrow="House overview"
        title={data.house.name}
        description="Everything for this house lives here: room setup, monthly readings, final bill snapshots, exports, and public sharing."
        actions={
          <>
            <Link href={`/houses/${data.house.id}/members`} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-brand-soft">
              Manage rooms
            </Link>
            <Link href={`/houses/${data.house.id}/billing`} className="rounded-2xl border border-white/25 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Open billing workspace
            </Link>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="animate-fade-up border-brand/10 bg-white">
          <p className="text-sm text-slate-500">Rooms</p>
          <p className="mt-3 text-3xl font-semibold text-ink">{data.members.length}</p>
          <p className="mt-2 text-sm text-slate-500">Billing entities available this month.</p>
        </Card>
        <Card className="animate-fade-up border-accent/10 bg-white" style={{ animationDelay: "90ms" }}>
          <p className="text-sm text-slate-500">Months recorded</p>
          <p className="mt-3 text-3xl font-semibold text-ink">{data.bills.length}</p>
          <p className="mt-2 text-sm text-slate-500">Draft and finalized months combined.</p>
        </Card>
        <Card className="animate-fade-up border-accent/10 bg-white" style={{ animationDelay: "180ms" }}>
          <p className="text-sm text-slate-500">Latest bill</p>
          <p className="mt-3 text-3xl font-semibold text-ink">{data.latestBill ? formatCurrency(data.latestBill.main_bill_amount) : formatCurrency(0)}</p>
          <p className="mt-2 text-sm text-slate-500">{data.latestBill ? formatMonthLabel(data.latestBill.billing_month) : "No bills yet"}</p>
        </Card>
      </section>

      {data.latestBill ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Latest snapshot</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Ready to export or share</h2>
              <p className="text-sm text-slate-500">The latest finalized month is surfaced here so users do not need to dig through history.</p>
            </div>
            {data.latestBill.status === "finalized" ? <ExportButtons bill={data.latestBill} targetId="house-latest-bill" /> : null}
          </div>
          <BillSnapshotCard bill={data.latestBill} targetId="house-latest-bill" />
        </section>
      ) : null}
    </div>
  );
}
