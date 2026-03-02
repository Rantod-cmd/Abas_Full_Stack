"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";
import { useLocale } from "../i18n";

type PlannerSidebarProps = {
  onLogout: () => void;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  selectedStoreId?: string | null;
};

type NavItem = {
  labelKey: string;
  href?: string;
  active?: boolean;
};

const baseNavSections: { titleKey: string; items: NavItem[] }[] = [
  {
    titleKey: "sidebar.financial",
    items: [
      { labelKey: "sidebar.dashboard", href: "/dashboard", active: true },

    ],
  },
  {
    titleKey: "sidebar.marketing",
    items: [{ labelKey: "sidebar.7p", href: "/marketing" }],
  },
];

export function PlannerSidebar({
  onLogout,
  userName,
  userEmail,
  userImage,
  selectedStoreId,
  mobile,
  onClose,
}: PlannerSidebarProps & { mobile?: boolean; onClose?: () => void }) {
  const { t } = useLocale();
  const displayName = userName || "ABAS";
  const displayEmail = userEmail || "abasxaxis@gmail.com";
  const pathname = usePathname();

  const navSections = useMemo(() => {
    if (!selectedStoreId) return baseNavSections;
    return baseNavSections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (item.href === "/marketing") {
          return {
            ...item,
            href: `/marketing?store_id=${encodeURIComponent(selectedStoreId)}`,
          };
        }
        return item;
      }),
    }));
  }, [selectedStoreId]);

  const initials = displayName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-8">
        <div className="flex items-center gap-3 rounded-2xl border border-[#e6e7fb] bg-white p-4 shadow-sm">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl ring-2 ring-[#e4e7ff]">
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: "url(/favicon.ico)" }}
              aria-label="Logo"
            />
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-base font-semibold text-[#2f3266]">{displayName}</p>
          </div>
        </div>

        {navSections.map((section) => (
          <div key={section.titleKey} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#b0b3d6]">
              {t(section.titleKey)}
            </p>
            <nav className="space-y-2">
              {section.items.map((item) => {
                const isActive = item.href ? pathname.startsWith(item.href) : !!item.active;
                return (
                  <SidebarItem
                    key={item.labelKey}
                    label={t(item.labelKey)}
                    active={isActive}
                    href={item.href}
                    onClick={mobile ? onClose : undefined}
                  />
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full justify-center rounded-xl border-[#f3e3e3] text-rose-600 hover:border-rose-200 hover:bg-rose-50"
        >
          {t("sidebar.logout")}
        </Button>
      </div>
    </div>
  );

  if (mobile) {
    return (
      <div className="fixed inset-0 z-50 flex lg:hidden">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
        {/* Sidebar Panel */}
        <aside className="relative flex h-full w-80 flex-col border-r border-[#ecefff] bg-[#fcfbff] px-8 py-7 shadow-2xl animate-in slide-in-from-left duration-300">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          {SidebarContent}
        </aside>
      </div>
    );
  }

  return (
    <aside className="sticky top-0 hidden lg:flex h-screen w-80 flex-col justify-between border-r border-[#ecefff] bg-[#fcfbff] px-8 py-7">
      {SidebarContent}
    </aside>
  );
}

function SidebarItem({
  label,
  active,
  href,
  onClick,
}: {
  label: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const className = `flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${active
    ? "bg-[#4c4bd6] text-white shadow-lg ring-2 ring-[#dfe0ff]"
    : "text-[#4b4f68] hover:bg-[#f2f4ff] hover:text-[#4c4bd6]"
    }`;

  const content = (
    <>
      <span>{label}</span>
      {active ? (
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return <div className={className} onClick={onClick}>{content}</div>;
}
