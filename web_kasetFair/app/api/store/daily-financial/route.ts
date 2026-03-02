import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
    const { store_id } = await req.json();
    console.log("API: Fetching daily financial for store_id:", store_id);

    try {
        // Fetch Revenue (DAY1-DAY9)
        const { data: revenueRows, error: revenueError } = await supabase
            .from("revenue_table")
            .select("*") // Fetch all columns to be sure
            .eq("store_id", store_id);

        if (revenueError) throw revenueError;
        const revenueData = revenueRows?.[0] || {};

        // Fetch COGS (DAY1-DAY9)
        const { data: cogsRows, error: cogsError } = await supabase
            .from("cog_table")
            .select("*")
            .eq("store_id", store_id);

        if (cogsError) throw cogsError;
        const cogsData = cogsRows?.[0] || {};

        // Fetch OpEx (DAY1-DAY9)
        const { data: opexRows, error: opexError } = await supabase
            .from("opex_table")
            .select("*")
            .eq("store_id", store_id);

        if (opexError) throw opexError;
        const opexData = opexRows?.[0] || {};

        // Transform data into daily array
        const dailyData = [];
        for (let i = 1; i <= 9; i++) {
            const dayKeyUpper = `DAY${i}`;
            const dayKeyLower = `day${i}`;

            const rev = (revenueData as any)?.[dayKeyUpper] ?? (revenueData as any)?.[dayKeyLower] ?? 0;
            const cog = (cogsData as any)?.[dayKeyUpper] ?? (cogsData as any)?.[dayKeyLower] ?? 0;
            const opex = (opexData as any)?.[dayKeyUpper] ?? (opexData as any)?.[dayKeyLower] ?? 0;

            dailyData.push({
                day: i,
                revenue: Number(rev) || 0,
                cogs: Number(cog) || 0,
                opex: Number(opex) || 0,
                net_profit: 0 // Placeholder เพื่อไม่ให้เกิด Error ใน Frontend
            });
        }

        console.log("API: Final dailyData structure (cast to numbers):", JSON.stringify(dailyData));
        return NextResponse.json({ dailyData });
    } catch (error) {
        console.error("Error fetching daily financial data:", error);
        return NextResponse.json({ error: "Failed to fetch daily data" }, { status: 500 });
    }
}
