"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FinancialRow, MetricsDaily } from "../types";
import { formatNumber } from "../utils";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "../i18n";

type RevenueChartCardProps = {
  rows: FinancialRow[];
  metricsDaily?: MetricsDaily[] | null;
  loading?: boolean;
};

export function RevenueChartCard({ rows, metricsDaily, loading }: RevenueChartCardProps) {
  const { t } = useLocale();
  const chartData =
    metricsDaily?.length && metricsDaily
      ? metricsDaily.map((day) => ({
          name: `Day ${day.day}`,
          revenue: day.revenue,
          expense: (day.cogs || 0) + (day.opex || 0),
          profit: day.net_profit,
        }))
      : rows.length > 0
        ? rows.map((row) => ({
            name: row.day,
            revenue: row.revenue,
            expense: row.expense,
            profit: row.profit,
          }))
        : [
            { name: "Day 1", revenue: 12000, expense: 6500, profit: 5500 },
            { name: "Day 2", revenue: 13800, expense: 6400, profit: 7400 },
            { name: "Day 3", revenue: 14200, expense: 6600, profit: 7600 },
            { name: "Day 4", revenue: 15000, expense: 6800, profit: 8200 },
          ];

  return (
    <Card className="border-[#e8eaff] shadow-sm w-full rounded-3xl">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#2c2f52]">{t("chart.costProfitTitle")}</p>
            <p className="text-xs text-[#7a80a7]">{t("chart.overview")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-4 h-[320px] rounded-2xl border border-[#edf0ff] bg-white px-4 pb-4 pt-5 shadow-inner">
          {loading ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={22} barGap={10}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6b62ff" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.85} />
                </linearGradient>
                <linearGradient id="expGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5ad6ff" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#eef1ff" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#7a80a7", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(76, 75, 214, 0.08)" }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="rounded-xl border border-[#e5e7ff] bg-white px-3 py-2 text-xs shadow-lg">
                      <p className="font-semibold text-[#2f3266]">{label}</p>
                      <p className="text-[#4f46e5]">Revenue: ฿{formatNumber(Number(payload[0].value) || 0)}</p>
                      <p className="text-[#0996d3]">Expense: ฿{formatNumber(Number(payload[1].value) || 0)}</p>
                    </div>
                  ) : null
                }
              />
              <Legend verticalAlign="top" height={30} wrapperStyle={{ color: "#7a80a7", fontSize: 12 }} iconType="circle" />
              <Bar
                dataKey="expense"
                name={t("chart.expense")}
                radius={[6, 6, 4, 4]}
                fill="url(#expGradient)"
              />
              <Bar
                dataKey="revenue"
                name={t("chart.revenue")}
                radius={[6, 6, 4, 4]}
                fill="url(#revGradient)"
              />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
