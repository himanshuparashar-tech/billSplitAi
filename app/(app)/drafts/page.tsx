import Link from "next/link";
import { ArrowRight, FilePen } from "lucide-react";

import { DeleteDraftButton } from "@/components/billing/delete-draft-button";

import { Card } from "@/components/shared/card";
import { DemoBanner } from "@/components/shared/demo-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHero } from "@/components/shared/page-hero";
import { getDraftsData } from "@/lib/data";
import { formatCurrency, formatMonthLabel } from "@/lib/utils";

export default async function DraftsPage() {
  const data = await getDraftsData();

  return (
    <div className="space-y-6">
      {data.viewer.isDemo ? <DemoBanner /> : null}

      <PageHero
        eyebrow="Drafts"
        title="Pick up where you left off"
        description="These bills have been saved but not yet finalized. Open any draft to continue entering readings and lock the month when you're ready."
      >
        <div className="flex flex-wrap gap-3 text-sm text-blue-50/90">
          <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">
            {data.bills.length} draft{data.bills.length !== 1 ? "s" : ""} saved
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">
            Not visible until finalized
          </span>
        </div>
      </PageHero>

      {data.bills.length === 0 ? (
        <EmptyState
          title="No drafts yet"
          description="Save a draft from the billing workspace and it will appear here so you can continue editing later."
          action={
            data.houses[0] ? (
              <Link
                href={`/houses/${data.houses[0].id}/billing`}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-brand via-brand-dark to-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:from-brand-dark hover:via-accent hover:to-ink"
              >
                Start a new bill
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.bills.map((bill) => {
            const houseId = bill.house_id;
            return (
              <Card
                key={bill.id}
                className="animate-fade-up border-amber-200/60 bg-white dark:border-amber-500/20 dark:bg-slate-900/82"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                    <FilePen className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
                    Draft
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-lg font-semibold text-ink dark:text-slate-50">
                    {formatMonthLabel(bill.billing_month)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{bill.house_name}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                      Bill amount
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink dark:text-slate-50">
                      {formatCurrency(bill.main_bill_amount)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                      Total units
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink dark:text-slate-50">
                      {bill.total_units.toFixed(2)}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/houses/${houseId}/billing?draftId=${bill.id}`}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand via-brand-dark to-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-accent/20 transition hover:from-brand-dark hover:via-accent hover:to-ink"
                >
                  Continue editing
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <DeleteDraftButton billId={bill.id} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
