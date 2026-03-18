import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const CASHFREE_APP_ID = Deno.env.get("CASHFREE_APP_ID");
    const CASHFREE_SECRET_KEY = Deno.env.get("CASHFREE_SECRET_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const url = new URL(req.url);
    const orderIdFromQuery = url.searchParams.get("order_id");

    let orderId: string;
    let paymentStatus = "pending";
    let cfPaymentId: string | null = null;
    let paymentMethod: string | null = null;

    if (orderIdFromQuery && req.method === "GET") {
      orderId = orderIdFromQuery;
      console.log("Auction credit - Return URL for order:", orderId);

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
        if (paymentsData?.length > 0) {
          cfPaymentId = paymentsData[0].cf_payment_id?.toString();
          paymentMethod = paymentsData[0].payment_method?.toString();
        }
      }
    } else {
      const payload = await req.json();
      console.log("Auction credit webhook payload:", JSON.stringify(payload));

      orderId = payload.data?.order?.order_id || payload.order_id;
      paymentStatus = payload.data?.payment?.payment_status?.toLowerCase() ||
        payload.data?.order?.order_status?.toLowerCase() || "pending";
      cfPaymentId = payload.data?.payment?.cf_payment_id?.toString();
      paymentMethod = payload.data?.payment?.payment_method;
      if (paymentStatus === "success") paymentStatus = "paid";
    }

    if (!orderId) throw new Error("Order ID not found");

    console.log(`Processing auction credit order ${orderId} status=${paymentStatus}`);

    // Get payment record
    const { data: paymentRecord, error: fetchError } = await supabase
      .from("auction_credit_payments")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (fetchError || !paymentRecord) {
      throw new Error("Payment record not found");
    }

    // Idempotency check
    if (paymentRecord.credits_credited && paymentStatus === "paid") {
      console.log("Credits already credited, skipping...");
      if (orderIdFromQuery && req.method === "GET") {
        return redirectResponse("success");
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
      updated_at: new Date().toISOString(),
    };
    if (paymentStatus === "paid") {
      updateData.paid_at = new Date().toISOString();
    }

    await supabase
      .from("auction_credit_payments")
      .update(updateData)
      .eq("order_id", orderId);

    // Credit auction credits on successful payment
    if (paymentStatus === "paid" && !paymentRecord.credits_credited) {
      const creditsToAdd = paymentRecord.credits_purchased;
      console.log(`Crediting ${creditsToAdd} auction credits to buyer ${paymentRecord.buyer_id}`);

      // Check existing credits
      const { data: existingCredits } = await supabase
        .from("buyer_auction_credits")
        .select("*")
        .eq("buyer_id", paymentRecord.buyer_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingCredits) {
        // Add to existing balance
        await supabase
          .from("buyer_auction_credits")
          .update({
            total_credits: (existingCredits.total_credits || 0) + creditsToAdd,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingCredits.id);
      } else {
        // Create new credits record
        await supabase
          .from("buyer_auction_credits")
          .insert({
            buyer_id: paymentRecord.buyer_id,
            total_credits: creditsToAdd,
            used_credits: 0,
            plan_id: paymentRecord.plan_id,
            payment_order_id: orderId,
          });
      }

      // Mark credits as credited
      await supabase
        .from("auction_credit_payments")
        .update({ credits_credited: true })
        .eq("order_id", orderId);

      // Create notification
      const planName = paymentRecord.metadata?.plan_name || "Auction Pack";
      await supabase.from("notifications").insert({
        user_id: paymentRecord.buyer_id,
        type: "auction_credits_purchased",
        title: `${planName} Activated! 🎉`,
        message: `${creditsToAdd} auction credits have been added to your account.`,
        metadata: { order_id: orderId, credits: creditsToAdd },
      });

      // Generate invoice
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("contact_person, company_name, email, phone, address, gstin, state")
          .eq("id", paymentRecord.buyer_id)
          .single();

        if (profile) {
          await fetch(`${SUPABASE_URL}/functions/v1/generate-payment-invoice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payment_type: "auction_credits",
              payment_id: orderId,
              user_id: paymentRecord.buyer_id,
              amount: paymentRecord.amount,
              tax_amount: paymentRecord.gst_amount,
              total_amount: paymentRecord.total_amount,
              description: `${planName} - ${creditsToAdd} Auction Credits`,
              customer_name: profile.company_name || profile.contact_person,
              customer_email: profile.email,
              customer_phone: profile.phone,
              customer_address: profile.address,
              customer_gstin: profile.gstin,
              customer_state: profile.state,
              metadata: { plan_name: planName, credits: creditsToAdd },
            }),
          });
        }
      } catch (invoiceError) {
        console.error("Invoice generation error:", invoiceError);
      }
    }

    // Redirect if GET
    if (orderIdFromQuery && req.method === "GET") {
      const status = paymentStatus === "paid" ? "success" : "failed";
      return redirectResponse(status);
    }

    return new Response(
      JSON.stringify({ success: true, status: paymentStatus }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Auction credit webhook error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

function redirectResponse(status: string) {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Payment</title>
<script>window.location.href = window.location.origin.replace('hsybhjjtxdwtpfvcmoqk.supabase.co/functions/v1/cashfree-auction-credit-webhook', 'procuresaathi.com') + '/buyer?auction_payment=${status}';</script>
</head><body><p>Redirecting...</p></body></html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html", ...corsHeaders },
  });
}
