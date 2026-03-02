import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("store_id");
  const name = searchParams.get("name");

  const query = supabase.from("suggest_ai").select("*").eq("user_id", session.user.id);

  if (storeId) {
    query.eq("store_id", storeId);
  }
  if (name) {
    query.eq("name", name);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ data: null }, { status: 200 });
    }
    console.error("❌ Supabase Error:", error);
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details ?? undefined },
      { status: 500 }
    );
  }

  return NextResponse.json({ data }, { status: 200 });
}
