import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrevoWebhookEvent {
  event: string;
  email: string;
  id: number;
  date: string;
  ts: number;
  "message-id": string;
  ts_event: number;
  subject?: string;
  tag?: string;
  sending_ip?: string;
  ts_epoch?: number;
  reason?: string;
  link?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const event: BrevoWebhookEvent = await req.json();
    console.log("Brevo webhook received:", JSON.stringify(event));

    const messageId = event["message-id"];
    if (!messageId) {
      console.log("No message-id in webhook event");
      return new Response(JSON.stringify({ success: true, message: "No message-id" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Map Brevo events to our status fields
    const updateData: Record<string, any> = {};
    const eventTime = new Date(event.ts_event * 1000).toISOString();

    switch (event.event) {
      case "delivered":
        updateData.status = "delivered";
        updateData.delivered_at = eventTime;
        break;
      case "opened":
      case "unique_opened":
        updateData.opened_at = eventTime;
        updateData.open_count = 1; // Will be incremented via SQL
        break;
      case "click":
        updateData.clicked_at = eventTime;
        updateData.click_count = 1;
        updateData.metadata = { last_clicked_link: event.link };
        break;
      case "soft_bounce":
      case "hard_bounce":
      case "blocked":
      case "invalid_email":
        updateData.status = "bounced";
        updateData.bounced_at = eventTime;
        updateData.bounce_reason = event.reason || event.event;
        break;
      case "spam":
      case "unsubscribed":
        updateData.status = event.event;
        break;
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    if (Object.keys(updateData).length > 0) {
      // For open and click counts, we need to increment
      if (event.event === "opened" || event.event === "unique_opened") {
        const { error } = await supabase
          .from("supplier_email_logs")
          .update({
            ...updateData,
            open_count: supabase.rpc("increment", { x: 1 }),
          })
          .eq("brevo_message_id", messageId);

        if (error) {
          // Fallback to simple update if rpc fails
          await supabase
            .from("supplier_email_logs")
            .update(updateData)
            .eq("brevo_message_id", messageId);
        }
      } else if (event.event === "click") {
        const { data: existing } = await supabase
          .from("supplier_email_logs")
          .select("click_count, metadata")
          .eq("brevo_message_id", messageId)
          .single();

        if (existing) {
          await supabase
            .from("supplier_email_logs")
            .update({
              clicked_at: updateData.clicked_at,
              click_count: (existing.click_count || 0) + 1,
              metadata: {
                ...(existing.metadata || {}),
                last_clicked_link: event.link,
              },
            })
            .eq("brevo_message_id", messageId);
        }
      } else {
        const { error } = await supabase
          .from("supplier_email_logs")
          .update(updateData)
          .eq("brevo_message_id", messageId);

        if (error) {
          console.error("Error updating email log:", error);
        }
      }

      console.log(`Updated email log for message ${messageId} with event ${event.event}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Brevo webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
