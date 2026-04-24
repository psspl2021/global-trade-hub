// Integrity alerts: scans recent logs + runs orphan/duplicate probes.
// Posts a single consolidated Slack message when any signal > 0.
// 5-minute cooldown via integrity_alert_state table.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WINDOW_MINUTES = 2;
const COOLDOWN_MINUTES = 5;
const COOLDOWN_KEY = "integrity_alerts:any";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SLACK_WEBHOOK = Deno.env.get("SLACK_INTEGRITY_WEBHOOK_URL");
const SUPABASE_PROJECT_REF = "hsybhjjtxdwtpfvcmoqk";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Query Supabase Analytics (logflare) for log occurrences in the last N minutes.
// Uses the management API with the service role; falls back to 0 on error.
async function countLogMatches(needle: string, sinceMs: number): Promise<number> {
  // We use postgres_logs (DB) since handle_new_user / role_known_values_check
  // surface as Postgres errors. Logflare via PG endpoint isn't directly callable
  // from edge fn; instead use the analytics REST endpoint.
  const url = `https://api.supabase.com/platform/projects/${SUPABASE_PROJECT_REF}/analytics/endpoints/logs.all`;
  const sinceIso = new Date(sinceMs).toISOString();
  const sql = `
    select count(*) as c
    from postgres_logs
    cross join unnest(metadata) as m
    cross join unnest(m.parsed) as parsed
    where event_message ilike '%${needle.replace(/'/g, "''")}%'
      and timestamp >= '${sinceIso}'
  `;
  try {
    const res = await fetch(`${url}?sql=${encodeURIComponent(sql)}`, {
      headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    });
    if (!res.ok) {
      console.warn(`[log-count] ${needle}: HTTP ${res.status}`);
      return 0;
    }
    const json = await res.json();
    return Number(json?.result?.[0]?.c ?? 0);
  } catch (e) {
    console.warn(`[log-count] ${needle} failed:`, e);
    return 0;
  }
}

async function countOrphanBuyers(): Promise<number> {
  const { data, error } = await supabase.rpc("exec_count_orphan_buyers").maybeSingle?.() ??
    { data: null, error: null };
  // RPC may not exist — use raw query via PostgREST is not possible for joins to auth.
  // Instead embed the logic directly using two queries we can issue.
  if (data && !error) return Number((data as any).count ?? 0);

  // Fallback: do it in two steps.
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
          { type: "mrkdwn", text: `*handle_new_user failures:*\n${signals.handle_new_user_failed}` },
          { type: "mrkdwn", text: `*user_not_in_company:*\n${signals.user_not_in_company}` },
          { type: "mrkdwn", text: `*role constraint violations:*\n${signals.role_check_violation}` },
          { type: "mrkdwn", text: `*orphan buyers:*\n${signals.orphan_buyers}` },
          { type: "mrkdwn", text: `*duplicate memberships:*\n${signals.duplicate_memberships}` },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Window: last ${WINDOW_MINUTES} min · ${new Date().toISOString()}`,
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
    const sinceMs = Date.now() - WINDOW_MINUTES * 60_000;

    const [
      handleNewUserFailed,
      userNotInCompany,
      roleCheckViolation,
      orphanBuyers,
      duplicateMemberships,
    ] = await Promise.all([
      countLogMatches("handle_new_user failed", sinceMs),
      countLogMatches("user_not_in_company", sinceMs),
      countLogMatches("role_known_values_check", sinceMs),
      countOrphanBuyers(),
      countDuplicateMemberships(),
    ]);

    const signals = {
      handle_new_user_failed: handleNewUserFailed,
      user_not_in_company: userNotInCompany,
      role_check_violation: roleCheckViolation,
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
