import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export type BoothForm = {
  name: string;
  products: string;
  theme: string;
  concept: string;
  location: string;
  category: string;
  size: string;
  equipment: string;
  funding: string;
  staff: string;
  hours: string;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: No user session." },
        { status: 401 }
      );
    }

    const formData: BoothForm = await request.json();
    const userId = session.user.id;

    // 👉 ตรวจว่าเป็น admin?
    //const isAdmin = userId === "9460055f-c144-4b9c-bbd9-aa27486615fe";
    const isAdmin = userId === "9";
    //
    // 1) CHECK STATUS แทนการนับจำนวนร้าน
    //
    const { data: account, error: statusError } = await supabase
      .from("accounts")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle();

    if (statusError) {
      console.error("Check account status failed:", statusError);
      return NextResponse.json(
        { error: "ไม่สามารถตรวจสอบสถานะบัญชีได้" },
        { status: 500 }
      );
    }

    // ถ้าไม่ใช่ admin และ status = true → ปิดสิทธิ์กด
    if (!isAdmin && account?.status === true) {
      return NextResponse.json(
        {
          error: "Quota Exceeded",
          message: "คุณสร้างแผนไปแล้ว 1 ครั้ง",
        },
        { status: 400 }
      );
    }

    //
    // 2) INSERT ร้านใหม่
    //
    const insertData = {
      user_id: userId,
      name: formData.name,
      products: formData.products,
      theme: formData.theme,
      concept: formData.concept,
      location: formData.location,
      category: formData.category ?? "",
      staff: formData.staff,
      hours: formData.hours,
      size_store: formData.size,
      tools: formData.equipment,
      capital: formData.funding,
    };

    const { data: newShop, error } = await supabase
      .from("set_store")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json(
        {
          error: error.message,
          message: "บันทึกร้านค้าล้มเหลว",
        },
        { status: 500 }
      );
    }

    const storeId = newShop?.store_id ?? newShop?.id ?? null;

    //
    // 3) อัปเดต accounts.status = true (ใช้สิทธิ์แล้ว)
    //
    if (!isAdmin) {
      await supabase
        .from("accounts")
        .update({ status: false }) //(ถ้า false จะได้หลายครั้ง)
        .eq("user_id", userId);
    }

    return NextResponse.json(
      {
        ...newShop,
        store_id: storeId,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Internal Server Error:", err);
    return NextResponse.json(
      {
        error: (err as Error).message,
        message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
      },
      { status: 500 }
    );
  }
}
