import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderRequest {
  buyer_id: string;
  plan_id: string;
  customer_email: string;
  customer_phone: string;
  customer_name: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CASHFREE_APP_ID = Deno.env.get("CASHFREE_APP_ID");
    const CASHFREE_SECRET_KEY = Deno.env.get("CASHFREE_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      throw new Error("Cashfree credentials not configured");
    }

    const { buyer_id, plan_id, customer_email, customer_phone, customer_name }: CreateOrderRequest = await req.json();

    if (!buyer_id || !plan_id || !customer_email || !customer_phone) {
      throw new Error("Missing required fields");
    }

    // Normalize inputs
    const normalizedEmail = customer_email.trim().toLowerCase();
    const normalizedPhone = customer_phone.replace(/\D/g, "").slice(-10);
    const normalizedCompany = (customer_name || "").trim().toLowerCase();

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch plan details
    const { data: plan, error: planError } = await supabase
      .from("auction_pricing_plans")
      .select("*")
      .eq("id", plan_id)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      throw new Error("Invalid or inactive pricing plan");
    }

    // 🚨 Starter abuse prevention — normalized + safe
    if (plan.name.toLowerCase().includes("starter")) {
      const { data: existing } = await supabase
        .from("auction_credit_payments")
        .select("metadata")
        .eq("status", "paid")
        .or(
          `buyer_id.eq.${buyer_id},buyer_email.eq.${normalizedEmail},buyer_phone.eq.${normalizedPhone},buyer_company.eq.${normalizedCompany}`
        );

      const hasStarter = existing?.some((p: any) =>
        p.metadata?.plan_name?.toLowerCase().includes("starter")
      );

      if (hasStarter) {
        throw new Error("Starter plan already used. Please choose Pro or Enterprise pack.");
      }
    }

    // Calculate pricing
    const basePrice = Number(plan.price);
    const gstRate = Number(plan.gst_rate) || 0.18;
    const gstAmount = Math.round(basePrice * gstRate);
    const totalAmount = basePrice + gstAmount;

    const orderId = `AUC_CREDIT_${Date.now()}_${buyer_id.substring(0, 8)}`;

    // Create payment record with normalized buyer identity
    const { data: insertedPayment, error: dbError } = await supabase
      .from("auction_credit_payments")
      .insert({
        buyer_id,
        plan_id,
        order_id: orderId,
        amount: basePrice,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        currency: "INR",
        status: "pending",
        credits_purchased: plan.auctions_count,
        buyer_email: normalizedEmail,
        buyer_phone: normalizedPhone,
        buyer_company: normalizedCompany,
        metadata: {
          plan_name: plan.name,
          price_per_auction: plan.price_per_auction,
          gst_rate: gstRate,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      if (dbError.message.includes("duplicate")) {
        throw new Error("Starter plan already used. Please choose Pro or Enterprise pack.");
      }
      throw new Error("Failed to create payment record");
    }

    // Create Cashfree order
    const cashfreeUrl = "https://api.cashfree.com/pg/orders";

    const orderPayload = {
      order_id: orderId,
      order_amount: totalAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: buyer_id.substring(0, 30),
        customer_email,
        customer_phone: customer_phone.replace(/\D/g, "").slice(-10),
        customer_name: customer_name || "Buyer",
      },
      order_meta: {
        return_url: `${SUPABASE_URL}/functions/v1/cashfree-auction-credit-webhook?order_id=${orderId}`,
        notify_url: `${SUPABASE_URL}/functions/v1/cashfree-auction-credit-webhook`,
      },
      order_note: `ProcureSaathi ${plan.name} - ${plan.auctions_count} Auction Credits`,
    };

    console.log("Creating Cashfree auction credit order:", JSON.stringify(orderPayload));

    const response = await fetch(cashfreeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify(orderPayload),
    });

    const responseData = await response.json();
    console.log("Cashfree response:", JSON.stringify(responseData));

    if (!response.ok) {
      console.error("Cashfree API error:", responseData);
      throw new Error(responseData.message || "Failed to create Cashfree order");
    }

    // Update payment record with session ID
    await supabase
      .from("auction_credit_payments")
      .update({ payment_session_id: responseData.payment_session_id })
      .eq("order_id", orderId);

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderId,
        payment_session_id: responseData.payment_session_id,
        order_status: responseData.order_status,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error creating auction credit order:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
