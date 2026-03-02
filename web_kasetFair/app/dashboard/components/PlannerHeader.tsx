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
  onOpenMobileMenu?: () => void;
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
  onOpenMobileMenu,
}: PlannerHeaderProps) {
  const router = useRouter();
  const { t, locale, setLocale } = useLocale();
  return (
    <header className="p-4 sm:p-6 space-y-6 bg-[#f8f9ff] relative mb-6">
      {/* Top Bar: Hamburger (Mobile) + Language Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-[#4c4bd6] hover:bg-white rounded-xl transition"
            onClick={onOpenMobileMenu}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.4em] text-[#b0b3d6]">
            Dashboard
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-[#d9ddff] bg-white p-1 shadow-sm">
          {(["en", "th"] as const).map((lng) => (
            <button
              key={lng}
              type="button"
              onClick={() => setLocale(lng)}
              className={`rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold transition ${locale === lng
                ? "bg-[#4c4bd6] text-white"
                : "text-[#4c4bd6] hover:bg-[#eef0ff]"
                }`}
            >
              {lng.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Title / Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#2e2e6c] leading-tight">
          Good to see you again, <br className="sm:hidden" />
          <span className="text-[#4c4bd6]">{userName ?? "Planner"}.</span>
        </h1>
      </div>

      {/* Controls Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        {/* Shop Dropdown (Full width on mobile) */}
        <div className="w-full sm:w-auto">
          <ShopDropdown
            shops={shops}
            selectedShopId={selectedShopId}
            onSelectShop={onSelectShop}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {shops.length === 0 && (
            <Button onClick={onAddShop} className="flex-1 sm:flex-none rounded-full px-5 text-white">
              {t("btn.addShop")}
            </Button>
          )}

          <Button
            type="button"
            className="flex-1 sm:flex-none rounded-full bg-emerald-500 px-4 sm:px-5 text-white hover:bg-emerald-600 disabled:opacity-60 text-xs sm:text-sm"
            disabled={!canDownloadAssumption || assumptionFileLoading}
            onClick={onDownloadAssumption}
          >
            {assumptionFileLoading ? "Loading..." : "Excel"}
          </Button>

          <Button
            onClick={() => router.push(`/dashboard/assumptions${selectedShopId ? `?store_id=${selectedShopId}` : ""}`)}
            className="flex-1 sm:flex-none rounded-full bg-[#eef0ff] px-4 sm:px-5 text-xs sm:text-sm font-semibold text-[#4c4bd6] hover:bg-[#e2e5ff]"
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
