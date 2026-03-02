import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { job_id, status = "done" } = body;
    console.log("📥 callback body:", body);

    if (!job_id) {
      return NextResponse.json(
        { error: "job_id is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("jobs")
      .update({
        status,
      })
      .eq("job_id", job_id);

    if (error) {
      console.error("❌ update jobs failed:", error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ n8n-callback error:", err);
    return NextResponse.json(
      { error: err?.message ?? "callback failed" },
      { status: 500 }
    );
  }
}
