import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error("Finance webhook missing env: N8N_WEBHOOK_URL");
      return NextResponse.json(
        { error: "N8N webhook URL is not configured" },
        { status: 500 },
      );
    }

    const body = await request.json();
    const storeId = body?.store_id;

    if (!storeId) {
      return NextResponse.json(
        { error: "store_id is required" },
        { status: 400 },
      );
    }

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_id: storeId }),
    });

    const text = await webhookResponse.text();

    if (!webhookResponse.ok) {
      console.error("Finance webhook error:", webhookResponse.status, text);
      return NextResponse.json(
        { error: "Webhook request failed", detail: text },
        { status: webhookResponse.status },
      );
    }

    return NextResponse.json({ ok: true, detail: text || null });
  } catch (error) {
    console.error("Finance webhook exception:", error);
    return NextResponse.json(
      { error: "Failed to call finance webhook" },
      { status: 500 },
    );
  }
}
