// Reset a team member's password to a new temporary password.
// - Returns the temp password to the calling admin (one-time display).
// - Marks the user with `created_by_admin` + clears `password_changed_at` so
//   the force-change-on-first-login gate fires on their next login.
// - Authority model:
//     buyer_manager     → can reset only buyer_purchaser in same company
//     buyer_ceo / cfo / vp / purchase_head → can reset anyone in same company
//     others            → forbidden
// - Logs every reset attempt (success or failure) to procurement_audit_logs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EXECUTIVE_RESETTERS = new Set([
  "buyer_ceo",
  "buyer_cfo",
  "buyer_vp",
  "buyer_purchase_head",
]);
const MANAGER_RESETTERS = new Set(["buyer_manager"]);
// What a manager is allowed to reset
const MANAGER_CAN_RESET = new Set(["buyer_purchaser"]);

function genPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const nums = "23456789";
  const sym = "!@#$%&*";
  const all = upper + lower + nums + sym;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  let pw = pick(upper) + pick(lower) + pick(nums) + pick(sym);
  for (let i = 0; i < 10; i++) pw += pick(all);
  return pw.split("").sort(() => Math.random() - 0.5).join("");
}

async function logAudit(
  admin: any,
  callerId: string,
  targetUserId: string,
  companyId: string | null,
  outcome: "success" | "denied" | "error",
  reason: string,
) {
  try {
    await admin.from("procurement_audit_logs").insert({
      actor_id: callerId,
      actor_role: "buyer_admin_action",
      action: "reset_team_member_password",
      entity_type: "user",
      entity_id: targetUserId,
      details: { outcome, reason, company_id: companyId },
    });
  } catch (_e) {
    // Audit failure must not block the operation
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: { user: caller }, error: callerErr } =
      await userClient.auth.getUser();
    if (callerErr || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const targetUserId = String(body.targetUserId ?? "").trim();

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: "targetUserId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Caller's membership
    const { data: callerMembership } = await admin
      .from("buyer_company_members")
      .select("company_id, role, is_active")
      .eq("user_id", caller.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!callerMembership) {
      await logAudit(admin, caller.id, targetUserId, null, "denied", "caller_not_a_buyer_member");
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerRole = callerMembership.role as string;
    const companyId = callerMembership.company_id as string;

    if (!EXECUTIVE_RESETTERS.has(callerRole) && !MANAGER_RESETTERS.has(callerRole)) {
      await logAudit(admin, caller.id, targetUserId, companyId, "denied", `caller_role_not_authorized:${callerRole}`);
      return new Response(
        JSON.stringify({ error: "Your role cannot reset team passwords" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Target's membership (must be in the same company)
    const { data: targetMembership } = await admin
      .from("buyer_company_members")
      .select("company_id, role, is_active, user_id")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (!targetMembership) {
      await logAudit(admin, caller.id, targetUserId, companyId, "denied", "target_not_a_member");
      return new Response(
        JSON.stringify({ error: "Target user is not a team member" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (targetMembership.company_id !== companyId) {
      await logAudit(admin, caller.id, targetUserId, companyId, "denied", "cross_company_reset_blocked");
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (targetUserId === caller.id) {
      await logAudit(admin, caller.id, targetUserId, companyId, "denied", "self_reset_blocked");
      return new Response(
        JSON.stringify({ error: "Use the change-password page to reset your own password" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const targetRole = targetMembership.role as string;

    // Authority check: managers can only reset purchasers
    if (MANAGER_RESETTERS.has(callerRole) && !MANAGER_CAN_RESET.has(targetRole)) {
      await logAudit(admin, caller.id, targetUserId, companyId, "denied", `manager_cannot_reset_role:${targetRole}`);
      return new Response(
        JSON.stringify({
          error: "Managers can only reset purchaser passwords. Ask an executive (CEO/CFO/VP/HOP) to reset this user.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Generate, set, and tag the user
    const tempPassword = genPassword();

    // Fetch existing metadata so we don't blow it away
    const { data: existingUserData } = await admin.auth.admin.getUserById(targetUserId);
    const existingMeta = (existingUserData?.user?.user_metadata ?? {}) as Record<string, any>;

    const newMeta = {
      ...existingMeta,
      created_by_admin: caller.id,
      // CRITICAL: clearing this re-arms the force-change-on-first-login gate
      password_changed_at: null,
      last_admin_password_reset_at: new Date().toISOString(),
    };

    const { error: updateErr } = await admin.auth.admin.updateUserById(
      targetUserId,
      {
        password: tempPassword,
        user_metadata: newMeta,
      },
    );

    if (updateErr) {
      await logAudit(admin, caller.id, targetUserId, companyId, "error", `update_failed:${updateErr.message}`);
      return new Response(
        JSON.stringify({ error: `Reset failed: ${updateErr.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    await logAudit(admin, caller.id, targetUserId, companyId, "success", `reset_by:${callerRole}`);

    return new Response(
      JSON.stringify({
        success: true,
        tempPassword,
        targetUserId,
        message:
          "Password reset. Share the temp password securely with the user — they'll be required to change it on next login.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (e) {
    console.error("reset-team-member-password error", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? "Unexpected error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
