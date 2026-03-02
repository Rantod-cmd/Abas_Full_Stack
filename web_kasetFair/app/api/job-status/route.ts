import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const job_id = searchParams.get("job_id");

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("*")
    .eq("job_id", job_id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}
