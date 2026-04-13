import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { po_id, approver_email, approver_role, po_number, po_value, vendor_name } = await req.json();

    if (!po_id || !approver_email || !approver_role) {
      return new Response(JSON.stringify({ error: "Missing required fields: po_id, approver_email, approver_role" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");

    if (!brevoApiKey || !senderEmail) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const roleLabel = approver_role === "director" ? "Director" : "Manager";
    const appUrl = "https://procuresaathi.lovable.app";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #ffffff; margin: 0;">🔒 PO Approval Required</h2>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb;">
          <p style="color: #374151; font-size: 16px;">
            A Purchase Order requires your <strong>${roleLabel}</strong> approval:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">PO Number</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${po_number || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Vendor</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${vendor_name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Value</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">₹${po_value ? Number(po_value).toLocaleString('en-IN') : 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #6b7280;">Approval Level</td>
              <td style="padding: 8px; font-weight: bold; color: #f59e0b;">${roleLabel}</td>
            </tr>
          </table>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${appUrl}/admin/purchase-orders?po=${po_id}" 
               style="background: #2563eb; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
              Review &amp; Approve →
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
            This is an automated notification from ProcureSaathi Procurement OS.
          </p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: "ProcureSaathi" },
        to: [{ email: approver_email }],
        subject: `🔒 PO Approval Required (${roleLabel}) — ${po_number || po_id}`,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Brevo error:", errText);
      return new Response(JSON.stringify({ error: "Email send failed", details: errText }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    await res.json();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PO Approval Email Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
