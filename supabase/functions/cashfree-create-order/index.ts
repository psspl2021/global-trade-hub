import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderRequest {
  supplier_id: string;
  customer_email: string;
  customer_phone: string;
  customer_name: string;
}

serve(async (req) => {
  // Handle CORS preflight
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

    const { supplier_id, customer_email, customer_phone, customer_name }: CreateOrderRequest = await req.json();

    if (!supplier_id || !customer_email || !customer_phone) {
      throw new Error("Missing required fields: supplier_id, customer_email, customer_phone");
    }

    // Generate unique order ID
    const orderId = `EMAIL_SUB_${Date.now()}_${supplier_id.substring(0, 8)}`;

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Create payment record in database
    const { error: dbError } = await supabase
      .from("email_subscription_payments")
      .insert({
        supplier_id,
        order_id: orderId,
        amount: 300,
        currency: "INR",
        status: "pending",
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to create payment record");
    }

    // Cashfree API endpoint (use sandbox for testing, production for live)
    const cashfreeUrl = "https://api.cashfree.com/pg/orders"; // Production
    // const cashfreeUrl = "https://sandbox.cashfree.com/pg/orders"; // Sandbox

    const orderPayload = {
      order_id: orderId,
      order_amount: 300,
      order_currency: "INR",
      customer_details: {
        customer_id: supplier_id.substring(0, 30),
        customer_email: customer_email,
        customer_phone: customer_phone.replace(/\D/g, "").slice(-10),
        customer_name: customer_name || "Supplier",
      },
      order_meta: {
        return_url: `${SUPABASE_URL}/functions/v1/cashfree-webhook?order_id=${orderId}`,
        notify_url: `${SUPABASE_URL}/functions/v1/cashfree-webhook`,
      },
      order_note: "ProcureSaathi Email Subscription - 500 emails/month",
    };

    console.log("Creating Cashfree order:", JSON.stringify(orderPayload));

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
      .from("email_subscription_payments")
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
    console.error("Error creating order:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
