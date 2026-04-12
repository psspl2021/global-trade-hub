import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  po_id: z.string().uuid().optional(),
  batch: z.boolean().optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { po_id, batch } = parsed.data;

    // Single PO reconciliation
    if (po_id) {
      const result = await reconcilePO(supabase, po_id);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Batch: check all POs with ERP sync enabled
    if (batch) {
      const { data: pos } = await supabase
        .from("purchase_orders")
        .select("id, erp_reference_id, erp_sync_status, status")
        .eq("erp_sync_enabled", true)
        .not("erp_reference_id", "is", null)
        .not("status", "in", '("closed","cancelled")');

      const results = [];
      for (const po of (pos || [])) {
        const result = await reconcilePO(supabase, po.id);
        results.push(result);
      }

      const mismatches = results.filter(r => r.is_mismatched);
      return new Response(JSON.stringify({
        total_checked: results.length,
        mismatches: mismatches.length,
        details: mismatches,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Provide po_id or batch=true" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function reconcilePO(supabase: any, poId: string) {
  const { data: po } = await supabase
    .from("purchase_orders")
    .select("id, status, erp_reference_id, erp_sync_status, erp_response")
    .eq("id", poId)
    .single();

  if (!po) return { po_id: poId, error: "PO not found" };

  // Extract ERP status from stored response
  const erpStatus = po.erp_response?.status || po.erp_sync_status || "unknown";
  const platformStatus = po.status;

  const isMismatched = detectMismatch(platformStatus, erpStatus);

  const logEntry = {
    po_id: poId,
    erp_reference_id: po.erp_reference_id,
    status_in_erp: erpStatus,
    status_in_platform: platformStatus,
    is_mismatched: isMismatched,
    mismatch_details: isMismatched
      ? { platform: platformStatus, erp: erpStatus, detected_at: new Date().toISOString() }
      : null,
  };

  await supabase.from("erp_reconciliation_logs").insert(logEntry);

  return logEntry;
}

function detectMismatch(platformStatus: string, erpStatus: string): boolean {
  // Map platform statuses to expected ERP equivalents
  const statusMap: Record<string, string[]> = {
    draft: ["draft", "pending", "unknown"],
    sent: ["sent", "open", "pending"],
    accepted: ["accepted", "confirmed", "open"],
    in_transit: ["in_transit", "shipped", "dispatched"],
    delivered: ["delivered", "received", "completed"],
    payment_done: ["paid", "payment_done", "settled"],
    closed: ["closed", "completed", "archived"],
  };

  const expected = statusMap[platformStatus] || [];
  return !expected.includes(erpStatus.toLowerCase());
}
