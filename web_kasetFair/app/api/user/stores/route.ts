import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json([], { status: 200 });
    }

    console.log("SESSION API:", session);

    const { data, error } = await supabase
      .from("set_store")
      .select("store_id, name, products, theme, concept, location, staff, hours, size_store, tools, capital, category")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("DB ERROR:", error);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json([], { status: 200 });
  }
  
}
