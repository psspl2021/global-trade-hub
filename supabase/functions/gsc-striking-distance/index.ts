import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { google } from "https://esm.sh/googleapis@126";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Secure with CRON_SECRET
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clientEmail = Deno.env.get("GSC_CLIENT_EMAIL");
  const privateKey = Deno.env.get("GSC_PRIVATE_KEY");
  const propertyUrl = Deno.env.get("GSC_PROPERTY_URL");

  if (!clientEmail || !privateKey || !propertyUrl) {
    return new Response(
      JSON.stringify({ success: false, message: "GSC secrets not configured." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const jwtClient = new google.auth.JWT(
      clientEmail,
      undefined,
      privateKey.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/webmasters.readonly"]
    );
    await jwtClient.authorize();

    const searchconsole = google.searchconsole({ version: "v1", auth: jwtClient });

    const today = new Date();
    const endDate = today.toISOString().split("T")[0];
    const startDate = new Date(today.setDate(today.getDate() - 28))
      .toISOString().split("T")[0];

    // Fetch page+query level data
    const response = await searchconsole.searchanalytics.query({
      siteUrl: propertyUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["page", "query"],
        rowLimit: 5000,
      },
    });

    const rows = response.data.rows || [];
    let detected = 0;

    for (const row of rows) {
      const pageUrl = row.keys?.[0];
      const query = row.keys?.[1];
      if (!pageUrl || !query) continue;

      const position = row.position || 0;
      const impressions = row.impressions || 0;
      const clicks = row.clicks || 0;
      const ctr = row.ctr || 0;

      // Striking distance criteria: position 6-20, impressions > 100, CTR < 3%
      if (position < 6 || position > 20) continue;
      if (impressions < 100) continue;
      if (ctr > 0.03) continue;

      // Extract slug from URL patterns
      let pageSlug = "";
      const demandMatch = pageUrl.match(/\/demand\/([^/?#]+)/);
      const compareMatch = pageUrl.match(/\/compare\/([^/?#]+)/);
      const useCaseMatch = pageUrl.match(/\/use-case\/([^/?#]+)/);
      const importMatch = pageUrl.match(/\/import\/([^/?#]+)/);

      if (demandMatch) pageSlug = demandMatch[1];
      else if (compareMatch) pageSlug = compareMatch[1];
      else if (useCaseMatch) pageSlug = useCaseMatch[1];
      else if (importMatch) pageSlug = importMatch[1];
      else continue;

      // Upsert into gsc_striking_distance
      await supabase
        .from("gsc_striking_distance")
        .upsert(
          {
            page_slug: pageSlug,
            query,
            position,
            impressions,
            clicks,
            ctr: Math.round(ctr * 10000) / 100, // Store as percentage
            detected_at: new Date().toISOString(),
            is_active: true,
          },
          { onConflict: "page_slug,query" }
        );

      detected++;
    }

    // Deactivate old entries not seen in this run
    await supabase
      .from("gsc_striking_distance")
      .update({ is_active: false })
      .lt("detected_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    return new Response(
      JSON.stringify({ success: true, detected }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
