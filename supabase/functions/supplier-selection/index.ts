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

    // Return anonymized result for buyer
    const buyerResponse = {
      success: true,
      finalPrice: result.selectedSupplier.totalLandedCost,
      estimatedDeliveryDays: await getEstimatedDeliveryDays(supabase, result.selectedSupplier.supplierId, requirement.product_category),
      supplierLabel: "ProcureSaathi Verified Supplier",
      selectionId: result.selectedSupplier.bidId || result.selectedSupplier.supplierId
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
  // Fetch all bids for this requirement
  const { data: bids, error: bidsError } = await supabase
    .from("bids")
    .select("*")
    .eq("requirement_id", requirement.id)
    .eq("status", "pending");

  if (bidsError || !bids || bids.length === 0) {
    // Fallback to auto-assign if no bids
    const autoResult = await autoAssignSupplier(supabase, requirement);
    return {
      ...autoResult,
      fallbackTriggered: true,
      fallbackReason: "No bids received, auto-assigned based on historical data"
    };
  }

  // Score each bid
  const scoredSuppliers: SupplierScore[] = await Promise.all(
    bids.map(async (bid: any) => {
      const performance = await getSupplierPerformance(supabase, bid.supplier_id);
      const categoryPerf = await getCategoryPerformance(supabase, bid.supplier_id, requirement.product_category);
      
      // Calculate logistics cost (from logistics bids or estimate)
      const logisticsCost = await getLogisticsCost(supabase, requirement.id, bid.supplier_id);
      
      const materialCost = bid.bid_amount;
      const totalLandedCost = materialCost + logisticsCost;
      
      // Calculate AI scores
      const deliverySuccessProbability = calculateDeliveryProbability(performance, categoryPerf, requirement);
      const qualityRiskScore = calculateQualityRisk(performance);
      
      // Composite score (lower is better)
      // Weight: 60% cost, 25% delivery probability (inverted), 15% quality risk
      const normalizedCost = totalLandedCost / (requirement.budget_max || totalLandedCost * 1.5);
      const compositeScore = (normalizedCost * 0.6) + 
                            ((1 - deliverySuccessProbability) * 0.25) + 
                            (qualityRiskScore * 0.15);
      
      const reasoning: string[] = [];
      reasoning.push(`Total Landed Cost: ₹${totalLandedCost.toLocaleString()}`);
      reasoning.push(`Delivery Success Rate: ${(deliverySuccessProbability * 100).toFixed(1)}%`);
      reasoning.push(`Quality Risk: ${(qualityRiskScore * 100).toFixed(1)}%`);
      if (categoryPerf?.l1_wins > 0) {
        reasoning.push(`Previous L1 wins in category: ${categoryPerf.l1_wins}`);
      }
      
      return {
        supplierId: bid.supplier_id,
        bidId: bid.id,
        materialCost,
        logisticsCost,
        totalLandedCost,
        deliverySuccessProbability,
        qualityRiskScore,
        compositeScore,
        reasoning
      };
    })
  );

  // Sort by composite score (lower is better)
  scoredSuppliers.sort((a, b) => a.compositeScore - b.compositeScore);

  const selected = scoredSuppliers[0];
  const runnerUps = scoredSuppliers.slice(1, 4);

  // Check risk thresholds for failsafe
  if (selected.qualityRiskScore > 0.7 || selected.deliverySuccessProbability < 0.5) {
    // Try next best supplier
    if (runnerUps.length > 0 && runnerUps[0].qualityRiskScore < 0.7 && runnerUps[0].deliverySuccessProbability >= 0.5) {
      return {
        selectedSupplier: runnerUps[0],
        runnerUps: [selected, ...runnerUps.slice(1)],
        mode: 'bidding',
        fallbackTriggered: true,
        fallbackReason: `Primary L1 (${selected.supplierId.slice(0, 8)}) exceeded risk thresholds. Selected next best.`
      };
    }
  }

  return {
    selectedSupplier: selected,
    runnerUps,
    mode: 'bidding',
    fallbackTriggered: false
  };
}

async function autoAssignSupplier(supabase: any, requirement: any): Promise<SelectionResult> {
  // Find suppliers who have won L1 for this category before
  const { data: categoryWinners, error: catError } = await supabase
    .from("supplier_category_performance")
    .select("*")
    .eq("category", requirement.product_category)
    .order("l1_wins", { ascending: false })
    .limit(10);

  if (catError || !categoryWinners || categoryWinners.length === 0) {
    // Fallback: Get any supplier with inventory
    const { data: inventorySuppliers } = await supabase
      .from("supplier_inventory_signals")
      .select("*")
      .eq("category", requirement.product_category)
      .gte("available_quantity", requirement.quantity)
      .order("last_updated", { ascending: false })
      .limit(5);

    if (!inventorySuppliers || inventorySuppliers.length === 0) {
      throw new Error("No suitable suppliers found for auto-assignment");
    }

    // Use inventory-based assignment
    return await scoreAndSelectFromInventory(supabase, inventorySuppliers, requirement);
  }

  // Score category winners
  const scoredSuppliers: SupplierScore[] = await Promise.all(
    categoryWinners.map(async (catPerf: any) => {
      const performance = await getSupplierPerformance(supabase, catPerf.supplier_id);
      
      // Estimate cost from historical average
      const estimatedMaterialCost = (catPerf.avg_price_per_unit || 0) * requirement.quantity;
      const estimatedLogisticsCost = estimatedMaterialCost * 0.05; // Estimate 5% for logistics
      const totalLandedCost = estimatedMaterialCost + estimatedLogisticsCost;
      
      const deliverySuccessProbability = calculateDeliveryProbability(performance, catPerf, requirement);
      const qualityRiskScore = calculateQualityRisk(performance);
      
      // For auto-assign, weight delivery reliability higher
      const compositeScore = ((totalLandedCost / (requirement.budget_max || totalLandedCost * 1.5)) * 0.4) + 
                            ((1 - deliverySuccessProbability) * 0.35) + 
                            (qualityRiskScore * 0.25);
      
      const reasoning: string[] = [];
      reasoning.push(`Historical avg price: ₹${catPerf.avg_price_per_unit?.toLocaleString() || 'N/A'}/unit`);
      reasoning.push(`L1 wins in category: ${catPerf.l1_wins}`);
      reasoning.push(`Delivery Success Rate: ${(deliverySuccessProbability * 100).toFixed(1)}%`);
      reasoning.push(`Auto-assigned based on historical performance`);
      
      return {
        supplierId: catPerf.supplier_id,
        materialCost: estimatedMaterialCost,
        logisticsCost: estimatedLogisticsCost,
        totalLandedCost,
        deliverySuccessProbability,
        qualityRiskScore,
        compositeScore,
        reasoning
      };
    })
  );

  scoredSuppliers.sort((a, b) => a.compositeScore - b.compositeScore);

  return {
    selectedSupplier: scoredSuppliers[0],
    runnerUps: scoredSuppliers.slice(1, 4),
    mode: 'auto_assign',
    fallbackTriggered: false
  };
}

async function scoreAndSelectFromInventory(supabase: any, inventorySuppliers: any[], requirement: any): Promise<SelectionResult> {
  const scoredSuppliers: SupplierScore[] = await Promise.all(
    inventorySuppliers.map(async (inv: any) => {
      const performance = await getSupplierPerformance(supabase, inv.supplier_id);
      
      // Estimate cost (use market average or default)
      const estimatedMaterialCost = requirement.budget_min || requirement.quantity * 1000;
      const estimatedLogisticsCost = estimatedMaterialCost * 0.05;
      const totalLandedCost = estimatedMaterialCost + estimatedLogisticsCost;
      
      const deliverySuccessProbability = performance?.delivery_success_rate || 0.85;
      const qualityRiskScore = 1 - (performance?.quality_score || 0.9);
      
      const compositeScore = 0.5; // Default score for inventory-based
      
      return {
        supplierId: inv.supplier_id,
        materialCost: estimatedMaterialCost,
        logisticsCost: estimatedLogisticsCost,
        totalLandedCost,
        deliverySuccessProbability,
        qualityRiskScore,
        compositeScore,
        reasoning: [`Inventory-based selection: ${inv.available_quantity} ${inv.unit} available`]
      };
    })
  );

  return {
    selectedSupplier: scoredSuppliers[0],
    runnerUps: scoredSuppliers.slice(1),
    mode: 'auto_assign',
    fallbackTriggered: true,
    fallbackReason: "No historical L1 data, selected based on inventory availability"
  };
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

function calculateDeliveryProbability(performance: any, categoryPerf: any, requirement: any): number {
  if (!performance) {
    return 0.85; // Default for new suppliers
  }
  
  let probability = performance.delivery_success_rate || 0.85;
  
  // Adjust based on category performance
  if (categoryPerf?.successful_deliveries > 0) {
    const categoryRate = categoryPerf.successful_deliveries / categoryPerf.total_orders;
    probability = (probability * 0.6) + (categoryRate * 0.4);
  }
  
  // Penalize for recent late deliveries
  if (performance.late_deliveries > 0) {
    const lateRatio = performance.late_deliveries / performance.total_orders;
    probability = probability * (1 - (lateRatio * 0.2));
  }
  
  // Bonus for frequent orders (active supplier)
  if (performance.total_orders > 10) {
    probability = Math.min(probability * 1.05, 0.99);
  }
  
  return Math.max(0.1, Math.min(probability, 0.99));
}

function calculateQualityRisk(performance: any): number {
  if (!performance) {
    return 0.15; // Default moderate-low risk for new suppliers
  }
  
  let risk = 0;
  
  // Base risk from quality score
  risk = 1 - (performance.quality_score || 0.9);
  
  // Add risk from rejections
  if (performance.quality_rejections > 0 && performance.total_orders > 0) {
    const rejectionRate = performance.quality_rejections / performance.total_orders;
    risk += rejectionRate * 0.3;
  }
  
  // Add risk from complaints
  if (performance.quality_complaints > 0 && performance.total_orders > 0) {
    const complaintRate = performance.quality_complaints / performance.total_orders;
    risk += complaintRate * 0.2;
  }
  
  return Math.max(0, Math.min(risk, 1));
}

async function getEstimatedDeliveryDays(supabase: any, supplierId: string, category: string): Promise<number> {
  const performance = await getSupplierPerformance(supabase, supplierId);
  
  if (performance?.avg_delivery_days) {
    return Math.round(performance.avg_delivery_days);
  }
  
  // Default based on category (can be refined)
  return 7;
}
