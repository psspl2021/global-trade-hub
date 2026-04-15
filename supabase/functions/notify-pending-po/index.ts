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

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");

    if (!brevoApiKey || !senderEmail) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all completed auctions without POs that need notification
    const { data: pendingAuctions, error: fetchError } = await supabase
      .rpc("get_pending_po_auctions");

    if (fetchError) {
      console.error("Failed to fetch pending auctions:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingAuctions || pendingAuctions.length === 0) {
      return new Response(JSON.stringify({ message: "No pending PO auctions found", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalSent = 0;
    const appUrl = "https://procuresaathi.lovable.app";

    for (const auction of pendingAuctions) {
      const approvers = auction.approver_emails;
      if (!approvers || !Array.isArray(approvers) || approvers.length === 0) {
        console.log(`No approvers found for auction ${auction.auction_id}, skipping`);
        continue;
      }

      const auctionEndDate = new Date(auction.auction_end).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
      const daysPending = Math.floor(
        (Date.now() - new Date(auction.auction_end).getTime()) / (1000 * 60 * 60 * 24)
      );

      for (const approver of approvers) {
        const roleLabel = approver.role === 'buyer_ceo' ? 'CEO' :
                          approver.role === 'buyer_cfo' ? 'CFO' : 'Manager';

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #dc2626; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: #ffffff; margin: 0;">⚠️ Action Required: PO Not Created</h2>
            </div>
            <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb;">
              <p style="color: #374151; font-size: 16px;">
                Dear <strong>${approver.name || roleLabel}</strong>,
              </p>
              <p style="color: #374151; font-size: 14px;">
                A reverse auction has been completed but the Purchase Order has <strong>not been created yet</strong>.
                This requires your immediate attention.
              </p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Auction</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${auction.auction_title}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Winning Price</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">₹${Number(auction.winning_price).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Auction Ended</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${auctionEndDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; color: #6b7280;">Days Pending</td>
                  <td style="padding: 8px; font-weight: bold; color: #dc2626;">${daysPending} day(s)</td>
                </tr>
              </table>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${appUrl}/dashboard?view=reverse-auction&auction=${auction.auction_id}" 
                   style="background: #2563eb; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                  Review Auction &amp; Create PO →
                </a>
              </div>
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
                This is an automated governance notification from ProcureSaathi Procurement OS.
              </p>
            </div>
          </div>
        `;

        try {
          const res = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
              "api-key": brevoApiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sender: { email: senderEmail, name: "ProcureSaathi" },
              to: [{ email: approver.email }],
              subject: `⚠️ PO Pending (${daysPending}d) — ${auction.auction_title}`,
              htmlContent,
            }),
          });

          if (res.ok) {
            totalSent++;
            console.log(`Notification sent to ${approver.email} for auction ${auction.auction_id}`);
          } else {
            const errText = await res.text();
            console.error(`Brevo error for ${approver.email}:`, errText);
          }
        } catch (emailErr) {
          console.error(`Email send error for ${approver.email}:`, emailErr);
        }
      }

      // Record notification to prevent duplicate reminders
      await supabase.from("po_pending_notifications").upsert({
        auction_id: auction.auction_id,
        buyer_company_id: auction.buyer_company_id,
        last_notified_at: new Date().toISOString(),
        notification_count: 1,
      }, { onConflict: "auction_id" });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      auctions_found: pendingAuctions.length,
      emails_sent: totalSent 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Pending PO Notification Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
