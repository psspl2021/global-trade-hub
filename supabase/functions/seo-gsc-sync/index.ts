import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-admin-trigger",
};

const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

function base64Url(bytes: Uint8Array | string) {
  const binary = typeof bytes === "string"
    ? bytes
    : Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function privateKeyCandidates(rawPrivateKey: string) {
  const beginMarker = "-----BEGIN PRIVATE KEY-----";
  const endMarker = "-----END PRIVATE KEY-----";
  const normalized = rawPrivateKey.trim().replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r/g, "\n");
  const bodies: string[] = [];
  const pemMatches = normalized.matchAll(/-----BEGIN PRIVATE KEY-----([\s\S]*?)-----END PRIVATE KEY-----/g);

  for (const match of pemMatches) {
    bodies.push(match[1]);
  }

  if (bodies.length === 0) {
    bodies.push(normalized.replace(beginMarker, "").replace(endMarker, ""));
  }

  const candidates = new Set<string>();
  for (const body of bodies) {
    const compact = body.replace(/[^A-Za-z0-9+/=]/g, "");
    if (compact.length > 0) candidates.add(compact);

    // Service-account PKCS#8 keys normally start with MII. This also recovers
    // the common broken paste where junk is accidentally prepended before MII.
    const starts = [...compact.matchAll(/MII/g)].map((match) => match.index ?? -1).filter((index) => index >= 0);
    for (const start of starts) {
      candidates.add(compact.slice(start));
    }
  }

  return [...candidates].filter((candidate) => candidate.length > 256);
}

async function importServiceAccountKey(rawPrivateKey: string) {
  const attempts = privateKeyCandidates(rawPrivateKey);

  for (const candidate of attempts) {
    try {
      return await crypto.subtle.importKey(
        "pkcs8",
        base64ToBytes(candidate),
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
      );
    } catch (_) {
      // Try the next candidate.
    }
  }

  throw new Error("invalid PEM private key. Use a fresh, unedited Google service-account JSON key file.");
}

async function getGoogleAccessToken(clientEmail: string, rawPrivateKey: string) {
  const key = await importServiceAccountKey(rawPrivateKey);
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: clientEmail,
    scope: GSC_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const unsignedJwt = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedJwt)
  );
  const assertion = `${unsignedJwt}.${base64Url(new Uint8Array(signature))}`;

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const tokenJson = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenJson.access_token) {
    const message = tokenJson.error_description || tokenJson.error || "Google token exchange failed";
    throw new Error(message);
  }

  return tokenJson.access_token as string;
}

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

  // Check GSC secrets — prefer GSC_SERVICE_ACCOUNT_JSON (full JSON paste, recommended)
  // Fallback to legacy GSC_CLIENT_EMAIL + GSC_PRIVATE_KEY pair.
  const serviceAccountJson = Deno.env.get("GSC_SERVICE_ACCOUNT_JSON");
  const propertyUrl = Deno.env.get("GSC_PROPERTY_URL");
  let clientEmail = Deno.env.get("GSC_CLIENT_EMAIL") || "";
  let privateKey = Deno.env.get("GSC_PRIVATE_KEY") || "";

  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      if (parsed.client_email && parsed.private_key) {
        clientEmail = parsed.client_email;
        privateKey = parsed.private_key;
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, error: "GSC_SERVICE_ACCOUNT_JSON is not valid JSON. Paste the entire .json file content from Google Cloud." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  if (!clientEmail || !privateKey || !propertyUrl) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "GSC secrets not configured. Set GSC_SERVICE_ACCOUNT_JSON (full JSON file) + GSC_PROPERTY_URL.",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const accessToken = await getGoogleAccessToken(clientEmail, privateKey);

    // Date range: last 28 days (covers both 7d sync needs + striking distance)
    const today = new Date();
    const endDate = today.toISOString().split("T")[0];
    const startDate = new Date(today.setDate(today.getDate() - 28))
      .toISOString().split("T")[0];

    const gscResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["page", "query"],
        rowLimit: 5000,
        }),
      }
    );

    const response = await gscResponse.json();
    if (!gscResponse.ok) {
      throw new Error(response.error?.message || response.error_description || "Google Search Console query failed");
    }

    const rows = response.rows || [];

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
