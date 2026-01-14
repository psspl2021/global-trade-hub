/**
 * ============================================================
 * BUYER INTELLIGENCE CRON
 * ============================================================
 * 
 * CRITICAL CHANGES:
 * 1. NO FAKE RFQs - rfqs_submitted always starts at 0
 * 2. Intent Score = CALCULATED, not random
 * 3. Discovers "opportunities" - actual RFQs come from signal pages
 * 
 * ============================================================
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DiscoverySettings {
  id: string;
  enabled: boolean;
  frequency: string | null;
  last_run_at: string | null;
  category: string | null;
  subcategory: string | null;
  country: string | null;
  target_industries: string[];
  min_deal_size: number;
}

// Buyer intent keyword templates (from taxonomy philosophy)
const projectIntentTemplates = [
  "{subcategory} for {industry} project",
  "{subcategory} supplier for {industry}",
  "bulk {subcategory} for {industry}",
  "{subcategory} procurement {country}",
  "annual rate contract {subcategory}",
];

const exportIntentTemplates = [
  "{subcategory} import from india",
  "indian {subcategory} for {industry}",
  "{subcategory} exporter for {country}",
];

function generateBuyerIntentKeywords(
  subcategory: string,
  industries: string[],
  country: string
): { keyword: string; intentType: string; intentScore: number }[] {
  const keywords: { keyword: string; intentType: string; intentScore: number }[] = [];
  
  for (const industry of industries.slice(0, 3)) {
    // Project intent (highest value)
    projectIntentTemplates.forEach(template => {
      const keyword = template
        .replace("{subcategory}", subcategory)
        .replace("{industry}", industry)
        .replace("{country}", country);
      
      keywords.push({
        keyword,
        intentType: "project",
        intentScore: 9,
      });
    });

    // Export intent (for international)
    if (country !== "india") {
      exportIntentTemplates.forEach(template => {
        const keyword = template
          .replace("{subcategory}", subcategory)
          .replace("{industry}", industry)
          .replace("{country}", country);
        
        keywords.push({
          keyword,
          intentType: "export",
          intentScore: 8,
        });
      });
    }
  }

  return keywords;
}

/**
 * Calculate REAL intent score based on targeting
 * NOT Math.random()
 */
function calculateIntentScore(
  dealSize: number,
  industry: string | null,
  country: string
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
  
  // Base score for having any targeting
  score += 2;
  
  // Normalize to 1-10 scale
  return Math.min(10, Math.max(1, score));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Buyer Intelligence: Checking settings...");

    // Fetch settings
    const { data: settings, error: settingsError } = await supabase
      .from("ai_seo_settings")
      .select("*")
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.log("Buyer Intelligence: No settings found");
      return new Response(
        JSON.stringify({ status: "skipped", reason: "no_settings" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const discoverySettings = settings as DiscoverySettings;

    // Check if enabled
    if (!discoverySettings.enabled) {
      console.log("Buyer Intelligence: Disabled");
      return new Response(
        JSON.stringify({ status: "skipped", reason: "disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check frequency lock
    const now = new Date();
    const lastRun = discoverySettings.last_run_at ? new Date(discoverySettings.last_run_at) : null;
    const frequency = discoverySettings.frequency || "daily";
    const frequencyMs = frequency === "weekly" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    if (lastRun && (now.getTime() - lastRun.getTime()) < frequencyMs) {
      const nextRunIn = Math.round((frequencyMs - (now.getTime() - lastRun.getTime())) / 60000);
      console.log(`Buyer Intelligence: Too soon. Next run in ${nextRunIn} minutes`);
      return new Response(
        JSON.stringify({ 
          status: "skipped", 
          reason: "frequency_lock",
          next_run_in_minutes: nextRunIn 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Buyer Intelligence: Starting market scan...");

    const category = discoverySettings.category?.toLowerCase() || "steel";
    const subcategory = discoverySettings.subcategory?.toLowerCase() || "ms pipes";
    const country = discoverySettings.country?.toLowerCase() || "india";
    const targetIndustries = discoverySettings.target_industries || ["construction", "infrastructure", "manufacturing"];
    const minDealSize = discoverySettings.min_deal_size || 500000;

    // Calculate REAL intent score
    const intentScore = calculateIntentScore(minDealSize, targetIndustries[0], country);

    // Create run record with ZERO fake RFQs
    const { data: run, error: runError } = await supabase
      .from("ai_seo_runs")
      .insert({
        status: "running",
        category,
        subcategory,
        country,
        company_role: "buyer",
        started_at: now.toISOString(),
        industries_reached: targetIndustries,
        subcategories_covered: [subcategory],
        // CRITICAL: No fake RFQs
        rfqs_submitted: 0,
        buyer_inquiries: 0,
        qualified_leads: 0,
        intent_score: intentScore,
      })
      .select()
      .single();

    if (runError) {
      console.error("Buyer Intelligence: Failed to create run", runError);
      throw runError;
    }

    // Generate buyer intent keywords (NOT marketing keywords)
    const keywords = generateBuyerIntentKeywords(subcategory, targetIndustries, country);
    
    // Save keywords to demand_discovery_keywords table
    const keywordInserts = keywords.slice(0, 20).map(k => ({
      category,
      subcategory,
      industry: targetIndustries[0] || "general",
      keyword: k.keyword,
      intent_type: k.intentType,
      intent_score: k.intentScore,
    }));

    await supabase
      .from("demand_discovery_keywords")
      .upsert(keywordInserts, { onConflict: "category,subcategory,keyword" });

    const keywordsDiscovered = keywords.length;
    
    // Calculate industry match rate based on targeting
    const industryMatchRate = targetIndustries.length > 0 
      ? Math.min(100, (targetIndustries.length / 5) * 100)
      : 0;

    // Update run as completed - NO FAKE METRICS
    await supabase
      .from("ai_seo_runs")
      .update({
        status: "completed",
        keywords_discovered: keywordsDiscovered,
        pages_audited: 0,
        pages_generated: 0, // Signal pages created separately
        // RFQs stay at 0 - they come from REAL submissions only
        rfqs_submitted: 0,
        buyer_inquiries: 0,
        qualified_leads: 0,
        industry_match_rate: industryMatchRate,
        avg_deal_size: 0, // Will be set from real RFQs
        intent_score: intentScore,
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
      .eq("id", discoverySettings.id);

    console.log(`Buyer Intelligence: Completed - ${keywordsDiscovered} opportunities discovered, intent score ${intentScore.toFixed(1)}`);

    return new Response(
      JSON.stringify({
        status: "completed",
        run_id: run.id,
        opportunities_discovered: keywordsDiscovered,
        intent_score: intentScore,
        industry_match_rate: industryMatchRate,
        // Note: RFQs will come from real signal page conversions
        rfqs_from_this_run: 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Buyer Intelligence Error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
