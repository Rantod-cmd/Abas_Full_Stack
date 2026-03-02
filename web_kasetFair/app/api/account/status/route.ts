import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("accounts")
    .select("status")
    .eq("user_id", session.user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch account status:", error.message);
    return NextResponse.json({ error: "ไม่สามารถตรวจสอบสถานะได้" }, { status: 500 });
  }

  return NextResponse.json({ status: Boolean(data?.status) }, { status: 200 });
}

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from("accounts")
    .update({ status: true })
    .eq("user_id", session.user.id);

  if (error) {
    console.error("Failed to update account status:", error.message);
    return NextResponse.json({ error: "อัปเดตสถานะไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ status: true }, { status: 200 });
}
