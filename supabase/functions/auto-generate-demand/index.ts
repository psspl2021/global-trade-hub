import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify CRON_SECRET for internal automation only
    const cronSecret = Deno.env.get("CRON_SECRET");
    const authHeader = req.headers.get("Authorization");
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

    // 1. Get top demand gaps (high-priority, not yet generated)
    const { data: gaps, error: gapsErr } = await supabase
      .from("demand_gaps")
      .select("slug, count, score, category")
      .gte("count", 3) // Only high-signal gaps
      .order("score", { ascending: false })
      .limit(5);

    if (gapsErr) {
      console.error("Failed to fetch demand gaps:", gapsErr);
      throw new Error(`DB query failed: ${gapsErr.message}`);
    }

    if (!gaps?.length) {
      return new Response(
        JSON.stringify({ success: true, generated: 0, message: "No high-priority gaps found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let generated = 0;
    const results: Array<{ slug: string; status: string }> = [];

    for (const gap of gaps) {
      const slug = gap.slug;

      // 2. Skip if already exists in demand_generated
      const { data: exists } = await supabase
        .from("demand_generated")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (exists) {
        results.push({ slug, status: "already_exists" });
        continue;
      }

      // 3. Insert as pending
      const name = slug
        .replace(/-suppliers-india$/g, "")
        .replace(/-suppliers$/g, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase());

      await supabase.from("demand_generated").insert({
        slug,
        name,
        status: "pending",
      });

      // 4. Call generate-demand-page with service role key
      try {
        const genRes = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-demand-page`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ slug }),
          }
        );

        if (genRes.ok) {
          generated++;
          results.push({ slug, status: "generated" });
        } else {
          const errText = await genRes.text();
          console.error(`Generation failed for ${slug}:`, errText);
          // Mark as failed
          await supabase
            .from("demand_generated")
            .update({ status: "failed" })
            .eq("slug", slug);
          results.push({ slug, status: "failed" });
        }
      } catch (genErr) {
        console.error(`Generation error for ${slug}:`, genErr);
        await supabase
          .from("demand_generated")
          .update({ status: "failed" })
          .eq("slug", slug);
        results.push({ slug, status: "error" });
      }
    }

    console.log(`[auto-generate-demand] Completed: ${generated}/${gaps.length} generated`);

    return new Response(
      JSON.stringify({ success: true, generated, total: gaps.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[auto-generate-demand] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
