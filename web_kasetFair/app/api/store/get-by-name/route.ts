import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, name } = body;

    if (!user_id || !name) {
      return NextResponse.json(
        { error: "user_id และ name จำเป็นต้องระบุ" },
        { status: 400 }
      );
    }

    console.log("🔍 ค้นหา store โดย user_id:", user_id, "name:", name);

    const { data, error, count } = await supabase
      .from("set_store")
      .select("store_id, name, user_id", { count: "exact", head: false })
      .eq("user_id", user_id)
      .eq("name", name)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      console.error("❌ DB Error:", error);
      return NextResponse.json({ error: "ไม่พบร้านค้า" }, { status: 404 });
    }

    if (typeof count === "number" && count > 1) {
      console.warn(`⚠️ พบ ${count} ร้านที่ชื่อซ้ำกัน เลือกแถวแรกให้ผู้ใช้`);
    }

    console.log("✅ พบร้านค้า:", data);
    return NextResponse.json({ store_id: data.store_id, name: data.name });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}