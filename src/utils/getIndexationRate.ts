import { supabase } from "@/integrations/supabase/client";

export async function getIndexationRate() {
  const { data, error } = await supabase
    .from("indexed_pages")
    .select("*");

  if (error) throw error;

  const pages = data ?? [];
  const indexed = pages.filter((p: any) => p.indexed).length;
  const total = pages.length;
  const rate = total > 0 ? (indexed / total) * 100 : 0;

  return { indexed, total, rate };
}
