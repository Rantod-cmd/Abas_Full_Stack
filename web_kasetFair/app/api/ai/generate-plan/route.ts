import { NextResponse } from "next/server";

const DEFAULT_PYTHON_GEN_PLAN_URL = "http://localhost:8000/generate-plan";

function resolveGenPlanUrl() {
    if (process.env.PYTHON_GEN_PLAN_URL) return process.env.PYTHON_GEN_PLAN_URL;
    if (process.env.PYTHON_AI_URL?.endsWith("/ai")) {
        return process.env.PYTHON_AI_URL.replace(/\/ai$/, "/generate-plan");
    }
    return DEFAULT_PYTHON_GEN_PLAN_URL;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const url = resolveGenPlanUrl();

        console.log("POST /api/ai/generate-plan ->", url);

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("❌ Python generate-plan error:", text);
            return NextResponse.json({ error: "Back-end error", details: text }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (err) {
        console.error("❌ /api/ai/generate-plan error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
