import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[signal-page-hygiene] Starting cleanup job...");

    // Auto-Disable Low-Quality Pages Rule:
    // IF views > 300 AND rfqs = 0 → is_active = false
    const { data: lowQualityPages, error: fetchError } = await supabase
      .from("admin_signal_pages")
      .select("id, slug, views, rfqs_submitted")
      .eq("is_active", true)
      .gt("views", 300)
      .or("rfqs_submitted.is.null,rfqs_submitted.eq.0");

    if (fetchError) {
      throw new Error(`Failed to fetch signal pages: ${fetchError.message}`);
    }

    if (!lowQualityPages || lowQualityPages.length === 0) {
      console.log("[signal-page-hygiene] No low-quality pages to disable");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No pages to disable",
          disabled_count: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Disable all low-quality pages
    const pageIds = lowQualityPages.map((p) => p.id);
    const { error: updateError } = await supabase
      .from("admin_signal_pages")
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .in("id", pageIds);

    if (updateError) {
      throw new Error(`Failed to disable pages: ${updateError.message}`);
    }

    console.log(`[signal-page-hygiene] Disabled ${lowQualityPages.length} low-quality pages:`, 
      lowQualityPages.map(p => ({ slug: p.slug, views: p.views, rfqs: p.rfqs_submitted }))
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Disabled ${lowQualityPages.length} low-quality signal pages`,
        disabled_count: lowQualityPages.length,
        disabled_pages: lowQualityPages.map(p => ({
          slug: p.slug,
          views: p.views,
          rfqs_submitted: p.rfqs_submitted || 0
        }))
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[signal-page-hygiene] Error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
