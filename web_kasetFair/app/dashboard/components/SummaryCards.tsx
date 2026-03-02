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
  const [dbRevenue, setDbRevenue] = useState(0);
  const [dbCogs, setDbCogs] = useState(0);
  const [dbOpex, setDbOpex] = useState(0);
  const [dbNetProfit, setDbNetProfit] = useState(0);
  useEffect(() => {
    if (!storeId) return;
    const fetchFinancialData = async () => {
      try {
        // Fetch Revenue
        const revenueRes = await fetch("/api/store/revenue_table", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ store_id: storeId }),
        });
        const revenueData = await revenueRes.json();
        console.log("Revenue API Response:", revenueData);
        if (revenueData.totalRevenue) {
          setDbRevenue(revenueData.totalRevenue);
        }
        if (revenueData.netProfit) {
          setDbNetProfit(revenueData.netProfit);
        }
        // Fetch COGS
        const cogsRes = await fetch("/api/store/cog_table", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ store_id: storeId }),
        });
        const cogsData = await cogsRes.json();
        console.log("COGS API Response:", cogsData);
        if (cogsData.totalCog) {
          setDbCogs(cogsData.totalCog);
        }
        // Fetch OpEx
        const opexRes = await fetch("/api/store/opex_table", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ store_id: storeId }),
        });
        const opexData = await opexRes.json();
        console.log("OpEx API Response:", opexData);
        if (opexData.totalOpex) {
          setDbOpex(opexData.totalOpex);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchFinancialData();
  }, [storeId]);

  const totalRevenue = dbRevenue || planData?.total_revenue || revenue;
  /*  const csvRows = useMemo(() => {
      if (!planData?.financial_csv) return [];
      return parseFinancialCsv(planData.financial_csv);
    }, [planData?.financial_csv]);*/

  /* const csvTotalCogs = useMemo(
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
   );*/

  const totalCogs = dbCogs || metricsSummary?.total_cogs || 0;
  const totalOpex = dbOpex || metricsSummary?.total_opex || 0;
  const netProfit = dbNetProfit || metricsSummary?.net_profit || 0;
  const isLoading = loading || planLoading;

  const statItems = [
    {
      title: "Total Revenue",
      value: totalRevenue,
      /*delta: "+0.0%",*/
    },
    {
      title: "Total COGS",
      value: totalCogs,
      /*delta: "-0.0%",*/
    },
    {
      title: "Net Profit",
      value: netProfit,
      /*delta: "+0.0%", */
    },
    {
      title: "OpEX",
      value: totalOpex,
      /* delta: "-0.0%",*/
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
              {/*{item.delta}*/}
            </span>
          </div>
        </Card>
      ))}
    </section>
  );
}
