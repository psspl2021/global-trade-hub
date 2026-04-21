/**
 * seed-test-global-auction
 *
 * One-click test harness for the live auction → auto PO pipeline.
 *
 * Flow:
 *  1. Creates a global USD reverse auction owned by the calling buyer
 *  2. Inserts 3 synthetic supplier bids (descending prices)
 *  3. Marks auction `completed` with the lowest bidder as winner
 *  4. Invokes `auto-build-po-from-auction` (creates PO, export docs, ERP queue)
 *  5. Returns the auction id, PO id, and PO number
 *
 * Auth: requires authenticated buyer (Bearer token). The auction + PO are owned
 *       by that buyer so it shows up immediately in their dashboard.
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
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Resolve buyer's company (for region_type=global path)
    const { data: membership } = await admin
      .from("buyer_company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    const company_id = membership?.company_id ?? null;

    const startingPrice = 50000; // USD
    const quantity = 100;
    const auctionStart = new Date(Date.now() - 60_000).toISOString();
    const auctionEnd = new Date(Date.now() + 5_000).toISOString();
    const title = `TEST GLOBAL AUCTION • ${new Date().toISOString().slice(11, 19)}`;

    // 1. Create the auction (live → about to end)
    const { data: auction, error: auctionErr } = await admin
      .from("reverse_auctions")
      .insert({
        buyer_id: user.id,
        company_id,
        title,
        product_slug: "test-global-widget",
        category: "Industrial Goods",
        quantity,
        unit: "units",
        starting_price: startingPrice,
        current_price: startingPrice,
        currency: "USD",
        transaction_type: "international",
        status: "live",
        auction_start: auctionStart,
        auction_end: auctionEnd,
        minimum_bid_step_pct: 0.5,
        anti_snipe_seconds: 0,
        enable_po_generation: true,
        enable_erp_sync: true,
        incoterm: "FOB",
        hs_code: "8479.89",
        port_of_loading: "Mumbai (INNSA)",
        port_of_discharge: "Hamburg (DEHAM)",
        origin_country: "IN",
        destination_country: "DE",
        shipment_mode: "Sea",
        delivery_address: "Hamburg Port, Germany",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      })
      .select("*")
      .single();

    if (auctionErr || !auction) {
      console.error("auction insert error", auctionErr);
      return json({ error: auctionErr?.message || "auction insert failed" }, 500);
    }

    // 2. Synthetic supplier bids — use 3 distinct UUIDs (not real auth users)
    //    We bypass FK to auth.users by inserting into reverse_auction_bids
    //    with arbitrary supplier_ids; the auto-PO function tolerates this.
    const supplierIds = [
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
    ];
    const bidPrices = [48500, 47200, 46100]; // descending; last is L1 winner

    const bidRows = supplierIds.map((sid, i) => ({
      auction_id: auction.id,
      supplier_id: sid,
      bid_price: bidPrices[i],
      currency: "USD",
      created_at: new Date(Date.now() + i * 200).toISOString(),
    }));

    const { error: bidsErr } = await admin
      .from("reverse_auction_bids")
      .insert(bidRows);
    if (bidsErr) {
      console.warn("bid insert warning (non-fatal):", bidsErr.message);
    }

    const winnerSupplierId = supplierIds[2];
    const winningPrice = bidPrices[2];

    // 3. Insert a minimal profile row for the winner so vendor_name is populated
    await admin.from("profiles").upsert({
      id: winnerSupplierId,
      company_name: "Acme Global Industries Ltd. (TEST)",
      contact_person: "Test Supplier",
      email: `test-supplier-${winnerSupplierId.slice(0, 6)}@example.com`,
      phone: "+49 40 1234567",
      address: "Industriestraße 12, 20457 Hamburg, Germany",
    }, { onConflict: "id", ignoreDuplicates: false });

    // 4. Mark auction completed with winner
    const { error: updErr } = await admin
      .from("reverse_auctions")
      .update({
        status: "completed",
        winner_supplier_id: winnerSupplierId,
        winning_price: winningPrice,
        current_price: winningPrice,
        auction_end: new Date().toISOString(),
      })
      .eq("id", auction.id);
    if (updErr) {
      console.error("auction complete error", updErr);
      return json({ error: updErr.message }, 500);
    }

    // 5. Invoke auto-build-po-from-auction (service-call so it bypasses owner check edge cases)
    let buildResult: any = null;
    try {
      const r = await fetch(
        `${SUPABASE_URL}/functions/v1/auto-build-po-from-auction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({ auction_id: auction.id }),
        },
      );
      buildResult = await r.json().catch(() => ({}));
      if (!r.ok) {
        console.error("auto-build-po failed:", buildResult);
      }
    } catch (e: any) {
      console.error("auto-build-po fetch failed:", e?.message);
    }

    return json({
      success: true,
      auction_id: auction.id,
      auction_title: title,
      winner_supplier_id: winnerSupplierId,
      winning_price: winningPrice,
      currency: "USD",
      bid_count: bidRows.length,
      po: buildResult?.success
        ? {
          purchase_order_id: buildResult.purchase_order_id,
          po_number: buildResult.po_number,
          is_global: buildResult.is_global,
          total_amount: buildResult.total_amount,
          docs: buildResult.docs,
          erp_queued: buildResult.erp_queued,
        }
        : { error: buildResult?.error || "PO build did not return success" },
    });
  } catch (e: any) {
    console.error("seed-test-global-auction error:", e);
    return json({ error: e?.message || "internal_error" }, 500);
  }
});
