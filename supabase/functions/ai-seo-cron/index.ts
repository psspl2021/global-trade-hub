import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SEOSettings {
  id: string;
  enabled: boolean;
  frequency: string | null;
  last_run_at: string | null;
  category: string | null;
  country: string | null;
  company_role: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("AI SEO Cron: Checking settings...");

    // Fetch settings
    const { data: settings, error: settingsError } = await supabase
      .from("ai_seo_settings")
      .select("*")
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.log("AI SEO Cron: No settings found");
      return new Response(
        JSON.stringify({ status: "skipped", reason: "no_settings" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const seoSettings = settings as SEOSettings;

    // Check if enabled
    if (!seoSettings.enabled) {
      console.log("AI SEO Cron: Auto-run disabled");
      return new Response(
        JSON.stringify({ status: "skipped", reason: "disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check frequency lock
    const now = new Date();
    const lastRun = seoSettings.last_run_at ? new Date(seoSettings.last_run_at) : null;
    const frequency = seoSettings.frequency || "daily";

    const frequencyMs = frequency === "weekly" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    if (lastRun && (now.getTime() - lastRun.getTime()) < frequencyMs) {
      const nextRunIn = Math.round((frequencyMs - (now.getTime() - lastRun.getTime())) / 60000);
      console.log(`AI SEO Cron: Too soon. Next run in ${nextRunIn} minutes`);
      return new Response(
        JSON.stringify({ 
          status: "skipped", 
          reason: "frequency_lock",
          next_run_in_minutes: nextRunIn 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI SEO Cron: Starting execution...");

    // Create run record
    const { data: run, error: runError } = await supabase
      .from("ai_seo_runs")
      .insert({
        status: "running",
        category: seoSettings.category?.toLowerCase() || "steel",
        country: seoSettings.country?.toLowerCase() || "india",
        company_role: seoSettings.company_role || "buyer",
        started_at: now.toISOString(),
      })
      .select()
      .single();

    if (runError) {
      console.error("AI SEO Cron: Failed to create run", runError);
      throw runError;
    }

    // Simulate AI SEO work (in production: call OpenAI, scrape keywords, etc.)
    const keywordsDiscovered = Math.floor(Math.random() * 50) + 20;
    const pagesAudited = Math.floor(Math.random() * 10) + 5;
    const pagesGenerated = Math.floor(Math.random() * 5) + 1;

    // Update run as completed
    await supabase
      .from("ai_seo_runs")
      .update({
        status: "completed",
        keywords_discovered: keywordsDiscovered,
        pages_audited: pagesAudited,
        pages_generated: pagesGenerated,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    // Update last_run_at in settings
    await supabase
      .from("ai_seo_settings")
      .update({ 
        last_run_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", seoSettings.id);

    console.log(`AI SEO Cron: Completed - ${keywordsDiscovered} keywords, ${pagesGenerated} pages`);

    return new Response(
      JSON.stringify({
        status: "completed",
        run_id: run.id,
        keywords_discovered: keywordsDiscovered,
        pages_audited: pagesAudited,
        pages_generated: pagesGenerated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("AI SEO Cron Error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
