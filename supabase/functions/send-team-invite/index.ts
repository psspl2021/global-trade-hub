import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, role, categories, inviterName, companyName, companyId } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') || 'noreply@procuresaathi.com';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const roleLabel = role?.replace('buyer_', '').replace(/^\w/, (c: string) => c.toUpperCase()) || 'Team Member';
    const categoryList = categories?.length
      ? categories.map((c: string) => `<li style="padding:2px 0;">${c}</li>`).join('')
      : '';

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    let existingProfile: { id: string; contact_person: string | null; email: string | null } | null = null;

    const { data: profileByEmail } = await supabaseAdmin
      .from('profiles')
      .select('id, contact_person, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (profileByEmail) {
      existingProfile = profileByEmail;
    } else {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = users?.find((u: any) => u.email?.toLowerCase() === normalizedEmail);
      if (authUser) {
        const { data: profileById } = await supabaseAdmin
          .from('profiles')
          .select('id, contact_person, email')
          .eq('id', authUser.id)
          .maybeSingle();
        existingProfile = profileById || { id: authUser.id, contact_person: null, email: null };
      }
    }

    let userAlreadyExists = false;
    let alreadyMember = false;
    let ownsAnotherCompany = false;

    if (existingProfile && companyId) {
      userAlreadyExists = true;

      // Check if already a member of THIS company
      const { data: existing } = await supabaseAdmin
        .from('buyer_company_members')
        .select('id')
        .eq('company_id', companyId)
        .eq('user_id', existingProfile.id)
        .maybeSingle();

      if (existing) {
        alreadyMember = true;
      } else {
        // SAFETY: Check if user already belongs to ANY other buyer company.
        // If so, they MUST explicitly accept the invite via tokenized link —
        // never silently merge an independent buyer into another company.
        const { data: otherMemberships } = await supabaseAdmin
          .from('buyer_company_members')
          .select('id')
          .eq('user_id', existingProfile.id)
          .neq('company_id', companyId)
          .limit(1);

        if (otherMemberships && otherMemberships.length > 0) {
          ownsAnotherCompany = true;
          // Do NOT auto-insert. Force tokenized invite flow below.
          userAlreadyExists = false;
        } else {
          // Safe to auto-add: user has no other company affiliation.
          await supabaseAdmin
            .from('buyer_company_members')
            .insert({
              company_id: companyId,
              user_id: existingProfile.id,
              role: role || 'buyer_purchaser',
              is_active: true,
              assigned_categories: categories?.length ? categories : null,
            });
        }
      }
    }

    if (alreadyMember) {
      return new Response(JSON.stringify({ 
        success: true, 
        alreadyMember: true,
        message: 'User is already a member of your team.' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== STEP: Create team_invite record for NEW users =====
    let inviteId: string | null = null;
    if (!userAlreadyExists && companyId) {
      // Get the inviter's user ID from the auth header
      const authHeader = req.headers.get('authorization');
      let inviterId: string | null = null;
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        inviterId = user?.id || null;
      }

      const { data: inviteData } = await supabaseAdmin
        .from('team_invites')
        .insert({
          email: normalizedEmail,
          role: role || 'buyer_purchaser',
          company_id: companyId,
          invited_by: inviterId,
          categories: categories?.length ? categories : [],
          status: 'pending',
        })
        .select('id')
        .single();

      inviteId = inviteData?.id || null;
    }

    // Build email
    const isManagement = ['buyer_cfo', 'buyer_ceo', 'buyer_manager'].includes(role);
    const capabilitiesHtml = isManagement
      ? `<p style="color: #166534; font-size: 13px; margin: 0;">
           ✔ Approve Purchase Orders &nbsp; ✔ Approve Payments &nbsp; ✔ Add Team Members &nbsp; ✔ Financial Governance
         </p>`
      : `<p style="color: #166534; font-size: 13px; margin: 0;">
           ✔ Post RFQs &nbsp; ✔ Run Reverse Auctions &nbsp; ✔ Track Purchase Orders &nbsp; ✔ Manage Suppliers
         </p>`;

    const recipientName = fullName || existingProfile?.contact_person || '';
    const dashboardLink = `https://www.procuresaathi.com/dashboard`;
    // Tokenized invite link — NEVER fall back to /signup
    const inviteLink = inviteId 
      ? `https://www.procuresaathi.com/invite/${inviteId}`
      : `https://www.procuresaathi.com/login`;

    let htmlContent: string;
    let subject: string;

    if (userAlreadyExists) {
      subject = `You've been added to ${companyName || 'a team'} as ${roleLabel} on ProcureSaathi`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e40af, #2563eb); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 22px;">🎉 You've Been Added to ${companyName || 'a Team'}</h1>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 16px; margin-top: 0;">
              Hi${recipientName ? ` ${recipientName}` : ''},
            </p>
            <p style="color: #374151; font-size: 15px;">
              <strong>${inviterName || 'Your team admin'}</strong> has added you to
              <strong>${companyName || 'their organization'}</strong> on <strong>ProcureSaathi</strong>
              as a <strong>${roleLabel}</strong>.
            </p>
            <p style="color: #374151; font-size: 14px;">
              You can now access the ${isManagement ? 'Management View' : 'Procurement Dashboard'} directly from your dashboard.
            </p>

            ${categoryList ? `
            <div style="background: #f0f9ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 14px; margin: 16px 0;">
              <p style="color: #1e40af; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">📂 Assigned Categories:</p>
              <ul style="color: #374151; font-size: 14px; margin: 0; padding-left: 20px;">${categoryList}</ul>
            </div>` : ''}

            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px; margin: 16px 0;">
              ${capabilitiesHtml}
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${dashboardLink}" style="background: linear-gradient(135deg, #1e40af, #2563eb); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                Go to Dashboard →
              </a>
            </div>

            <p style="color: #6b7280; font-size: 13px;">
              No action needed — your access is already active. Log in to your existing account to get started.
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 16px;">
            ProcureSaathi — B2B Procurement Platform
          </p>
        </div>`;
    } else {
      // New user — send tokenized invite link
      subject = `You're invited to join ${companyName || 'a team'} on ProcureSaathi`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e40af, #2563eb); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 22px;">🤝 You're Invited to Join ${companyName || 'a Procurement Team'}</h1>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 16px; margin-top: 0;">
              Hi${recipientName ? ` ${recipientName}` : ''},
            </p>
            <p style="color: #374151; font-size: 15px;">
              <strong>${inviterName || 'Your team admin'}</strong> has invited you to join
              <strong>${companyName || 'their organization'}</strong> on <strong>ProcureSaathi</strong>
              as a <strong>${roleLabel}</strong>.
            </p>

            ${categoryList ? `
            <div style="background: #f0f9ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 14px; margin: 16px 0;">
              <p style="color: #1e40af; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">📂 Assigned Categories:</p>
              <ul style="color: #374151; font-size: 14px; margin: 0; padding-left: 20px;">${categoryList}</ul>
            </div>` : ''}

            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px; margin: 16px 0;">
              ${capabilitiesHtml}
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${inviteLink}" style="background: linear-gradient(135deg, #1e40af, #2563eb); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                Accept Invitation & Join →
              </a>
            </div>

            <p style="color: #6b7280; font-size: 13px;">
              Access your company dashboard on <strong>${companyName || 'ProcureSaathi'}</strong> instantly after login.
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 16px;">
            ProcureSaathi — B2B Procurement Platform
          </p>
        </div>`;
    }

    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'ProcureSaathi', email: BREVO_SENDER_EMAIL },
        to: [{ email, name: recipientName || undefined }],
        subject,
        htmlContent,
      }),
    });

    const responseBody = await emailResponse.text();

    if (!emailResponse.ok) {
      console.error(`Brevo API error [${emailResponse.status}]:`, responseBody);
      return new Response(JSON.stringify({ error: 'Failed to send email', details: responseBody }), {
        status: emailResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      userAlreadyExists,
      autoAdded: userAlreadyExists && !alreadyMember,
      inviteId,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in send-team-invite:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
