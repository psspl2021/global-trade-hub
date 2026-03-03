import { supabase } from "@/integrations/supabase/client";

export async function getRevenueMap(): Promise<Record<string, number>> {
  const { data } = await supabase
    .from("seo_revenue_dashboard" as any)
    .select("sku_slug, country_slug, total_revenue");

  const map: Record<string, number> = {};

  (data as any[])?.forEach((row: any) => {
    const key = `${row.sku_slug}|${row.country_slug || "india"}`;
    map[key] = (map[key] || 0) + (row.total_revenue || 0);
  });

  return map;
}
