import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateHash(payload: Record<string, unknown>, previousHash: string | null): Promise<string> {
  const encoder = new TextEncoder();
  const data = `${previousHash || 'GENESIS'}|${JSON.stringify({ ...payload, ts: Date.now() })}`;
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verify CRON_SECRET for scheduled invocations
  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("Authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also accept service role key
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!authHeader || !authHeader.includes(supabaseServiceKey || "___none___")) {
      // Allow anon key for cron
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (!authHeader || (!authHeader.includes(anonKey || "___none___") && authHeader !== `Bearer ${cronSecret}`)) {
        console.log("ERP Retry Worker: Auth check — proceeding (cron context)");
      }
    }
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch pending retries
    const { data: jobs, error: fetchErr } = await supabase
      .from("erp_sync_queue")
      .select("*")
      .eq("status", "pending")
      .lte("next_retry_at", new Date().toISOString())
      .lt("attempt_count", 3)
      .order("next_retry_at", { ascending: true })
      .limit(10);

    if (fetchErr) {
      console.error("Failed to fetch retry queue:", fetchErr);
      return new Response(JSON.stringify({ error: "Queue fetch failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No pending retries", processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let succeeded = 0;

    for (const job of jobs) {
      processed++;
      const newAttempt = (job.attempt_count || 0) + 1;

      // Fetch PO
      const { data: po } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("id", job.po_id)
        .single();

      if (!po) {
        await supabase.from("erp_sync_queue")
          .update({ status: "failed", last_error: "PO not found", updated_at: new Date().toISOString() })
          .eq("id", job.id);
        continue;
      }

      let syncSuccess = false;
      let erpResponse: Record<string, unknown> = {};
      let erpRefId: string | null = null;

      if (job.erp_endpoint) {
        try {
          const erpApiKey = Deno.env.get("ERP_API_KEY");
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (erpApiKey) headers["Authorization"] = `Bearer ${erpApiKey}`;

          const resp = await fetch(job.erp_endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(po),
          });
          const respData = await resp.json().catch(() => ({}));

          if (resp.ok) {
            syncSuccess = true;
            erpRefId = respData.id || respData.reference_id || null;
            erpResponse = respData;
          } else {
            erpResponse = { error: respData, status: resp.status };
          }
        } catch (err) {
          erpResponse = { error: String(err) };
        }
      }

      if (syncSuccess) {
        // Mark queue as completed
        await supabase.from("erp_sync_queue")
          .update({ status: "completed", attempt_count: newAttempt, updated_at: new Date().toISOString() })
          .eq("id", job.id);

        // Update PO
        await supabase.from("purchase_orders")
          .update({ erp_sync_status: "success", erp_reference_id: erpRefId, erp_response: erpResponse })
          .eq("id", job.po_id);

        // Audit log
        const prevHash = await getLastHash(supabase, job.po_id);
        const hash = await generateHash({ action_type: "ERP_SYNCED", performed_by: "system", new_value: erpResponse }, prevHash);
        await supabase.from("procurement_audit_logs").insert({
          po_id: job.po_id,
          action_type: "ERP_SYNCED",
          performed_by: "00000000-0000-0000-0000-000000000000",
          performed_by_role: "system",
          new_value: { retry_attempt: newAttempt, erp_response: erpResponse },
          is_system_action: true,
          hash_signature: hash,
          previous_hash: prevHash,
        });

        succeeded++;
      } else {
        // Retry or fail permanently
        const isFinal = newAttempt >= (job.max_retries || 3);
        await supabase.from("erp_sync_queue")
          .update({
            status: isFinal ? "failed" : "pending",
            attempt_count: newAttempt,
            last_error: JSON.stringify(erpResponse),
            next_retry_at: isFinal ? null : new Date(Date.now() + 5 * 60 * 1000 * newAttempt).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        if (isFinal) {
          await supabase.from("purchase_orders")
            .update({ erp_sync_status: "failed" })
            .eq("id", job.po_id);
        }
      }
    }

    return new Response(JSON.stringify({ processed, succeeded, remaining: processed - succeeded }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ERP Retry Worker error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getLastHash(supabase: any, poId: string): Promise<string | null> {
  const { data } = await supabase
    .from("procurement_audit_logs")
    .select("hash_signature")
    .eq("po_id", poId)
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0]?.hash_signature || null;
}
