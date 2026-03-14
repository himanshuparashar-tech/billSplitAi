import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicBillActions } from "@/components/billing/public-bill-actions";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { getBillSnapshotById } from "@/lib/data";
import { formatCurrency, formatMonthLabel } from "@/lib/utils";

export default async function PublicBillPage({ params }: { params: { billId: string } }) {
  const bill = await getBillSnapshotById(params.billId, { publicAccess: true });

  if (!bill || bill.status !== "finalized") {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-panel backdrop-blur dark:border-white/10 dark:bg-slate-950/85 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <Logo />
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800">
              Open SplitBill AI
            </Link>
          </div>
        </header>

        <section id="public-bill-invoice" className="overflow-hidden rounded-[36px] border border-white/70 bg-white/92 shadow-panel backdrop-blur dark:border-white/10 dark:bg-slate-950/92">
          <div className="surface-grid border-b border-slate-200 bg-gradient-to-r from-white via-brand-soft/50 to-accent-soft/60 p-6 dark:border-white/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent dark:text-blue-200">Public bill invoice</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{bill.house.name}</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{formatMonthLabel(bill.billing_month)}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                <div className="rounded-3xl bg-white/80 p-4 ring-1 ring-slate-200 dark:bg-slate-950/80 dark:ring-white/10">
                  <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Total bill</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{formatCurrency(bill.main_bill_amount)}</p>
                </div>
                <div className="rounded-3xl bg-white/80 p-4 ring-1 ring-slate-200 dark:bg-slate-950/80 dark:ring-white/10">
                  <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Price per unit</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{formatCurrency(bill.price_per_unit)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 p-6 dark:bg-slate-950/92 sm:p-8">
            <PublicBillActions bill={bill} targetId="public-bill-invoice" />

            <div className="overflow-hidden rounded-[28px] border border-slate-200 dark:border-white/10">
              <table className="min-w-full divide-y divide-slate-200 text-left dark:divide-white/10">
                <thead className="bg-slate-50 dark:bg-slate-900/70">
                  <tr className="text-sm text-slate-500 dark:text-slate-400">
                    <th className="px-5 py-4 font-medium">Member name</th>
                    <th className="px-5 py-4 font-medium">Units consumed</th>
                    <th className="px-5 py-4 font-medium">Bill amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {bill.results.map((result) => (
                    <tr key={result.id} className="bg-white dark:bg-slate-950/92">
                      <td className="px-5 py-4 font-semibold text-slate-950 dark:text-slate-50">{result.member_name_snapshot}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{result.final_units.toFixed(2)} units</td>
                      <td className="px-5 py-4 font-semibold text-slate-950 dark:text-slate-50">{formatCurrency(result.bill_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-900/70">
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Total units</p>
                <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">{bill.total_units.toFixed(2)}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-900/70">
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Motor units</p>
                <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">{bill.motor_units.toFixed(2)}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-900/70">
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Finalized</p>
                <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">Snapshot locked</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

