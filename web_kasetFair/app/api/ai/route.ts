import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const DEFAULT_PYTHON_AI_URL = "http://localhost:8000/ai";
const DEFAULT_PYTHON_RAG_URL = "http://localhost:8000/rag";

function resolveRagUrl() {
  if (process.env.PYTHON_RAG_URL) return process.env.PYTHON_RAG_URL;
  if (process.env.PYTHON_AI_URL?.endsWith("/ai")) {
    return process.env.PYTHON_AI_URL.replace(/\/ai$/, "/rag");
  }
  return process.env.PYTHON_AI_URL || DEFAULT_PYTHON_RAG_URL;
}

function buildRagQuestion(payload: Record<string, unknown>) {
  const parts: string[] = [];
  if (payload.name) parts.push(`ชื่อร้าน: ${payload.name}`);
  if (payload.products) parts.push(`สินค้า: ${payload.products}`);
  if (payload.concept) parts.push(`คอนเซ็ปต์: ${payload.concept}`);
  if (payload.theme) parts.push(`ธีม: ${payload.theme}`);
  if (payload.location) parts.push(`ทำเล: ${payload.location}`);
  return parts.length
    ? `ขอคำแนะนำเป็นหัวข้อย่อยสำหรับร้านในงานเกษตรแฟร์จากข้อมูลต่อไปนี้:\n${parts.join("\n")}`
    : "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("FORM DATA RECEIVED:", body);

    const pythonAiUrl = process.env.PYTHON_AI_URL || DEFAULT_PYTHON_AI_URL;
    console.log("🚀 [DEBUG] Calling Python AI at:", pythonAiUrl);

    const aiRequest = fetch(pythonAiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Optional: fire RAG in parallel using same payload-derived question
    const ragQuestion = buildRagQuestion(body);
    const ragPromise = ragQuestion
      ? fetch(resolveRagUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: ragQuestion }),
      }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "RAG backend error");
        return data;
      })
      : Promise.resolve(null);

    const [aiRes, ragRes] = await Promise.allSettled([aiRequest, ragPromise]);

    if (aiRes.status === "rejected") {
      console.error("❌ Python AI request failed:", aiRes.reason);
      return NextResponse.json({ error: "Python AI ประมวลผลล้มเหลว" }, { status: 500 });
    }

    const aiResponse = aiRes.value;
    const aiResult = await aiResponse.json().catch(() => ({}));
    if (!aiResponse.ok) {
      return NextResponse.json({ error: aiResult?.error || "Python AI ประมวลผลล้มเหลว" }, { status: 500 });
    }

    let ragResult = null;
    if (ragRes.status === "fulfilled") {
      ragResult = ragRes.value;
    } else if (ragRes.status === "rejected" && ragQuestion) {
      console.warn("⚠️ RAG request failed:", ragRes.reason);
    }

    if (ragResult?.answer_text && body?.store_id && supabaseAdmin) {
      console.log("📝 Saving RAG result to Supabase for store_id:", body.store_id);
      try {
        const { error: updateError } = await supabaseAdmin
          .from("set_store")
          .update({ suggest_ai: ragResult.answer_text })
          .eq("store_id", body.store_id);

        if (updateError) {
          console.error("❌ Supabase update failed:", updateError);
        } else {
          console.log("✅ Supabase update successful");
        }
      } catch (err) {
        console.error("⚠️ Exception during Supabase update:", err);
      }
    } else {
      console.log("⚠️ Skipping RAG save. missing:", {
        hasAnswer: !!ragResult?.answer_text,
        hasStoreId: !!body?.store_id,
        hasSupabaseAdmin: !!supabaseAdmin
      });
    }

    return NextResponse.json({ ...aiResult, rag_result: ragResult });
  } catch (err) {
    console.error("❌ /api/ai unexpected error:", err);
    return NextResponse.json({ error: "Next.js ส่งข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}
