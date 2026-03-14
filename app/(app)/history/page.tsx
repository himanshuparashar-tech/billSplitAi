import Link from "next/link";

import { BillSnapshotCard } from "@/components/billing/bill-snapshot-card";
import { ReopenBillButton } from "@/components/billing/reopen-bill-button";
import { ExportButtons } from "@/components/export/export-buttons";
import { Card } from "@/components/shared/card";
import { DemoBanner } from "@/components/shared/demo-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHero } from "@/components/shared/page-hero";
import { getBillSnapshotById, getHistoryData } from "@/lib/data";
import { formatCurrency, formatMonthLabel } from "@/lib/utils";

export default async function HistoryPage({ searchParams }: { searchParams?: { billId?: string } }) {
  const history = await getHistoryData();
  const selectedId = searchParams?.billId ?? history.bills[0]?.id;
  const selectedBill = selectedId ? await getBillSnapshotById(selectedId, { viewer: history.viewer }) : null;
  const latestMonth = history.bills[0] ? formatMonthLabel(history.bills[0].billing_month) : "No finalized month";

  return (
    <div className="space-y-6">
      {history.viewer.isDemo ? <DemoBanner /> : null}

      <PageHero
        eyebrow="History"
        title="Review any month without losing your place"
        description="Pick a saved bill from the list, inspect the full room split, then export it, copy the public page, or reopen the month if a correction is needed."
      >
        <div className="flex flex-wrap gap-3 text-sm text-blue-50/90">
          <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">{history.bills.length} saved months</span>
          <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">Latest saved month: {latestMonth}</span>
          <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">Exports available per selected month</span>
        </div>
      </PageHero>

      <section className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] xl:grid-cols-[0.74fr_1.26fr]">
        <Card className="animate-fade-up border-accent/10 lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">Saved months</h2>
              <p className="text-sm text-[color:var(--text-secondary)]">Tap any month to load it on the right.</p>
            </div>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              {history.bills.length} items
            </span>
          </div>

          <div className="mt-5 max-h-[550px] space-y-3 overflow-y-auto">
            {history.bills.length ? (
              history.bills.map((bill, index) => {
                const selected = bill.id === selectedId;
                return (
                  <Link
                    key={bill.id}
                    href={`/history?billId=${bill.id}`}
                    className={`block rounded-3xl border px-4 py-4 transition ${selected ? "border-accent bg-accent-soft/70 shadow-sm dark:bg-accent/10" : "border-[color:var(--border-color)] bg-[color:var(--bg-card-strong)] hover:border-accent/25 hover:bg-accent-soft/30 dark:hover:bg-accent/10"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--text-primary)]">{formatMonthLabel(bill.billing_month)}</p>
                        <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{bill.house_name}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${bill.status === "finalized" ? "bg-brand-soft text-brand-dark dark:bg-brand/15 dark:text-brand" : "app-muted-panel border text-[color:var(--text-secondary)]"}`}
                      >
                        {bill.status}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Total bill</p>
                        <p className="mt-1 text-sm font-semibold text-[color:var(--text-primary)]">{formatCurrency(bill.main_bill_amount)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Order</p>
                        <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{index === 0 ? "Newest month" : `Month ${history.bills.length - index}`}</p>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <EmptyState title="No bill history" description="Finalize a monthly bill to populate history." />
            )}
          </div>
        </Card>

        {selectedBill ? (
          <div className="space-y-4">
            <Card className="animate-fade-up border-brand/10" style={{ animationDelay: "80ms" }}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Selected bill</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[color:var(--text-primary)]">{selectedBill.house.name}</h2>
                  <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{formatMonthLabel(selectedBill.billing_month)}</p>
                  {selectedBill.status === "finalized" ? (
                    <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                      Public link:{" "}
                      <Link
                        href={`/bill/${selectedBill.id}`}
                        className="font-medium text-accent underline-offset-4 hover:underline"
                      >
                        /bill/{selectedBill.id}
                      </Link>
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Draft months stay private until finalized.</p>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:max-w-[28rem] xl:justify-end [&_button]:w-full sm:[&_button]:w-auto">
                  {selectedBill.status === "finalized" ? <ReopenBillButton billId={selectedBill.id} disabled={history.viewer.isDemo} /> : null}
                  {selectedBill.status === "finalized" ? <ExportButtons bill={selectedBill} targetId="history-selected-bill" /> : null}
                  <Link
                    href={`/houses/${selectedBill.house.id}/billing`}
                    className="inline-flex items-center justify-center rounded-2xl bg-accent-soft px-4 py-2.5 text-sm font-semibold text-accent ring-1 ring-accent/15 transition hover:bg-accent-soft/80 dark:bg-accent/10 dark:text-blue-200 dark:ring-white/10"
                  >
                    Open billing workspace
                  </Link>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl bg-brand-soft/60 p-4 dark:bg-brand/10">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">Total bill</p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--text-primary)]">{formatCurrency(selectedBill.main_bill_amount)}</p>
                </div>
                <div className="rounded-3xl bg-accent-soft/60 p-4 dark:bg-accent/10">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">Price per unit</p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--text-primary)]">{formatCurrency(selectedBill.price_per_unit)}</p>
                </div>
                <div className="app-muted-panel rounded-3xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">Tracked rooms</p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--text-primary)]">{selectedBill.results.length}</p>
                </div>
                <div className="app-muted-panel rounded-3xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">Motor units</p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--text-primary)]">{selectedBill.motor_units.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            <BillSnapshotCard bill={selectedBill} targetId="history-selected-bill" />
          </div>
        ) : (
          <EmptyState title="Choose a bill" description="Select a month from the list to inspect its details and available actions." />
        )}
      </section>
    </div>
  );
}
