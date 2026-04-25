// Integrity alerts: DB-driven only.
// Posts a single consolidated Slack message when any signal > 0.
// 5-minute cooldown via integrity_alert_state table.
//
// NOTE: Analytics-based log scanning was removed — the Supabase analytics REST
// endpoint requires a Management API personal access token (not the service
// role key), so all calls returned 401 and silently produced 0 — making the
// monitor a false-positive generator. We now rely exclusively on direct DB
// probes (orphan buyers, duplicate memberships) which are authoritative,
// deterministic, and have zero external dependencies.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COOLDOWN_MINUTES = 5;
const COOLDOWN_KEY = "integrity_alerts:any";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SLACK_WEBHOOK = Deno.env.get("SLACK_INTEGRITY_WEBHOOK_URL");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function countOrphanBuyers(): Promise<number> {
  const { data: roles } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .like("role", "buyer_%");
  if (!roles || roles.length === 0) return 0;

  const userIds = [...new Set(roles.map((r: any) => r.user_id))];
  const { data: members } = await supabase
    .from("buyer_company_members")
    .select("user_id")
    .in("user_id", userIds)
    .eq("is_active", true);
  const memberSet = new Set((members ?? []).map((m: any) => m.user_id));
  return userIds.filter((id) => !memberSet.has(id)).length;
}

async function countDuplicateMemberships(): Promise<number> {
  const { data, error } = await supabase
    .from("buyer_company_members")
    .select("user_id, company_id");
  if (error || !data) return 0;
  const seen = new Map<string, number>();
  for (const row of data as any[]) {
    const k = `${row.user_id}::${row.company_id}`;
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  let dup = 0;
  for (const [, c] of seen) if (c > 1) dup++;
  return dup;
}

async function checkCooldown(): Promise<boolean> {
  const { data } = await supabase
    .from("integrity_alert_state")
    .select("last_alerted_at")
    .eq("signal_key", COOLDOWN_KEY)
    .maybeSingle();
  if (!data) return false;
  const last = new Date(data.last_alerted_at).getTime();
  return Date.now() - last < COOLDOWN_MINUTES * 60_000;
}

async function markAlerted() {
  await supabase
    .from("integrity_alert_state")
    .upsert({ signal_key: COOLDOWN_KEY, last_alerted_at: new Date().toISOString() });
}

async function postToSlack(signals: Record<string, number>) {
  if (!SLACK_WEBHOOK) {
    console.warn("SLACK_INTEGRITY_WEBHOOK_URL not configured; skipping post");
    return;
  }
  const payload = {
    text: "🚨 Procurement Integrity Alert",
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: "*Integrity signals detected*" },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*orphan buyers:*\n${signals.orphan_buyers}` },
          { type: "mrkdwn", text: `*duplicate memberships:*\n${signals.duplicate_memberships}` },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `DB-driven probes · ${new Date().toISOString()}`,
          },
        ],
      },
    ],
  };
  const res = await fetch(SLACK_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error(`Slack post failed: ${res.status} ${await res.text()}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const [orphanBuyers, duplicateMemberships] = await Promise.all([
      countOrphanBuyers(),
      countDuplicateMemberships(),
    ]);

    const signals = {
      orphan_buyers: orphanBuyers,
      duplicate_memberships: duplicateMemberships,
    };

    const total = Object.values(signals).reduce((a, b) => a + b, 0);
    console.log("[integrity-alerts] signals:", JSON.stringify(signals));

    let alerted = false;
    let cooldown = false;

    if (total > 0) {
      cooldown = await checkCooldown();
      if (!cooldown) {
        await postToSlack(signals);
        await markAlerted();
        alerted = true;
      } else {
        console.log("[integrity-alerts] cooldown active, suppressing alert");
      }
    }

    return new Response(
      JSON.stringify({ ok: true, signals, total, alerted, cooldown }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[integrity-alerts] fatal:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
