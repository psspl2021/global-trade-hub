import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupplierScore {
  supplierId: string;
  bidId?: string;
  materialCost: number;
  logisticsCost: number;
  totalLandedCost: number;
  deliverySuccessProbability: number;
  qualityRiskScore: number;
  compositeScore: number;
  reasoning: string[];
}

interface SelectionResult {
  selectedSupplier: SupplierScore;
  runnerUps: SupplierScore[];
  mode: 'bidding' | 'auto_assign';
  fallbackTriggered: boolean;
  fallbackReason?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { requirementId, mode, forceSupplier } = await req.json();

    if (!requirementId) {
      return new Response(
        JSON.stringify({ error: "requirementId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch requirement details
    const { data: requirement, error: reqError } = await supabase
      .from("requirements")
      .select("*")
      .eq("id", requirementId)
      .single();

    if (reqError || !requirement) {
      return new Response(
        JSON.stringify({ error: "Requirement not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: SelectionResult;

    if (mode === "auto_assign") {
      // MODE B: Without Bidding - Auto-assign based on historical data
      result = await autoAssignSupplier(supabase, requirement);
    } else {
      // MODE A: With Bidding - Select from submitted bids
      result = await selectFromBids(supabase, requirement);
    }

    // Log the selection decision
    const { error: logError } = await supabase
      .from("supplier_selection_log")
      .insert({
        requirement_id: requirementId,
        selection_mode: result.mode,
        selected_supplier_id: result.selectedSupplier.supplierId,
        selected_bid_id: result.selectedSupplier.bidId,
        total_landed_cost: result.selectedSupplier.totalLandedCost,
        material_cost: result.selectedSupplier.materialCost,
        logistics_cost: result.selectedSupplier.logisticsCost,
        delivery_success_probability: result.selectedSupplier.deliverySuccessProbability,
        quality_risk_score: result.selectedSupplier.qualityRiskScore,
        ai_reasoning: { reasoning: result.selectedSupplier.reasoning, compositeScore: result.selectedSupplier.compositeScore },
        runner_up_suppliers: result.runnerUps.map(r => ({
          supplierId: r.supplierId,
          totalLandedCost: r.totalLandedCost,
          compositeScore: r.compositeScore
        })),
        fallback_triggered: result.fallbackTriggered,
        fallback_reason: result.fallbackReason
      });

    if (logError) {
      console.error("Error logging selection:", logError);
    }

    // Return ANONYMIZED result for buyer - NEVER expose supplier_id
    // Generate ps_partner_id hash from supplier_id
    const psPartnerId = `PS-${result.selectedSupplier.supplierId.substring(0, 8).toUpperCase()}`;
    
    const buyerResponse = {
      success: true,
      finalPrice: result.selectedSupplier.totalLandedCost,
      estimatedDeliveryDays: await getEstimatedDeliveryDays(supabase, result.selectedSupplier.supplierId, requirement.product_category),
      // CRITICAL: NEVER expose supplier identity to buyer
      supplierLabel: "ProcureSaathi Verified Partner",
      psPartnerId: psPartnerId, // Anonymized ID only
      selectionId: result.selectedSupplier.bidId || crypto.randomUUID(),
      // AI decision metadata (read-only for buyer)
      aiConfidence: result.selectedSupplier.compositeScore || 0,
      deliveryReliability: result.selectedSupplier.deliverySuccessProbability,
      isLaneLocked: result.mode === 'bidding' && !result.fallbackTriggered
    };

    return new Response(
      JSON.stringify(buyerResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Supplier selection error:", error);
    const errorMessage = error instanceof Error ? error.message : "Selection failed";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function selectFromBids(supabase: any, requirement: any): Promise<SelectionResult> {
  // Use the database function for bidding mode selection
  const { data: dbResult, error: dbError } = await supabase
    .rpc("select_supplier_with_bidding", { p_requirement_id: requirement.id });

  if (dbError) {
    console.error("Database selection error:", dbError);
    // Fallback to auto-assign if DB function fails
    const autoResult = await autoAssignSupplier(supabase, requirement);
    return {
      ...autoResult,
      fallbackTriggered: true,
      fallbackReason: "Bidding selection failed, auto-assigned: " + dbError.message
    };
  }

  if (!dbResult?.success) {
    // No suitable supplier from bidding, try auto-assign
    const autoResult = await autoAssignSupplier(supabase, requirement);
    return {
      ...autoResult,
      fallbackTriggered: true,
      fallbackReason: dbResult?.error || "No bids met risk thresholds"
    };
  }

  // Fetch the selected bid details for response
  const { data: selectedBid } = await supabase
    .from("bids")
    .select("*")
    .eq("id", dbResult.selection_log_id ? undefined : dbResult.supplier_id)
    .single();

  // Get performance data for response
  const performance = await getSupplierPerformance(supabase, dbResult.supplier_id);
  const deliveryRate = await getDynamicDeliveryRate(supabase, dbResult.supplier_id);

  return {
    selectedSupplier: {
      supplierId: dbResult.supplier_id,
      bidId: selectedBid?.id,
      materialCost: dbResult.total_price || 0,
      logisticsCost: 0,
      totalLandedCost: dbResult.total_price || 0,
      deliverySuccessProbability: deliveryRate,
      qualityRiskScore: performance?.quality_risk_score || 0,
      compositeScore: 0,
      reasoning: ["Selected via L1 bidding logic", `Delivery days: ${dbResult.delivery_days}`]
    },
    runnerUps: [],
    mode: 'bidding',
    fallbackTriggered: dbResult.fallback_triggered || false,
    fallbackReason: dbResult.fallback_reason
  };
}

async function autoAssignSupplier(supabase: any, requirement: any): Promise<SelectionResult> {
  // Use the database function for auto-assignment
  const { data: dbResult, error: dbError } = await supabase
    .rpc("auto_assign_supplier", { p_requirement_id: requirement.id });

  if (dbError) {
    console.error("Auto-assign error:", dbError);
    throw new Error("Auto-assignment failed: " + dbError.message);
  }

  if (!dbResult?.success) {
    throw new Error(dbResult?.error || "No suitable supplier found for auto-assignment");
  }

  // Get performance data
  const performance = await getSupplierPerformance(supabase, dbResult.supplier_id);

  return {
    selectedSupplier: {
      supplierId: dbResult.supplier_id,
      materialCost: dbResult.estimated_price || 0,
      logisticsCost: 0,
      totalLandedCost: dbResult.estimated_price || 0,
      deliverySuccessProbability: dbResult.delivery_rate || 0.85,
      qualityRiskScore: performance?.quality_risk_score || 0,
      compositeScore: 0,
      reasoning: [
        "Auto-assigned based on historical L1 wins",
        `Inventory fresh: ${dbResult.inventory_fresh ? 'Yes' : 'No'}`,
        `Delivery rate: ${(dbResult.delivery_rate * 100).toFixed(0)}%`
      ]
    },
    runnerUps: [],
    mode: 'auto_assign',
    fallbackTriggered: !dbResult.inventory_fresh,
    fallbackReason: !dbResult.inventory_fresh ? "Inventory data may be stale" : undefined
  };
}

// Dynamic delivery success rate using database function
async function getDynamicDeliveryRate(supabase: any, supplierId: string): Promise<number> {
  const { data, error } = await supabase
    .rpc("get_delivery_success_rate", { p_supplier_id: supplierId });
  
  if (error || data === null) {
    return 0.85; // Default for new suppliers
  }
  return data;
}

async function getSupplierPerformance(supabase: any, supplierId: string) {
  const { data } = await supabase
    .from("supplier_performance")
    .select("*")
    .eq("supplier_id", supplierId)
    .single();
  return data;
}

async function getCategoryPerformance(supabase: any, supplierId: string, category: string) {
  const { data } = await supabase
    .from("supplier_category_performance")
    .select("*")
    .eq("supplier_id", supplierId)
    .eq("category", category)
    .single();
  return data;
}

async function getLogisticsCost(supabase: any, requirementId: string, supplierId: string): Promise<number> {
  // Check if there's a linked logistics requirement with bids
  const { data: logisticsBid } = await supabase
    .from("logistics_bids")
    .select("bid_amount")
    .eq("requirement_id", requirementId)
    .eq("status", "accepted")
    .single();
  
  if (logisticsBid) {
    return logisticsBid.bid_amount;
  }
  
  // Estimate: typically 3-7% of material cost
  return 0; // Will be added when logistics bid is available
}

async function getEstimatedDeliveryDays(supabase: any, supplierId: string, category: string): Promise<number> {
  const performance = await getSupplierPerformance(supabase, supplierId);
  
  if (performance?.avg_delivery_days) {
    return Math.round(performance.avg_delivery_days);
  }
  
  // Default based on category (can be refined)
  return 7;
}
