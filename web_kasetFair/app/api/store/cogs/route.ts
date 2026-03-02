import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { store_id: storeId } = (await req.json()) as { store_id?: string };

    if (!storeId) {
      return NextResponse.json({ error: "store_id จำเป็นต้องระบุ" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("cogs")
      .select("store_id, ingredient, unit_cost")
      .eq("store_id", storeId);

    if (error) {
      console.warn("⚠️ ดึง cogs ไม่สำเร็จ:", error.message);
      return NextResponse.json({ data: null, message: "ยังไม่มี COGS" });
    }

    const rows = Array.isArray(data) ? data : data ? [data] : [];
    if (!rows.length) {
      return NextResponse.json({ data: null, message: "ยังไม่มี COGS" });
    }

    // ส่งกลับในรูปแบบ arrays ให้ frontend ใช้งานต่อ
    const ingredient = rows.map((r) => r.ingredient);
    const unit_cost = rows.map((r) => r.unit_cost);

    return NextResponse.json({ store_id: storeId, ingredient, unit_cost });
  } catch (err) {
    console.error("❌ /api/store/cogs error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการโหลด COGS" }, { status: 500 });
  }
}
