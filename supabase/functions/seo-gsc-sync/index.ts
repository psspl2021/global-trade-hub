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

  // 🔒 Secure with CRON_SECRET
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check if GSC secrets exist
  const clientEmail = Deno.env.get("GSC_CLIENT_EMAIL");
  const privateKey = Deno.env.get("GSC_PRIVATE_KEY");
  const propertyUrl = Deno.env.get("GSC_PROPERTY_URL");

  if (!clientEmail || !privateKey || !propertyUrl) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "GSC secrets not configured yet.",
      }),
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

    const searchconsole = google.searchconsole({
      version: "v1",
      auth: jwtClient,
    });

    const today = new Date();
    const endDate = today.toISOString().split("T")[0];
    const startDate = new Date(today.setDate(today.getDate() - 7))
      .toISOString()
      .split("T")[0];

    const response = await searchconsole.searchanalytics.query({
      siteUrl: propertyUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["page"],
        rowLimit: 2500,
      },
    });

    const rows = response.data.rows || [];
    let updated = 0;

    for (const row of rows) {
      const pageUrl = row.keys?.[0];
      if (!pageUrl) continue;

      const slug = pageUrl.split("/demand/")[1];
      if (!slug) continue;

      await supabase
        .from("seo_demand_pages")
        .update({
          impressions: row.impressions || 0,
          clicks: row.clicks || 0,
          last_checked: new Date().toISOString(),
        })
        .eq("slug", slug);

      updated++;
    }

    return new Response(
      JSON.stringify({ success: true, updated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
