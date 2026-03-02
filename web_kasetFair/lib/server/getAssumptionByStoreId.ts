import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getAssumptionByStoreId(store_id: string) {
  const { data, error } = await supabaseAdmin
    .from("assumption")
    .select("foot_traffic, interest_rate, conversion_rate")
    .eq("store_id", store_id)
    .single();

  if (error) {
    console.error("getAssumptionByStoreId error:", error);
    return null;
  }

  return {
    foot: data.foot_traffic,
    interest: data.interest_rate,
    conversion: data.conversion_rate,
  };
}
