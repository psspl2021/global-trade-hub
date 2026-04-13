import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify CRON_SECRET for scheduled calls
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = Deno.env.get("CRON_SECRET");
  if (expectedSecret && cronSecret !== expectedSecret) {
    // Also allow service-role auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "___")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL") || "noreply@procuresaathi.com";

    if (!brevoApiKey) {
      throw new Error("BREVO_API_KEY not configured");
    }

    // Fetch queued emails (batch of 10)
    const { data: emails, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "queued")
      .lte("scheduled_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) throw fetchError;
    if (!emails || emails.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        const brevoPayload = {
          sender: { email: senderEmail, name: "ProcureSaathi" },
          to: [{ email: email.recipient_email, name: email.recipient_name || email.recipient_email }],
          subject: email.subject,
          htmlContent: email.html_body,
        };

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(brevoPayload),
        });

        if (response.ok) {
          await supabase
            .from("email_queue")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", email.id);
          sent++;
        } else {
          const errorBody = await response.text();
          const newAttempts = (email.attempts || 0) + 1;
          const newStatus = newAttempts >= (email.max_attempts || 3) ? "failed" : "queued";

          await supabase
            .from("email_queue")
            .update({
              status: newStatus,
              attempts: newAttempts,
              last_error: `HTTP ${response.status}: ${errorBody.slice(0, 500)}`,
            })
            .eq("id", email.id);
          failed++;
        }
      } catch (sendError) {
        const newAttempts = (email.attempts || 0) + 1;
        const newStatus = newAttempts >= (email.max_attempts || 3) ? "failed" : "queued";

        await supabase
          .from("email_queue")
          .update({
            status: newStatus,
            attempts: newAttempts,
            last_error: (sendError as Error).message?.slice(0, 500),
          })
          .eq("id", email.id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ processed: emails.length, sent, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email queue worker error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
