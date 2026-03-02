import { NextResponse } from "next/server";

const DEFAULT_PYTHON_RAG_URL = process.env.PYTHON_RAG_URL || "http://localhost:8000/rag";

function resolveRagUrl() {
  if (process.env.PYTHON_RAG_URL) return process.env.PYTHON_RAG_URL;
  if (process.env.PYTHON_AI_URL?.endsWith("/ai")) {
    return process.env.PYTHON_AI_URL.replace(/\/ai$/, "/rag");
  }
  return process.env.PYTHON_AI_URL || DEFAULT_PYTHON_RAG_URL;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const question = body?.question;

    if (!question || !String(question).trim()) {
      return NextResponse.json({ error: "ต้องระบุคำถาม (question)" }, { status: 400 });
    }

    const targetUrl = resolveRagUrl();
    const pythonRes = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
      cache: "no-store",
    });

    const data = await pythonRes.json().catch(() => ({}));

    if (!pythonRes.ok) {
      const detail = (data && (data.detail || data.error)) || "RAG backend error";
      return NextResponse.json({ error: detail }, { status: pythonRes.status || 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("❌ /api/rag error:", err);
    return NextResponse.json({ error: "ไม่สามารถประมวลผลคำถามได้" }, { status: 500 });
  }
}
