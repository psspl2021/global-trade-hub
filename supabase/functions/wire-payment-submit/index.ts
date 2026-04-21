// Buyer-submitted wire/SWIFT payment claim. Inserts a wire_payment_intents row
// and queues an admin alert. Reconciliation is manual via admin dashboard.
import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader || "");
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { amount, currency, reference_number, proof_url, notes, buyer_company } = await req.json();
    if (!amount || amount <= 0 || !currency) {
      return new Response(JSON.stringify({ error: "Invalid amount or currency" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: intent, error } = await supabase
      .from("wire_payment_intents")
      .insert({
        user_id: user.id,
        buyer_email: user.email,
        buyer_company,
        amount,
        currency: currency.toUpperCase(),
        reference_number,
        proof_url,
        notes,
        status: "submitted",
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from("subscription_admin_alerts").insert({
      alert_type: "wire_received",
      user_id: user.id,
      wire_intent_id: intent.id,
      payload: { amount, currency, reference_number, buyer_email: user.email },
    });

    return new Response(JSON.stringify({ success: true, intent_id: intent.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
