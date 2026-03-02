"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  defaultAdvice,
  defaultCsv,
  defaultMetrics,
  initialAssumptions,
  initialForm,
  initialProductMix,
} from "./constants";
import { createSheetFromCsv } from "@/app/actions/google-sheets";
import type { BoothForm, Metrics, MetricsProduct, ProductMix, Shop, Summary } from "./types";
import {
  buildProductMixFromAssumptions,
  buildProductMixFromFinancialJson,
  buildProductMixFromMetrics,
  calculateSummary,
  parseFinancialCsv,
} from "./utils";

const FINANCE_SHEET_WEBHOOK_PATH = "https://n8n.srv1143129.hstgr.cloud/webhook-test/finanace-sheet";

type UserStoreRecord = Partial<BoothForm> & {
  size_store?: string;
  tools?: string;
  capital?: string;
  category?: string;
  store_id: string;
  id?: string;
};

type BusinessPlanResponse = {
  id?: string;
  metrics?: Metrics;
  advice?: string;
  assumptions?: unknown;
  product_mix?: ProductMix[];
  financial_csv?: string | Record<string, unknown> | null;
};

type AIProduct = {
  name?: string;
  sku?: string;
  price_per_unit?: number;
  cost_per_unit?: number;
  production_buffer?: number;
  sales_forecast?: number[];
};

type AIFixedCosts = {
  daily_labor_cost?: number;
  daily_utilities?: number;
  daily_transport?: number;
};

type AIPlanResponse = {
  total_revenue: number;
  net_profit: number;
  breakeven_day?: number;
  financial_csv?: string | Record<string, unknown> | null;
  product_mix?: ProductMix[];
  assumptions_debug: {
    products?: AIProduct[];
    fixed_costs?: AIFixedCosts;
    duration_days?: number;
  };
  rag_result?: {
    answer_text?: string;
  };
};

type RagSection = {
  title: string;
  bullets: string[];
};

type RagResponse = {
  answer_text: string;
  sections?: RagSection[];
  sources?: { file: string; chunk_id?: number; score?: number }[];
};

type BoothFormWithStore = BoothForm & {
  store_id?: string | null;
};

function sumForecastUnits(forecast?: number[]) {
  if (!Array.isArray(forecast)) return 0;
  return forecast.reduce((total, value) => total + (Number(value) || 0), 0);
}

function calculateProductCogs(products: AIProduct[]) {
  return products.reduce((sum, product) => {
    const cost = Number(product.cost_per_unit ?? 0);
    const buffer = Number(product.production_buffer ?? 0);
    const sales = sumForecastUnits(product.sales_forecast);
    return sum + sales * (1 + buffer) * cost;
  }, 0);
}

function calculateTotalOpex(costs: AIFixedCosts | undefined, days: number) {
  if (!costs || !days) return 0;
  const labor = Number(costs.daily_labor_cost ?? 0);
  const utilities = Number(costs.daily_utilities ?? 0);
  const transport = Number(costs.daily_transport ?? 0);
  return (labor + utilities + transport) * days;
}

function countCustomersFromProducts(products: AIProduct[]) {
  return products.reduce((sum, product) => sum + sumForecastUnits(product.sales_forecast), 0);
}

function buildMetricsProductsFromAI(products: AIProduct[]): MetricsProduct[] {
  return products.map((product) => {
    const totalUnits = sumForecastUnits(product.sales_forecast);
    const price = Number(product.price_per_unit ?? 0);
    const cost = Number(product.cost_per_unit ?? 0);
    const totalRevenue = totalUnits * price;
    const totalCogs = totalUnits * cost;
    const grossMarginPct = totalRevenue ? ((totalRevenue - totalCogs) / totalRevenue) * 100 : 0;

    return {
      name: product.name ?? product.sku ?? "สินค้า",
      total_units: totalUnits,
      total_revenue: totalRevenue,
      total_cogs: totalCogs,
      avg_price: price,
      avg_cost: cost,
      gross_margin_pct: Number.isFinite(grossMarginPct) ? grossMarginPct : 0,
    };
  });
}

function buildRagQuestion(payload: BoothForm) {
  const parts = [];
  if (payload.name) parts.push(`ชื่อร้าน: ${payload.name}`);
  if (payload.products) parts.push(`สินค้า: ${payload.products}`);
  if (payload.concept) parts.push(`คอนเซ็ปต์: ${payload.concept}`);
  if (payload.category) parts.push(`หมวดหมู่: ${payload.category}`);
  if (payload.theme) parts.push(`ธีม: ${payload.theme}`);
  if (payload.location) parts.push(`ทำเล: ${payload.location}`);
  return `ขอคำแนะนำเป็นหัวข้อย่อยสำหรับร้านในงานเกษตรแฟร์จากข้อมูลต่อไปนี้:\n${parts.join("\n")}`;
}

export function usePlannerState() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<BoothForm>(initialForm);
  const [shops, setShops] = useState<Shop[]>([
    { id: "initial", label: initialForm.name || "ร้านใหม่", data: initialForm },
  ]);
  const [selectedShopId, setSelectedShopId] = useState<string>("initial");
  const [preferredStoreId, setPreferredStoreId] = useState<string | null>(null);
  const [productMix, setProductMix] = useState(initialProductMix);
  const [advice, setAdvice] = useState(defaultAdvice);
  const [financialCsv, setFinancialCsv] = useState<string | null | Record<string, unknown>>(defaultCsv);
  const [assumptions, setAssumptions] = useState(initialAssumptions);
  const [metrics, setMetrics] = useState<Metrics | null>(defaultMetrics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [skipAutoFetchPlan, setSkipAutoFetchPlan] = useState(false);
  const [assumptionDownloadUrl, setAssumptionDownloadUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary>({
    revenue: 0,
    profit: 0,
    expense: 0,
    customers: 0,
    items: 0,
  });

  const parsedFinancialRows = useMemo(() => parseFinancialCsv(financialCsv), [financialCsv]);

  const metricsFinancialRows = useMemo(() => {
    if (!metrics?.daily?.length) return [];
    return metrics.daily.map((day) => ({
      day: `Day ${day.day}`,
      revenue: day.revenue || 0,
      expense: (day.cogs || 0) + (day.opex || 0),
      profit: day.net_profit || 0,
      customers: 0,
      items: 0,
      cogs: day.cogs || 0,
      opex: day.opex || 0,
      accumulated: day.accumulated ?? null,
    }));
  }, [metrics]);

  const financialRows = parsedFinancialRows.length ? parsedFinancialRows : metricsFinancialRows;

  useEffect(() => {
    if (metrics?.summary) {
      setSummary({
        revenue: metrics.summary.total_revenue || 0,
        profit: metrics.summary.net_profit || 0,
        expense: (metrics.summary.total_cogs || 0) + (metrics.summary.total_opex || 0),
        customers: 0,
        items: metrics.products?.length || 0,
      });
    } else if (financialRows.length) {
      setSummary(calculateSummary(financialRows));
    }
  }, [metrics, financialRows]);

  useEffect(() => {
    const jobId = localStorage.getItem("pending_job_id");
    if (!jobId) return;

    console.log("⏳ resume job:", jobId);

    setLoading(true);

    waitJobUntilDone(jobId)
      .then(() => {
        localStorage.removeItem("pending_job_id");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadUserStores = useCallback(async () => {
    const res = await fetch("/api/user/stores");
    const data = (await res.json()) as UserStoreRecord[];

    const formatted: Shop[] = data.map((store) => {
      const normalized: BoothForm = {
        name: store.name ?? "",
        products: store.products ?? "",
        theme: store.theme ?? "",
        concept: store.concept ?? "",
        location: store.location ?? "",
        category: store.category ?? "",
        size: store.size ?? store.size_store ?? "",
        equipment: store.equipment ?? store.tools ?? "",
        funding: store.funding ?? store.capital ?? "",
        staff: store.staff ?? "",
        hours: store.hours ?? "",
      };
      return {
        id: store.store_id,
        label: normalized.name || "ร้านใหม่",
        data: normalized,
        store_id: store.store_id,
      };
    });

    setShops(formatted);

    if (formatted.length > 0) {
      setSelectedShopId((prev) => {
        if (preferredStoreId && formatted.some((s) => s.id === preferredStoreId)) {
          return preferredStoreId;
        }
        if (prev && prev !== "initial" && formatted.some((s) => s.id === prev)) {
          return prev;
        }
        return formatted[0].id;
      });
    }
  }, [preferredStoreId]);

  const currentShop = useMemo(
    () => shops.find((shop) => shop.id === selectedShopId),
    [shops, selectedShopId]
  );

  const setFormField = useCallback((updates: Partial<BoothForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const mapStoreToForm = useCallback((store: Partial<BoothForm> & { size_store?: string; tools?: string; capital?: string; category?: string }): BoothForm => {
    return {
      name: store.name ?? "",
      products: store.products ?? "",
      theme: store.theme ?? "",
      concept: store.concept ?? "",
      location: store.location ?? "",
      category: store.category ?? "",
      size: store.size ?? store.size_store ?? "",
      equipment: store.equipment ?? store.tools ?? "",
      funding: store.funding ?? store.capital ?? "",
      staff: store.staff ?? "",
      hours: store.hours ?? "",
    };
  }, []);

  const triggerCogsGenerate = useCallback(async (storeId?: string | null, product?: string) => {
    if (!storeId || storeId === "initial" || !product?.trim()) return;
    try {
      await fetch("/api/store/cogs-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId, product }),
      });
    } catch (err) {
      console.warn("⚠️ generate COGS failed:", err);
    }
  }, []);

  const fetchStoreByStoreId = useCallback(async (storeId?: string) => {
    if (!storeId) return null;
    try {
      const response = await fetch("/api/store/by-store-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId }),
      });
      if (!response.ok) {
        console.warn("⚠️ ไม่สามารถดึงข้อมูลร้านจาก Supabase ได้");
        return null;
      }
      return (await response.json()) as Partial<BoothForm>;
    } catch (err) {
      console.error("❌ ดึงข้อมูลร้านล่าสุดไม่สำเร็จ:", err);
      return null;
    }
  }, []);

  const fetchStoreSuggestion = useCallback(async (storeId?: string) => {
    if (!storeId) return null;
    const store = await fetchStoreByStoreId(storeId);
    const suggestAi = (store as { suggest_ai?: string } | null)?.suggest_ai;
    if (suggestAi) {
      setAdvice(suggestAi);
      return store;
    }
    return store;
  }, [fetchStoreByStoreId]);

  const fetchBusinessPlan = useCallback(async (storeId?: string | null) => {
    if (!storeId) {
      console.warn("⚠️ ไม่มี store_id สำหรับร้านนี้");
      return;
    }

    try {
      const res = await fetch("/api/store/business-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId }),
      });

      const payload = (await res.json()) as BusinessPlanResponse | { data: null; message?: string };
      if ("data" in payload && payload.data === null) {
        console.log("ℹ️ ยังไม่มีแผนธุรกิจสำหรับร้านนี้");
        setAdvice(defaultAdvice);
        setFinancialCsv(defaultCsv);
        setMetrics(defaultMetrics);
        return;
      }

      const planData = payload as BusinessPlanResponse;
      console.log("✅ ได้รับข้อมูล business_plan:", planData);

      setMetrics(planData.metrics ?? null);
      setAdvice(planData.advice ?? defaultAdvice);
      setFinancialCsv(planData.financial_csv ?? defaultCsv);

      if (planData.assumptions) {
        setAssumptions(
          typeof planData.assumptions === "string"
            ? planData.assumptions
            : JSON.stringify(planData.assumptions, null, 2)
        );
      }
      const mixFromFinancial = buildProductMixFromFinancialJson(planData.financial_csv);
      if (mixFromFinancial.length) {
        setProductMix(mixFromFinancial);
      } else if (planData.product_mix) {
        setProductMix(planData.product_mix);
      }
    } catch (err) {
      console.error("❌ Error loading business_plan:", err);
    }
  }, []);

  // ✅ handleSelectShop สำหรับ single-select และดึงข้อมูล business_plan
  const handleSelectShop = useCallback(
    (id: string) => {
      console.log("🔄 Select shop ID:", id);
      setPreferredStoreId(id);
      setSelectedShopId(id);
    },
    [setPreferredStoreId]
  );

  useEffect(() => {
    console.log("🔥 useEffect fired", { skipAutoFetchPlan, currentShop });
    if (skipAutoFetchPlan) {
      console.log("⏸ skip auto fetch");
      return;
    }

    const storeId = currentShop?.store_id ?? currentShop?.id;
    if (!storeId || storeId === "initial") return;

    fetchBusinessPlan(storeId);
    fetchStoreSuggestion(storeId);
  }, [
    currentShop?.store_id,
    currentShop?.id,
    fetchBusinessPlan,
    fetchStoreSuggestion,
    skipAutoFetchPlan,
  ]);

  const fetchRagAdvice = useCallback(async (payload: BoothForm) => {
    const question = buildRagQuestion(payload);
    if (!question.trim()) return null;
    try {
      const response = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!response.ok) {
        console.warn("⚠️ RAG backend ไม่พร้อมใช้งาน");
        return null;
      }
      return (await response.json()) as RagResponse;
    } catch (err) {
      console.error("❌ ไม่สามารถดึงคำแนะนำ RAG:", err);
      return null;
    }
  }, []);

  const fetchMerchantCode = useCallback(async () => {
    try {
      const response = await fetch("/api/account/merchant-code");
      if (!response.ok) {
        console.warn("⚠️ ไม่สามารถดึง merchant_code จากบัญชีได้");
        return null;
      }
      const payload = (await response.json()) as { merchant_code?: string | null };
      return payload.merchant_code ?? null;
    } catch (err) {
      console.warn("⚠️ ดึง merchant_code ล้มเหลว:", err);
      return null;
    }
  }, []);

  const handleGeneratePlan = useCallback(async (payload: BoothForm) => {
    try {
      const response = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("ไม่สามารถเชื่อมต่อ backend ได้");

      const data = await response.json();
      setAdvice(data.advice_markdown || defaultAdvice);
      setFinancialCsv(data.financial_csv || defaultCsv);
      setMetrics(data.metrics ?? null);

      const assumptionText = data.assumptions_debug
        ? JSON.stringify(data.assumptions_debug, null, 2)
        : JSON.stringify({ note: "ไม่มีข้อมูล assumptions_debug" }, null, 2);
      setAssumptions(assumptionText);

      const mixFromFinancial = buildProductMixFromFinancialJson(data.financial_csv);
      if (mixFromFinancial.length) {
        setProductMix(mixFromFinancial);
      } else if (data.product_mix) {
        setProductMix(data.product_mix);
      } else if (data.metrics?.products) {
        const derived = buildProductMixFromMetrics(data.metrics.products);
        setProductMix(derived.length ? derived : buildProductMixFromAssumptions(data.assumptions_debug));
      } else {
        setProductMix(buildProductMixFromAssumptions(data.assumptions_debug));
      }

      const ragAdvice = await fetchRagAdvice(payload);
      if (ragAdvice?.answer_text) {
        setAdvice(ragAdvice.answer_text);
      }
    } catch (err) {
      setError((err as Error).message || "เกิดข้อผิดพลาด");
    }
  }, [fetchRagAdvice]);

  // ฟังก์ชันดึง store_id จาก Supabase ตาราง set_store
  const getStoreIdByUserAndName = useCallback(async (shopName: string) => {
    try {
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      const userId = sessionData?.user?.id;

      if (!userId) {
        console.warn("⚠️ ไม่พบ user_id");
        return null;
      }

      const res = await fetch("/api/store/get-by-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, name: shopName }),
      });

      if (!res.ok) {
        console.warn("⚠️ ไม่พบร้านค้า");
        return null;
      }

      const data = await res.json();
      console.log("✅ ดึง store_id สำเร็จ:", data.store_id);
      return data.store_id;
    } catch (err) {
      console.error("❌ Error getting store_id:", err);
      return null;
    }
  }, []);

  const handleSendToAI = useCallback(async (FormData: BoothFormWithStore) => {
    setError(null);
    try {
      // ใช้ store_id ที่เพิ่งสร้างถ้ามี
      let storeId: string | null = FormData.store_id ?? null;

      // ถ้าไม่มี ให้ดึงจาก table ตามชื่อร้าน
      if (FormData.name) {
        storeId = storeId ?? (await getStoreIdByUserAndName(FormData.name));
      }
      // ถ้ายังไม่เจอ ให้ fallback ใช้ของ currentShop
      if (!storeId) {
        storeId = currentShop?.store_id ?? currentShop?.id ?? null;
      }

      console.log("🏪 currentShop:", currentShop);
      console.log("🆔 storeId:", storeId);
      const payload = { ...FormData, store_id: storeId };
      console.log("📤 Sending to /api/ai:", payload);

      let jobId: string | null = null;

      if (storeId) {
        try {
          const res = await fetch("/api/sendN8n", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ store_id: storeId, data: payload }),
          });

          const data = await res.json();
          jobId = data?.job_id ?? null;

          console.log("✅ ส่งข้อมูลไป n8n เรียบร้อย job_id:", jobId);
        } catch (err) {
          console.warn("⚠️ ส่งข้อมูลไป n8n ล้มเหลว:", err);
        }
      }


      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("AI ประมวลผลไม่สำเร็จ");

      const data = (await res.json()) as AIPlanResponse;
      const assumptionProducts = Array.isArray(data.assumptions_debug?.products)
        ? data.assumptions_debug.products
        : [];
      const durationDays = data.assumptions_debug?.duration_days ?? 0;
      const totalCogs = calculateProductCogs(assumptionProducts);
      const totalOpex = calculateTotalOpex(data.assumptions_debug?.fixed_costs, durationDays);

      setMetrics({
        summary: {
          total_revenue: data.total_revenue,
          net_profit: data.net_profit,
          break_even_day: data.breakeven_day,
          gross_profit: data.total_revenue - totalCogs,
          total_cogs: totalCogs,
          total_opex: totalOpex,
        },
        daily: [],
        products: buildMetricsProductsFromAI(assumptionProducts),
      });

      setSummary({
        revenue: data.total_revenue,
        profit: data.net_profit,
        items: assumptionProducts.length,
        customers: countCustomersFromProducts(assumptionProducts),
        expense: 0,
      });

      if (data.rag_result?.answer_text) {
        setAdvice(data.rag_result.answer_text);
      }

      return {
        ...data,
        job_id: jobId,
      };
    } catch (err) {
      console.error("❌ ส่งข้อมูลไป AI ไม่สำเร็จ:", err);
      setError("ไม่สามารถเชื่อมต่อระบบ AI ได้");
    } finally {

    }
  }, [currentShop, getStoreIdByUserAndName]);

  const handleExportToSheet = useCallback(
    async (accessToken: string) => {
      if (!accessToken) {
        alert("ไม่พบสิทธิ์การเข้าถึง Google Drive");
        return;
      }
      if (typeof financialCsv !== "string" || !financialCsv.trim()) {
        alert("ไม่มีข้อมูล CSV สำหรับส่งออก");
        return;
      }

      setIsExporting(true);
      try {
        const fileName = `Financial Plan - ${form.name || "My Store"} - ${new Date().toISOString()}`;
        const result = await createSheetFromCsv(accessToken, financialCsv, fileName);
        if (result.success && result.fileId) {
          const downloadUrl = `https://docs.google.com/spreadsheets/d/${result.fileId}/export?format=xlsx`;

          setAssumptionDownloadUrl(downloadUrl);

          // (ถ้าต้องการเปิดทันทีหลังสร้าง)
          // window.open(downloadUrl, "_blank", "noopener,noreferrer");
          window.location.href = downloadUrl;
        }
      } catch (err) {
        console.error("Export to Google Sheets failed:", err);
        alert("เกิดข้อผิดพลาดระหว่างการส่งออก Google Sheets");
      } finally {
        setIsExporting(false);
      }
    },
    [financialCsv, form.name],
  );

  async function waitJobUntilDone(job_id: string) {
    let count = 0;

    while (true) {
      const res = await fetch(`/api/job-status?job_id=${job_id}`);
      const json = await res.json();

      console.log("🟡 job-status res:", json);
      // รองรับทุกรูปแบบ
      const status =
        json?.status ??
        json?.data?.status ??
        (Array.isArray(json) ? json[0]?.status : null);

      console.log("🔎 JOB STATUS:", status);


      if (status === "done") {
        console.log("✅ JOB DONE — EXIT LOOP");
        return true;
      };

      if (count++ > 60) {   // ~ 3 นาที
        console.warn("⛔ TIMEOUT — stop waiting");
        return false;
      }

      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  const handleSaveShop = useCallback(async () => {
    if (!form.name.trim()) {
      setError("กรุณากรอกชื่อร้าน");
      return;
    }

    setError(null);
    setSkipAutoFetchPlan(true);     // ⛔️ ปิด auto fetch business-plan
    setLoading(true);

    try {
      // -------------------------
      // ตรวจ session
      // -------------------------
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      const userId = sessionData?.user?.id;

      if (!userId) {
        setError("ไม่พบ session ผู้ใช้");
        return;
      }

      // -------------------------
      // ตรวจโควต้า
      // -------------------------
      const statusRes = await fetch("/api/account/status");
      const statusPayload = await statusRes.json();

      if (!statusRes.ok) {
        setError(statusPayload.error || "ไม่สามารถตรวจสอบสถานะบัญชีได้");
        return;
      }

      if (statusPayload.status === true) {
        alert("คุณใช้โควต้าครบแล้ว");
        return;
      }

      const nextShops = [...shops];
      let nextSelected = selectedShopId;

      let storeIdForAI: string | null =
        selectedShopId !== "initial" ? selectedShopId : null;

      // -------------------------
      // เพิ่มร้านใหม่ (ถ้ายังไม่มี)
      // -------------------------
      if (!(isEdit && selectedShopId !== "initial")) {
        const res = await fetch("/api/addShop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const created = await res.json();
        const newId = created.id || created.store_id;

        if (!newId) {
          setError("ไม่มี store_id");
          return;
        }

        setSelectedShopId(newId);

        nextShops.push({ id: newId, label: form.name, data: form });
        nextSelected = newId;
        storeIdForAI = newId;
      } else {
        // -------------------------
        // อัปเดตร้านเก่า
        // -------------------------
        await fetch("/api/editShop", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedShopId, ...form }),
        });

        const idx = nextShops.findIndex((s) => s.id === selectedShopId);
        if (idx >= 0) {
          nextShops[idx] = { id: selectedShopId, label: form.name, data: form };
        }
      }

      // -------------------------
      // trigger COGS
      // -------------------------
      if (storeIdForAI) {
        await triggerCogsGenerate(storeIdForAI, form.products);
      }

      // -------------------------
      // ส่งไป AI (และยิง n8n รอบเดียว)
      // -------------------------
      const aiResult = await handleSendToAI({
        ...form,
        store_id: storeIdForAI ?? undefined,
      });

      // -------------------------
      // ⏳ รอ n8n ทำงานเสร็จ
      // -------------------------
      console.log("🟡 aiResult:", aiResult);
      console.log("🟡 job_id:", aiResult?.job_id);

      if (aiResult?.job_id) {
        localStorage.setItem("pending_job_id", aiResult.job_id);
        await waitJobUntilDone(aiResult.job_id);
        localStorage.removeItem("pending_job_id");
      }


      // -------------------------
      // โหลดแผน (หลังทุกอย่างเสร็จ)
      // -------------------------
      await handleGeneratePlan(form);

      // -------------------------
      // อัปเดตโควต้า
      // -------------------------
      const statusUpdateRes = await fetch("/api/account/status", {
        method: "POST",
      });

      if (!statusUpdateRes.ok) {
        const detail = await statusUpdateRes.text();
        console.warn("⚠️ อัปเดตสถานะบัญชีไม่สำเร็จ:", detail);
      }

      setShops(nextShops);
      setSelectedShopId(nextSelected);
      setShowModal(false);

      if (!isEdit) {
        setForm(initialForm);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    } finally {
      setSkipAutoFetchPlan(false);  // ✅ เปิด auto fetch กลับ
      setLoading(false);
    }
  }, [
    form,
    isEdit,
    selectedShopId,
    shops,
    handleGeneratePlan,
    handleSendToAI,
    triggerCogsGenerate,
  ]);


  const handleEditShop = useCallback(async () => {
    if (!currentShop) return;

    const latest = await fetchStoreByStoreId(currentShop.store_id ?? currentShop.id);
    if (latest) {
      const normalized = mapStoreToForm(latest);
      setForm(normalized);
      setShops((prev) =>
        prev.map((shop) =>
          shop.id === currentShop.id
            ? { ...shop, label: normalized.name || shop.label, data: normalized }
            : shop
        )
      );
      // Trigger COGS generation via Python backend so assumptions page can show fresh ingredient costs
      const storeId = currentShop.store_id ?? currentShop.id;
      triggerCogsGenerate(storeId, normalized.products);
    } else {
      setForm(currentShop.data);
    }

    setIsEdit(true);
    setShowModal(true);
  }, [currentShop, fetchStoreByStoreId, mapStoreToForm, triggerCogsGenerate]);

  const handleAddShop = useCallback(async () => {
    setIsEdit(false);
    const merchantCode = await fetchMerchantCode();
    setForm({ ...initialForm, location: merchantCode ?? "" });
    setShowModal(true);
  }, [fetchMerchantCode]);

  return {
    advice,
    assumptions,
    currentShop,
    error,
    financialRows,
    form,
    handleAddShop,
    handleEditShop,
    handleGeneratePlan,
    handleSaveShop,
    handleSelectShop, // ✅ เพิ่มฟังก์ชันนี้
    loading,
    productMix,
    metrics,
    selectedShopId,
    setPreferredStoreId,
    setFormField,
    setSelectedShopId,
    setShowModal,
    showModal,
    shops,
    summary,
    isEdit,
    loadUserStores,
    handleExportToSheet,
    isExporting,
    assumptionDownloadUrl,
  };
}
