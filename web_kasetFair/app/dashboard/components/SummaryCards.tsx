import { Card } from "@/components/ui/card";
import type { MetricsSummary } from "../types";
import { formatNumber, parseFinancialCsv } from "../utils";
import { useEffect, useMemo, useState } from "react";

type SummaryCardsProps = {
  revenue: number;
  metricsSummary?: MetricsSummary | null;
  loading?: boolean;
  storeId?: string;
};

type BusinessPlanRow = {
  total_revenue?: number;
  net_profit?: number;
  financial_csv?: string | Record<string, unknown> | null;
};

export function SummaryCards({
  revenue,
  metricsSummary,
  loading,
  storeId,
}: SummaryCardsProps) {
  const [planData, setPlanData] = useState<BusinessPlanRow | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      if (!storeId) {
        setPlanData(null);
        return;
      }

      setPlanLoading(true);
      try {
        const res = await fetch("/api/store/business-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ store_id: storeId }),
        });

        if (!res.ok) {
          if (!cancelled) setPlanData(null);
          return;
        }

        const data = (await res.json()) as BusinessPlanRow | { data: null };
        if (!cancelled) {
          if ("data" in data && data.data === null) {
            setPlanData(null);
          } else {
            setPlanData(data as BusinessPlanRow);
          }
        }
      } catch {
        if (!cancelled) setPlanData(null);
      } finally {
        if (!cancelled) setPlanLoading(false);
      }
    }

    loadPlan();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const totalRevenue = planData?.total_revenue ?? metricsSummary?.total_revenue ?? revenue;
  const csvRows = useMemo(() => {
    if (!planData?.financial_csv) return [];
    return parseFinancialCsv(planData.financial_csv);
  }, [planData?.financial_csv]);

  const csvTotalCogs = useMemo(
    () =>
      csvRows.reduce((sum, row) => {
        const cogs = row.cogs ?? row.expense ?? 0;
        return sum + cogs;
      }, 0),
    [csvRows],
  );

  const csvTotalOpex = useMemo(
    () =>
      csvRows.reduce((sum, row) => {
        return sum + (row.opex ?? 0);
      }, 0),
    [csvRows],
  );

  const totalCogs = csvRows.length ? csvTotalCogs : metricsSummary?.total_cogs ?? 0;
  const totalOpex = csvRows.length ? csvTotalOpex : metricsSummary?.total_opex ?? 0;
  const netProfit = planData?.net_profit ?? metricsSummary?.net_profit ?? metricsSummary?.gross_profit ?? (totalRevenue - totalCogs);
  const isLoading = loading || planLoading;

  const statItems = [
    {
      title: "Total Revenue",
      value: totalRevenue,
      delta: "+0.0%",
    },
    {
      title: "Total COGS",
      value: totalCogs,
      delta: "-0.0%",
    },
    {
      title: "Net Profit",
      value: netProfit,
      delta: "+0.0%",
    },
    {
      title: "OpEX",
      value: totalOpex,
      delta: "-0.0%",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {statItems.map((item) => (
        <Card
          key={item.title}
          className="rounded-2xl border border-[#e6e9ff] bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#b0b3d6]">
                {item.title}
              </p>
              <p className="mt-3 text-xl font-semibold text-[#2f3266]">
                {isLoading ? (
                  <span className="inline-block h-4 w-20 animate-pulse rounded bg-slate-200/80" />
                ) : (
                  `฿${formatNumber(item.value)}`
                )}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#7a80a7]">
              {item.delta}
            </span>
          </div>
        </Card>
      ))}
    </section>
  );
}
