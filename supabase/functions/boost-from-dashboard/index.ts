import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verify CRON_SECRET for internal automation
  const authHeader = req.headers.get("Authorization") || "";
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

  try {
    // 1. Decay old boosts first (randomize to prevent stagnation)
    const { error: decayErr } = await supabase.rpc("decay_boosts", {
      max_links: 10,
    });
    if (decayErr) {
      console.warn("[boost] Decay warning:", decayErr.message);
    } else {
      console.log("[boost] Decayed old boosts");
    }

    // 2. Apply category-aware boosting (inject category-specific winners)
    const { data: catCount, error: catErr } = await supabase.rpc(
      "boost_category_links",
      { max_links: 10 }
    );
    if (catErr) {
      console.warn("[boost] Category boost warning:", catErr.message);
    } else {
      console.log(`[boost] Category-boosted ${catCount} categories`);
    }

    // 3. Also inject global top 5 winners as before (cross-category authority)
    const { data: winners, error: fetchErr } = await supabase
      .from("demand_revenue_dashboard")
      .select("slug, revenue_score")
      .order("revenue_score", { ascending: false })
      .limit(5);

    if (fetchErr) throw fetchErr;

    const boostSlugs = (winners || []).map((w: { slug: string }) => w.slug);

    if (boostSlugs.length > 0) {
      const { error: rpcErr } = await supabase.rpc("boost_internal_links", {
        boost_slugs: boostSlugs,
        max_links: 10,
      });
      if (rpcErr) throw rpcErr;
      console.log(`[boost] Global top ${boostSlugs.length} winners:`, boostSlugs);
    }

    return new Response(
      JSON.stringify({
        success: true,
        decayed: true,
        categories_boosted: catCount ?? 0,
        global_boosted: boostSlugs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[boost] Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
