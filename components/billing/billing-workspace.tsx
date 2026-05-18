"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Camera, Gauge, Pencil, Receipt, Sparkles, Trash2, Waves, Zap } from "lucide-react";

import { Button } from "@/components/shared/button";
import { Card } from "@/components/shared/card";
import { FormErrorSummary } from "@/components/shared/form-error-summary";
import { MonthPicker } from "@/components/shared/month-picker";
import { useToast } from "@/components/shared/toast-provider";
import { calculateBillSummary } from "@/lib/billing";
import { appConfig, isSupabaseConfigured } from "@/lib/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatCurrency, monthInputValue } from "@/lib/utils";
import type { BillSnapshot, Member } from "@/types";

interface ReadingRowState {
  memberId: string;
  memberName: string;
  previousReading: string;
  currentReading: string;
  daysStayed: number;
  file: File | null;
  existingPhotoPath?: string | null;
  existingPhotoUrl?: string | null;
}

function daysInMonth(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function getInitialRows(members: Member[], latestBill: BillSnapshot | null, defaultDays: number): ReadingRowState[] {
  return members.map((member) => {
    const previousFromLatest = latestBill?.readings.find((reading) => reading.member_id === member.id);
    const previous = previousFromLatest ? previousFromLatest.current_reading : 0;

    return {
      memberId: member.id,
      memberName: member.name,
      previousReading: previous.toString(),
      currentReading: previous.toString(),
      daysStayed: defaultDays,
      file: null,
      existingPhotoPath: previousFromLatest?.meter_photo_path ?? null,
      existingPhotoUrl: previousFromLatest?.meter_photo_url ?? null
    };
  });
}

function getRowsFromDraft(members: Member[], draftBill: BillSnapshot): ReadingRowState[] {
  const defaultDays = daysInMonth(draftBill.billing_month);
  return members.map((member) => {
    const reading = draftBill.readings.find((r) => r.member_id === member.id);
    return {
      memberId: member.id,
      memberName: member.name,
      previousReading: reading ? reading.previous_reading.toString() : "0",
      currentReading: reading ? reading.current_reading.toString() : "0",
      daysStayed: defaultDays,
      file: null,
      existingPhotoPath: reading?.meter_photo_path ?? null,
      existingPhotoUrl: reading?.meter_photo_url ?? null
    };
  });
}

async function uploadMeterPhoto(houseId: string, billingMonth: string, memberId: string, file: File) {
  const supabase = createSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const filePath = `${houseId}/${billingMonth}/${memberId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(appConfig.storageBucket).upload(filePath, file, {
    upsert: true
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(appConfig.storageBucket).getPublicUrl(filePath);

  return {
    path: filePath,
    url: data.publicUrl
  };
}

export function BillingWorkspace({
  houseId,
  members,
  latestBill,
  draftBill,
  disabled
}: {
  houseId: string;
  members: Member[];
  latestBill: BillSnapshot | null;
  draftBill?: BillSnapshot | null;
  disabled: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const initialMonth = draftBill ? draftBill.billing_month : monthInputValue(new Date());
  const [billingMonth, setBillingMonth] = useState(initialMonth);
  const [mainBillAmount, setMainBillAmount] = useState(() =>
    draftBill ? draftBill.main_bill_amount.toString() : ""
  );
  const [totalUnits, setTotalUnits] = useState(() =>
    draftBill ? draftBill.total_units.toString() : ""
  );
  const [motorPreviousReading, setMotorPreviousReading] = useState(() =>
    draftBill ? draftBill.motor_previous_reading.toString() : String(latestBill?.motor_current_reading ?? 0)
  );
  const [motorCurrentReading, setMotorCurrentReading] = useState(() =>
    draftBill ? draftBill.motor_current_reading.toString() : String(latestBill?.motor_current_reading ?? 0)
  );
  const [rows, setRows] = useState<ReadingRowState[]>(() =>
    draftBill
      ? getRowsFromDraft(members, draftBill)
      : getInitialRows(members, latestBill, daysInMonth(initialMonth))
  );
  const [proRateEnabled, setProRateEnabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<false | "draft" | "finalize">(false);

  const prevMonthRef = useRef(billingMonth);
  useEffect(() => {
    const prev = prevMonthRef.current;
    if (prev === billingMonth) return;
    const oldDays = daysInMonth(prev);
    const newDays = daysInMonth(billingMonth);
    prevMonthRef.current = billingMonth;
    if (oldDays === newDays) return;
    setRows((current) =>
      current.map((row) => ({
        ...row,
        daysStayed: row.daysStayed === oldDays ? newDays : row.daysStayed
      }))
    );
  }, [billingMonth]);

  const totalDaysInMonth = daysInMonth(billingMonth);

  const parsedPayload = {
    houseId,
    billingMonth,
    mainBillAmount: Number(mainBillAmount || 0),
    totalUnits: Number(totalUnits || 0),
    motorPreviousReading: Number(motorPreviousReading || 0),
    motorCurrentReading: Number(motorCurrentReading || 0),
    readings: rows.map((row) => ({
      memberId: row.memberId,
      previousReading: Number(row.previousReading || 0),
      currentReading: Number(row.currentReading || 0),
      daysStayed: row.daysStayed
    }))
  };

  let preview: ReturnType<typeof calculateBillSummary> | null = null;

  try {
    if (parsedPayload.mainBillAmount > 0 && parsedPayload.totalUnits > 0 && rows.length > 0) {
      preview = calculateBillSummary(parsedPayload);
    }
  } catch {
    preview = null;
  }

  const validationErrors: string[] = [];
  if (!billingMonth) validationErrors.push("Choose a billing month.");
  if (!mainBillAmount || Number(mainBillAmount) <= 0) validationErrors.push("Enter the main bill amount.");
  if (!totalUnits || Number(totalUnits) <= 0) validationErrors.push("Enter the total main-meter units.");
  if (Number(motorCurrentReading) < Number(motorPreviousReading)) validationErrors.push("Motor current reading must be greater than or equal to motor previous reading.");
  for (const row of rows) {
    if (Number(row.currentReading) < Number(row.previousReading)) {
      validationErrors.push(`${row.memberName}: current reading must be greater than or equal to previous reading.`);
    }
  }

  const motorUnitsValue = Math.max(0, Number(motorCurrentReading || 0) - Number(motorPreviousReading || 0));
  const quickRate = Number(mainBillAmount) > 0 && Number(totalUnits) > 0 ? Number(mainBillAmount) / Number(totalUnits) : 0;

  const totalRoomUnits = rows.reduce((sum, row) => {
    const units = Number(row.currentReading || 0) - Number(row.previousReading || 0);
    return sum + (Number.isFinite(units) && units >= 0 ? units : 0);
  }, 0);
  const roomVsMainDiff = Number(totalUnits || 0) - (totalRoomUnits + motorUnitsValue);

  function updateRow(memberId: string, key: keyof ReadingRowState, value: string | File | null | number) {
    setRows((current) => current.map((row) => (row.memberId === memberId ? { ...row, [key]: value } : row)));
  }

  function clearRowPhoto(memberId: string) {
    setRows((current) =>
      current.map((row) =>
        row.memberId === memberId
          ? { ...row, file: null, existingPhotoPath: null, existingPhotoUrl: null }
          : row
      )
    );
  }

  async function handleSubmit(mode: "draft" | "finalize") {
    if (validationErrors.length) {
      const text = validationErrors[0];
      setMessage(text);
      toast(text, "error");
      return;
    }

    if (disabled || !isSupabaseConfigured) {
      const text = "Configure Supabase to save readings and finalized bills.";
      setMessage(text);
      toast(text, "error");
      return;
    }

    setLoading(mode);
    setMessage(null);

    try {
      const readings = [] as Array<{
        memberId: string;
        previousReading: number;
        currentReading: number;
        meterPhotoPath?: string | null;
        meterPhotoUrl?: string | null;
      }>;

      for (const row of rows) {
        let photo = {
          path: row.existingPhotoPath ?? null,
          url: row.existingPhotoUrl ?? null
        };

        if (row.file) {
          photo = await uploadMeterPhoto(houseId, billingMonth, row.memberId, row.file);
        }

        readings.push({
          memberId: row.memberId,
          previousReading: Number(row.previousReading || 0),
          currentReading: Number(row.currentReading || 0),
          meterPhotoPath: photo.path,
          meterPhotoUrl: photo.url
        });
      }

      const response = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          houseId,
          billingMonth,
          mainBillAmount: Number(mainBillAmount),
          totalUnits: Number(totalUnits),
          motorPreviousReading: Number(motorPreviousReading),
          motorCurrentReading: Number(motorCurrentReading),
          readings,
          mode
        })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save bill.");
      }

      const successMessage =
        mode === "finalize"
          ? `Bill finalized. Difference vs tracked units: ${result.differenceUnits.toFixed(2)} units.`
          : "Draft saved successfully.";

      setMessage(successMessage);
      toast(mode === "finalize" ? "Bill calculated and finalized." : "Reading saved.");
      router.refresh();
      if (mode === "finalize") {
        router.push(`/history?billId=${result.billId}`);
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unable to save bill.";
      setMessage(text);
      toast(text, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <FormErrorSummary title="Fix these details before saving" errors={[...new Set(validationErrors)]} />

      <div className="grid gap-6 xl:grid-cols-[1.32fr_1.68fr]">
        <div className="space-y-6">
          <Card className="animate-fade-up border-brand/10 bg-white dark:border-white/10 dark:bg-slate-900/82">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-brand-soft p-3 text-brand-dark dark:bg-brand/15 dark:text-brand">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent dark:text-blue-200">Step 1</p>
                <h3 className="mt-2 text-xl font-semibold text-ink dark:text-slate-50">Build the invoice setup</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Start with the billing month, official bill amount, total main-meter units, and motor meter values.
                  This turns the raw bill into a clean pricing base before room readings are added.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4 rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-brand-soft/30 to-accent-soft/45 p-4 dark:border-white/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent dark:text-blue-200">Invoice period</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose which month this finalized snapshot belongs to.</p>
                  </div>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950/80 dark:text-slate-300 dark:ring-white/10">
                    Monthly snapshot
                  </span>
                </div>
                <MonthPicker value={billingMonth} onChange={setBillingMonth} disabled={disabled || loading !== false} />
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/75">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Gauge className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Expected rate</p>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-ink dark:text-slate-50">{quickRate > 0 ? formatCurrency(quickRate) : "--"}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Main bill amount divided by total units.</p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/75">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Waves className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Motor units</p>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-ink dark:text-slate-50">{motorUnitsValue.toFixed(2)}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Current motor reading minus previous motor reading.</p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/75">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Billing readiness</p>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-ink dark:text-slate-50">{validationErrors.length ? `${validationErrors.length} checks` : "Ready"}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Fix setup issues here before final review.</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/70 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl bg-brand-soft p-2.5 text-brand-dark dark:bg-brand/15 dark:text-brand">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent dark:text-blue-200">Official bill values</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use the exact amount and total units from the electricity bill.</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Main bill amount</span>
                    <input type="number" min="0" step="0.01" value={mainBillAmount} onChange={(event) => setMainBillAmount(event.target.value)} placeholder="9200" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Total main-meter units</span>
                    <input type="number" min="0" step="0.01" value={totalUnits} onChange={(event) => setTotalUnits(event.target.value)} placeholder="1948" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand" />
                  </label>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/70 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl bg-accent-soft p-2.5 text-accent dark:bg-accent/15 dark:text-blue-200">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent dark:text-blue-200">Motor meter</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">These units are split equally across all active rooms.</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Motor previous</span>
                    <input type="number" min="0" step="0.01" value={motorPreviousReading} onChange={(event) => setMotorPreviousReading(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Motor current</span>
                    <input type="number" min="0" step="0.01" value={motorCurrentReading} onChange={(event) => setMotorCurrentReading(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand" />
                  </label>
                </div>
              </div>
            </div>
          </Card>

          <Card className="animate-fade-up border-accent/10 bg-white dark:border-white/10 dark:bg-slate-900/82" style={{ animationDelay: "100ms" }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-accent-soft p-3 text-accent dark:bg-accent/15 dark:text-blue-200">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent dark:text-blue-200">Step 2</p>
                  <h3 className="mt-2 text-xl font-semibold text-ink dark:text-slate-50">Enter room readings</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Previous values are prefilled from the latest month where possible. Fill current readings room by room,
                    then attach photos only where needed.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProRateEnabled((v) => !v)}
                className={`shrink-0 rounded-2xl border px-3 py-2 text-xs font-semibold transition ${proRateEnabled ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400" : "border-slate-200 bg-slate-50 text-slate-500 hover:border-brand hover:text-brand dark:border-white/10 dark:bg-slate-900 dark:text-slate-400"}`}
              >
                {proRateEnabled ? "Pro-rate on" : "Pro-rate off"}
              </button>
            </div>

            <div className="mt-6 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400">
                    <th className="pb-3 font-medium" style={{ minWidth: "130px" }}>Room</th>
                    <th className="pb-3 font-medium" style={{ minWidth: "150px" }}>Previous</th>
                    <th className="pb-3 font-medium" style={{ minWidth: "150px" }}>Current</th>
                    <th className="pb-3 font-medium" style={{ minWidth: "80px" }}>Units</th>
                    {proRateEnabled && (
                      <th className="pb-3 font-medium" style={{ minWidth: "110px" }}>
                        Days
                        <span className="ml-1.5 text-[10px] font-normal text-slate-400">/ {totalDaysInMonth}</span>
                      </th>
                    )}
                    <th className="pb-3 font-medium" style={{ minWidth: "220px" }}>Meter photo</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const units = Number(row.currentReading || 0) - Number(row.previousReading || 0);
                    return (
                      <tr key={row.memberId} className="border-b border-slate-100 align-top dark:border-white/5">
                        <td className="py-4 font-semibold text-ink dark:text-slate-50">{row.memberName}</td>
                        <td className="py-4 pr-3">
                          <input type="number" min="0" step="0.01" value={row.previousReading} onChange={(event) => updateRow(row.memberId, "previousReading", event.target.value)} className="w-full min-w-[120px] rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand" />
                        </td>
                        <td className="py-4 pr-3">
                          <input type="number" min="0" step="0.01" value={row.currentReading} onChange={(event) => updateRow(row.memberId, "currentReading", event.target.value)} className="w-full min-w-[120px] rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand" />
                        </td>
                        <td className="py-4 text-slate-600 dark:text-slate-300 align-middle">{Number.isFinite(units) ? units.toFixed(2) : "0.00"}</td>
                        {proRateEnabled && (
                          <td className="py-4 pr-3">
                            <input
                              type="number"
                              min="1"
                              max={totalDaysInMonth}
                              step="1"
                              value={row.daysStayed}
                              onChange={(event) => updateRow(row.memberId, "daysStayed", Math.min(totalDaysInMonth, Math.max(1, Number(event.target.value) || 1)))}
                              className={`w-full min-w-[80px] rounded-2xl border px-4 py-3 outline-none transition focus:border-brand ${row.daysStayed < totalDaysInMonth ? "border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-500/10" : "border-slate-200"}`}
                            />
                          </td>
                        )}
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor={`file-${row.memberId}`}
                              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-brand hover:bg-brand-soft hover:text-brand dark:border-white/10 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-brand"
                              title="Upload meter photo"
                            >
                              <Pencil className="h-4 w-4" />
                            </label>
                            <input
                              id={`file-${row.memberId}`}
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(event) => updateRow(row.memberId, "file", event.target.files?.[0] ?? null)}
                            />
                            {(row.file || row.existingPhotoUrl) ? (
                              <>
                                <span className="max-w-[120px] truncate text-xs text-slate-600 dark:text-slate-300">
                                  {row.file ? row.file.name : "Saved photo"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => clearRowPhoto(row.memberId)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                                  title="Remove photo"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500">No photo</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-100 dark:border-white/5">
                    <td className="py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Motor meter</td>
                    <td className="py-3 text-sm text-slate-400 dark:text-slate-500">{motorPreviousReading || "0"}</td>
                    <td className="py-3 pr-3 text-sm text-slate-400 dark:text-slate-500">{motorCurrentReading || "0"}</td>
                    <td className="py-3 text-sm text-slate-500 dark:text-slate-400">{motorUnitsValue.toFixed(2)}</td>
                    {proRateEnabled && <td />}
                    <td />
                  </tr>
                  <tr className="border-t-2 border-slate-200 dark:border-white/15">
                    <td className="pt-4 font-semibold text-ink dark:text-slate-50">Total</td>
                    <td />
                    <td />
                    <td className="pt-4 font-semibold text-ink dark:text-slate-50">{(totalRoomUnits + motorUnitsValue).toFixed(2)}</td>
                    {proRateEnabled && <td />}
                    <td className="pt-4">
                      {Number(totalUnits) > 0 && (
                        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ring-1 ${Math.abs(roomVsMainDiff) < 0.01 ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20" : "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20"}`}>
                          {roomVsMainDiff >= 0 ? "+" : ""}{roomVsMainDiff.toFixed(2)} vs main meter
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-6 grid gap-4 md:hidden">
              {rows.map((row) => {
                const units = Number(row.currentReading || 0) - Number(row.previousReading || 0);
                return (
                  <div key={row.memberId} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/70">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-base font-semibold text-ink dark:text-slate-50">{row.memberName}</h4>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-accent ring-1 ring-accent/10 dark:bg-slate-900 dark:text-blue-200 dark:ring-white/10">{units.toFixed(2)} units</span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Previous</span>
                        <input type="number" min="0" step="0.01" value={row.previousReading} onChange={(event) => updateRow(row.memberId, "previousReading", event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Current</span>
                        <input type="number" min="0" step="0.01" value={row.currentReading} onChange={(event) => updateRow(row.memberId, "currentReading", event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand" />
                      </label>
                      {proRateEnabled && (
                        <label className="block">
                          <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Days / {totalDaysInMonth}</span>
                          <input
                            type="number" min="1" max={totalDaysInMonth} step="1"
                            value={row.daysStayed}
                            onChange={(event) => updateRow(row.memberId, "daysStayed", Math.min(totalDaysInMonth, Math.max(1, Number(event.target.value) || 1)))}
                            className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-brand ${row.daysStayed < totalDaysInMonth ? "border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-500/10" : "border-slate-200"}`}
                          />
                        </label>
                      )}
                    </div>
                    <div className="mt-3">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Meter photo</span>
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`file-mob-${row.memberId}`}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-brand hover:bg-brand-soft hover:text-brand dark:border-white/10 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-brand"
                        >
                          <Pencil className="h-4 w-4" />
                        </label>
                        <input
                          id={`file-mob-${row.memberId}`}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(event) => updateRow(row.memberId, "file", event.target.files?.[0] ?? null)}
                        />
                        {(row.file || row.existingPhotoUrl) ? (
                          <>
                            <span className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-300">
                              {row.file ? row.file.name : "Saved photo"}
                            </span>
                            <button
                              type="button"
                              onClick={() => clearRowPhoto(row.memberId)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">No photo</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {rows.length > 0 && (
                <div className="rounded-3xl border-2 border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/70">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent dark:text-blue-200">Total tracked units</h4>
                    <span className="text-xl font-semibold text-ink dark:text-slate-50">{(totalRoomUnits + motorUnitsValue).toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Rooms: {totalRoomUnits.toFixed(2)}</span>
                    <span>Motor: {motorUnitsValue.toFixed(2)}</span>
                  </div>
                  {Number(totalUnits) > 0 && (
                    <div className={`mt-3 rounded-2xl px-4 py-2.5 text-sm font-medium ${Math.abs(roomVsMainDiff) < 0.01 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}>
                      {roomVsMainDiff >= 0 ? "+" : ""}{roomVsMainDiff.toFixed(2)} units vs main meter ({Number(totalUnits).toFixed(2)})
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-4 xl:self-start">
          <Card className="animate-fade-up border-accent/10 bg-white dark:border-white/10 dark:bg-slate-900/82" style={{ animationDelay: "180ms" }}>
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-brand-soft p-3 text-brand-dark dark:bg-brand/15 dark:text-brand">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent dark:text-blue-200">Step 3</p>
                <h3 className="mt-2 text-xl font-semibold text-ink dark:text-slate-50">Review before saving</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Keep the main summary and actions on the right so users can verify numbers and save without losing context.
                </p>
              </div>
            </div>

            {preview ? (
              <div className="mt-6 space-y-4">
                <div className="grid gap-3">
                  <div className="rounded-3xl bg-brand-soft/60 p-4 dark:bg-brand/15">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Price per unit</p>
                    <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-50">{formatCurrency(preview.pricePerUnit)}</p>
                  </div>
                  <div className="rounded-3xl bg-accent-soft/60 p-4 dark:bg-accent/15">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Motor share · full month</p>
                    <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-50">{preview.motorSharePerFullMonth.toFixed(2)} units</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Pro-rated per room based on days stayed.</p>
                  </div>
                  <div className={`rounded-3xl p-4 ${Math.abs(preview.differenceUnits) < 0.01 ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-amber-50 dark:bg-amber-500/10"}`}>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Difference vs tracked units</p>
                    <p className="mt-2 text-2xl font-semibold text-ink dark:text-slate-50">{preview.differenceUnits.toFixed(2)} units</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Aim for zero when the tracked rooms fully explain the main meter.</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/70">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent dark:text-blue-200">Room split</h4>
                  <div className="mt-4 space-y-3">
                    {preview.results.map((result) => {
                      const row = rows.find((r) => r.memberId === result.member_id);
                      const isPartial = row && row.daysStayed < totalDaysInMonth;
                      return (
                        <div key={result.member_id} className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-ink dark:text-slate-50">{row?.memberName}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{result.final_units.toFixed(2)} billed units</p>
                            </div>
                            <p className="font-semibold text-ink dark:text-slate-50">{formatCurrency(result.bill_amount)}</p>
                          </div>
                          {isPartial && (
                            <p className="mt-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                              Motor share pro-rated: {row.daysStayed}/{totalDaysInMonth} days → {result.motor_share_units.toFixed(2)} units
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm leading-7 text-slate-500 dark:text-slate-400">Complete the bill details and room readings to unlock the live split preview here.</p>
            )}

            {message ? <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">{message}</p> : null}
            <div className="mt-6 flex flex-col gap-3">
              <Button onClick={() => handleSubmit("draft")} disabled={loading !== false || !rows.length || disabled}>
                {loading === "draft" ? "Saving draft..." : "Save draft"}
              </Button>
              <Button onClick={() => handleSubmit("finalize")} disabled={loading !== false || !rows.length || disabled}>
                {loading === "finalize" ? "Finalizing..." : "Finalize month"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
