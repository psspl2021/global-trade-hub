import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  type: "new_bid" | "new_requirement" | "bid_accepted" | "document_verified" | "new_logistics_requirement" | "referral_reward";
  data: Record<string, any>;
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
      return `
        <div style="${baseStyles}">
          <h1 style="color: #1e40af;">New Requirement in Your Category! 📦</h1>
          <p>A new requirement matching your product categories has been posted.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Title:</strong> ${data.requirement_title}</p>
            <p><strong>Category:</strong> ${data.category}</p>
            <p><strong>Quantity:</strong> ${data.quantity} ${data.unit}</p>
            <p><strong>Location:</strong> ${data.location}</p>
            <p><strong>Deadline:</strong> ${data.deadline}</p>
          </div>
          <p>Be the first to submit a competitive bid!</p>
          <a href="https://procuresaathi.lovable.app/browse" style="${buttonStyle}">Submit Bid</a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This email was sent by ProcureSaathi. If you have any questions, please contact our support team.
          </p>
        </div>
      `;

    case "bid_accepted":
      return `
        <div style="${baseStyles}">
          <h1 style="color: #16a34a;">Congratulations! Your Bid Was Accepted! 🎊</h1>
          <p>Your bid has been accepted by the buyer.</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #86efac;">
            <p><strong>Requirement:</strong> ${data.requirement_title}</p>
            <p><strong>Your Bid:</strong> ₹${data.bid_amount?.toLocaleString('en-IN')}</p>
            <p><strong>Buyer:</strong> ${data.buyer_name}</p>
          </div>
          <p>Please proceed with the order fulfillment as per the agreed terms.</p>
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
    const { to, subject, type, data }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to ${to}`);

    const html = getEmailTemplate(type, data);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ProcureSaathi <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Resend API error: ${errorText}`);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

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
