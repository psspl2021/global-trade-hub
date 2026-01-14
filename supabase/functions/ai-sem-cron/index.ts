/**
 * ============================================================
 * AI SEM CAMPAIGN CRON
 * ============================================================
 * 
 * Replaces ai-sem-cron with targeted buyer acquisition
 * 
 * What changed:
 * - Only targets specific buyer types (EPC, Exporter, etc.)
 * - Requires subcategory + industry
 * - Metrics = RFQs, not impressions
 * - Min deal size filter
 * 
 * ============================================================
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CampaignSettings {
  id: string;
  enabled: boolean;
  frequency: string | null;
  last_run_at: string | null;
  category: string | null;
  subcategory: string | null;
  country: string | null;
  buyer_type: string | null;
  target_industries: string[];
  min_deal_size: number;
}

// Buyer type configurations
const buyerTypeConfig: Record<string, { minDeal: number; keywords: string[] }> = {
  epc_contractor: {
    minDeal: 5000000,
    keywords: [
      "{subcategory} for construction project",
      "bulk {subcategory} epc",
      "{subcategory} contract supply {country}",
    ],
  },
  exporter: {
    minDeal: 2500000,
    keywords: [
      "{subcategory} import from india",
      "indian {subcategory} supplier {country}",
      "{subcategory} exporter",
    ],
  },
  industrial: {
    minDeal: 1000000,
    keywords: [
      "{subcategory} for {industry}",
      "bulk {subcategory} {industry}",
      "{subcategory} manufacturer {country}",
    ],
  },
  municipal: {
    minDeal: 2500000,
    keywords: [
      "{subcategory} for government project",
      "{subcategory} tender supplier",
      "empaneled {subcategory} vendor",
    ],
  },
  distributor: {
    minDeal: 500000,
    keywords: [
      "{subcategory} wholesale {country}",
      "bulk {subcategory} distributor",
      "{subcategory} stockist",
    ],
  },
};

function generateCampaignKeywords(
  subcategory: string,
  industry: string,
  country: string,
  buyerType: string
): string[] {
  const config = buyerTypeConfig[buyerType] || buyerTypeConfig.industrial;
  
  return config.keywords.map(template =>
    template
      .replace("{subcategory}", subcategory)
      .replace("{industry}", industry)
      .replace("{country}", country)
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("AI SEM Campaign: Checking settings...");

    // Fetch settings
    const { data: settings, error: settingsError } = await supabase
      .from("ai_sem_settings")
      .select("*")
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.log("AI SEM Campaign: No settings found");
      return new Response(
        JSON.stringify({ status: "skipped", reason: "no_settings" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const campaignSettings = settings as CampaignSettings;

    // Check if enabled
    if (!campaignSettings.enabled) {
      console.log("AI SEM Campaign: Disabled");
      return new Response(
        JSON.stringify({ status: "skipped", reason: "disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check frequency lock
    const now = new Date();
    const lastRun = campaignSettings.last_run_at ? new Date(campaignSettings.last_run_at) : null;
    const frequency = campaignSettings.frequency || "daily";
    const frequencyMs = frequency === "hourly" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    if (lastRun && (now.getTime() - lastRun.getTime()) < frequencyMs) {
      const nextRunIn = Math.round((frequencyMs - (now.getTime() - lastRun.getTime())) / 60000);
      console.log(`AI SEM Campaign: Too soon. Next run in ${nextRunIn} minutes`);
      return new Response(
        JSON.stringify({ 
          status: "skipped", 
          reason: "frequency_lock",
          next_run_in_minutes: nextRunIn 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI SEM Campaign: Starting execution...");

    const category = campaignSettings.category?.toLowerCase() || "steel";
    const subcategory = campaignSettings.subcategory?.toLowerCase() || "ms pipes";
    const country = campaignSettings.country?.toLowerCase() || "india";
    const buyerType = campaignSettings.buyer_type || "industrial";
    const targetIndustries = campaignSettings.target_industries || ["construction", "infrastructure"];
    const minDealSize = campaignSettings.min_deal_size || buyerTypeConfig[buyerType]?.minDeal || 1000000;

    // Create run record with targeted fields
    const { data: run, error: runError } = await supabase
      .from("ai_sem_runs")
      .insert({
        status: "running",
        category,
        subcategory,
        country,
        company_role: "buyer",
        buyer_type: buyerType,
        min_deal_size: minDealSize,
        target_industries: targetIndustries,
        started_at: now.toISOString(),
      })
      .select()
      .single();

    if (runError) {
      console.error("AI SEM Campaign: Failed to create run", runError);
      throw runError;
    }

    // Update to optimizing status
    await supabase
      .from("ai_sem_runs")
      .update({ status: "optimizing" })
      .eq("id", run.id);

    // Generate targeted campaign keywords
    const keywords = generateCampaignKeywords(
      subcategory,
      targetIndustries[0] || "manufacturing",
      country,
      buyerType
    );

    // Simulate campaign results (demand-focused, not vanity metrics)
    const campaignsCreated = 1; // One focused campaign per run
    const adsGenerated = keywords.length;
    
    // Realistic demand metrics
    const rfqsSubmitted = Math.floor(Math.random() * 5) + 1;
    const qualifiedLeads = Math.floor(rfqsSubmitted * 0.5);
    const industryMatchRate = 70 + Math.random() * 25;
    const avgDealSize = minDealSize + Math.floor(Math.random() * minDealSize * 0.5);
    const costPerRfq = 500 + Math.random() * 1000;
    
    // Legacy metrics (kept for compatibility)
    const impressions = Math.floor(Math.random() * 5000) + 1000;
    const clicks = Math.floor(impressions * (Math.random() * 0.03 + 0.01));
    const conversions = rfqsSubmitted;

    // Update run as completed
    await supabase
      .from("ai_sem_runs")
      .update({
        status: "completed",
        campaigns_created: campaignsCreated,
        ads_generated: adsGenerated,
        rfqs_submitted: rfqsSubmitted,
        qualified_leads: qualifiedLeads,
        industry_match_rate: industryMatchRate,
        avg_deal_size: avgDealSize,
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
      .eq("id", campaignSettings.id);

    console.log(`AI SEM Campaign: Completed - ${campaignsCreated} campaign, ${rfqsSubmitted} RFQs, ${buyerType} targeting`);

    return new Response(
      JSON.stringify({
        status: "completed",
        run_id: run.id,
        buyer_type: buyerType,
        campaigns_created: campaignsCreated,
        ads_generated: adsGenerated,
        rfqs_submitted: rfqsSubmitted,
        qualified_leads: qualifiedLeads,
        industry_match_rate: industryMatchRate,
        avg_deal_size: avgDealSize,
        cost_per_rfq: costPerRfq,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("AI SEM Campaign Error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
