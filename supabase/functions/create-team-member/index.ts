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
];

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

    if (existing) {
      userId = existing.id;
    } else {
      // IMPORTANT: Insert team_invites row BEFORE createUser so the
      // auto_provision_buyer_company trigger joins the existing company
      // instead of creating a new one for this user.
      await admin.from("team_invites").insert({
        email,
        role,
        company_id: companyId,
        invited_by: caller.id,
        status: "pending",
        categories: categories.length ? categories : null,
      });

      // Look up caller's company to copy company_name into the new user's profile
      const { data: callerCompany } = await admin
        .from("buyer_companies")
        .select("company_name, city, state, country")
        .eq("id", companyId)
        .maybeSingle();

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

    // Already a member?
    const { data: existingMember } = await admin
      .from("buyer_company_members")
      .select("id, is_active")
      .eq("user_id", userId!)
      .eq("company_id", companyId)
      .maybeSingle();

    if (existingMember) {
      if (!existingMember.is_active) {
        await admin
          .from("buyer_company_members")
          .update({
            is_active: true,
            role,
            assigned_categories: categories.length ? categories : null,
          })
          .eq("id", existingMember.id);
      }
      return new Response(
        JSON.stringify({
          success: true,
          alreadyMember: true,
          userId,
          tempPassword,
          createdNew,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

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
        JSON.stringify({ error: memberErr.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Best-effort profile upsert
    if (fullName) {
      await admin.from("profiles").upsert(
        { id: userId!, contact_person: fullName },
        { onConflict: "id" },
      );
    }

    // Persist temp credentials so the creator can copy/share the login
    // later from the Purchaser dropdown — auto-deleted on first sign-in.
    if (createdNew && tempPassword) {
      await admin.from("purchaser_temp_credentials").upsert(
        {
          user_id: userId!,
          company_id: companyId,
          created_by: caller.id,
          email,
          temp_password: tempPassword,
        },
        { onConflict: "user_id" },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
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
