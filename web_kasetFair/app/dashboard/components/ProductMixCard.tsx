import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { accentPalette } from "../constants";
import type { MetricsProduct, ProductMix } from "../types";
import { formatNumber } from "../utils";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, LabelList } from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type { ContentType } from "recharts/types/component/Label";
import { useLocale } from "../i18n";
import { useMemo, useState } from "react";

type ProductMixCardProps = {
  productMix: ProductMix[];
  metricsProducts?: MetricsProduct[] | null;
  summaryRevenue: number;
  summaryProfit: number;
  averageCustomers: number;
  totalItems: number;
  loading?: boolean;
  assumptions?: string | null;
};

const MAX_PIE_ITEMS = 5;

type ChartDatum = ProductMix & { value: number };

function normalizePieData(data: ProductMix[]) {
  return data
    .map((item) => {
      const value =
        typeof item.value === "number"
          ? item.value
          : typeof item.percent === "number"
            ? item.percent
            : 0;
      return { ...item, value };
    })
    .filter((item) => item.value > 0);
}

function assignPercent(items: ChartDatum[], total: number) {
  return items.map((item) => ({
    ...item,
    percent: total ? Math.round(((item.value / total) * 1000)) / 10 : 0,
  }));
}

function buildPieData(data: ProductMix[]): ChartDatum[] {
  const normalized = normalizePieData(data);
  if (!normalized.length) return [];

  const sorted = [...normalized].sort((a, b) => b.value - a.value);
  const totalValue = sorted.reduce((sum, item) => sum + item.value, 0);
  if (!totalValue) return [];

  if (sorted.length <= MAX_PIE_ITEMS) {
    return assignPercent(sorted, totalValue);
  }

  const top = sorted.slice(0, MAX_PIE_ITEMS - 1);
  const rest = sorted.slice(MAX_PIE_ITEMS - 1);
  const restValue = rest.reduce((sum, i) => sum + i.value, 0);

  return assignPercent(
    [
      ...top,
      {
        name: "อื่น ๆ",
        value: restValue,
      },
    ],
    totalValue,
  );
}

const RADIAN = Math.PI / 180;

const renderProductLabel = (props: PieLabelRenderProps) => {
  if (
    props.cx == null ||
    props.cy == null ||
    props.midAngle == null ||
    props.innerRadius == null ||
    props.outerRadius == null ||
    props.name == null
  ) {
    return null;
  }

  const cx = Number(props.cx);
  const cy = Number(props.cy);
  const midAngle = Number(props.midAngle);
  const innerRadius = Number(props.innerRadius);
  const outerRadius = Number(props.outerRadius);
  const percentValue = typeof props.percent === "number" ? props.percent : 0;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const labelText = typeof props.name === "string" ? props.name : String(props.name);

  return (
    <text
      x={x}
      y={y}
      fill="#2c2f52"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${labelText} ${(Math.round(percentValue * 1000) / 10).toFixed(1)}%`}
    </text>
  );
};

export function ProductMixCard({
  productMix,
  metricsProducts,
  totalItems,
  loading,
  assumptions,
}: ProductMixCardProps) {
  const { t } = useLocale();
  const [isDailyView, setIsDailyView] = useState(false);

  const totalUnits =
    metricsProducts?.reduce((sum, product) => sum + (product.total_units || 0), 0) ??
    totalItems ??
    0;
  const fallbackMix =
    !productMix.length && totalUnits > 0 && metricsProducts?.length
      ? metricsProducts.map((product) => ({
        name: product.name,
        value: product.total_units || 0,
        percent: Math.max(0, Math.round(((product.total_units || 0) / totalUnits) * 1000) / 10),
      }))
      : [];
  const rawData = productMix.length ? productMix : fallbackMix;
  const chartData = buildPieData(rawData);
  const totalChartValue = chartData.reduce((sum, item) => sum + (item.value || 0), 0);
  const tooltipFormatter = (value: number | string) => {
    const numericValue = typeof value === "number" ? value : Number(value) || 0;
    const percentValue = totalChartValue ? (numericValue / totalChartValue) * 100 : 0;
    return [`${formatNumber(numericValue)} pcs (${percentValue.toFixed(1)}%)`, t("mix.tooltipShare")];
  };
  const targetUnits = totalUnits > 0 ? Math.round(totalUnits * 1.1) : 500;
  const percentToTarget = targetUnits ? Math.min(100, Math.round((totalUnits / targetUnits) * 100)) : 0;

  // Prepare Data
  const { dailyCharts, totalRevenueData } = useMemo(() => {
    if (!assumptions) return { dailyCharts: [], totalRevenueData: [] };
    try {
      const parsed = typeof assumptions === "string" ? JSON.parse(assumptions) : assumptions;
      const products = parsed.products || [];
      if (!Array.isArray(products)) return { dailyCharts: [], totalRevenueData: [] };

      // 1. Daily Charts (Revenue)
      const daily = Array.from({ length: 9 }).map((_, dayIndex) => {
        const dayMix: ProductMix[] = products.map((p: any) => {
          const forecast = p.sales_forecast;
          const price = Number(p.price_per_unit) || 0;
          let qty = 0;
          if (Array.isArray(forecast)) {
            qty = Number(forecast[dayIndex]) || 0;
          }
          const revenue = qty * price;
          return { name: p.name || "Product", value: revenue };
        });
        const validMix = dayMix.filter((i) => i.value > 0);
        return {
          day: dayIndex + 1,
          data: buildPieData(validMix),
        };
      });

      // 2. Total Chart (Sum of 9 Days Revenue)
      const totalMix: ProductMix[] = products.map((p: any) => {
        const forecast = p.sales_forecast || [];
        const price = Number(p.price_per_unit) || 0;
        let totalQty = 0;
        if (Array.isArray(forecast)) {
          totalQty = forecast.reduce((sum: number, q: any) => sum + (Number(q) || 0), 0);
        }
        const totalRevenue = totalQty * price;
        return { name: p.name || "Product", value: totalRevenue };
      });
      const totalData = buildPieData(totalMix.filter((i) => i.value > 0));

      return { dailyCharts: daily, totalRevenueData: totalData };
    } catch {
      return { dailyCharts: [], totalRevenueData: [] };
    }
  }, [assumptions]);

  // Determine Main Chart Data
  // If assumptions exist, use totalRevenueData (Sum 9 Days Revenue).
  // Fallback to 'chartData' (Metrics/Legacy) if no assumptions parsed.
  const activeChartData = totalRevenueData.length > 0 ? totalRevenueData : chartData;
  // If totalRevenueData is used, we are in "Revenue Mode" (Baht)
  // Check if we derived data from assumptions (which means we have revenue data)
  const isRevenueMode = totalRevenueData.length > 0;

  const activeTotalValue = activeChartData.reduce((sum, item) => sum + (item.value || 0), 0);

  const mainTooltipFormatter = (
    value: number | string,
    name?: string,
    entry?: { payload?: { name?: string } },
  ) => {
    const numericValue = typeof value === "number" ? value : Number(value) || 0;
    const percentValue = activeTotalValue ? (numericValue / activeTotalValue) * 100 : 0;
    const unit = isRevenueMode ? "฿" : "";
    const suffix = isRevenueMode ? "Revenue" : "pcs";
    const valStr = formatNumber(numericValue);
    const tooltipName =
      entry?.payload?.name ??
      (typeof name === "string" ? name : null) ??
      (isRevenueMode ? "Revenue" : t("mix.tooltipShare"));
    const suffixText = !isRevenueMode ? ` ${suffix}` : "";
    const percentText = isRevenueMode && percentValue ? ` (${percentValue.toFixed(1)}%)` : "";

    return [`${unit}${valStr}${suffixText}${percentText}`, tooltipName];
  };

  return (
    <Card className="space-y-4 rounded-3xl border-[#e8eaff] bg-white p-4 shadow-sm">
      <CardHeader className="pb-0">
        <div className="flex w-full items-center">
          <div>
            <p className="text-sm font-semibold text-[#2c2f52]">
              {isDailyView ? t("mix.title") + " (9 Days)" : t("mix.title") + " (Total)"}
            </p>
          </div>
          <button
            onClick={() => setIsDailyView(!isDailyView)}
            className="ml-auto text-xs font-semibold text-[#4c4bd6] hover:underline"
          >
            {isDailyView ? t("assump.back") : t("btn.seeAll")}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {isDailyView ? (
          <div className="grid grid-cols-3 gap-4 pb-4">
            {dailyCharts.map((dayChart) => (
              <div key={dayChart.day} className="flex flex-col items-center">
                <span className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Day {dayChart.day}
                </span>
                <div className="h-24 w-full">
                  {dayChart.data.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dayChart.data}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={15}
                          outerRadius={30}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {dayChart.data.map((entry, index) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={accentPalette[index % accentPalette.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, _name, entry) => [
                            `฿${formatNumber(Number(value) || 0)}`,
                            entry?.payload?.name ?? "Revenue",
                          ]}
                          contentStyle={{ borderRadius: 8, fontSize: 10 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-slate-300">
                      -
                    </div>
                  )}
                </div>
                <div className="text-[10px] font-semibold text-slate-600">
                  ฿{formatNumber(dayChart.data.reduce((acc, cur) => acc + cur.value, 0))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="h-56 w-full">
              {loading ? (
                <Skeleton className="h-full w-full rounded-full" />
              ) : activeChartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {activeChartData.map((_, idx) => (
                        <linearGradient key={`grad-${idx}`} id={`mix-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={accentPalette[idx % accentPalette.length]} stopOpacity={0.95} />
                          <stop offset="100%" stopColor={accentPalette[idx % accentPalette.length]} stopOpacity={0.8} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={activeChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      stroke="#f8f9ff"
                      strokeWidth={2}
                    >
                      {activeChartData.map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={`url(#mix-${index})`} />
                      ))}
                      <LabelList content={renderProductLabel as ContentType} />
                    </Pie>
                    <Tooltip formatter={mainTooltipFormatter} contentStyle={{ borderRadius: 12, borderColor: "#e4e7ff", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-[#9aa0c7]">
                  {t("mix.noData")}
                </div>
              )}
            </div>

            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-sm text-[#7a80a7]">
                <p>{t("mix.performance")}</p>
                <p>
                  {t("mix.sell")} {totalUnits ? formatNumber(totalUnits) : "-"} / {formatNumber(targetUnits)} pcs
                </p>
              </div>
              <div className="h-2 w-full rounded-full bg-[#eef0ff]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#4c4bd6] to-[#a78bfa]"
                  style={{ width: `${percentToTarget}%` }}
                />
              </div>
              <p className="text-xs text-[#4c4bd6]">{t("mix.trend")}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
