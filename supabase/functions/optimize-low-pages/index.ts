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

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Find low-converting pages: decent views but poor conversion
    const { data: lowPages, error: fetchErr } = await supabase
      .from("demand_revenue_dashboard")
      .select("slug, views, conversion_rate")
      .gt("views", 30)
      .lt("conversion_rate", 1)
      .order("views", { ascending: false })
      .limit(5);

    if (fetchErr) throw fetchErr;

    if (!lowPages || lowPages.length === 0) {
      return new Response(
        JSON.stringify({ message: "No low-converting pages to optimize" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Array<{ slug: string; status: string }> = [];

    for (const page of lowPages) {
      const productName = page.slug.replace(/-/g, " ");

      try {
        const aiRes = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                {
                  role: "system",
                  content: `You are a B2B procurement conversion copywriter. Rewrite the product introduction and CTA for a procurement landing page. Focus on:
1. Clear value proposition for industrial buyers
2. Trust signals (verified suppliers, quality checks, competitive pricing)
3. Strong call-to-action driving RFQ submissions
4. Pricing transparency language
5. Urgency without being pushy

Output ONLY the improved product definition text (2-3 paragraphs). No markdown headers, no extra formatting.`,
                },
                {
                  role: "user",
                  content: `Rewrite the intro and CTA for: ${productName}. Current conversion rate is ${page.conversion_rate}% with ${page.views} views. Make it convert better.`,
                },
              ],
            }),
          }
        );

        if (!aiRes.ok) {
          const errText = await aiRes.text();
          console.error(`[optimize] AI error for ${page.slug}:`, aiRes.status, errText);
          results.push({ slug: page.slug, status: `ai_error_${aiRes.status}` });
          continue;
        }

        const result = await aiRes.json();
        const improved = result.choices?.[0]?.message?.content;

        if (!improved) {
          results.push({ slug: page.slug, status: "no_content" });
          continue;
        }

        const { error: updateErr } = await supabase
          .from("demand_generated")
          .update({
            definition: improved,
            updated_at: new Date().toISOString(),
          })
          .eq("slug", page.slug);

        if (updateErr) {
          console.error(`[optimize] Update error for ${page.slug}:`, updateErr);
          results.push({ slug: page.slug, status: "update_error" });
        } else {
          console.log(`[optimize] Improved: ${page.slug}`);
          results.push({ slug: page.slug, status: "optimized" });
        }
      } catch (pageErr) {
        console.error(`[optimize] Error for ${page.slug}:`, pageErr);
        results.push({ slug: page.slug, status: "error" });
      }
    }

    return new Response(
      JSON.stringify({ success: true, optimized: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[optimize] Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
