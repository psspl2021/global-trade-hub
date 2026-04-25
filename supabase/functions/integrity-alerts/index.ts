// Integrity alerts: DB-driven only.
// Posts a single consolidated Slack message when any signal > 0.
// 5-minute cooldown via integrity_alert_state table.
//
// Signals (computed atomically by public.integrity_signals() RPC):
//   - orphan_buyers: users with a buyer_* role but no active company membership
//   - members_without_roles: active company members with no row in user_roles
//
// History:
//   - The previous duplicate_memberships probe was removed: a UNIQUE
//     (company_id, user_id) constraint makes that state physically
//     impossible, so the probe was dead code.
//   - The previous PostgREST query used `.like("role", "buyer_%")` against
//     the app_role enum, which silently returned a 42883 error and made the
//     probe permanently report 0. Replaced with a SECURITY DEFINER SQL
//     function so signal logic lives next to the data.

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

async function fetchSignals(): Promise<{ orphan_buyers: number; members_without_roles: number }> {
  const { data, error } = await supabase.rpc("integrity_signals");
  if (error) {
    console.error("[integrity-alerts] RPC failure", {
      rpc: "integrity_signals",
      message: error.message,
      code: (error as { code?: string }).code ?? null,
      details: (error as { details?: string }).details ?? null,
      hint: (error as { hint?: string }).hint ?? null,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`integrity_signals RPC failed: ${error.message}`);
  }
  const row = Array.isArray(data) ? data[0] : data;
  return {
    orphan_buyers: Number(row?.orphan_buyers ?? 0),
    members_without_roles: Number(row?.members_without_roles ?? 0),
  };
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
          { type: "mrkdwn", text: `*members without roles:*\n${signals.members_without_roles}` },
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
    const signals = await fetchSignals();
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
