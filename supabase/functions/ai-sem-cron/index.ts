import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SEMSettings {
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

    console.log("AI SEM Cron: Checking settings...");

    // Fetch settings
    const { data: settings, error: settingsError } = await supabase
      .from("ai_sem_settings")
      .select("*")
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.log("AI SEM Cron: No settings found");
      return new Response(
        JSON.stringify({ status: "skipped", reason: "no_settings" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const semSettings = settings as SEMSettings;

    // Check if enabled
    if (!semSettings.enabled) {
      console.log("AI SEM Cron: Auto-run disabled");
      return new Response(
        JSON.stringify({ status: "skipped", reason: "disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check frequency lock
    const now = new Date();
    const lastRun = semSettings.last_run_at ? new Date(semSettings.last_run_at) : null;
    const frequency = semSettings.frequency || "daily";

    const frequencyMs = frequency === "hourly" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    if (lastRun && (now.getTime() - lastRun.getTime()) < frequencyMs) {
      const nextRunIn = Math.round((frequencyMs - (now.getTime() - lastRun.getTime())) / 60000);
      console.log(`AI SEM Cron: Too soon. Next run in ${nextRunIn} minutes`);
      return new Response(
        JSON.stringify({ 
          status: "skipped", 
          reason: "frequency_lock",
          next_run_in_minutes: nextRunIn 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI SEM Cron: Starting execution...");

    // Create run record
    const { data: run, error: runError } = await supabase
      .from("ai_sem_runs")
      .insert({
        status: "running",
        category: semSettings.category?.toLowerCase() || "steel",
        country: semSettings.country?.toLowerCase() || "india",
        company_role: semSettings.company_role || "buyer",
        started_at: now.toISOString(),
      })
      .select()
      .single();

    if (runError) {
      console.error("AI SEM Cron: Failed to create run", runError);
      throw runError;
    }

    // Update to optimizing status
    await supabase
      .from("ai_sem_runs")
      .update({ status: "optimizing" })
      .eq("id", run.id);

    // Simulate AI SEM work (in production: call Google Ads API, Meta Ads, etc.)
    const campaignsCreated = Math.floor(Math.random() * 5) + 1;
    const adsGenerated = campaignsCreated * (Math.floor(Math.random() * 3) + 2);
    const impressions = Math.floor(Math.random() * 10000) + 1000;
    const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01));
    const conversions = Math.floor(clicks * (Math.random() * 0.1 + 0.02));
    const costPerRfq = parseFloat((Math.random() * 500 + 100).toFixed(2));

    // Update run as completed
    await supabase
      .from("ai_sem_runs")
      .update({
        status: "completed",
        campaigns_created: campaignsCreated,
        ads_generated: adsGenerated,
        total_impressions: impressions,
        total_clicks: clicks,
        total_conversions: conversions,
        cost_per_rfq: costPerRfq,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    // Update last_run_at in settings
    await supabase
      .from("ai_sem_settings")
      .update({ 
        last_run_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", semSettings.id);

    console.log(`AI SEM Cron: Completed - ${campaignsCreated} campaigns, ${adsGenerated} ads, ${conversions} conversions`);

    return new Response(
      JSON.stringify({
        status: "completed",
        run_id: run.id,
        campaigns_created: campaignsCreated,
        ads_generated: adsGenerated,
        total_impressions: impressions,
        total_clicks: clicks,
        total_conversions: conversions,
        cost_per_rfq: costPerRfq,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("AI SEM Cron Error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
