import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
