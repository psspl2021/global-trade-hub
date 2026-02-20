import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 Secure with CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: queue } = await supabase
    .from("seo_rewrite_queue")
    .select("*")
    .eq("processed", false);

  let processed = 0;

  for (const item of queue || []) {
    const parts = item.slug.replace(/-/g, " ");
    const newTitle = `Buy ${parts} – Verified Suppliers & Live Market Rates`;

    await supabase
      .from("seo_demand_pages")
      .update({ meta_title: newTitle })
      .eq("slug", item.slug);

    await supabase
      .from("seo_rewrite_queue")
      .update({ processed: true })
      .eq("id", item.id);

    processed++;
  }

  return new Response(
    JSON.stringify({ success: true, processed }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
