"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlannerSidebar } from "../dashboard/components/PlannerSidebar";
import { LocaleProvider } from "../dashboard/i18n";

type StoreSummary = {
  store_id?: string | null;
  name?: string | null;
};

export default function MarketingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storesLoading, setStoresLoading] = useState(false);
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);

  const syncStoreQueryParam = useCallback(
    (nextStoreId: string) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set("store_id", nextStoreId);
      router.replace(`/marketing?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    setStoresLoading(true);

    async function fetchStores() {
      try {
        const res = await fetch("/api/user/stores");
        const storeList = (await res.json()) as StoreSummary[];
        if (cancelled) return;

        const available = storeList.filter((store) => store.store_id);
        setStores(available);

        if (!available.length) {
          setError("ไม่พบร้าน กรุณาเพิ่มร้านค้าก่อน");
          setPdfUrl(null);
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Load store_id failed:", err);
        setError(err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลร้านได้");
        setPdfUrl(null);
        setLoading(false);
      } finally {
        if (!cancelled) setStoresLoading(false);
      }
    }

    fetchStores();
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (storesLoading) return;

    const paramId = searchParams.get("store_id");
    const paramMatch = paramId && stores.some((s) => s.store_id === paramId) ? paramId : null;
    const currentValidStoreId =
      storeId && stores.some((s) => s.store_id === storeId) ? storeId : null;
    const firstStoreId = stores[0]?.store_id ?? null;
    const nextStoreId = paramMatch ?? currentValidStoreId ?? firstStoreId;

    if (nextStoreId && nextStoreId !== storeId) {
      setStoreId(nextStoreId);
      if (paramMatch !== nextStoreId) {
        syncStoreQueryParam(nextStoreId);
      }
      return;
    }

    if (!nextStoreId && !storesLoading && !stores.length) {
      setError("ไม่พบร้าน กรุณาเพิ่มร้านค้าก่อน");
      setPdfUrl(null);
      setLoading(false);
    }
  }, [status, storesLoading, stores, searchParams, storeId, syncStoreQueryParam]);

  useEffect(() => {
    async function loadPdf(currentStoreId: string) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/marketing/7p?store_id=${encodeURIComponent(currentStoreId)}`);
        const payload = (await res.json()) as { url?: string; error?: string };
        if (!res.ok) {
          throw new Error(payload.error || "ไม่สามารถดึงไฟล์ 7P ได้");
        }
        setPdfUrl(payload.url ?? null);
      } catch (err) {
        console.error("Load 7P pdf failed:", err);
        setError(err instanceof Error ? err.message : "ไม่สามารถดึงไฟล์ 7P ได้");
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated" && storeId) {
      loadPdf(storeId);
    }
  }, [status, storeId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelectStore = (nextId: string) => {
    if (!nextId || nextId === storeId) return;
    setError(null);
    setPdfUrl(null);
    setStoreId(nextId);
    syncStoreQueryParam(nextId);
  };

  if (status === "loading") {
    return null;
  }

  return (
    <LocaleProvider>
      <div className="min-h-screen bg-white text-slate-900">

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <PlannerSidebar
            mobile
            onLogout={() => signOut({ callbackUrl: "/login" })}
            userName={session?.user?.name}
            userEmail={session?.user?.email}
            userImage={session?.user?.image}
            selectedStoreId={storeId}
            onClose={() => setMobileMenuOpen(false)}
          />
        )}

        <div className="flex min-h-screen">
          <PlannerSidebar
            onLogout={() => signOut({ callbackUrl: "/login" })}
            userName={session?.user?.name}
            userEmail={session?.user?.email}
            userImage={session?.user?.image}
            selectedStoreId={storeId}
          />

          <main className="flex-1 space-y-6 bg-[#f8f9ff] p-6 sm:p-10">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                {/* Hamburger Button */}
                <button
                  type="button"
                  className="lg:hidden mt-1 p-2 -ml-2 text-slate-500 hover:text-[#4c4bd6] hover:bg-white rounded-xl transition"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                </button>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9a9af5]">
                    Marketing
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold text-[#2e2e6c]">7P Analysis</h1>
                  <p className="mt-1 text-sm text-[#6b6f92]">
                    เอกสารกลยุทธ์ 7P
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="flex flex-1 sm:flex-none items-center gap-2 rounded-full border border-[#e6e9ff] bg-white px-3 py-2">
                  <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-[#7a80a7]">
                    เลือกร้าน
                  </span>
                  <select
                    className="w-full sm:w-auto min-w-[100px] bg-transparent text-sm font-semibold text-[#2e2e6c] focus:outline-none"
                    value={storeId ?? ""}
                    onChange={(e) => handleSelectStore(e.target.value)}
                    disabled={storesLoading || loading || !stores.length}
                  >
                    <option value="" disabled>
                      {storesLoading ? "กำลังโหลด..." : "เลือกร้าน"}
                    </option>
                    {stores.map((store) => (
                      <option key={store.store_id} value={store.store_id ?? ""}>
                        {store.name || store.store_id}
                      </option>
                    ))}
                  </select>
                </div>
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    className="flex-1 sm:flex-none rounded-full border border-[#d5d9ff] px-4 py-2 text-sm font-semibold text-[#4c4bd6] transition hover:border-[#4c4bd6] hover:bg-[#f4f4ff] whitespace-nowrap"
                  >
                    ดาวน์โหลด
                  </a>
                )}
              </div>
            </header>

            <section className="flex-1 rounded-3xl border border-[#e6e9ff] bg-white p-4 shadow-sm">
              {loading ? (
                <div className="flex h-[70vh] items-center justify-center text-sm text-[#7a80a7]">
                  กำลังโหลดไฟล์ 7P...
                </div>
              ) : error ? (
                <div className="flex h-[70vh] flex-col items-center justify-center gap-3 text-center text-sm text-rose-500">
                  <p>{error}</p>
                  <button
                    className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600"
                    onClick={() => {
                      setError(null);
                      if (!storeId) {
                        setError("กรุณาเลือกร้านค้าก่อนโหลดไฟล์");
                        return;
                      }
                      setLoading(true);
                      fetch(`/api/marketing/7p?store_id=${encodeURIComponent(storeId)}`)
                        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
                        .then(({ ok, data }) => {
                          if (!ok) throw new Error(data.error || "ไม่สามารถดึงไฟล์ 7P ได้");
                          setPdfUrl(data.url ?? null);
                        })
                        .catch((err) => setError(err instanceof Error ? err.message : "โหลดไฟล์ไม่สำเร็จ"))
                        .finally(() => setLoading(false));
                    }}
                  >
                    ลองใหม่อีกครั้ง
                  </button>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="h-[75vh] w-full rounded-2xl border border-[#e6e9ff]"
                  title="7P Analysis PDF"
                />
              ) : (
                <div className="flex h-[70vh] items-center justify-center text-sm text-[#7a80a7]">
                  ไม่พบไฟล์ 7P สำหรับแสดงผล
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </LocaleProvider>
  );
}
