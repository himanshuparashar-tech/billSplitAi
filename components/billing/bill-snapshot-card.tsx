import Image from "next/image";

import { Card } from "@/components/shared/card";
import { formatCurrency, formatMonthLabel } from "@/lib/utils";
import type { BillSnapshot } from "@/types";

export function BillSnapshotCard({ bill, targetId }: { bill: BillSnapshot; targetId: string }) {
  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white p-0 dark:border-white/10 dark:bg-slate-950/85">
      <div id={targetId} className="bg-white p-6 dark:bg-slate-950/85 sm:p-8">
        <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand dark:text-brand">{bill.status} bill snapshot</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{bill.house.name}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatMonthLabel(bill.billing_month)}</p>
          </div>

          <div className="grid gap-3 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900/70 dark:text-slate-300 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Total bill</p>
              <p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">{formatCurrency(bill.main_bill_amount)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Price per unit</p>
              <p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">{formatCurrency(bill.price_per_unit)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Total units</p>
              <p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">{bill.total_units.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Motor units</p>
              <p className="mt-1 font-semibold text-slate-950 dark:text-slate-50">{bill.motor_units.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-white/10">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="pb-3 font-medium">Member name</th>
                <th className="pb-3 font-medium">Units consumed</th>
                <th className="pb-3 font-medium">Motor share</th>
                <th className="pb-3 font-medium">Bill amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {bill.results.length ? (
                bill.results.map((result) => (
                  <tr key={result.id}>
                    <td className="py-4 font-semibold text-slate-950 dark:text-slate-50">{result.member_name_snapshot}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">{result.member_units.toFixed(2)}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">{result.motor_share_units.toFixed(2)}</td>
                    <td className="py-4 font-semibold text-slate-950 dark:text-slate-50">{formatCurrency(result.bill_amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-sm text-slate-500 dark:text-slate-400" colSpan={4}>
                    No finalized member results yet. Save and finalize this month to lock the bill snapshot.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {bill.readings.some((reading) => reading.meter_photo_url) ? (
          <div className="mt-8 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Meter photo previews</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Each uploaded meter image is tied to the saved reading for this month.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {bill.readings
                .filter((reading) => reading.meter_photo_url)
                .map((reading) => (
                  <div key={reading.id} className="overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10">
                    <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-900">
                      <Image
                        src={reading.meter_photo_url!}
                        alt={`${reading.member_name ?? "Member"} meter`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      <p className="font-semibold text-slate-950 dark:text-slate-50">{reading.member_name ?? "Member"}</p>
                      <p>Previous: {reading.previous_reading.toFixed(2)}</p>
                      <p>Current: {reading.current_reading.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
