import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const DEFAULT_BUCKET = "Test_7P";
const SIGNED_URL_TTL = 60 * 60; // 1 ชั่วโมง

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const storeId = url.searchParams.get("store_id");

    if (!storeId) {
      return NextResponse.json(
        { error: "ต้องส่ง store_id มาด้วย" },
        { status: 400 }
      );
    }

    const bucket = process.env.NEXT_PUBLIC_7P_BUCKET || DEFAULT_BUCKET;

    // candidate ที่เราจะลอง
    const candidates = [
      `${storeId}.pdf`,
      `${storeId}`
    ];

    for (const path of candidates) {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(path, SIGNED_URL_TTL);

      if (!error && data?.signedUrl) {
        return NextResponse.json({ url: data.signedUrl });
      }
    }

    return NextResponse.json(
      { error: `ไม่พบไฟล์ 7P สำหรับร้าน: ${storeId}` },
      { status: 404 }
    );
  } catch (err) {
    console.error("Failed to load 7P PDF:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 }
    );
  }
}


// import { NextResponse } from "next/server";
// import { supabaseAdmin } from "@/lib/supabaseAdmin";

// const DEFAULT_BUCKET = "Test_7P";
// const DEFAULT_PATH = "Test_7P.pdf";

// export async function GET() {
//   try {
//     if (!supabaseAdmin) {
//       return NextResponse.json({ error: "Supabase client not configured" }, { status: 500 });
//     }

//     const bucket = process.env.NEXT_PUBLIC_7P_BUCKET || DEFAULT_BUCKET;
//     const preferredPath = process.env.NEXT_PUBLIC_7P_FILE || DEFAULT_PATH;

//     // Try preferred file first; if missing, fall back to the first file in the bucket.
//     const createUrl = async (path: string) =>
//       supabaseAdmin.storage.from(bucket).createSignedUrl(path, 60 * 60);

//     let { data, error } = await createUrl(preferredPath);

//     if ((error || !data?.signedUrl) && !process.env.NEXT_PUBLIC_7P_FILE) {
//       const { data: list, error: listError } = await supabaseAdmin.storage.from(bucket).list("", { limit: 1 });
//       if (listError) {
//         return NextResponse.json(
//           { error: listError.message || "ไม่สามารถดึงไฟล์ 7P ได้" },
//           { status: 500 },
//         );
//       }

//       const fallbackPath = list?.[0]?.name;
//       if (fallbackPath) {
//         const result = await createUrl(fallbackPath);
//         data = result.data;
//         error = result.error;
//       }
//     }

//     if (error || !data?.signedUrl) {
//       return NextResponse.json(
//         { error: error?.message || "ไม่สามารถดึงไฟล์ 7P ได้" },
//         { status: 500 },
//       );
//     }

//     return NextResponse.json({ url: data.signedUrl });
//   } catch (err) {
//     console.error("Failed to load 7P PDF:", err);
//     return NextResponse.json(
//       { error: err instanceof Error ? err.message : "Unexpected error" },
//       { status: 500 },
//     );
//   }
// }
