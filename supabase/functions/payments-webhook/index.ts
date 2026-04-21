// Stripe webhook — activates / updates / cancels global_plan_subscriptions
// and queues admin alerts on important events.
import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const url = new URL(req.url);
  const env = (url.searchParams.get("env") || "sandbox") as StripeEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log("[stripe-webhook]", event.type, "env:", env);

    switch (event.type) {
      case "customer.subscription.created":
        await handleSubCreated(event.data.object, env);
        break;
      case "customer.subscription.updated":
        await handleSubUpdated(event.data.object, env);
        break;
      case "customer.subscription.deleted":
        await handleSubDeleted(event.data.object, env);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object, env);
        break;
      default:
        console.log("[stripe-webhook] unhandled:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[stripe-webhook] error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});

async function handleSubCreated(sub: any, env: StripeEnv) {
  const userId = sub.metadata?.userId;
  if (!userId) return;

  const item = sub.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const amount = (item?.price?.unit_amount || 0) / 100;
  const currency = (item?.price?.currency || "usd").toUpperCase();

  const start = sub.current_period_start;
  const end = sub.current_period_end;

  const { data: subRow } = await supabase
    .from("global_plan_subscriptions")
    .upsert(
      {
        user_id: userId,
        payment_provider: "stripe",
        currency,
        amount_paid: amount,
        status: sub.status === "trialing" ? "active" : sub.status,
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer,
        stripe_price_id: priceId,
        environment: env,
        current_period_start: start ? new Date(start * 1000).toISOString() : null,
        current_period_end: end ? new Date(end * 1000).toISOString() : null,
        auto_renew: true,
        cancel_at_period_end: sub.cancel_at_period_end || false,
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" }
    )
    .select()
    .single();

  await supabase.from("subscription_admin_alerts").insert({
    alert_type: "activation",
    user_id: userId,
    subscription_id: subRow?.id,
    payload: { provider: "stripe", currency, amount, env },
  });
}

async function handleSubUpdated(sub: any, env: StripeEnv) {
  const start = sub.current_period_start;
  const end = sub.current_period_end;

  await supabase
    .from("global_plan_subscriptions")
    .update({
      status: sub.status,
      current_period_start: start ? new Date(start * 1000).toISOString() : null,
      current_period_end: end ? new Date(end * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", sub.id)
    .eq("environment", env);
}

async function handleSubDeleted(sub: any, env: StripeEnv) {
  const { data: subRow } = await supabase
    .from("global_plan_subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", sub.id)
    .eq("environment", env)
    .select()
    .single();

  if (subRow) {
    await supabase.from("subscription_admin_alerts").insert({
      alert_type: "cancellation",
      user_id: subRow.user_id,
      subscription_id: subRow.id,
      payload: { provider: "stripe", env, period_end: subRow.current_period_end },
    });
  }
}

async function handlePaymentFailed(invoice: any, env: StripeEnv) {
  const subId = invoice.subscription;
  if (!subId) return;
  const { data: subRow } = await supabase
    .from("global_plan_subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subId)
    .eq("environment", env)
    .select()
    .single();
  if (subRow) {
    await supabase.from("subscription_admin_alerts").insert({
      alert_type: "renewal_failed",
      user_id: subRow.user_id,
      subscription_id: subRow.id,
      payload: { provider: "stripe", env, invoice_id: invoice.id },
    });
  }
}
