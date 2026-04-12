import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const BodySchema = z.object({
  po_id: z.string().uuid(),
  erp_endpoint: z.string().url().optional(),
  erp_type: z.enum(["webhook", "tally", "sap", "odoo", "busy", "manual"]).default("webhook"),
});

async function generateHash(payload: Record<string, unknown>): Promise<string> {
  const encoder = new TextEncoder();
  const data = JSON.stringify({ ...payload, ts: Date.now() });
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { po_id, erp_endpoint, erp_type } = parsed.data;

    // Fetch the PO
    const { data: po, error: poError } = await supabase
      .from("purchase_orders")
      .select("*")
      .eq("id", po_id)
      .single();

    if (poError || !po) {
      return new Response(JSON.stringify({ error: "PO not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build ERP payload based on type
    const erpPayload = buildErpPayload(po, erp_type);

    // Log PO_CREATED audit event
    const createHash = await generateHash({
      action_type: "ERP_SYNCED",
      performed_by: user.id,
      new_value: erpPayload,
    });

    let syncStatus = "success";
    let erpResponse: Record<string, unknown> = { type: erp_type, synced_at: new Date().toISOString() };
    let erpRefId: string | null = null;

    // If endpoint provided, attempt real sync
    if (erp_endpoint) {
      try {
        const erpApiKey = Deno.env.get("ERP_API_KEY");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (erpApiKey) headers["Authorization"] = `Bearer ${erpApiKey}`;

        const resp = await fetch(erp_endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(erpPayload),
        });

        const respData = await resp.json().catch(() => ({}));

        if (!resp.ok) {
          syncStatus = "failed";
          erpResponse = { error: respData, status: resp.status };
        } else {
          erpRefId = respData.id || respData.reference_id || respData.po_number || null;
          erpResponse = respData;
        }
      } catch (fetchErr) {
        syncStatus = "failed";
        erpResponse = { error: String(fetchErr) };
      }
    } else {
      // Manual / no endpoint — mark as pending for manual sync
      syncStatus = erp_type === "manual" ? "manual_pending" : "pending";
      erpResponse = { type: erp_type, payload: erpPayload, message: "No endpoint configured — payload ready for manual sync" };
    }

    // Update PO with sync status
    await supabase
      .from("purchase_orders")
      .update({
        erp_sync_status: syncStatus,
        erp_reference_id: erpRefId,
        erp_response: erpResponse,
      })
      .eq("id", po_id);

    // Log audit event
    await supabase.from("procurement_audit_logs").insert({
      po_id,
      action_type: syncStatus === "failed" ? "ERP_SYNC_FAILED" : "ERP_SYNCED",
      performed_by: user.id,
      performed_by_role: "buyer",
      new_value: { erp_type, sync_status: syncStatus, erp_response: erpResponse },
      is_system_action: false,
      hash_signature: createHash,
    });

    return new Response(JSON.stringify({
      success: syncStatus !== "failed",
      sync_status: syncStatus,
      erp_reference_id: erpRefId,
      erp_payload: erpPayload,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ERP Sync error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildErpPayload(po: Record<string, unknown>, erpType: string) {
  const base = {
    po_number: po.po_number,
    vendor_name: po.vendor_name,
    vendor_gstin: po.vendor_gstin,
    total_amount: po.total_amount,
    subtotal: po.subtotal,
    tax_amount: po.tax_amount,
    currency: po.currency || "INR",
    order_date: po.order_date,
    delivery_due_date: po.delivery_due_date,
    delivery_address: po.delivery_address,
    terms_and_conditions: po.terms_and_conditions,
    notes: po.notes,
  };

  switch (erpType) {
    case "tally":
      return {
        VoucherType: "Purchase",
        PartyName: po.vendor_name,
        Amount: String(po.total_amount),
        GSTIN: po.vendor_gstin,
        Narration: `ProcureSaathi PO ${po.po_number}`,
        Date: po.order_date,
      };
    case "sap":
      return {
        CompanyCode: "1000",
        Supplier: po.vendor_name,
        PurchaseOrderType: "NB",
        TotalNetAmount: po.total_amount,
        Currency: po.currency || "INR",
        PurchaseOrderDate: po.order_date,
        ...base,
      };
    case "odoo":
      return {
        partner_name: po.vendor_name,
        amount_total: po.total_amount,
        date_order: po.order_date,
        notes: `ProcureSaathi PO ${po.po_number}`,
        ...base,
      };
    default:
      return base;
  }
}
