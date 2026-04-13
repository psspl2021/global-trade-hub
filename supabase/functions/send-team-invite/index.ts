import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, role, categories, inviterName, companyName } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') || 'noreply@procuresaathi.com';

    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const roleLabel = role?.replace('buyer_', '').replace(/^\w/, (c: string) => c.toUpperCase()) || 'Team Member';
    const categoryList = categories?.length
      ? categories.map((c: string) => `<li style="padding:2px 0;">${c}</li>`).join('')
      : '';

    const signupLink = `https://procuresaathi.lovable.app/signup`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e40af, #2563eb); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 22px;">🤝 You're Invited to Join ${companyName || 'a Procurement Team'}</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="color: #374151; font-size: 16px; margin-top: 0;">
            Hi${fullName ? ` ${fullName}` : ''},
          </p>
          <p style="color: #374151; font-size: 15px;">
            <strong>${inviterName || 'Your team admin'}</strong> has invited you to join
            <strong>${companyName || 'their organization'}</strong> on <strong>ProcureSaathi</strong>
            as a <strong>${roleLabel}</strong>.
          </p>

          ${categoryList ? `
          <div style="background: #f0f9ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 14px; margin: 16px 0;">
            <p style="color: #1e40af; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">📂 Assigned Categories:</p>
            <ul style="color: #374151; font-size: 14px; margin: 0; padding-left: 20px;">
              ${categoryList}
            </ul>
          </div>` : ''}

          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px; margin: 16px 0;">
            <p style="color: #166534; font-size: 13px; margin: 0;">
              ✔ Post RFQs &nbsp; ✔ Run Reverse Auctions &nbsp; ✔ Track Purchase Orders &nbsp; ✔ Manage Suppliers
            </p>
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
      </div>
    `;

    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'ProcureSaathi', email: BREVO_SENDER_EMAIL },
        to: [{ email, name: fullName || undefined }],
        subject: `You're invited to join ${companyName || 'a team'} on ProcureSaathi`,
        htmlContent,
      }),
    });

    const responseBody = await emailResponse.text();

    if (!emailResponse.ok) {
      console.error(`Brevo API error [${emailResponse.status}]:`, responseBody);
      return new Response(JSON.stringify({ error: 'Failed to send invitation email', details: responseBody }), {
        status: emailResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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
