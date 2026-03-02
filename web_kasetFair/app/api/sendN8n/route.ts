import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { store_id, data = {} } = body;

    if (!store_id) {
      return NextResponse.json(
        { error: "store_id required" },
        { status: 400 }
      );
    }

    const n8nSheetUrl = process.env.N8N_WEBHOOK_URL_SHEET;
    const n8nReportUrl = process.env.N8N_WEBHOOK_URL_REPORT;

    if (!n8nSheetUrl || !n8nReportUrl) {
      return NextResponse.json(
        { error: "N8N_WEBHOOK_URL not configured" },
        { status: 500 }
      );
    }

    // ดึงข้อมูลร้าน
    const { data: store, error } = await supabaseAdmin
      .from("set_store")
      .select("*")
      .eq("store_id", store_id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 👉 job_id ของเรา
    const job_id = randomUUID();

    // บันทึกงาน
    await supabaseAdmin.from("jobs").insert({
      job_id,
      status: "pending",
    });

    const payload_sheet = {
      job_id,
      store_id,
      ...data,
    };

    const payload_report = {
      job_id,
      event: "STORE_DATA",
      store_id,
      store,
      sent_at: new Date().toISOString(),
    };

    // 🚀 ยิงไป n8n — ไม่ await
    fetch(n8nSheetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload_sheet),
    }).catch(console.error);

    fetch(n8nReportUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload_report),
    }).catch(console.error);

    return NextResponse.json({
      status: "queued",
      job_id,
    });
  } catch (err: any) {
    console.error("❌ sendN8n failed:", err);
    return NextResponse.json(
      { error: err.message || "Send to n8n failed" },
      { status: 500 }
    );
  }
}
