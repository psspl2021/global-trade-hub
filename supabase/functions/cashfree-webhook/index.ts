import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const CASHFREE_APP_ID = Deno.env.get("CASHFREE_APP_ID");
    const CASHFREE_SECRET_KEY = Deno.env.get("CASHFREE_SECRET_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Check if this is a return URL redirect (GET with order_id)
    const url = new URL(req.url);
    const orderIdFromQuery = url.searchParams.get("order_id");

    let orderId: string;
    let paymentStatus: string = "pending";
    let cfPaymentId: string | null = null;
    let paymentMethod: string | null = null;

    if (orderIdFromQuery && req.method === "GET") {
      // This is a return URL redirect - verify payment status with Cashfree
      orderId = orderIdFromQuery;
      console.log("Return URL redirect for order:", orderId);

      // Fetch order status from Cashfree
      const statusResponse = await fetch(
        `https://api.cashfree.com/pg/orders/${orderId}`,
        {
          method: "GET",
          headers: {
            "x-client-id": CASHFREE_APP_ID!,
            "x-client-secret": CASHFREE_SECRET_KEY!,
            "x-api-version": "2023-08-01",
          },
        }
      );

      const statusData = await statusResponse.json();
      console.log("Cashfree order status:", JSON.stringify(statusData));

      // Get payment details to check actual payment status
      const paymentsResponse = await fetch(
        `https://api.cashfree.com/pg/orders/${orderId}/payments`,
        {
          method: "GET",
          headers: {
            "x-client-id": CASHFREE_APP_ID!,
            "x-client-secret": CASHFREE_SECRET_KEY!,
            "x-api-version": "2023-08-01",
          },
        }
      );

      const paymentsData = await paymentsResponse.json();
      console.log("Payment details:", JSON.stringify(paymentsData));

      // Check if any payment is successful
      if (paymentsData && Array.isArray(paymentsData) && paymentsData.length > 0) {
        const successfulPayment = paymentsData.find(
          (p: any) => p.payment_status === "SUCCESS"
        );
        if (successfulPayment) {
          paymentStatus = "paid";
          cfPaymentId = successfulPayment.cf_payment_id?.toString();
          paymentMethod = successfulPayment.payment_method?.toString();
        } else {
          // Check for pending or active payments
          const pendingPayment = paymentsData.find(
            (p: any) => p.payment_status === "PENDING" || p.payment_status === "NOT_ATTEMPTED"
          );
          if (pendingPayment) {
            paymentStatus = "pending";
          } else {
            paymentStatus = statusData.order_status === "PAID" ? "paid" : statusData.order_status?.toLowerCase() || "pending";
          }
        }
      } else {
        // No payments yet, check order status
        paymentStatus = statusData.order_status === "PAID" ? "paid" : 
                       statusData.order_status === "ACTIVE" ? "pending" : 
                       statusData.order_status?.toLowerCase() || "pending";
      }
    } else {
      // This is a webhook POST from Cashfree
      const payload = await req.json();
      console.log("Cashfree webhook payload:", JSON.stringify(payload));

      orderId = payload.data?.order?.order_id || payload.order_id;
      paymentStatus = payload.data?.payment?.payment_status?.toLowerCase() || 
                     payload.data?.order?.order_status?.toLowerCase() || 
                     "pending";
      cfPaymentId = payload.data?.payment?.cf_payment_id?.toString();
      paymentMethod = payload.data?.payment?.payment_method;

      if (paymentStatus === "success") paymentStatus = "paid";
    }

    if (!orderId) {
      throw new Error("Order ID not found in request");
    }

    console.log(`Processing order ${orderId} with status ${paymentStatus}`);

    // Get the payment record
    const { data: paymentRecord, error: fetchError } = await supabase
      .from("email_subscription_payments")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (fetchError || !paymentRecord) {
      console.error("Payment record not found:", fetchError);
      throw new Error("Payment record not found");
    }

    // Update payment record
    const updateData: any = {
      status: paymentStatus,
      cf_payment_id: cfPaymentId,
      payment_method: paymentMethod,
    };

    if (paymentStatus === "paid") {
      updateData.paid_at = new Date().toISOString();
      updateData.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    }

    const { error: updateError } = await supabase
      .from("email_subscription_payments")
      .update(updateData)
      .eq("order_id", orderId);

    if (updateError) {
      console.error("Error updating payment record:", updateError);
    }

    // If payment is successful, credit the 200-email pack (count-based, no expiry)
    if (paymentStatus === "paid") {
      console.log("Crediting email pack for supplier:", paymentRecord.supplier_id);

      const EMAILS_PER_PACK = 200;

      const { error: packError } = await supabase.rpc("activate_email_pack", {
        p_supplier_id: paymentRecord.supplier_id,
        p_emails_to_add: EMAILS_PER_PACK,
        p_order_id: orderId,
      });

      if (packError) {
        console.error("Error crediting email pack:", packError);
      } else {
        console.log("Email pack credited successfully");
      }

      // Create notification for supplier
      await supabase.from("notifications").insert({
        user_id: paymentRecord.supplier_id,
        type: "email_pack_activated",
        title: "Premium Email Pack Activated!",
        message:
          "Your 200-email premium pack is now active. No time expiry — valid until all 200 emails are consumed. Covers both forward RFQs and reverse auctions.",
        metadata: { order_id: orderId, emails_credited: EMAILS_PER_PACK },
      });

      // Generate and send invoice
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("contact_person, company_name, email, phone, address, gstin, state")
          .eq("id", paymentRecord.supplier_id)
          .single();

        if (profile) {
          // ₹500 pack: base ≈ ₹423.73 → GST 18% → total ₹500
          const totalAmount = 500;
          const basePrice = Math.round((totalAmount / 1.18) * 100) / 100; // 423.73
          const gstAmount = Math.round((totalAmount - basePrice) * 100) / 100; // 76.27

          const invoiceResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/generate-payment-invoice`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                payment_type: "email_pack",
                payment_id: orderId,
                user_id: paymentRecord.supplier_id,
                amount: basePrice,
                tax_amount: gstAmount,
                total_amount: totalAmount,
                description:
                  "Premium Email Pack — 200 Emails (No Time Expiry, Forward RFQs + Reverse Auctions)",
                customer_name: profile.company_name || profile.contact_person,
                customer_email: profile.email,
                customer_phone: profile.phone,
                customer_address: profile.address,
                customer_gstin: profile.gstin,
                customer_state: profile.state,
                metadata: {
                  pack_type: "email_200_lifetime",
                  emails_included: EMAILS_PER_PACK,
                  expiry: "none",
                  scope: "forward_and_reverse_auctions",
                },
              }),
            }
          );

          const invoiceResult = await invoiceResponse.json();
          console.log("Invoice generation result:", invoiceResult);
        }
      } catch (invoiceError) {
        console.error("Error generating invoice:", invoiceError);
      }
    }

    // If this was a GET request (return URL), redirect to dashboard
    if (orderIdFromQuery && req.method === "GET") {
      // Determine the redirect status
      let redirectStatus = "failed";
      let statusMessage = "Failed ❌";
      
      if (paymentStatus === "paid") {
        redirectStatus = "success";
        statusMessage = "Successful ✅";
      } else if (paymentStatus === "pending" || paymentStatus === "active") {
        redirectStatus = "pending";
        statusMessage = "Processing... ⏳";
      }
      
      // For now, return a simple HTML page that redirects
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Payment ${statusMessage}</title>
          <script>
            window.location.href = window.location.origin.replace('hsybhjjtxdwtpfvcmoqk.supabase.co/functions/v1/cashfree-webhook', 'procuresaathi.com') + '/dashboard?payment=${redirectStatus}';
          </script>
        </head>
        <body>
          <p>Redirecting to dashboard...</p>
          <p>Payment Status: ${statusMessage}</p>
        </body>
        </html>
      `;
      
      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({ success: true, status: paymentStatus }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
