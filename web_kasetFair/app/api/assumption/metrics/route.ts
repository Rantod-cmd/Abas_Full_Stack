import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("store_id");

  if (!storeId) {
    return NextResponse.json({ error: "Missing store_id" }, { status: 400 });
  }

  // ✅ เช็คว่า store เป็นของ user จริง
  const { data: store, error: storeError } = await supabase
    .from("set_store")
    .select("user_id")
    .eq("store_id", storeId)
    .single();

  if (storeError || !store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  if (store.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ⭐ ดึง metric ที่ต้องใช้บน dashboard
  const { data, error } = await supabase
    .from("assumption")
    .select("foot_traffic, interest_rate, conversion_rate, day1, day2, day3, day4, day5, day6, day7, day8, day9")
    .eq("store_id", storeId)
    .limit(1);

  if (error) {
    console.error("Failed to load assumption metrics", error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }

  return NextResponse.json({
    foot_traffic: data?.[0]?.foot_traffic ?? null,
    interest_rate: data?.[0]?.interest_rate ?? null,
    conversion_rate: data?.[0]?.conversion_rate ?? null,
    day1: data?.[0]?.day1 ?? null,
    day2: data?.[0]?.day2 ?? null,
    day3: data?.[0]?.day3 ?? null,  
    day4: data?.[0]?.day4 ?? null,
    day5: data?.[0]?.day5 ?? null,
    day6: data?.[0]?.day6 ?? null,
    day7: data?.[0]?.day7 ?? null,
    day8: data?.[0]?.day8 ?? null,
    day9: data?.[0]?.day9 ?? null,
  });
}
