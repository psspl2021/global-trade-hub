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

      paymentStatus = statusData.order_status === "PAID" ? "paid" : statusData.order_status?.toLowerCase() || "pending";
      
      // Get payment details if paid
      if (paymentStatus === "paid") {
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

        if (paymentsData && paymentsData.length > 0) {
          cfPaymentId = paymentsData[0].cf_payment_id?.toString();
          paymentMethod = paymentsData[0].payment_method?.toString();
        }
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

    // If payment is successful, activate the subscription
    if (paymentStatus === "paid") {
      console.log("Activating email subscription for supplier:", paymentRecord.supplier_id);

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Update or insert supplier email quota
      const { error: quotaError } = await supabase
        .from("supplier_email_quotas")
        .upsert({
          supplier_id: paymentRecord.supplier_id,
          has_email_subscription: true,
          subscription_expires_at: expiresAt,
          monthly_emails_sent: 0,
          last_monthly_reset: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "supplier_id",
        });

      if (quotaError) {
        console.error("Error updating quota:", quotaError);
      } else {
        console.log("Email subscription activated successfully");
      }

      // Create notification for supplier
      await supabase.from("notifications").insert({
        user_id: paymentRecord.supplier_id,
        type: "subscription_activated",
        title: "Premium Email Subscription Activated!",
        message: "Your premium email subscription is now active. You can now receive up to 500 email notifications per month.",
        metadata: { order_id: orderId, expires_at: expiresAt },
      });
    }

    // If this was a GET request (return URL), redirect to dashboard
    if (orderIdFromQuery && req.method === "GET") {
      const redirectUrl = paymentStatus === "paid" 
        ? `${url.origin.replace('supabase.co/functions/v1/cashfree-webhook', 'lovable.app')}/dashboard?payment=success`
        : `${url.origin.replace('supabase.co/functions/v1/cashfree-webhook', 'lovable.app')}/dashboard?payment=failed`;
      
      // For now, return a simple HTML page that redirects
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Payment ${paymentStatus === "paid" ? "Successful" : "Failed"}</title>
          <script>
            window.location.href = window.location.origin.replace('hsybhjjtxdwtpfvcmoqk.supabase.co/functions/v1/cashfree-webhook', 'procuresaathi.com') + '/dashboard?payment=${paymentStatus === "paid" ? "success" : "failed"}';
          </script>
        </head>
        <body>
          <p>Redirecting to dashboard...</p>
          <p>Payment Status: ${paymentStatus === "paid" ? "Successful ✅" : "Failed ❌"}</p>
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
