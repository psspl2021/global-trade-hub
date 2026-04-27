import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { google } from "https://esm.sh/googleapis@126";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-admin-trigger",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 Two auth modes:
  //  1) CRON_SECRET (server-to-server, cron jobs)
  //  2) Admin user JWT (manual trigger from Admin UI) — header x-admin-trigger=true
  const authHeader = req.headers.get("authorization") || "";
  const adminTrigger = req.headers.get("x-admin-trigger") === "true";
  const cronSecret = Deno.env.get("CRON_SECRET");

  let isAuthorized = false;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    isAuthorized = true;
  } else if (adminTrigger && authHeader.startsWith("Bearer ")) {
    // Verify the JWT belongs to an admin user
    const userJwt = authHeader.replace("Bearer ", "");
    const supaAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: userData } = await supaAuth.auth.getUser(userJwt);
    if (userData?.user) {
      const { data: roleRow } = await supaAuth
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (roleRow) isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check GSC secrets
  const clientEmail = Deno.env.get("GSC_CLIENT_EMAIL");
  const privateKey = Deno.env.get("GSC_PRIVATE_KEY");
  const propertyUrl = Deno.env.get("GSC_PROPERTY_URL");

  if (!clientEmail || !privateKey || !propertyUrl) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "GSC secrets not configured (need GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY, GSC_PROPERTY_URL).",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Normalize private key — handle accidental paste of JSON line fragment, full JSON object,
    // or PEM with missing newlines around BEGIN/END markers.
    let normalizedKey = privateKey.trim();

    // If user pasted the whole service-account JSON object, extract private_key
    if (normalizedKey.startsWith("{")) {
      try {
        const parsed = JSON.parse(normalizedKey);
        if (parsed.private_key) normalizedKey = parsed.private_key;
      } catch (_) { /* fall through */ }
    }

    // Convert literal \n to real newlines first
    normalizedKey = normalizedKey.replace(/\\n/g, "\n");

    // Extract just the PEM portion (strip any "private_key": "..." wrapper)
    const beginMarker = "-----BEGIN PRIVATE KEY-----";
    const endMarker = "-----END PRIVATE KEY-----";
    const beginIdx = normalizedKey.indexOf(beginMarker);
    const endIdx = normalizedKey.indexOf(endMarker);
    if (beginIdx >= 0 && endIdx > beginIdx) {
      // Pull out the base64 body between markers, strip ALL whitespace, then re-wrap to 64-char lines
      let body = normalizedKey.slice(beginIdx + beginMarker.length, endIdx);
      body = body.replace(/[\s\\]/g, ""); // remove whitespace + stray backslashes
      const wrapped = body.match(/.{1,64}/g)?.join("\n") || "";
      normalizedKey = `${beginMarker}\n${wrapped}\n${endMarker}\n`;
    }

    // Authenticate with Google
    const jwtClient = new google.auth.JWT(
      clientEmail,
      undefined,
      normalizedKey,
      ["https://www.googleapis.com/auth/webmasters.readonly"]
    );
    await jwtClient.authorize();

    const searchconsole = google.searchconsole({ version: "v1", auth: jwtClient });

    // Date range: last 28 days (covers both 7d sync needs + striking distance)
    const today = new Date();
    const endDate = today.toISOString().split("T")[0];
    const startDate = new Date(today.setDate(today.getDate() - 28))
      .toISOString().split("T")[0];

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

    // ============ Aggregations ============
    // Per-page totals (for seo_demand_pages)
    const pageTotals = new Map<string, { slug: string; impressions: number; clicks: number }>();
    // Per page+query rows (for gsc_queries)
    const queryRows: Array<{
      page_slug: string;
      query: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }> = [];
    // Striking distance candidates
    const strikingRows: Array<{
      page_slug: string;
      query: string;
      position: number;
      impressions: number;
      clicks: number;
      ctr: number;
    }> = [];

    function extractSlug(pageUrl: string): { slug: string; fullPath: string } | null {
      const patterns = [
        /\/demand\/([^/?#]+)/,
        /\/compare\/([^/?#]+)/,
        /\/use-case\/([^/?#]+)/,
        /\/import\/([^/?#]+)/,
        /\/source\/([^/?#]+)/,
        /\/procurement\/([^/?#]+)/,
      ];
      for (const re of patterns) {
        const m = pageUrl.match(re);
        if (m) {
          const fullPath = new URL(pageUrl).pathname;
          return { slug: m[1], fullPath };
        }
      }
      return null;
    }

    for (const row of rows) {
      const pageUrl = row.keys?.[0];
      const query = row.keys?.[1];
      if (!pageUrl || !query) continue;

      const impressions = row.impressions || 0;
      const clicks = row.clicks || 0;
      const ctr = row.ctr || 0;
      const position = row.position || 0;

      const extracted = extractSlug(pageUrl);
      if (!extracted) continue;
      const { slug, fullPath } = extracted;

      // Aggregate per-page totals (only for /demand/ slugs to update seo_demand_pages)
      if (pageUrl.includes("/demand/")) {
        const existing = pageTotals.get(slug) || { slug, impressions: 0, clicks: 0 };
        existing.impressions += impressions;
        existing.clicks += clicks;
        pageTotals.set(slug, existing);
      }

      // Per query row (for gsc_queries) — page_slug stored as full path like "/demand/xxx"
      queryRows.push({
        page_slug: fullPath,
        query,
        clicks,
        impressions,
        ctr,
        position,
      });

      // Striking distance: position 6-20, impressions > 100, CTR < 3%
      if (position >= 6 && position <= 20 && impressions >= 100 && ctr < 0.03) {
        strikingRows.push({
          page_slug: slug,
          query,
          position,
          impressions,
          clicks,
          ctr: Math.round(ctr * 10000) / 100, // %
        });
      }
    }

    // ============ Writes ============

    // 1) seo_demand_pages: update impressions/clicks/last_checked per slug
    let pagesUpdated = 0;
    const nowISO = new Date().toISOString();
    for (const [slug, totals] of pageTotals) {
      const { error: updErr, count } = await supabase
        .from("seo_demand_pages")
        .update({
          impressions: totals.impressions,
          clicks: totals.clicks,
          last_checked: nowISO,
          gsc_status: totals.impressions > 0 ? "indexed" : "pending",
        }, { count: "exact" })
        .eq("slug", slug);
      if (!updErr && (count ?? 0) > 0) pagesUpdated++;
    }

    // 2) gsc_queries: clear stale rows for these pages, then bulk insert fresh
    let queriesInserted = 0;
    if (queryRows.length > 0) {
      // Delete old rows for these page_slugs (refresh data)
      const distinctPages = Array.from(new Set(queryRows.map(q => q.page_slug)));
      await supabase
        .from("gsc_queries")
        .delete()
        .in("page_slug", distinctPages);

      // Insert in chunks of 500 to avoid payload limits
      const chunkSize = 500;
      for (let i = 0; i < queryRows.length; i += chunkSize) {
        const chunk = queryRows.slice(i, i + chunkSize).map(r => ({
          ...r,
          updated_at: nowISO,
        }));
        const { error: insErr } = await supabase.from("gsc_queries").insert(chunk);
        if (!insErr) queriesInserted += chunk.length;
      }
    }

    // 3) gsc_striking_distance: upsert active opportunities
    let strikingUpserted = 0;
    for (const sr of strikingRows) {
      const { error: upErr } = await supabase
        .from("gsc_striking_distance")
        .upsert(
          {
            page_slug: sr.page_slug,
            query: sr.query,
            position: sr.position,
            impressions: sr.impressions,
            clicks: sr.clicks,
            ctr: sr.ctr,
            detected_at: nowISO,
            is_active: true,
          },
          { onConflict: "page_slug,query" }
        );
      if (!upErr) strikingUpserted++;
    }

    // Deactivate striking_distance entries not seen in past 7 days
    await supabase
      .from("gsc_striking_distance")
      .update({ is_active: false })
      .lt("detected_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    return new Response(
      JSON.stringify({
        success: true,
        property: propertyUrl,
        date_range: { startDate, endDate },
        gsc_rows_fetched: rows.length,
        seo_demand_pages_updated: pagesUpdated,
        gsc_queries_inserted: queriesInserted,
        gsc_striking_distance_upserted: strikingUpserted,
        synced_at: nowISO,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[seo-gsc-sync] error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        hint: "If you see 'invalid_grant' or 'invalid_client', the GSC service-account key is rejected — likely needs OAuth refresh-token method instead.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
