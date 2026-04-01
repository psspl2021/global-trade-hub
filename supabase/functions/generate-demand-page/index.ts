import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const { slug } = await req.json();
    if (!slug || typeof slug !== "string" || slug.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid slug" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already generated
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existing } = await adminSupabase
      .from("demand_generated")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, slug, message: "Already generated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert slug to product name
    const name = slug
      .replace(/-suppliers-india$/g, "")
      .replace(/-suppliers$/g, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    // Infer category from slug
    const categoryMap: Record<string, { category: string; categorySlug: string; industrySlug: string }> = {
      steel: { category: "Ferrous Metals", categorySlug: "ferrous-metals", industrySlug: "metals" },
      tmt: { category: "Ferrous Metals", categorySlug: "ferrous-metals", industrySlug: "metals" },
      iron: { category: "Ferrous Metals", categorySlug: "ferrous-metals", industrySlug: "metals" },
      aluminium: { category: "Non-Ferrous Metals", categorySlug: "non-ferrous-metals", industrySlug: "metals" },
      copper: { category: "Non-Ferrous Metals", categorySlug: "non-ferrous-metals", industrySlug: "metals" },
      zinc: { category: "Non-Ferrous Metals", categorySlug: "non-ferrous-metals", industrySlug: "metals" },
      brass: { category: "Non-Ferrous Metals", categorySlug: "non-ferrous-metals", industrySlug: "metals" },
      pipe: { category: "Pipes & Fittings", categorySlug: "pipes-fittings", industrySlug: "piping" },
      tube: { category: "Pipes & Fittings", categorySlug: "pipes-fittings", industrySlug: "piping" },
      valve: { category: "Pipes & Fittings", categorySlug: "pipes-fittings", industrySlug: "piping" },
      cement: { category: "Construction Materials", categorySlug: "construction-materials", industrySlug: "construction" },
      concrete: { category: "Construction Materials", categorySlug: "construction-materials", industrySlug: "construction" },
      roof: { category: "Construction Materials", categorySlug: "construction-materials", industrySlug: "construction" },
      wire: { category: "Electrical", categorySlug: "electrical", industrySlug: "electrical" },
      cable: { category: "Electrical", categorySlug: "electrical", industrySlug: "electrical" },
    };

    let category = "Industrial Materials";
    let categorySlug = "industrial-materials";
    let industrySlug = "general";
    const lowerSlug = slug.toLowerCase();
    for (const [keyword, meta] of Object.entries(categoryMap)) {
      if (lowerSlug.includes(keyword)) {
        category = meta.category;
        categorySlug = meta.categorySlug;
        industrySlug = meta.industrySlug;
        break;
      }
    }

    // Call Lovable AI to generate taxonomy
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are a B2B procurement taxonomy generator for the Indian industrial market.
Given a product name, generate structured JSON data for a procurement landing page.
Return ONLY valid JSON with this exact structure:
{
  "definition": "2-3 sentence description of the product",
  "industries": ["industry1", "industry2", ...],
  "grades": ["grade1", "grade2", ...],
  "specifications": ["spec1", "spec2", ...],
  "standards": ["IS standard", "ASTM standard", ...],
  "hsnCodes": ["code1"],
  "orderSizes": "typical order size range",
  "importCountries": ["country1", "country2"],
  "priceRange": "₹X - ₹Y per unit",
  "applications": ["application1", "application2", ...],
  "challenges": ["challenge1", "challenge2"],
  "marketTrend": "1-2 sentence market trend summary for India"
}
Keep all data specific to the Indian B2B procurement context. Use realistic prices in INR.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate procurement taxonomy data for: ${name} (category: ${category})` },
        ],
      }),
    });

    if (!aiRes.ok) {
      const status = aiRes.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limited. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    // Parse JSON from AI response (handle markdown code blocks)
    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error("Failed to parse AI taxonomy JSON");
    }

    // Insert into DB
    const { error: insertError } = await adminSupabase.from("demand_generated").insert({
      slug,
      name,
      category,
      category_slug: categorySlug,
      industry_slug: industrySlug,
      sub_industry_slug: categorySlug,
      definition: parsed.definition || "",
      industries: parsed.industries || [],
      grades: parsed.grades || [],
      specifications: parsed.specifications || [],
      standards: parsed.standards || [],
      hsn_codes: parsed.hsnCodes || [],
      order_sizes: parsed.orderSizes || "",
      import_countries: parsed.importCountries || [],
      price_range: parsed.priceRange || "",
      applications: parsed.applications || [],
      challenges: parsed.challenges || [],
      market_trend: parsed.marketTrend || "",
      status: "active",
      generated_by: "ai",
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`DB insert failed: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, slug, name }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-demand-page error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
