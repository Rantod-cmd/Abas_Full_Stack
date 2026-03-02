import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const session = await getServerSession(authOptions);

  console.log("sessionId : ", session?.user?.id);

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

  return NextResponse.json({ status: data?.status === true }, { status: 200 });
}

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let statusValue: boolean;

  if (session.user.id === "9460055f-c144-4b9c-bbd9-aa27486615fe") {
    statusValue = false;
  } else {
    statusValue = true;
  }

  const { error } = await supabaseAdmin
      .from("accounts")
      .update({ status: statusValue })
      .eq("user_id", session.user.id);

  if (error) {
    console.error("Failed to update account status:", error.message);
    return NextResponse.json({ error: "อัปเดตสถานะไม่สำเร็จ" }, { status: 500 });
  }

  // 👉 ตอนนี้จะส่งค่าที่ถูกต้อง
  return NextResponse.json({ status: statusValue }, { status: 200 });
}
