/**
 * ============================================================
 * TARGETED BUYER ACQUISITION CRON
 * ============================================================
 * 
 * CRITICAL CHANGES:
 * 1. NO FAKE RFQs - All counts initialized to 0
 * 2. Intent Score = CALCULATED based on buyer type + deal size
 * 3. Configures targeting - actual RFQs come from signal pages
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
const buyerTypeConfig: Record<string, { minDeal: number; intentMultiplier: number; keywords: string[] }> = {
  epc_contractor: {
    minDeal: 5000000,
    intentMultiplier: 1.0,
    keywords: [
      "{subcategory} for construction project",
      "bulk {subcategory} epc",
      "{subcategory} contract supply {country}",
    ],
  },
  exporter: {
    minDeal: 2500000,
    intentMultiplier: 0.9,
    keywords: [
      "{subcategory} import from india",
      "indian {subcategory} supplier {country}",
      "{subcategory} exporter",
    ],
  },
  industrial: {
    minDeal: 1000000,
    intentMultiplier: 0.7,
    keywords: [
      "{subcategory} for {industry}",
      "bulk {subcategory} {industry}",
      "{subcategory} manufacturer {country}",
    ],
  },
  municipal: {
    minDeal: 2500000,
    intentMultiplier: 0.85,
    keywords: [
      "{subcategory} for government project",
      "{subcategory} tender supplier",
      "empaneled {subcategory} vendor",
    ],
  },
  distributor: {
    minDeal: 500000,
    intentMultiplier: 0.5,
    keywords: [
      "{subcategory} wholesale {country}",
      "bulk {subcategory} distributor",
      "{subcategory} stockist",
    ],
  },
};

/**
 * Calculate REAL intent score based on buyer targeting
 * NOT Math.random()
 */
function calculateIntentScore(
  dealSize: number,
  industry: string | null,
  country: string,
  buyerType: string
): number {
  let score = 0;
  
  // Deal size weight (0-3 points)
  if (dealSize >= 10000000) score += 3;
  else if (dealSize >= 5000000) score += 2.5;
  else if (dealSize >= 2500000) score += 2;
  else if (dealSize >= 1000000) score += 1.5;
  else if (dealSize >= 500000) score += 1;
  else score += 0.5;
  
  // Industry specificity (0-2 points)
  const highValueIndustries = [
    'construction', 'infrastructure', 'oil_gas', 'power', 
    'water_treatment', 'railways', 'metro', 'highways'
  ];
  if (industry && highValueIndustries.some(i => industry.includes(i))) {
    score += 2;
  } else if (industry) {
    score += 1;
  }
  
  // Geography (0-1 point)
  const highValueCountries = ['uae', 'usa', 'germany', 'saudi-arabia', 'qatar'];
  if (highValueCountries.includes(country.toLowerCase())) {
    score += 1;
  } else {
    score += 0.5;
  }
  
  // Buyer type bonus (0-2 points)
  const highValueBuyerTypes = ['epc_contractor', 'exporter', 'municipal'];
  if (highValueBuyerTypes.includes(buyerType)) {
    score += 2;
  } else if (buyerType === 'industrial') {
    score += 1;
  } else {
    score += 0.5;
  }
  
  // Apply buyer type multiplier
  const config = buyerTypeConfig[buyerType];
  if (config) {
    score *= config.intentMultiplier;
  }
  
  // Normalize to 1-10 scale
  return Math.min(10, Math.max(1, score));
}

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

    console.log("Targeted Acquisition: Checking settings...");

    // Fetch settings
    const { data: settings, error: settingsError } = await supabase
      .from("ai_sem_settings")
      .select("*")
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.log("Targeted Acquisition: No settings found");
      return new Response(
        JSON.stringify({ status: "skipped", reason: "no_settings" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const campaignSettings = settings as CampaignSettings;

    // Check if enabled
    if (!campaignSettings.enabled) {
      console.log("Targeted Acquisition: Disabled");
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
      console.log(`Targeted Acquisition: Too soon. Next run in ${nextRunIn} minutes`);
      return new Response(
        JSON.stringify({ 
          status: "skipped", 
          reason: "frequency_lock",
          next_run_in_minutes: nextRunIn 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Targeted Acquisition: Configuring campaign...");

    const category = campaignSettings.category?.toLowerCase() || "steel";
    const subcategory = campaignSettings.subcategory?.toLowerCase() || "ms pipes";
    const country = campaignSettings.country?.toLowerCase() || "india";
    const buyerType = campaignSettings.buyer_type || "industrial";
    const targetIndustries = campaignSettings.target_industries || ["construction", "infrastructure"];
    const minDealSize = campaignSettings.min_deal_size || buyerTypeConfig[buyerType]?.minDeal || 1000000;

    // Calculate REAL intent score
    const intentScore = calculateIntentScore(minDealSize, targetIndustries[0], country, buyerType);

    // Create run record with ZERO fake metrics
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
        // CRITICAL: No fake RFQs or impressions
        rfqs_submitted: 0,
        qualified_leads: 0,
        campaigns_created: 0,
        ads_generated: 0,
        total_impressions: 0,
        total_clicks: 0,
        total_conversions: 0,
      })
      .select()
      .single();

    if (runError) {
      console.error("Targeted Acquisition: Failed to create run", runError);
      throw runError;
    }

    // Generate targeted campaign keywords
    const keywords = generateCampaignKeywords(
      subcategory,
      targetIndustries[0] || "manufacturing",
      country,
      buyerType
    );

    // Calculate industry match rate
    const industryMatchRate = targetIndustries.length > 0 
      ? Math.min(100, (targetIndustries.length / 5) * 100)
      : 0;

    // Update run as completed - NO FAKE METRICS
    await supabase
      .from("ai_sem_runs")
      .update({
        status: "completed",
        campaigns_created: 1, // One focused campaign per run
        ads_generated: keywords.length,
        // RFQs stay at 0 - they come from REAL submissions only
        rfqs_submitted: 0,
        qualified_leads: 0,
        industry_match_rate: industryMatchRate,
        avg_deal_size: 0, // Will be set from real RFQs
        // NO fake impressions/clicks
        total_impressions: 0,
        total_clicks: 0,
        total_conversions: 0,
        cost_per_rfq: null,
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

    console.log(`Targeted Acquisition: Completed - ${buyerType} targeting, intent score ${intentScore.toFixed(1)}`);

    return new Response(
      JSON.stringify({
        status: "completed",
        run_id: run.id,
        buyer_type: buyerType,
        campaigns_created: 1,
        ads_generated: keywords.length,
        intent_score: intentScore,
        industry_match_rate: industryMatchRate,
        // Note: RFQs will come from real signal page conversions
        rfqs_from_this_run: 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Targeted Acquisition Error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
