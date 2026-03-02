"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Locale = "en" | "th";

type Translations = Record<string, string>;

const messages: Record<Locale, Translations> = {
  en: {
    // Header / actions
    "btn.addShop": "Add shop",
    "btn.edit": "Edit",
    "btn.assumption": "Assumption",
    "btn.download": "Download",
    "btn.seeAll": "See all",
    "btn.close": "Close",
    "btn.cancel": "Cancel",
    "btn.update": "Update",
    "btn.createPlan": "Create plan",
    "btn.save": "Save",
    // Sidebar
    "sidebar.selectShop": "Select shop",
    "sidebar.chooseShop": "Choose a shop",
    "sidebar.noShops": "No shops yet",
    "sidebar.financial": "Financial",
    "sidebar.dashboard": "Dashboard",
    "sidebar.statement": "Statement",
    "sidebar.marketing": "Marketing",
    "sidebar.7p": "7P Analysis",
    "sidebar.setting": "Setting",
    "sidebar.help": "Help & Support",
    "sidebar.logout": "Logout",
    // Dashboard callout
    "dashboard.cta": 'Click "Add shop" to fill in details and let AI build a plan.',
    // Chart
    "chart.costProfitTitle": "Cost & Profit Timeline",
    "chart.overview": "9-day projection overview",
    "chart.expense": "Expense",
    "chart.revenue": "Revenue",
    // Assumptions
    "assump.sectionLabel": "Financial",
    "assump.sectionTitle": "Assumption Analysis",
    "assump.back": "Back to dashboard",
    "assump.cogsTitle": "SKU / COGS Breakdown",
    "assump.cogsSubtitle": "Cost per SKU mapped by ingredient",
    "assump.noSku": "No SKU data",
    "assump.ingredient": "Ingredient",
    "assump.unitCost": "Unit Cost (฿)",
    "assump.noCogs": "No ingredient level cost breakdown found for this store.",
    "assump.addIngredient": "Add Ingredient",
    "assump.totalCogs": "Total COGS per unit",
    "assump.dailyVarTitle": "Daily Variable Costs",
    "assump.dailyVarSubtitle": "Expenses that change with booth activity",
    "assump.addDailyCost": "Add Daily Cost Item",
    "assump.costItem": "Cost Item",
    "assump.costPerUnit": "Cost / Unit (฿)",
    "assump.qtyPerDay": "Qty / Day",
    "assump.totalPerDay": "Total / Day (฿)",
    "assump.noDailyCosts": "No daily variable costs recorded yet.",
    "assump.totalDailyCost": "Total Daily Variable Cost",
    "assump.saleForecastTitle": "Sale Forecast For 9-Day Parameters",
    "assump.saleForecastSubtitle": "Configure traffic and conversion assumptions for your projection period.",
    "assump.legendFootTraffic": "Foot Traffic",
    "assump.legendInterest": "Interest",
    "assump.legendConversion": "Conversion",
    "assump.estBuyers": "Est. Buyers / Day",
    "assump.estBuyersDesc": "Projected buyers given current conversion funnel",
    "assump.totalBuyers": "Total 9-Day Buyers",
    "assump.totalBuyersDesc": "Estimation for entire event",
    // Product mix
    "mix.title": "Sale Volume - 9 Day",
    "mix.tooltipShare": "Share",
    "mix.noData": "Add a shop to see sales mix",
    "mix.performance": "Performance vs Target",
    "mix.sell": "Sell",
    "mix.trend": "Trend: +12% above expected",
    // Financial table
    "finance.summary": "Daily Financial Summary",
    "finance.showProduct": "Show product details",
    "finance.hideProduct": "Hide product details",
    "finance.day": "Day",
    "finance.revenue": "Revenue (THB)",
    "finance.cogs": "COGS (THB)",
    "finance.opex": "Opex (THB)",
    "finance.netProfit": "Net Profit (THB)",
    "finance.accumulated": "Accumulated Cash",
    "finance.noData": "No financial data available",
    "finance.product": "Product",
    "finance.totalRevenue": "Total Revenue (THB)",
    "finance.totalCogs": "Total COGS (THB)",
    "finance.units": "Units Sold",
    "finance.avgPrice": "Avg Price",
    "finance.avgCost": "Avg Cost",
    "finance.grossMargin": "Gross Margin (%)",
    "finance.noProduct": "No product details available",
    // Shop modal
    "modal.editShop": "Edit shop",
    "modal.newShop": "New shop details",
    "modal.name": "Shop name",
    "modal.theme": "Theme",
    "modal.concept": "Concept",
    "modal.location": "Location",
    "modal.category": "Category",
    "modal.size": "Shop size",
    "modal.equipment": "Equipment",
    "modal.funding": "Funding",
    "modal.staff": "Staff",
    "modal.hours": "Hours",
    "modal.products": "Products",
  },
  th: {
    "btn.addShop": "เพิ่มร้านค้า",
    "btn.edit": "แก้ไข",
    "btn.assumption": "Assumption",
    "btn.download": "ดาวน์โหลด",
    "btn.seeAll": "ดูทั้งหมด",
    "btn.close": "ปิด",
    "btn.cancel": "ยกเลิก",
    "btn.update": "อัพเดท",
    "btn.createPlan": "สร้างแผน",
    "btn.save": "บันทึก",
    "sidebar.selectShop": "เลือกร้านค้า",
    "sidebar.chooseShop": "เลือกหน้าร้าน",
    "sidebar.noShops": "ยังไม่มีร้านค้า",
    "sidebar.financial": "การเงิน",
    "sidebar.dashboard": "แดชบอร์ด",
    "sidebar.statement": "สเตทเมนต์",
    "sidebar.marketing": "การตลาด",
    "sidebar.7p": "7P Analysis",
    "sidebar.setting": "ตั้งค่า",
    "sidebar.help": "ช่วยเหลือ",
    "sidebar.logout": "ออกจากระบบ",
    "dashboard.cta": "คลิกปุ่ม “เพิ่มร้านค้า” เพื่อกรอกข้อมูลและให้ AI สร้างแผนการเงิน",
    "chart.costProfitTitle": "ไทม์ไลน์ต้นทุนและกำไร",
    "chart.overview": "ภาพรวมคาดการณ์ 9 วัน",
    "chart.expense": "ต้นทุน/ค่าใช้จ่าย",
    "chart.revenue": "รายได้",
    "assump.sectionLabel": "การเงิน",
    "assump.sectionTitle": "การวิเคราะห์สมมติฐาน",
    "assump.back": "กลับแดชบอร์ด",
    "assump.cogsTitle": "สรุปต้นทุนต่อ SKU",
    "assump.cogsSubtitle": "ต้นทุนต่อ SKU แยกตามวัตถุดิบ",
    "assump.noSku": "ยังไม่มี SKU",
    "assump.ingredient": "วัตถุดิบ",
    "assump.unitCost": "ต้นทุนต่อหน่วย (฿)",
    "assump.noCogs": "ยังไม่มีต้นทุนวัตถุดิบสำหรับร้านนี้",
    "assump.addIngredient": "เพิ่มวัตถุดิบ",
    "assump.totalCogs": "ต้นทุนรวมต่อชิ้น",
    "assump.dailyVarTitle": "ค่าใช้จ่ายผันแปรรายวัน",
    "assump.dailyVarSubtitle": "ค่าใช้จ่ายที่เปลี่ยนตามการขาย",
    "assump.addDailyCost": "เพิ่มรายการค่าใช้จ่าย",
    "assump.costItem": "รายการค่าใช้จ่าย",
    "assump.costPerUnit": "ต้นทุน/หน่วย (฿)",
    "assump.qtyPerDay": "จำนวน/วัน",
    "assump.totalPerDay": "รวม/วัน (฿)",
    "assump.noDailyCosts": "ยังไม่มีรายการค่าใช้จ่ายผันแปร",
    "assump.totalDailyCost": "รวมค่าใช้จ่ายผันแปรต่อวัน",
    "assump.saleForecastTitle": "คาดการณ์ยอดขาย 9 วัน",
    "assump.saleForecastSubtitle": "ตั้งค่าผู้คนที่เดินผ่านและอัตราแปลงสำหรับช่วงงาน",
    "assump.legendFootTraffic": "ผู้ผ่าน",
    "assump.legendInterest": "สนใจ",
    "assump.legendConversion": "ซื้อ",
    "assump.estBuyers": "ผู้ซื้อโดยประมาณ/วัน",
    "assump.estBuyersDesc": "ผู้ซื้อที่คาดการณ์จากฟันเนลปัจจุบัน",
    "assump.totalBuyers": "ผู้ซื้อรวม 9 วัน",
    "assump.totalBuyersDesc": "ประมาณการตลอดงาน",
    "mix.title": "ยอดขายสะสม 9 วัน",
    "mix.tooltipShare": "สัดส่วน",
    "mix.noData": "เพิ่มร้านค้าเพื่อดูข้อมูลการขาย",
    "mix.performance": "ประสิทธิภาพเทียบเป้าหมาย",
    "mix.sell": "ขายได้",
    "mix.trend": "เทรนด์: สูงกว่าคาด +12%",
    "finance.summary": "สรุปการเงินรายวัน",
    "finance.showProduct": "ดูรายละเอียดสินค้า",
    "finance.hideProduct": "ซ่อนรายละเอียดสินค้า",
    "finance.day": "วัน",
    "finance.revenue": "รายได้ (บาท)",
    "finance.cogs": "ต้นทุนสินค้า (บาท)",
    "finance.opex": "ค่าใช้จ่ายดำเนินงาน (บาท)",
    "finance.netProfit": "กำไรสุทธิ (บาท)",
    "finance.accumulated": "กระแสเงินสะสม",
    "finance.noData": "ไม่มีข้อมูลตารางการเงิน",
    "finance.product": "สินค้า",
    "finance.totalRevenue": "ยอดขายรวม (บาท)",
    "finance.totalCogs": "ต้นทุนรวม (บาท)",
    "finance.units": "จำนวน (ชิ้น/ชุด)",
    "finance.avgPrice": "ราคาเฉลี่ย",
    "finance.avgCost": "ต้นทุนเฉลี่ย",
    "finance.grossMargin": "กำไรขั้นต้น (%)",
    "finance.noProduct": "ไม่มีรายละเอียดสินค้า",
    "modal.editShop": "แก้ไขร้านค้า",
    "modal.newShop": "รายละเอียดร้านค้าใหม่",
    "modal.name": "ชื่อร้าน",
    "modal.theme": "ธีม",
    "modal.concept": "แนวคิด (คอนเซปต์)",
    "modal.location": "ตำแหน่งที่ตั้งร้านค้า",
    "modal.category": "หมวดหมู่ร้านค้า",
    "modal.size": "ขนาดของร้าน",
    "modal.equipment": "เครื่องมือที่มีอยู่",
    "modal.funding": "เงินทุน",
    "modal.staff": "จำนวนพนักงาน",
    "modal.hours": "วันและเวลาเปิด-ปิด",
    "modal.products": "รายการสินค้า",
  },
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("locale") as Locale | null) : null;
    if (stored === "en" || stored === "th") {
      setLocale(stored);
    }
  }, []);

  const handleSetLocale = (lng: Locale) => {
    setLocale(lng);
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", lng);
    }
  };

  const t = (key: string) => {
    const dict = messages[locale] || messages.en;
    return dict[key] || messages.en[key] || key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
