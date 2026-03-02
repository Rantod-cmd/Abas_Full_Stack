import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EditShopForm } from "@/app/dashboard/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData: EditShopForm = await request.json();

        console.log("USER SESSION ID:", session.user.id);
        console.log("FORM ID:", formData.id);
        console.log("FORM DATA RECEIVED:", formData);

        const { data, error } = await supabase.from("set_store").update({
            name: formData.name,
            products: formData.products,
            theme: formData.theme,
            concept: formData.concept,
            location: formData.location,
            category: formData.category,
            staff: formData.staff,
            hours: formData.hours,
            size_store: formData.size,
            tools: formData.equipment,
            capital: formData.funding,
        }).eq("store_id", formData.id)
        .eq("user_id", session.user.id)
        .select()
        .maybeSingle();

        if (error) {
            console.error(error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
