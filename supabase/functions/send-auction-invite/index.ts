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
    const { email, auctionTitle, auctionId, product, quantity, startTime, auctionLink } = await req.json();

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

    const startDate = startTime ? new Date(startTime).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }) : 'TBD';

    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: 'ProcureSaathi',
          email: BREVO_SENDER_EMAIL,
        },
        to: [{ email }],
        subject: `🌍 Private Global Auction Invitation – ${auctionTitle}`,
        headers: {
          'X-Mailin-custom': `auction_id:${auctionId || ''}`,
        },
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #d97706, #ea580c); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: #fff; margin: 0; font-size: 22px;">🌍 You're Invited to a Private Global Auction</h1>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
              <p style="color: #374151; font-size: 16px; margin-top: 0;">
                A verified buyer on <strong>ProcureSaathi</strong> has invited you to participate in a <strong>Private Reverse Auction</strong>. Compete with trusted suppliers to win the order!
              </p>
              
              <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h2 style="color: #92400e; margin: 0 0 12px 0; font-size: 18px;">${auctionTitle}</h2>
                <table style="width: 100%; font-size: 14px; color: #374151;">
                  <tr><td style="padding: 4px 0; font-weight: 600;">📦 Product:</td><td>${product || 'Multiple items'}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: 600;">📊 Quantity:</td><td>${quantity || 'See auction details'}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: 600;">⏱ Auction Start:</td><td>${startDate}</td></tr>
                </table>
              </div>

              <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px; margin: 16px 0;">
                <p style="color: #166534; font-size: 13px; margin: 0;">
                  ✔ Verified buyer requirement &nbsp; ✔ Transparent competitive bidding &nbsp; ✔ International sourcing opportunity
                </p>
              </div>

              <div style="text-align: center; margin: 24px 0;">
                <a href="${auctionLink}" style="background: linear-gradient(135deg, #d97706, #ea580c); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                  🎯 Join & Place Your Bid →
                </a>
              </div>

              <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 12px; margin: 16px 0;">
                <p style="color: #1e40af; font-size: 13px; margin: 0;">
                  🆓 <strong>Suppliers get 2 months FREE access</strong> — no upfront cost. Pay only when you start winning business.
                </p>
              </div>

              <p style="color: #6b7280; font-size: 13px; margin-bottom: 0;">
                This is a private auction — only invited suppliers can view and bid.
              </p>
            </div>
            <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 16px;">
              ProcureSaathi — Global B2B Procurement Platform
            </p>
          </div>
        `,
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

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in send-auction-invite:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
