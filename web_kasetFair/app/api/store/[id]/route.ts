import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("set_store")
    .select("*")
    .eq("user_id", session.user.id)
    .or(`id.eq.${id},store_id.eq.${id}`)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Not Found or not allowed" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
