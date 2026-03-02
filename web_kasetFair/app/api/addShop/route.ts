import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase Service Role environment variables (SUPABASE_URL/SUPABASE_SERVICE_KEY) are not set.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // 🔒 Enforce 1 Shop Per Account Limit
    const { count, error: countError } = await supabase
      .from('set_store')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);

    if (countError) {
      console.error("Check existing shop failed:", countError);
      return NextResponse.json({ error: "Failed to check existing shops" }, { status: 500 });
    }

    if (count && count >= 1) {
      return NextResponse.json(
        { error: "Quota Exceeded", message: "1 Account สามารถสร้างได้แค่ 1 ร้านค้าเท่านั้นครับ" },
        { status: 400 }
      );
    }

    const insertData = {
      user_id: session.user.id,
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
      .from('set_store')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json(
        {
          error: error.message,
          message: "บันทึกร้านค้าล้มเหลว (ตรวจสอบ RLS Policy หรือ Field ในตาราง set_shop)"
        },
        { status: 500 }
      );
    }

    const storeId = newShop?.store_id ?? newShop?.id ?? null;

    return NextResponse.json(
      {
        ...newShop,
        store_id: storeId,
      },
      { status: 200 },
    );

  } catch (err) {
    console.error("Internal Server Error:", err);
    return NextResponse.json(
      {
        error: (err as Error).message,
        message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"
      },
      { status: 500 }
    );
  }
}
