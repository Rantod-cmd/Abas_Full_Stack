import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
    const { store_id } = await req.json();

    try {
        const { data, error } = await supabase
            .from("revenue_table")
            .select("total, net_profit")
            .eq("store_id", store_id); // เอาแค่อันเดียว (ถ้าจะเอา single() ให้เติมต่อท้าย)

        if (error) throw error;

        // ดึงค่าแรกมาใช้เลย (ไม่ Sum)
        const total = (data as any)?.[0]?.total || 0;
        const netProfit = (data as any)?.[0]?.net_profit || 0;

        return NextResponse.json({ totalRevenue: total, netProfit });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch revenue" }, { status: 500 });
    }
}