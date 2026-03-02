"use client";

import { useEffect } from "react"; // ✅ Import useEffect
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BoothForm } from "../types";
import { useLocale } from "../i18n";

const CATEGORY_OPTIONS = [
  { value: "อาหารคาว", label: "อาหารคาว" },
  { value: "ของหวานและขนม", label: "ของหวานและขนม" },
  { value: "เครื่องดื่ม", label: "เครื่องดื่ม" },
  { value: "สินค้า/บริการอื่นๆ", label: "สินค้า/บริการอื่นๆ" },
];

type ShopFormModalProps = {
  open: boolean;
  form: BoothForm;
  error?: string | null;
  onChange: (updates: Partial<BoothForm>) => void;
  onClose: () => void;
  onSave: () => void;
  isEdit?: boolean; // ← เพิ่ม prop นี้
  isAdmin?: boolean;
};

export function ShopFormModal({
  open,
  form,
  error,
  onChange,
  onClose,
  onSave,
  isEdit = false, // ← ค่า default = เพิ่มร้าน
  isAdmin = false,
}: ShopFormModalProps) {
  const { t } = useLocale();

  // ✅ Auto-set default category if empty
  useEffect(() => {
    if (open && !form.category) {
      onChange({ category: CATEGORY_OPTIONS[0].value });
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Modal Panel */}
        <div className="relative w-full max-w-3xl transform rounded-2xl bg-white p-6 text-left shadow-2xl ring-1 ring-slate-200 transition-all">

          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-slate-900">
              {isEdit ? t("modal.editShop") : t("modal.newShop")}
            </p>
            <button
              onClick={onClose}
              className="rounded-full px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            >
              {t("btn.close")}
            </button>
          </div>

          {/* Form Inputs */}
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <LabeledInput
              label={t("modal.name")}
              value={form.name}
              onChange={(value) => onChange({ name: value })}
              placeholder="ระบุชื่อร้านของคุณ เช่น ร้านไก่ทอด"
            />
            <LabeledInput
              label={t("modal.theme")}
              value={form.theme}
              onChange={(value) => onChange({ theme: value })}
              placeholder="ระบุธีมของร้าน เช่น ธีมสีแดงขาวเหมือน KFC"
            />
            <LabeledInput
              label={t("modal.concept")}
              value={form.concept}
              onChange={(value) => onChange({ concept: value })}
              placeholder="ระบุคอนเซ็ปต์ของร้าน เช่น ไก่ทอดสดใหม่ทุกวัน"
            />
            <LabeledInput
              label={t("modal.location")}
              value={form.location}
              onChange={(value) => onChange({ location: value })}
              readOnly={!isAdmin}
            />
            <LabeledSelect
              label={t("modal.category")}
              value={form.category}
              options={CATEGORY_OPTIONS}
              onChange={(value) => onChange({ category: value })}
            />
            <LabeledInput
              label={t("modal.size")}
              value={form.size}
              onChange={(value) => onChange({ size: value })}
              placeholder="ระบุขนาดของร้าน เช่น 2 x 2 เมตร"
            />
            <LabeledInput
              label={t("modal.equipment")}
              value={form.equipment}
              onChange={(value) => onChange({ equipment: value })}
              placeholder="ระบุเครื่องมือของร้าน เช่น เครื่องปั่น"
            />
            <LabeledInput
              label={t("modal.funding")}
              value={form.funding}
              onChange={(value) => onChange({ funding: value })}
              placeholder="ระบุราคาต้นทุน เช่น 10,000 บาท"
            />
            <LabeledInput
              label={t("modal.staff")}
              value={form.staff}
              onChange={(value) => onChange({ staff: value })}
              placeholder="ระบุจำนวนพนักงาน เช่น 3 คน (เจ้าของร้าน 1 คน ช่วยเหลือ 2 คน)"
            />
            <LabeledInput
              label={t("modal.hours")}
              value={form.hours}
              onChange={(value) => onChange({ hours: value })}
              placeholder="ระบุเวลาที่เปิดให้บริการ เช่น 08.00 - 20.00 น."
            />

            {/* Products textarea */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-sm font-semibold text-slate-900">
                {t("modal.products")}
                <Textarea
                  value={form.products}
                  onChange={(e) => onChange({ products: e.target.value })}
                  rows={3}
                  className="mt-1"
                  placeholder="ระบุสินค้าที่ขาย เช่น ไก่ทอด 3 เมนู ไก่ทอดวิงแซ่บ 49 บาท ไก่ทอดสาหร่าย 59 บาท และ ไก่ทอดหมาล่า 69 บาท"
                />
              </label>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="mt-6 flex items-center justify-between gap-3">
            {error ? <p className="text-sm text-rose-500">{error}</p> : <div />}

            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={onClose}>
                {t("btn.cancel")}
              </Button>

              {/* ปุ่มแก้ตามโหมด */}
              <Button
                onClick={onSave}
                className="bg-emerald-500 text-white hover:bg-emerald-600"
              >
                {isEdit ? t("btn.update") : t("btn.createPlan")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  readOnly = false,
  placeholder,

}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="text-sm font-semibold text-slate-900">
      {label}
      <Input
        className="mt-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        aria-readonly={readOnly}
        disabled={readOnly}
        placeholder={placeholder}
      />
    </label>
  );
}

function LabeledSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  readOnly?: boolean;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const selectValue = value || options[0]?.value || "";
  return (
    <label className="text-sm font-semibold text-slate-900">
      {label}
      <select
        className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
        value={selectValue}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
