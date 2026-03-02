import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("accounts")
      .select("merchant_code, username")
      .eq("user_id", session.user.id)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch merchant_code:", error.message);
      return NextResponse.json({ error: "ไม่สามารถดึง merchant_code ได้" }, { status: 500 });
    }

    const merchantCode = (data?.merchant_code ?? data?.username ?? null) as string | null;

    return NextResponse.json(
      { merchant_code: merchantCode },
      { status: 200 },
    );
  } catch (err) {
    console.error("Unexpected error while loading merchant_code:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
