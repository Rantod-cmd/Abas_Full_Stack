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

  const { data, error } = await supabase
    .from("assumption")
    .select("fileId")
    .eq("store_id", storeId)
    .limit(1);

  if (error) {
    console.error("Failed to load assumption fileId", error);
    return NextResponse.json({ error: "Failed to load fileId" }, { status: 500 });
  }

  return NextResponse.json({ fileId: data?.[0]?.fileId ?? null });
}
