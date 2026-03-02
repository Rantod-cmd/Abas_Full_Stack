import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const DEFAULT_PYTHON_COGS_URL = "http://localhost:8000/cogs";

function resolvePythonCogsUrl() {
  if (process.env.PYTHON_COGS_URL) return process.env.PYTHON_COGS_URL;
  if (process.env.PYTHON_AI_URL?.endsWith("/ai")) {
    return process.env.PYTHON_AI_URL.replace(/\/ai$/, "/cogs");
  }
  return process.env.PYTHON_AI_URL || DEFAULT_PYTHON_COGS_URL;
}

export async function POST(req: Request) {
  try {
    const { store_id: storeId, product } = (await req.json()) as { store_id?: string; product?: string };

    if (!storeId || !product) {
      return NextResponse.json({ error: "store_id และ product จำเป็นต้องระบุ" }, { status: 400 });
    }

    // Trigger Python aisearch to generate and persist COGS
    const pythonUrl = resolvePythonCogsUrl();
    const pythonRes = await fetch(pythonUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_id: storeId, product }),
    });

    if (!pythonRes.ok) {
      const detail = await pythonRes.text();
      return NextResponse.json({ error: "Python COGS ประมวลผลไม่สำเร็จ", detail }, { status: 500 });
    }

    const pythonData = await pythonRes.json().catch(() => ({}));

    // Fetch latest cogs row to return to client
    const { data, error } = await supabaseAdmin
      .from("cogs")
      .select("store_id, ingredient, unit_cost")
      .eq("store_id", storeId);

    if (error) {
      console.warn("⚠️ อ่าน cogs หลัง generate ไม่สำเร็จ:", error.message);
    }

    return NextResponse.json({
      generated: pythonData,
      cogs: Array.isArray(data) ? data : data ? [data] : null,
    });
  } catch (err) {
    console.error("❌ /api/store/cogs-generate error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการ generate COGS" }, { status: 500 });
  }
}
