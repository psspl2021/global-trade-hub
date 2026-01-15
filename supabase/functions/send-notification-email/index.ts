import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const BREVO_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL") ?? "noreply@procuresaathi.com";
const BREVO_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") ?? "ProcureSaathi";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  type: "new_bid" | "new_requirement" | "bid_accepted" | "document_verified" | "new_logistics_requirement" | "referral_reward";
  data: Record<string, any>;
  supplier_id?: string;
  buyer_id?: string;
  logistics_partner_id?: string;
  requirement_id?: string;
  logistics_requirement_id?: string;
}

const getEmailTemplate = (type: string, data: Record<string, any>): string => {
  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
  `;

  const buttonStyle = `
    display: inline-block;
    padding: 12px 24px;
    background-color: #2563eb;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
  `;

  switch (type) {
    case "new_bid":
      return `
        <div style="${baseStyles}">
          <h1 style="color: #1e40af;">New Bid Received! 🎉</h1>
          <p>Great news! You've received a new bid on your requirement.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Requirement:</strong> ${data.requirement_title}</p>
            <p><strong>Bid Amount:</strong> ₹${data.bid_amount?.toLocaleString('en-IN')}</p>
            <p><strong>Supplier:</strong> ${data.supplier_name}</p>
            <p><strong>Delivery Timeline:</strong> ${data.delivery_days} days</p>
          </div>
          <p>Login to your dashboard to review and accept the bid.</p>
          <a href="https://procuresaathi.lovable.app/dashboard" style="${buttonStyle}">View Bid</a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This email was sent by ProcureSaathi. If you have any questions, please contact our support team.
          </p>
        </div>
      `;

    case "new_requirement":
      const formattedDeadline = data.deadline ? new Date(data.deadline).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'Not specified';
      
      return `
        <div style="${baseStyles}">
          <h1 style="color: #1e40af;">New Requirement in Your Category! 📦</h1>
          <p>A new requirement matching your product categories has been posted. Act fast to submit your bid!</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1e40af; margin-top: 0; font-size: 18px;">${data.requirement_title}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; width: 40%;"><strong>Category:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${data.category}</td>
              </tr>
              ${data.items ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Items:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${data.items}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Quantity:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${typeof data.quantity === 'number' ? data.quantity.toFixed(2) : data.quantity} ${data.unit}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Delivery Location:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${data.location}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Last Date to Respond:</strong></td>
                <td style="padding: 8px 0; color: #dc2626; font-weight: 600;">${formattedDeadline}</td>
              </tr>
            </table>
          </div>
          
          <p style="background: #fef3c7; padding: 12px; border-radius: 6px; border-left: 4px solid #f59e0b;">
            ⏰ <strong>Don't miss out!</strong> Submit your bid before the deadline to secure this opportunity.
          </p>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://procuresaathi.lovable.app/browse${data.requirement_id ? `?id=${data.requirement_id}` : ''}" style="${buttonStyle}">View Requirement & Submit Bid</a>
          </div>
          
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            You're receiving this email because you've opted in to receive notifications for new requirements in your selected categories.
            <br><br>
            To manage your notification preferences, log in to your dashboard and visit Profile Settings.
            <br><br>
            This email was sent by ProcureSaathi. If you have any questions, please contact our support team.
          </p>
        </div>
      `;

    case "bid_accepted":
      return `
        <div style="${baseStyles}">
          <h1 style="color: #16a34a;">Congratulations! You've Been Assigned! 🎊</h1>
          <p>ProcureSaathi has selected you as the fulfillment partner for this requirement.</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #86efac;">
            <p><strong>Requirement:</strong> ${data.requirement_title}</p>
            <p><strong>Your Offer:</strong> ₹${data.bid_amount?.toLocaleString('en-IN')}</p>
            <p><strong>Order Managed By:</strong> ProcureSaathi</p>
          </div>
          <p>Please proceed with order fulfillment as per the agreed terms. ProcureSaathi will coordinate delivery.</p>
          <a href="https://procuresaathi.lovable.app/dashboard" style="${buttonStyle}">View Details</a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This email was sent by ProcureSaathi. If you have any questions, please contact our support team.
          </p>
        </div>
      `;

    case "document_verified":
      return `
        <div style="${baseStyles}">
          <h1 style="color: #16a34a;">Document Verified! ✅</h1>
          <p>Your document has been verified successfully.</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #86efac;">
            <p><strong>Document Type:</strong> ${data.document_type}</p>
            <p><strong>Verified On:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
          <p>You can now start bidding on logistics requirements!</p>
          <a href="https://procuresaathi.lovable.app/dashboard" style="${buttonStyle}">Go to Dashboard</a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This email was sent by ProcureSaathi. If you have any questions, please contact our support team.
          </p>
        </div>
      `;

    case "new_logistics_requirement":
      return `
        <div style="${baseStyles}">
          <h1 style="color: #1e40af;">New Logistics Requirement on Your Route! 🚛</h1>
          <p>A new logistics requirement matching your routes has been posted.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Title:</strong> ${data.requirement_title}</p>
            <p><strong>Pickup:</strong> ${data.pickup_location}</p>
            <p><strong>Delivery:</strong> ${data.delivery_location}</p>
            <p><strong>Material:</strong> ${data.material_type}</p>
            <p><strong>Quantity:</strong> ${data.quantity} ${data.unit}</p>
          </div>
          <p>Submit your bid now!</p>
          <a href="https://procuresaathi.lovable.app/book-truck" style="${buttonStyle}">Submit Bid</a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This email was sent by ProcureSaathi. If you have any questions, please contact our support team.
          </p>
        </div>
      `;

    case "referral_reward":
      return `
        <div style="${baseStyles}">
          <h1 style="color: #7c3aed;">Referral Reward Earned! 🎁</h1>
          <p>Great news! Your referred user just had their bid accepted.</p>
          <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #c4b5fd;">
            <p><strong>Reward:</strong> 1 Free Premium Bid</p>
            <p><strong>Your New Balance:</strong> Check your dashboard</p>
          </div>
          <p>Keep referring to earn more rewards!</p>
          <a href="https://procuresaathi.lovable.app/dashboard" style="${buttonStyle}">View Dashboard</a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This email was sent by ProcureSaathi. If you have any questions, please contact our support team.
          </p>
        </div>
      `;

    default:
      return `
        <div style="${baseStyles}">
          <h1>Notification from ProcureSaathi</h1>
          <p>${JSON.stringify(data)}</p>
        </div>
      `;
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, type, data, supplier_id, buyer_id, logistics_partner_id, requirement_id, logistics_requirement_id }: EmailRequest = await req.json();

    // Determine user_id and user_type for logging
    const user_id = supplier_id || buyer_id || logistics_partner_id;
    const user_type = supplier_id ? 'supplier' : buyer_id ? 'buyer' : logistics_partner_id ? 'logistics_partner' : null;

    console.log(`Sending ${type} email to ${to} (user_type: ${user_type})`);

    const html = getEmailTemplate(type, data);

    // Send via Brevo API
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY || "",
      },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    console.log(`Brevo response status: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Brevo API error:", errorText);
      throw new Error(`Brevo API error: ${errorText}`);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    // Log the email in our database if user_id is provided
    if (user_id && emailResponse.messageId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { error: logError } = await supabase.from("supplier_email_logs").insert({
          supplier_id: supplier_id || user_id, // Keep backward compatibility
          user_id: user_id,
          user_type: user_type,
          requirement_id: requirement_id || null,
          logistics_requirement_id: logistics_requirement_id || null,
          brevo_message_id: emailResponse.messageId,
          recipient_email: to,
          subject,
          email_type: type,
          status: "sent",
          sent_at: new Date().toISOString(),
        });

        if (logError) {
          console.error("Error inserting email log:", logError);
        } else {
          console.log(`Email logged for ${user_type} ${user_id}`);
        }

        // Update email quota for suppliers only (buyers and logistics partners don't have quotas)
        if (supplier_id) {
          const { error: quotaError } = await supabase.rpc('check_and_increment_email_quota', {
            p_supplier_id: supplier_id
          });

          if (quotaError) {
            console.error("Error updating email quota:", quotaError);
          }
        }
      } catch (logError) {
        console.error("Error logging email:", logError);
        // Don't fail the request if logging fails
      }
    }

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
