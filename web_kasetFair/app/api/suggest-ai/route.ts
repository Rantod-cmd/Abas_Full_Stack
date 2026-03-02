import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: No user session." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { store_id, name, advice, response_data } = body;

    console.log("📥 /api/suggest-ai payload:", {
      store_id,
      name,
      hasAdvice: !!advice,
      hasResponseData: !!response_data,
    });

    // ✅ ต้องมี store_id หรือ name อย่างใดอย่างหนึ่ง
    if (!store_id && !name) {
      return NextResponse.json(
        { error: "store_id หรือ name จำเป็นต้องระบุอย่างใดอย่างหนึ่ง" },
        { status: 400 }
      );
    }

    if (!advice) {
      return NextResponse.json(
        { error: "advice จำเป็นต้องระบุ" },
        { status: 400 }
      );
    }

    console.log("💾 บันทึกข้อมูล suggest_ai สำหรับ store_id:", store_id || "N/A", "name:", name || "N/A");

    const insertData: {
      advice: string;
      user_id: string;
      store_id?: string;
      name?: string;
      response_data?: unknown;
    } = { advice, user_id: session.user.id };

    // ✅ บันทึก store_id หรือ name
    if (store_id) {
      insertData.store_id = store_id;
    }
    if (name) {
      insertData.name = name;
    }

    // บันทึก response_data เป็น JSON ถ้าแปลงได้
    if (response_data !== undefined) {
      try {
        insertData.response_data =
          typeof response_data === "string" ? JSON.parse(response_data) : response_data;
      } catch {
        insertData.response_data = response_data;
      }
    }

    const { data, error } = await supabase
      .from("suggest_ai")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase Error:", error);
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          details: error.details,
          message: "บันทึกข้อมูล suggest_ai ล้มเหลว" 
        },
        { status: 500 }
      );
    }

    console.log("✅ บันทึกข้อมูล suggest_ai สำเร็จ:", data);
    return NextResponse.json({ 
      success: true, 
      data: data 
    }, { status: 200 });

  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return NextResponse.json(
      { 
        error: (err as Error).message,
        message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" 
      },
      { status: 500 }
    );
  }
}
