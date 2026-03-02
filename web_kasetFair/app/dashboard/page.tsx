"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdviceCard } from "./components/AdviceCard";
import { FinancialTableCard } from "./components/FinancialTableCard";
import { PlannerHeader } from "./components/PlannerHeader";
import { PlannerSidebar } from "./components/PlannerSidebar";
import { ProductMixCard } from "./components/ProductMixCard";
import { RevenueChartCard } from "./components/RevenueChartCard";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { ShopFormModal } from "./components/ShopFormModal";
import { SummaryCards } from "./components/SummaryCards";
import { TipsCard } from "./components/TipsCard";
import { usePlannerState } from "./usePlannerState";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useCallback } from "react";
import { LocaleProvider, useLocale } from "./i18n";

export default function DashboardPage() {
  return (
    <LocaleProvider>
      <DashboardContent />
    </LocaleProvider>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const {
    advice,
    assumptions,
    error,
    financialRows,
    form,
    handleAddShop,
    handleEditShop,
    handleSaveShop,
    loading,
    productMix,
    metrics,
    selectedShopId,
    setFormField,
    setShowModal,
    showModal,
    shops,
    summary,
    isEdit,
    loadUserStores,
    handleSelectShop,
    currentShop
  } = usePlannerState();
  const { t } = useLocale();
  const [assumptionFileLoading, setAssumptionFileLoading] = useState(false);

  const averageCustomers = financialRows.length
    ? Math.round(summary.customers / financialRows.length)
    : 0;

  useEffect(() => {
    if (status === "authenticated") {
      // Load user stores when authenticated
      loadUserStores();
    }
  }, [status, loadUserStores]);

  // Read store_id from URL and select it
  useEffect(() => {
    const storeIdParam = searchParams.get("store_id");
    if (storeIdParam && shops.length > 0) {
      // Find if the store exists in the loaded shops
      const foundShop = shops.find(
        (s) => s.store_id === storeIdParam || s.id === storeIdParam
      );
      if (foundShop && foundShop.store_id && selectedShopId !== foundShop.store_id) {
        handleSelectShop(foundShop.store_id);
      }
    }
  }, [searchParams, shops, selectedShopId, handleSelectShop]);

  const handleDownloadAssumptionFile = useCallback(async () => {
    if (assumptionFileLoading) return;
    const storeId = currentShop?.store_id ?? currentShop?.id;

    if (!storeId || storeId === "initial") {
      alert("กรุณาเลือกร้านก่อนดาวน์โหลดไฟล์");
      return;
    }

    setAssumptionFileLoading(true);
    try {
      const safeStoreId = storeId as string;
      const response = await fetch(`/api/assumption/file?store_id=${encodeURIComponent(safeStoreId)}`);
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "ไม่สามารถดึงข้อมูลไฟล์ได้");
      }

      const payload = (await response.json()) as { fileId?: string | null };
      if (!payload.fileId) {
        alert("ไม่พบไฟล์สำหรับดาวน์โหลด");
        return;
      }

      window.open(
        `https://docs.google.com/spreadsheets/d/${payload.fileId}/export?format=xlsx`,
        "_blank"
      );
    } catch (error) {
      console.error("Download Excel failed:", error);
      alert("ไม่สามารถดาวน์โหลดไฟล์ได้");
    } finally {
      setAssumptionFileLoading(false);
    }
  }, [assumptionFileLoading, currentShop?.store_id, currentShop?.id]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen bg-white text-slate-900">
        <div className="w-64 border-r border-[#ecefff] bg-white p-6 space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="flex-1 space-y-4 bg-[#f8f9ff] p-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <LoadingOverlay loading={loading} />
      <div className="flex min-h-screen">
        <PlannerSidebar
          onLogout={() => signOut({ callbackUrl: "/login" })}
          userName={session?.user?.name}
          userEmail={session?.user?.email}
          userImage={session?.user?.image}
          selectedStoreId={currentShop?.store_id || currentShop?.id || null}
        />
        <main className="flex-1 space-y-6 bg-[#f8f9ff] p-6 sm:p-8 overflow-y-auto">
          <PlannerHeader
            userName={session?.user?.name}
            sessionEmail={session?.user?.email}
            shops={shops}
            selectedShopId={selectedShopId}
            onSelectShop={handleSelectShop}
            onAddShop={handleAddShop}
            onEditShop={handleEditShop}
            assumptionFileLoading={assumptionFileLoading}
            onDownloadAssumption={handleDownloadAssumptionFile}
            canDownloadAssumption={Boolean(currentShop?.store_id || currentShop?.id)}
          />

          {!loading && !metrics?.daily?.length && !financialRows.length ? (
            <div className="rounded-xl border border-dashed border-[#d7dbff] bg-white px-4 py-3 text-sm text-[#4c4bd6]">
              {t("dashboard.cta")}
            </div>
          ) : null}
          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="xl:flex-[2]">
              <RevenueChartCard
                rows={financialRows}
                metricsDaily={metrics?.daily}
                loading={loading}
              />
            </div>
            <div className="xl:flex-[1]">
              <ProductMixCard
                productMix={productMix}
                metricsProducts={metrics?.products}
                summaryRevenue={summary.revenue}
                summaryProfit={summary.profit}
                averageCustomers={averageCustomers}
                totalItems={summary.items}
                loading={loading}
                assumptions={assumptions}
              />
            </div>
          </div>

          <SummaryCards
            revenue={summary.revenue}
            metricsSummary={metrics?.summary}
            loading={loading}
            storeId={currentShop?.store_id || currentShop?.id}
          />

          <AdviceCard advice={advice} loading={loading} />

          <TipsCard />

          <FinancialTableCard
            rows={financialRows}
            metricsDaily={metrics?.daily}
            metricsProducts={metrics?.products}
            userId={session?.user?.id}
            error={error}
            loading={loading}
          />

        </main>
      </div>

      <ShopFormModal
        open={showModal}
        form={form}
        error={error}
        onChange={setFormField}
        onClose={() => setShowModal(false)}
        onSave={handleSaveShop}
        isEdit={isEdit}
      />
    </div>
  );
}
