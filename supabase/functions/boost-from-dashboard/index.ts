import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

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
    // 1. Fetch top 5 performers from revenue dashboard
    const { data: winners, error: fetchErr } = await supabase
      .from("demand_revenue_dashboard")
      .select("slug, revenue_score")
      .order("revenue_score", { ascending: false })
      .limit(5);

    if (fetchErr) throw fetchErr;

    const boostSlugs = (winners || []).map((w: { slug: string }) => w.slug);

    if (boostSlugs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No winners to boost yet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Apply boost via RPC
    const { error: rpcErr } = await supabase.rpc("boost_internal_links", {
      boost_slugs: boostSlugs,
      max_links: 10,
    });

    if (rpcErr) throw rpcErr;

    console.log(`[boost] Injected ${boostSlugs.length} winners:`, boostSlugs);

    return new Response(
      JSON.stringify({ success: true, boosted: boostSlugs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[boost] Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
