import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify cron secret
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

  const { data: pages } = await supabase
    .from("seo_demand_pages")
    .select("slug, impressions, clicks");

  for (const page of pages || []) {
    const impressions = page.impressions || 0;
    const clicks = page.clicks || 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    let ctr_status = "healthy";
    let rewrite_required = false;

    if (impressions > 3000 && ctr < 1) {
      ctr_status = "critical";
      rewrite_required = true;
    } else if (impressions > 1000 && ctr < 1.5) {
      ctr_status = "warning";
      rewrite_required = true;
    }

    await supabase
      .from("seo_demand_pages")
      .update({ ctr, ctr_status, rewrite_required })
      .eq("slug", page.slug);

    if (rewrite_required) {
      await supabase.from("seo_rewrite_queue").insert({
        slug: page.slug,
        reason: `CTR anomaly detected: ${ctr.toFixed(2)}% (${ctr_status})`,
      });
    }
  }

  return new Response(JSON.stringify({ success: true, message: "CTR monitoring complete." }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
