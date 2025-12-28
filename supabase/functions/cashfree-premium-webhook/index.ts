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
      console.log("Premium Pack - Return URL redirect for order:", orderId);

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
      console.log("Premium Pack - Cashfree webhook payload:", JSON.stringify(payload));

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

    console.log(`Processing premium order ${orderId} with status ${paymentStatus}`);

    // Get the payment record
    const { data: paymentRecord, error: fetchError } = await supabase
      .from("premium_bid_payments")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (fetchError || !paymentRecord) {
      console.error("Premium payment record not found:", fetchError);
      throw new Error("Payment record not found");
    }

    // Check if already credited (idempotency)
    if (paymentRecord.bids_credited && paymentStatus === "paid") {
      console.log("Bids already credited for this order, skipping...");
      
      if (orderIdFromQuery && req.method === "GET") {
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Payment Successful</title>
            <script>
              window.location.href = window.location.origin.replace('hsybhjjtxdwtpfvcmoqk.supabase.co/functions/v1/cashfree-premium-webhook', 'procuresaathi.com') + '/dashboard?premium_payment=success';
            </script>
          </head>
          <body>
            <p>Redirecting to dashboard...</p>
            <p>Payment Status: Successful ✅</p>
          </body>
          </html>
        `;
        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html", ...corsHeaders },
        });
      }
      
      return new Response(
        JSON.stringify({ success: true, status: "already_processed" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update payment record
    const updateData: any = {
      status: paymentStatus,
      cf_payment_id: cfPaymentId,
      payment_method: paymentMethod,
    };

    if (paymentStatus === "paid") {
      updateData.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("premium_bid_payments")
      .update(updateData)
      .eq("order_id", orderId);

    if (updateError) {
      console.error("Error updating payment record:", updateError);
    }

    // If payment is successful, credit the premium bids
    if (paymentStatus === "paid" && !paymentRecord.bids_credited) {
      console.log("Crediting premium bids for user:", paymentRecord.user_id);

      const bidsToCredit = paymentRecord.bids_purchased || 50;
      const userType = paymentRecord.metadata?.user_type || 'supplier';

      // Get current subscription
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("id, premium_bids_balance")
        .eq("user_id", paymentRecord.user_id)
        .single();

      if (subscription) {
        // Update existing subscription
        const newBalance = (subscription.premium_bids_balance || 0) + bidsToCredit;
        
        const { error: subError } = await supabase
          .from("subscriptions")
          .update({ 
            premium_bids_balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq("id", subscription.id);

        if (subError) {
          console.error("Error updating subscription:", subError);
        } else {
          console.log(`Added ${bidsToCredit} premium bids. New balance: ${newBalance}`);
        }
      } else {
        // Create new subscription
        const { error: createError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: paymentRecord.user_id,
            tier: 'free',
            bids_limit: 5,
            premium_bids_balance: bidsToCredit,
          });

        if (createError) {
          console.error("Error creating subscription:", createError);
        } else {
          console.log(`Created subscription with ${bidsToCredit} premium bids`);
        }
      }

      // Mark as credited
      await supabase
        .from("premium_bid_payments")
        .update({ bids_credited: true })
        .eq("order_id", orderId);

      // Create notification for user
      const itemType = userType === 'logistics_partner' ? 'quotes' : 'bids';
      await supabase.from("notifications").insert({
        user_id: paymentRecord.user_id,
        type: "premium_bids_purchased",
        title: "Premium Pack Activated! 🎉",
        message: `Your ${bidsToCredit} premium ${itemType} have been credited to your account. They never expire - use them anytime!`,
        metadata: { order_id: orderId, bids_credited: bidsToCredit },
      });

      // Generate and send invoice
      try {
        // Get user profile for invoice details
        const { data: profile } = await supabase
          .from("profiles")
          .select("contact_person, company_name, email, phone, address, gstin, state")
          .eq("id", paymentRecord.user_id)
          .single();

        if (profile) {
          const basePrice = paymentRecord.metadata?.base_price || 24950;
          const gstAmount = paymentRecord.metadata?.gst_amount || Math.round(basePrice * 0.18);
          const transactionFee = paymentRecord.metadata?.transaction_fee || 0;
          
          const invoiceResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/generate-payment-invoice`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                payment_type: "premium_pack",
                payment_id: orderId,
                user_id: paymentRecord.user_id,
                amount: basePrice,
                tax_amount: gstAmount,
                total_amount: paymentRecord.amount,
                description: `Premium Pack - ${bidsToCredit} Lifetime ${itemType.charAt(0).toUpperCase() + itemType.slice(1)} (₹499 per ${userType === 'logistics_partner' ? 'quote' : 'bid'})`,
                customer_name: profile.company_name || profile.contact_person,
                customer_email: profile.email,
                customer_phone: profile.phone,
                customer_address: profile.address,
                customer_gstin: profile.gstin,
                customer_state: profile.state,
                metadata: {
                  bids_purchased: bidsToCredit,
                  user_type: userType,
                  transaction_fee: transactionFee,
                },
              }),
            }
          );

          const invoiceResult = await invoiceResponse.json();
          console.log("Invoice generation result:", invoiceResult);
        }
      } catch (invoiceError) {
        console.error("Error generating invoice:", invoiceError);
        // Don't fail the webhook if invoice generation fails
      }
    }

    // If this was a GET request (return URL), redirect to dashboard
    if (orderIdFromQuery && req.method === "GET") {
      const status = paymentStatus === "paid" ? "success" : "failed";
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Payment ${paymentStatus === "paid" ? "Successful" : "Failed"}</title>
          <script>
            window.location.href = window.location.origin.replace('hsybhjjtxdwtpfvcmoqk.supabase.co/functions/v1/cashfree-premium-webhook', 'procuresaathi.com') + '/dashboard?premium_payment=${status}';
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
    console.error("Premium webhook error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
