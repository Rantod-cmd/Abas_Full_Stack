import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
    const { store_id } = await req.json();

    try {
        const { data, error } = await supabase
            .from("cog_table")
            .select("total")
            .eq("store_id", store_id);
        if (error) throw error;

        // ดึงค่าแรกมาใช้เลย (ไม่ Sum)
        const total = (data as any)?.[0]?.total || 0;
        return NextResponse.json({ totalCog: total });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch cogs" }, { status: 500 });
    }
}
