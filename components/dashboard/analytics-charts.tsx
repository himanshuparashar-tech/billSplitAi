"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Card } from "@/components/shared/card";
import type { MemberUsagePoint, MonthlyUsagePoint, UsageSharePoint } from "@/types";

const pieColors = ["#59c14f", "#2f63b5", "#17346f", "#7ecf77", "#4d7ac4", "#2f8f3b"];

export function AnalyticsCharts({
  barData,
  lineData,
  pieData
}: {
  barData: MemberUsagePoint[];
  lineData: MonthlyUsagePoint[];
  pieData: UsageSharePoint[];
}) {
  const hasData = barData.length || lineData.length || pieData.length;

  if (!hasData) {
    return (
      <Card className="border-brand/10 bg-white dark:border-white/10 dark:bg-slate-900/82">
        <h3 className="text-lg font-semibold text-ink dark:text-slate-50">Analytics will appear after your first finalized bill</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Finalize a month to unlock the member comparison chart, monthly trend line, and usage share breakdown.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="animate-fade-up border-brand/10 bg-white dark:border-white/10 dark:bg-slate-900/82 xl:col-span-1">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-ink dark:text-slate-50">Units by member</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Quickly compare who is driving the largest share of usage.</p>
          </div>
          <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark dark:bg-brand/15 dark:text-brand">Usage</span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e6ff" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip cursor={{ fill: "rgba(89,193,79,0.08)" }} />
              <Bar dataKey="units" radius={[12, 12, 0, 0]} fill="#59c14f" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="animate-fade-up border-accent/10 bg-white dark:border-white/10 dark:bg-slate-900/82 xl:col-span-1" style={{ animationDelay: "120ms" }}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-ink dark:text-slate-50">Monthly trend</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">See whether total electricity usage is rising or stabilizing over time.</p>
          </div>
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-dark dark:bg-accent/15 dark:text-blue-200">Trend</span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e6ff" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="units" stroke="#2f63b5" strokeWidth={3} dot={{ r: 4, fill: "#2f63b5" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="animate-fade-up border-accent/10 bg-white dark:border-white/10 dark:bg-slate-900/82 xl:col-span-1" style={{ animationDelay: "220ms" }}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-ink dark:text-slate-50">Share of billed units</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Useful for spotting an unusually high member contribution to the bill.</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink ring-1 ring-accent/15 dark:bg-slate-950 dark:text-slate-100 dark:ring-white/10">Share</span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={48} paddingAngle={3}>
                {pieData.map((entry, index) => (
                  <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
