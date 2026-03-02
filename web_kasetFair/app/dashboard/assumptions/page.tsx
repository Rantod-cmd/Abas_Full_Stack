"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlannerSidebar } from "../components/PlannerSidebar";
import { usePlannerState } from "../usePlannerState";
import {
  AssumptionMetricsOverride,
  buildChartData,
  ChartPoint,
  currency,
  deriveForecastStats,
  integer,
  parseAssumptionsPayload,
} from "./helpers";
import { LineChart } from "./components/LineChart";
import { LocaleProvider, useLocale } from "../i18n";

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      if (trimmed.includes(",")) {
        return trimmed
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [];
    }
  }
  return [];
}

export default function AssumptionsPage() {
  return (
    <LocaleProvider>
      <AssumptionsContent />
    </LocaleProvider>
  );
}

function AssumptionsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { assumptions, loadUserStores, metrics, currentShop, setSelectedShopId, setPreferredStoreId } =
    usePlannerState();
  const { t, locale, setLocale } = useLocale();
  const [cogsOverride, setCogsOverride] = useState<{ name: string; cost: number }[]>([]);
  const [assumptionMetrics, setAssumptionMetrics] = useState<AssumptionMetricsOverride | null>(null);
  const [selectedSku, setSelectedSku] = useState<string | undefined>(undefined);
  const [selectedDay, setSelectedDay] = useState<ChartPoint | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      loadUserStores();
    }
  }, [status, loadUserStores]);

  useEffect(() => {
    const storeIdParam = searchParams.get("store_id");
    if (storeIdParam) {
      setSelectedShopId(storeIdParam);
      setPreferredStoreId(storeIdParam);
    }
  }, [searchParams, setSelectedShopId, setPreferredStoreId]);

  useEffect(() => {
    const storeIdParam = searchParams.get("store_id");
    let storeId = currentShop?.store_id ?? currentShop?.id;

    if (!storeId || storeId === "initial") {
      storeId = storeIdParam ?? undefined;
    }

    if (!storeId || storeId === "initial") {
      setCogsOverride([]);
      return;
    }

    const fetchCogs = async () => {
      try {
        const res = await fetch("/api/store/cogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ store_id: storeId }),
        });
        if (!res.ok) {
          setCogsOverride([]);
          return;
        }
        const data = await res.json();
        if (data?.data === null) {
          setCogsOverride([]);
          return;
        }

        const ingredientList = toArray(data?.name ?? data?.data?.name ?? data?.ingredient ?? data?.data?.ingredient).map((item) => String(item));
        const costList = toArray(data?.price ?? data?.data?.price ?? data?.unit_cost ?? data?.data?.unit_cost).map((item) => Number(item));

        const rows = ingredientList.map((name, idx) => ({
          name: name,
          cost: Number.isFinite(costList[idx]) ? costList[idx] : 0,
        }));

        setCogsOverride(rows.filter((row) => row.name));
      } catch (err) {
        console.warn("⚠️ โหลด COGS ไม่สำเร็จ:", err);
        setCogsOverride([]);
      }
    };

    fetchCogs();
  }, [currentShop?.store_id, currentShop?.id, searchParams]);

  useEffect(() => {
    const storeIdParam = searchParams.get("store_id");
    let storeId = currentShop?.store_id ?? currentShop?.id;

    if (!storeId || storeId === "initial") {
      storeId = storeIdParam ?? undefined;
    }

    if (!storeId || storeId === "initial") {
      setAssumptionMetrics(null);
      return;
    }

    const fetchAssumptionMetrics = async () => {
      try {
        const res = await fetch(
          `/api/assumption/metrics?store_id=${encodeURIComponent(storeId)}`
        );

        if (!res.ok) {
          setAssumptionMetrics(null);
          return;
        }

        const record = (await res.json()) as
          | {
            foot_traffic?: unknown;
            interest_rate?: unknown;
            conversion_rate?: unknown;
            day1?: unknown;
            day2?: unknown;
            day3?: unknown;
            day4?: unknown;
            day5?: unknown;
            day6?: unknown;
            day7?: unknown;
            day8?: unknown;
            day9?: unknown;
          }
          | null;

        if (!record) {
          setAssumptionMetrics(null);
          return;
        }

        const normalize = (value: unknown): number | null => {
          if (typeof value === "string") {
            const cleaned = value.replace("%", "").trim();
            const num = Number(cleaned);
            return Number.isFinite(num) ? num : null;
          }

          const num = Number(value);
          return Number.isFinite(num) ? num : null;
        };

        const nextMetrics: AssumptionMetricsOverride = {
          footTraffic: normalize(record.foot_traffic),
          interestRate: normalize(record.interest_rate),
          conversionRate: normalize(record.conversion_rate),
          dailyFootTraffic: [
            normalize(record.day1),
            normalize(record.day2),
            normalize(record.day3),
            normalize(record.day4),
            normalize(record.day5),
            normalize(record.day6),
            normalize(record.day7),
            normalize(record.day8),
            normalize(record.day9),
          ],
        };

        setAssumptionMetrics(nextMetrics);
      } catch (err) {
        console.warn("⚠️ โหลด assumption metrics ไม่สำเร็จ:", err);
        setAssumptionMetrics(null);
      }
    };

    fetchAssumptionMetrics();
  }, [currentShop?.store_id, currentShop?.id, searchParams]);

  const { productOptions, topLevelIngredients, fallbackProductRows, variableCostRows } = useMemo(
    () => parseAssumptionsPayload(assumptions),
    [assumptions]
  );

  useEffect(() => {
    if (!selectedSku && productOptions[0]) {
      setSelectedSku(productOptions[0].value);
    }
  }, [productOptions, selectedSku]);
  const activeSku = useMemo(() => {
    if (!productOptions.length) return undefined;
    return productOptions.some((opt) => opt.value === selectedSku) ? selectedSku : productOptions[0].value;
  }, [productOptions, selectedSku]);

  const cogsRows = useMemo(() => {
    if (cogsOverride.length > 0) {
      return cogsOverride;
    }

    return [];
  }, [cogsOverride]);

  const cogsTotal = useMemo(
    () => cogsRows.reduce((sum, row) => sum + (Number.isFinite(row.cost) ? row.cost : 0), 0),
    [cogsRows]
  );

  const variableCostTotal = useMemo(
    () => variableCostRows.reduce((sum, row) => sum + (Number.isFinite(row.total) ? row.total : 0), 0),
    [variableCostRows]
  );

  const chartData = useMemo(() => buildChartData(metrics, assumptionMetrics ?? undefined), [metrics, assumptionMetrics]);
  const { statCards, estimatedBuyersPerDay, totalNineDayBuyers } = useMemo(
    () => deriveForecastStats(chartData, assumptionMetrics ?? undefined),
    [chartData, assumptionMetrics]
  );

  const totalFootTraffic = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.foot, 0);
  }, [chartData]);

  const displayStatCards = useMemo(() => {
    const cards = [...statCards];
    if (cards.length > 0) {
      if (selectedDay) {
        // Selected day: (Foot Traffic / (Conversion / 100)) / (Interest / 100)
        const val = (selectedDay.foot / ((selectedDay.conversion / 100) * (selectedDay.interest / 100)));
        cards[0] = {
          ...cards[0],
          value: integer(val),
        };
      } else {
        // Default: 9-day total
        cards[0] = {
          ...cards[0],
          value: integer(chartData.reduce((acc, curr) => acc + curr.foot, 0)),
        };
      }
    }
    return cards;
  }, [statCards, selectedDay, totalFootTraffic]);

  const displayEstBuyers = useMemo(() => {
    if (selectedDay) {
      // Selected day: Display Raw Foot Traffic (Day 1-9)
      return selectedDay.foot;
    }
    // Default: Average/Total as calculated by helper
    return estimatedBuyersPerDay;
  }, [selectedDay, estimatedBuyersPerDay]);

  const progressPercent = useMemo(() => {
    if (selectedDay) {
      // Interactive: Progress based on Day Index (Day 1 = 1/9, Day 9 = 9/9)
      const dayMatch = selectedDay.x.match(/Day (\d+)/i);
      if (dayMatch && dayMatch[1]) {
        const dayNum = parseInt(dayMatch[1], 10);
        return (dayNum / 9) * 100;
      }
      return 100; // Fallback
    }

    if (!totalNineDayBuyers) return 0;
    // Default: (Sum Traffic / Total Buyers) * 100
    return (totalFootTraffic / totalNineDayBuyers) * 100;
  }, [selectedDay, totalFootTraffic, totalNineDayBuyers]);

  const assumptionStrings = useMemo(() => {
    const formatNumber = (value?: number | null, suffix?: string) => {
      if (value === null || value === undefined || Number.isNaN(value)) return "-";
      return `${value.toLocaleString("en-US")}${suffix ?? ""}`;
    };
    return {
      // Prefer explicit foot_traffic, fallback to first valid daily value.
      foot: formatNumber(
        assumptionMetrics?.footTraffic ??
        assumptionMetrics?.dailyFootTraffic?.find((v) => v !== null && v !== undefined && !Number.isNaN(v))
      ),
      interest: formatNumber(assumptionMetrics?.interestRate, " %"),
      conversion: formatNumber(assumptionMetrics?.conversionRate, " %"),
    };
  }, [assumptionMetrics]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="flex min-h-screen">
        <PlannerSidebar
          onLogout={() => signOut({ callbackUrl: "/login" })}
          userName={session?.user?.name}
          userEmail={session?.user?.email}
          userImage={session?.user?.image}
        />

        <main className="flex-1 overflow-y-auto bg-[#f8f9ff] p-6 sm:p-10">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-8">
            <header className="flex flex-col-reverse gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9a9af5]">{t("assump.sectionLabel")}</p>
                <h1 className="mt-2 text-3xl md:text-4xl font-semibold text-[#2e2e6c]">{t("assump.sectionTitle")}</h1>
              </div>
              <div className="flex items-center justify-between gap-2 md:justify-end">
                {/* Language Switcher */}
                <div className="flex items-center gap-1 rounded-full border border-[#d9ddff] bg-white p-1 shadow-sm">
                  {(["en", "th"] as const).map((lng) => (
                    <button
                      key={lng}
                      type="button"
                      onClick={() => setLocale(lng)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${locale === lng ? "bg-[#4c4bd6] text-white" : "text-[#4c4bd6] hover:bg-[#eef0ff]"
                        }`}
                    >
                      {lng.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="rounded-full border border-[#d9ddff] bg-white px-4 py-2 text-sm font-semibold text-[#4c4bd6] shadow-sm hover:border-[#c4cbff] hover:bg-[#f4f6ff]"
                >
                  {t("assump.back")}
                </button>
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-3xl border border-[#e6e9ff] bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-[#1e1e54]">{t("assump.cogsTitle")}</p>
                    <p className="text-sm text-slate-500">{t("assump.cogsSubtitle")}</p>
                  </div>
                  {productOptions.length > 0 ? (
                    <select
                      value={activeSku}
                      onChange={(event) => setSelectedSku(event.target.value)}
                      className="rounded-full border border-[#d4d7ff] bg-white px-4 py-2 text-sm text-slate-700 focus:border-[#4c4bd6] focus:outline-none"
                    >
                      {productOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>

                <div className="mt-6 max-h-48 overflow-y-auto">
                  {cogsRows.length > 0 ? (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          <th className="pb-3">{t("assump.ingredient")}</th>
                          <th className="pb-3 text-right">{t("assump.unitCost")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cogsRows.map((row, idx) => (
                          <tr key={`${row.name}-${idx}`} className="border-t border-dashed border-[#f0f2ff] text-lg">
                            <td className="py-3 font-medium text-slate-800">{row.name}</td>
                            <td className="py-3 text-right text-slate-800">{currency(row.cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
                      {t("assump.noCogs")}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#f1f3ff] pt-4">
                  {/* <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-dashed border-[#c6cbff] px-4 py-2 text-xs font-semibold text-[#4c4bd6]"
                  >
                    <span className="text-base">+</span> {t("assump.addIngredient")}
                  </button> */}
                  <div className="ml-auto w-fit text-right">
                    {/*<p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("assump.totalCogs")}</p>*/}
                    {/*<p className="text-2xl font-semibold text-[#1e1e54]">{currency(cogsTotal)}</p>*/}
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-[#e6e9ff] bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-[#1e1e54]">{t("assump.dailyVarTitle")}</p>
                    <p className="text-sm text-slate-500">{t("assump.dailyVarSubtitle")}</p>
                  </div>
                  {/* <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-dashed border-[#c6cbff] px-4 py-2 text-xs font-semibold text-[#4c4bd6]"
                  >
                    <span className="text-base">+</span> {t("assump.addDailyCost")}
                  </button> */}
                </div>

                {variableCostRows.length > 0 ? (
                  <div className="mt-6 max-h-[60vh] overflow-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          <th className="pb-3">{t("assump.costItem")}</th>
                          <th className="pb-3 text-right">{t("assump.costPerUnit")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variableCostRows.map((row, idx) => (
                          <tr key={`${row.name}-${idx}`} className="border-t border-dashed border-[#f0f2ff] text-sm">
                            <td className="py-3 font-medium text-lg text-slate-800">{row.name}</td>
                            <td className="py-3 text-right text-lg text-slate-800">{currency(row.unitCost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
                    {t("assump.noDailyCosts")}
                  </div>
                )}

                <div className="mt-6 border-t border-[#f1f3ff] pt-4 text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("assump.totalDailyCost")}</p>
                  <p className="text-2xl font-semibold text-[#1e1e54]">{currency(variableCostTotal)}</p>
                </div>
              </section>
            </div>

            <section className="rounded-3xl border border-[#e6e9ff] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f1f3ff] pb-6">
                <div>
                  <p className="text-lg font-semibold text-[#1e1e54]">{t("assump.saleForecastTitle")}</p>
                  <p className="text-sm text-slate-500">{t("assump.saleForecastSubtitle")}</p>
                </div>
                <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <span className="inline-flex items-center gap-2 text-[#4c4bd6]">
                    <span className="h-2 w-2 rounded-full bg-[#4c4bd6]" /> {t("assump.legendFootTraffic")}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-6 lg:flex-row">
                <div className="space-y-4 lg:w-[32%]">
                  {displayStatCards.map((card) => (
                    <article key={card.title} className="rounded-2xl border border-[#e6e9ff] bg-[#fbfbff] p-4 shadow-inner">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-base font-semibold text-slate-800">{card.title}</p>
                          <p className="text-xs text-slate-500">{card.description}</p>
                        </div>
                        <svg width={20} height={20} viewBox="0 0 24 24" className="text-slate-300">
                          <path
                            /*d="M12 5v14m7-7H5"*/
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <p className={`mt-6 text-3xl font-semibold ${card.accent}`}>{card.value}</p>
                    </article>
                  ))}
                </div>

                <div className="rounded-2xl border border-[#e6e9ff] p-4 lg:w-[68%]">
                  <LineChart data={chartData} height={320} onPointClick={setSelectedDay} />

                  <div className="mt-6">
                    <div className="h-2 w-full rounded-full bg-[#ebeefe]">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#4c4bd6] to-[#a78bfa]"
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      <span>Day 1</span>
                      <span>Day 9</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#e6e9ff] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("assump.estBuyers")}</p>
                  <p className="mt-2 text-3xl font-semibold text-[#4c4bd6]">≈ {integer(displayEstBuyers)}</p>
                  <p className="text-sm text-slate-500">{t("assump.estBuyersDesc")}</p>
                </div>
                <div className="rounded-2xl border border-[#e6e9ff] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("assump.totalBuyers")}</p>
                  <p className="mt-2 text-3xl font-semibold text-[#4c4bd6]">≈ {integer(
                    assumptionMetrics?.dailyFootTraffic?.reduce((sum: number, val) => sum + (val ?? 0), 0) ?? 0
                  )}</p>
                  <p className="text-sm text-slate-500">{t("assump.totalBuyersDesc")}</p>
                </div>
              </div>
            </section>
          </div>
        </main >
      </div >
    </div >
  );
}
