// Create a team member account directly (no email invite).
// Returns a temporary password the admin can share with the user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ROLES = [
  "buyer_purchaser",
  "buyer_manager",
  "buyer_hr",
  "buyer_cfo",
  "buyer_ceo",
  "buyer_vp",
  "buyer_purchase_head",
];

// Roles that require user_roles entry (executive/management roles for login redirect)
const EXECUTIVE_ROLES = new Set([
  "buyer_cfo",
  "buyer_ceo",
  "buyer_vp",
  "buyer_purchase_head",
  "buyer_manager",
  "buyer_hr",
]);

// Roles allowed to create team members (matches UI canAddPurchasers)
const ADMIN_ROLES = [
  "buyer_ceo",
  "buyer_cfo",
  "buyer_manager",
  "buyer_hr",
  "buyer_purchaser",
  "buyer_purchase_head",
  "buyer_director",
  "buyer_operations_manager",
];

function genPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const nums = "23456789";
  const sym = "!@#$%&*";
  const all = upper + lower + nums + sym;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  let pw = pick(upper) + pick(lower) + pick(nums) + pick(sym);
  for (let i = 0; i < 10; i++) pw += pick(all);
  return pw
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
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

    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const fullName = String(body.fullName ?? "").trim();
    const role = String(body.role ?? "");
    const categories: string[] = Array.isArray(body.categories)
      ? body.categories
      : [];

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Valid email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Caller must be an admin in some company
    const { data: callerMembership } = await admin
      .from("buyer_company_members")
      .select("company_id, role, is_active")
      .eq("user_id", caller.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!callerMembership || !ADMIN_ROLES.includes(callerMembership.role)) {
      return new Response(
        JSON.stringify({ error: "Not authorized to add team members" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const companyId = callerMembership.company_id;

    // Check existing user via admin list (filter by email)
    let userId: string | null = null;
    const { data: existingList } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const existing = existingList?.users?.find(
      (u) => (u.email ?? "").toLowerCase() === email,
    );

    let tempPassword: string | null = null;
    let createdNew = false;

    // Look up caller's company once (used both for invite + profile fallback)
    const { data: callerCompany } = await admin
      .from("buyer_companies")
      .select("company_name, city, state, country")
      .eq("id", companyId)
      .maybeSingle();

    if (existing) {
      userId = existing.id;
    } else {
      // IMPORTANT: insert team_invites BEFORE createUser so the
      // auto_provision_buyer_company trigger (if it fires) joins the
      // existing company instead of creating a new one.
      await admin.from("team_invites").insert({
        email,
        role,
        company_id: companyId,
        invited_by: caller.id,
        status: "pending",
        categories: categories.length ? categories : null,
      });

      tempPassword = genPassword();
      const { data: created, error: createErr } = await admin.auth.admin
        .createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: fullName || undefined,
            contact_person: fullName || email.split("@")[0],
            company_name: callerCompany?.company_name ?? "Company",
            role,
            created_by_admin: caller.id,
          },
        });
      if (createErr || !created.user) {
        console.error("createUser failed", {
          message: createErr?.message,
          status: (createErr as any)?.status,
          name: createErr?.name,
          code: (createErr as any)?.code,
        });
        return new Response(
          JSON.stringify({
            error: createErr?.message ?? "Failed to create user",
            details: {
              status: (createErr as any)?.status,
              code: (createErr as any)?.code,
            },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      userId = created.user.id;
      createdNew = true;
    }

    // ─── Authoritative provisioning (fail-closed) ───────────────────
    // Edge function is the single writer. Trigger may have already inserted
    // some rows (best-effort); we re-assert each invariant here and verify.

    // 1) Profile must exist (FK target for downstream tables).
    const profileContact = fullName || email.split("@")[0];
    // company_name has a unique-by-lower index; per-user suffix avoids collisions
    // for teammates of the same buyer_company.
    const profileCompanyName =
      `${callerCompany?.company_name ?? "Company"} · ${email.split("@")[0]}`;
    const { error: profileErr } = await admin.from("profiles").upsert(
      {
        id: userId!,
        email,
        contact_person: profileContact,
        company_name: profileCompanyName,
      },
      { onConflict: "id" },
    );
    if (profileErr) {
      // Non-fatal only if a row already exists; log and continue.
      console.warn("[create-team-member] profile upsert warning", profileErr.message);
    }

    // 2) Membership — upsert (idempotent across retries / trigger races)
    const { data: existingMember } = await admin
      .from("buyer_company_members")
      .select("id, is_active")
      .eq("user_id", userId!)
      .eq("company_id", companyId)
      .maybeSingle();

    let alreadyMember = false;
    if (existingMember) {
      alreadyMember = true;
      await admin
        .from("buyer_company_members")
        .update({
          is_active: true,
          role,
          assigned_categories: categories.length ? categories : null,
        })
        .eq("id", existingMember.id);
    } else {
      const { error: memberErr } = await admin
        .from("buyer_company_members")
        .insert({
          user_id: userId!,
          company_id: companyId,
          role,
          assigned_categories: categories.length ? categories : null,
          is_active: true,
        });
      if (memberErr) {
        return new Response(
          JSON.stringify({ error: memberErr.message, step: "membership_insert" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // 3) Role mapping (login redirect for execs/management)
    if (EXECUTIVE_ROLES.has(role)) {
      await admin.from("user_roles").upsert(
        { user_id: userId!, role: role as any },
        { onConflict: "user_id,role" },
      );
    }

    // 4) Mark invite accepted (idempotent)
    await admin
      .from("team_invites")
      .update({ status: "accepted" })
      .eq("email", email)
      .eq("company_id", companyId)
      .eq("status", "pending");

    // 5) FAIL-CLOSED VERIFY — never return success without confirming the row.
    const { count: memberCount, error: verifyErr } = await admin
      .from("buyer_company_members")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId!)
      .eq("company_id", companyId)
      .eq("is_active", true);
    if (verifyErr || (memberCount ?? 0) !== 1) {
      console.error("[create-team-member] membership_not_verified", {
        userId,
        companyId,
        memberCount,
        verifyErr: verifyErr?.message,
      });
      return new Response(
        JSON.stringify({
          error: "membership_not_created",
          details: { memberCount, verifyErr: verifyErr?.message },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("[create-team-member] team_member_provisioned", {
      user_id: userId,
      company_id: companyId,
      role,
      created_new: createdNew,
      already_member: alreadyMember,
    });

    return new Response(
      JSON.stringify({
        success: true,
        alreadyMember,
        userId,
        tempPassword,
        createdNew,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? "Server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
