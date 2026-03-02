import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { store_id } = body;

    if (!store_id || store_id === "initial") {
      return NextResponse.json(
        { error: "store_id จำเป็นต้องระบุ" },
        { status: 400 }
      );
    }

    console.log("🔍 ค้นหา business_plans จาก store_id:", store_id);

    const query = supabase
      .from("business_plans")
      .select("*")
      .eq("store_id", store_id);

    const { data, error } = await query.limit(1);

    if (error) {
      console.warn("⚠️ ไม่พบ business_plans:", error.message);
      return NextResponse.json(
        { data: null, message: "ยังไม่มีแผนธุรกิจ" },
        { status: 200 }
      );
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return NextResponse.json(
        { data: null, message: "ยังไม่มีแผนธุรกิจ" },
        { status: 200 }
      );
    }

    console.log("✅ พบ business_plans:", row);
    return NextResponse.json(row);
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
