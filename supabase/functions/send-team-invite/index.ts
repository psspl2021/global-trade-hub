import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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

    // Check if user already exists — try profiles.email first, then auth.users
    const normalizedEmail = email.trim().toLowerCase();
    let existingProfile: { id: string; contact_person: string | null; email: string | null } | null = null;

    const { data: profileByEmail } = await supabaseAdmin
      .from('profiles')
      .select('id, contact_person, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (profileByEmail) {
      existingProfile = profileByEmail;
    } else {
      // Fallback: check auth.users (profiles.email may be null)
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

    if (existingProfile && companyId) {
      userAlreadyExists = true;

      // Check if already a member
      const { data: existing } = await supabaseAdmin
        .from('buyer_company_members')
        .select('id')
        .eq('company_id', companyId)
        .eq('user_id', existingProfile.id)
        .maybeSingle();

      if (existing) {
        alreadyMember = true;
      } else {
        // Auto-add to company
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

    // Build role-specific capabilities
    const isManagement = ['buyer_cfo', 'buyer_ceo', 'buyer_manager'].includes(role);
    const capabilitiesHtml = isManagement
      ? `<p style="color: #166534; font-size: 13px; margin: 0;">
           ✔ Approve Purchase Orders &nbsp; ✔ Approve Payments &nbsp; ✔ Add Team Members &nbsp; ✔ Financial Governance
         </p>`
      : `<p style="color: #166534; font-size: 13px; margin: 0;">
           ✔ Post RFQs &nbsp; ✔ Run Reverse Auctions &nbsp; ✔ Track Purchase Orders &nbsp; ✔ Manage Suppliers
         </p>`;

    const recipientName = fullName || existingProfile?.contact_person || '';
    const dashboardLink = `https://procuresaathi.lovable.app/dashboard`;
    const signupLink = `https://procuresaathi.lovable.app/signup`;

    let htmlContent: string;
    let subject: string;

    if (userAlreadyExists) {
      // User exists → "You've been added" notification (no signup needed)
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
      // User doesn't exist → Signup invite
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
              <a href="${signupLink}" style="background: linear-gradient(135deg, #1e40af, #2563eb); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                Accept Invitation & Join →
              </a>
            </div>

            <p style="color: #6b7280; font-size: 13px;">
              Sign up using this email address (<strong>${email}</strong>) to be automatically linked to the team.
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
