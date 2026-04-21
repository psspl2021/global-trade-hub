/**
 * auto-build-po-from-auction
 *
 * Atomically builds a Purchase Order from a completed reverse auction:
 *   1. Loads auction + winning bid + invited supplier profile
 *   2. Creates `purchase_orders` row (idempotent via auction_id unique index)
 *   3. Creates `po_items` row(s)
 *   4. For global (non-INR / region_type='global') auctions:
 *        - Generates Commercial Invoice + Packing List + Certificate of Origin + Bill of Lading
 *   5. Queues an `erp_sync_queue` job so the retry worker picks it up
 *
 * Auth: accepts either authenticated buyer (Bearer token of auction owner)
 *       OR service role (when called from the DB trigger / cron).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const EXPORT_DOC_TYPES = [
  "commercial_invoice",
  "packing_list",
  "certificate_of_origin",
  "bill_of_lading",
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { auction_id } = await req.json().catch(() => ({}));
    if (!auction_id || typeof auction_id !== "string") {
      return json({ error: "auction_id required" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Auth: accept (a) service-role calls, (b) authenticated buyer who owns the auction,
    //       or (c) system trigger calls (no Authorization header — pg_net invocation).
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const isServiceCall = token === SERVICE_KEY;
    const isSystemCall = !token; // trigger via pg_net sends no auth

    let actorUserId: string | null = null;
    if (!isServiceCall && !isSystemCall) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return json({ error: "Unauthorized" }, 401);
      actorUserId = user.id;
    }

    // 1. Load auction
    const { data: auction, error: aucErr } = await admin
      .from("reverse_auctions")
      .select("*")
      .eq("id", auction_id)
      .maybeSingle();
    if (aucErr || !auction) return json({ error: "Auction not found" }, 404);

    if (!isServiceCall && !isSystemCall && actorUserId !== auction.buyer_id) {
      return json({ error: "Forbidden" }, 403);
    }

    if (auction.status !== "completed" || !auction.winner_supplier_id) {
      return json({ error: "Auction not completed with a winner" }, 400);
    }
    if (auction.enable_po_generation === false) {
      return json({ skipped: true, reason: "po_generation_disabled" }, 200);
    }

    // 2. Idempotency — return existing PO if already built
    const { data: existing } = await admin
      .from("purchase_orders")
      .select("id, po_number")
      .eq("auction_id", auction_id)
      .neq("po_status", "cancelled")
      .maybeSingle();
    if (existing) {
      return json({
        success: true,
        idempotent: true,
        purchase_order_id: existing.id,
        po_number: existing.po_number,
      });
    }

    // 3. Get winning bid
    const { data: winBid } = await admin
      .from("reverse_auction_bids")
      .select("*")
      .eq("auction_id", auction_id)
      .eq("supplier_id", auction.winner_supplier_id)
      .order("bid_price", { ascending: true })
      .limit(1)
      .maybeSingle();

    const winPrice = Number(
      auction.winning_price ?? winBid?.bid_price ?? auction.current_price ?? 0,
    );
    if (!winPrice || winPrice <= 0) {
      return json({ error: "No valid winning price" }, 400);
    }

    // 4. Resolve supplier profile (vendor info)
    const { data: vendorProfile } = await admin
      .from("profiles")
      .select("id, company_name, contact_person, email, phone, address")
      .eq("id", auction.winner_supplier_id)
      .maybeSingle();

    // 5. Resolve buyer company (for region_type/base currency)
    let buyerCompany: any = null;
    if (auction.company_id) {
      const { data: bc } = await admin
        .from("buyer_companies")
        .select(
          "id, company_name, base_currency, region_type, org_timezone, country",
        )
        .eq("id", auction.company_id)
        .maybeSingle();
      buyerCompany = bc;
    }

    const isGlobal = (auction.currency || "INR") !== "INR" ||
      buyerCompany?.region_type === "global" ||
      auction.destination_country &&
        auction.destination_country.toUpperCase() !== "IN";

    const qty = Number(auction.quantity || 1);
    const unitPrice = winPrice / Math.max(qty, 1);
    const subtotal = winPrice;
    const taxRate = isGlobal ? 0 : 18;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    const poNumber = `AUCTION-${auction.id.slice(0, 8).toUpperCase()}-${
      Date.now().toString().slice(-6)
    }`;

    // 6. Insert PO
    const { data: po, error: poInsErr } = await admin
      .from("purchase_orders")
      .insert({
        po_number: poNumber,
        po_source: "auction",
        po_status: "draft",
        auction_id: auction.id,
        requirement_id: auction.requirement_id,
        purchaser_id: auction.purchaser_id,
        created_by: auction.buyer_id,
        buyer_company_id: auction.company_id,
        supplier_id: auction.winner_supplier_id,
        vendor_name: vendorProfile?.company_name ||
          vendorProfile?.contact_person ||
          "Awarded Supplier",
        vendor_email: vendorProfile?.email,
        vendor_phone: vendorProfile?.phone,
        vendor_address: vendorProfile?.address,
        currency: auction.currency || "INR",
        base_currency: buyerCompany?.base_currency || auction.currency || "INR",
        region_type: isGlobal ? "global" : "domestic",
        incoterms: auction.incoterms || auction.incoterm,
        delivery_address: auction.delivery_address,
        expected_delivery_date: auction.deadline,
        order_date: new Date().toISOString().slice(0, 10),
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: total,
        po_value: total,
        po_value_base_currency: total,
        notes:
          `Auto-built from reverse auction "${auction.title}" — winning bid ${winPrice} ${
            auction.currency || "INR"
          }.`,
        approval_status: "pending_manager",
        approval_required: true,
        erp_sync_enabled: auction.enable_erp_sync !== false,
        erp_sync_status: "pending",
      })
      .select("*")
      .single();

    if (poInsErr || !po) {
      return json({ error: poInsErr?.message || "PO insert failed" }, 500);
    }

    // 7. PO items
    await admin.from("po_items").insert({
      po_id: po.id,
      description: auction.title || `Item for ${auction.product_slug}`,
      quantity: qty,
      unit: auction.unit || "units",
      unit_price: unitPrice,
      hsn_code: auction.hs_code,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total: subtotal,
    });

    // 8. Queue ERP sync job (retry worker picks it up)
    if (po.erp_sync_enabled) {
      await admin.from("erp_sync_queue").insert({
        po_id: po.id,
        status: "pending",
        attempt_count: 0,
        max_retries: 3,
      });
    }

    // 9. Generate export documents (global only) — in parallel
    const docResults: Record<string, { ok: boolean; error?: string }> = {};
    if (isGlobal) {
      const headersForwarded = isServiceCall
        ? { Authorization: `Bearer ${SERVICE_KEY}` }
        : { Authorization: authHeader };

      await Promise.all(
        EXPORT_DOC_TYPES.map(async (dt) => {
          try {
            const r = await fetch(
              `${SUPABASE_URL}/functions/v1/generate-export-docs`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...headersForwarded,
                },
                body: JSON.stringify({
                  purchase_order_id: po.id,
                  document_type: dt,
                }),
              },
            );
            const txt = await r.text();
            docResults[dt] = r.ok
              ? { ok: true }
              : { ok: false, error: `${r.status}: ${txt.slice(0, 120)}` };
          } catch (e: any) {
            docResults[dt] = { ok: false, error: e?.message || "fetch failed" };
          }
        }),
      );
    }

    return json({
      success: true,
      purchase_order_id: po.id,
      po_number: po.po_number,
      is_global: isGlobal,
      total_amount: total,
      currency: po.currency,
      docs: docResults,
      erp_queued: po.erp_sync_enabled,
    });
  } catch (e: any) {
    console.error("auto-build-po-from-auction error:", e);
    return json({ error: e?.message || "internal_error" }, 500);
  }
});
