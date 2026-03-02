"use client";

import { Button } from "@/components/ui/button";
import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Shop } from "../types";
import { useLocale } from "../i18n";

type PlannerHeaderProps = {
  sessionEmail?: string | null;
  shops: Shop[];
  selectedShopId: string;
  onSelectShop: (id: string) => void;
  onAddShop: () => void;
  onEditShop: (id: string) => void;
  userName?: string | null;
  assumptionFileLoading?: boolean;
  onDownloadAssumption?: () => void;
  canDownloadAssumption?: boolean;
};

export function PlannerHeader({
  userName,
  shops,
  selectedShopId,
  onSelectShop,
  onAddShop,
  onEditShop,
  assumptionFileLoading,
  onDownloadAssumption,
  canDownloadAssumption,
}: PlannerHeaderProps) {
  const router = useRouter();
  const { t, locale, setLocale } = useLocale();
  return (
    <header className="p-6 space-y-6 bg-[#f8f9ff] relative">
      <div className="absolute top-6 right-6 z-10 flex items-center gap-1 rounded-full border border-[#d9ddff] bg-white p-1 shadow-sm">
        {(["en", "th"] as const).map((lng) => (
          <button
            key={lng}
            type="button"
            onClick={() => setLocale(lng)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${locale === lng
                ? "bg-[#4c4bd6] text-white"
                : "text-[#4c4bd6] hover:bg-[#eef0ff]"
              }`}
          >
            {lng.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#b0b3d6]">
            Dashboard Overview
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#2e2e6c]">
            Good to see you again, {userName ?? "Planner"}.
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ShopDropdown
          shops={shops}
          selectedShopId={selectedShopId}
          onSelectShop={onSelectShop}
        />
        <div className="flex flex-wrap gap-2 ml-auto">
          {/* Language Switcher MOVED to top-right absolute position */}

          <Button onClick={onAddShop} className="rounded-full px-5 text-white">
            {t("btn.addShop")}
          </Button>

          <Button
            type="button"
            className="rounded-full bg-emerald-500 px-5 text-white hover:bg-emerald-600 disabled:opacity-60"
            disabled={!canDownloadAssumption || assumptionFileLoading}
            onClick={onDownloadAssumption}
          >
            {assumptionFileLoading ? "กำลังโหลด..." : "Download Excel"}
          </Button>
          <Button
            onClick={() => router.push(`/dashboard/assumptions${selectedShopId ? `?store_id=${selectedShopId}` : ""}`)}
            className="rounded-full bg-[#eef0ff] px-5 text-sm font-semibold text-[#4c4bd6] hover:bg-[#e2e5ff]"
            variant="ghost"
          >
            {t("btn.assumption")}
          </Button>
        </div>
      </div>
    </header>
  );
}

function ShopDropdown({
  shops,
  selectedShopId,
  onSelectShop,
}: {
  shops: Shop[];
  selectedShopId: string;
  onSelectShop: (id: string) => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => shops.find((shop) => shop.id === selectedShopId) || null,
    [selectedShopId, shops]
  );

  useEffect(() => {
    const onClickAway = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  const handleSelectShop = (id: string) => {
    onSelectShop(id); // เลือกทีละร้าน
    setOpen(false);   // ปิด dropdown
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        className="flex min-w-[220px] items-center justify-between gap-3 rounded-full border border-[#e3e6ff] bg-white text-slate-800 shadow-sm hover:border-[#cfd5ff] hover:bg-[#f5f7ff]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="flex flex-col items-start">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-600">
            {t("sidebar.selectShop")}
          </span>
          <span className="text-base font-semibold text-slate-900">
            {shops.length === 0 ? t("sidebar.chooseShop") : selected?.label ?? t("sidebar.chooseShop")}
          </span>
        </div>
        <ChevronIcon direction={open ? "up" : "down"} />
      </Button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-64 overflow-hidden rounded-2xl border border-[#e3e6ff] bg-white shadow-[0_18px_40px_rgba(18,24,68,0.12)]">
          <div className="max-h-64 overflow-auto py-2">
            {shops.length === 0 ? (
              <div className="px-4 py-2 text-sm text-slate-500">{t("sidebar.noShops")}</div>
            ) : (
              shops.map((shop, index) => {
                const active = shop.id === selectedShopId;
                return (
                  <button
                    key={shop.id || `${shop.label}-${index}`}
                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition ${active ? "bg-[#eef1ff] text-[#4c4bd6]" : "text-[#2f3657] hover:bg-[#f7f8ff]"
                      }`}
                    onClick={() => handleSelectShop(shop.id)}
                  >
                    <span className="truncate">{shop.label}</span>
                    {active && <CheckIcon />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  const rotate = direction === "up" ? "rotate-180" : "";
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden
      className={`text-slate-500 transition ${rotate}`}
    >
      <path
        d="m6 9 6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}


function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden className="text-emerald-600">
      <path d="m5 13 4 4L19 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
