/**
 * ============================================================
 * EXTERNAL DEMAND INTELLIGENCE ENGINE
 * ============================================================
 * 
 * This is NOT an SEO system. This is a REVENUE INTELLIGENCE layer.
 * 
 * Pipeline:
 * External Signal → Classification (BUY/RESEARCH/NOISE) → 
 * Scoring (intent, urgency, value, feasibility) →
 * Decision (Auto-RFQ / Admin Review / Ignore) →
 * Managed Fulfilment Execution
 * 
 * CORE LAWS:
 * ✅ Detect external demand signals
 * ✅ Convert them into structured internal signals
 * ✅ Feed RFQ pipeline for admin/auto-sourcing
 * ❌ NO buyer identity exposure
 * ❌ NO lead selling
 * ❌ NO contact info exposure
 * 
 * ============================================================
 */

import { supabase } from "@/integrations/supabase/client";
import { 
  getMappedCategories, 
  getAIDiscoverySubcategories,
  getIndustriesForSubcategory,
  getAllIndustriesForCategory 
} from "@/data/categorySubcategoryMap";

// ============================================================
// TYPES
// ============================================================

export type SignalClassification = 'buy' | 'research' | 'noise';
export type DecisionAction = 'auto_rfq' | 'admin_review' | 'ignore' | 'pending';
export type SignalSource = 'keyword_scan' | 'signal_page' | 'external_api' | 'manual';

export interface DemandSignal {
  id?: string;
  runId?: string;
  signalSource: SignalSource;
  externalSourceUrl?: string;
  
  // Classification
  classification: SignalClassification;
  confidenceScore: number;
  
  // Multi-dimensional Scoring
  intentScore: number;
  urgencyScore: number;
  valueScore: number;
  feasibilityScore: number;
  overallScore?: number; // Calculated as average
  
  // Demand Details
  category: string;
  subcategory: string;
  industry: string;
  productDescription: string;
  estimatedQuantity?: number;
  estimatedUnit?: string;
  estimatedValue: number;
  deliveryLocation?: string;
  deliveryTimelineDays?: number;
  buyerType?: string;
  
  // Fulfilment Feasibility
  matchingSuppliersCount: number;
  bestSupplierMatchScore: number;
  fulfilmentFeasible: boolean;
  
  // Decision
  decisionAction: DecisionAction;
  decisionNotes?: string;
  convertedToRfqId?: string;
}

export interface DISettings {
  id: string;
  autoRfqMinScore: number;
  adminReviewMinScore: number;
  buyClassificationMinScore: number;
  requireSupplierAvailability: boolean;
  minMatchingSuppliers: number;
  minSupplierMatchScore: number;
  enabledCategories: string[];
  enabledCountries: string[];
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly';
  lastRunAt?: string;
}

export interface DIMetrics {
  totalSignalsToday: number;
  buySignalsToday: number;
  autoRfqsCreated: number;
  pendingReview: number;
  avgOverallScore: number;
  avgFeasibilityScore: number;
  conversionRate: number; // Signals → RFQs
  topCategories: { category: string; count: number }[];
}

// ============================================================
// SIGNAL CLASSIFICATION
// ============================================================

/**
 * Classify a signal as BUY, RESEARCH, or NOISE
 * Based on multiple factors, NOT random
 */
export function classifySignal(signal: Partial<DemandSignal>): SignalClassification {
  const {
    intentScore = 0,
    urgencyScore = 0,
    valueScore = 0,
    feasibilityScore = 0,
    estimatedValue = 0,
    productDescription = '',
    deliveryTimelineDays,
    matchingSuppliersCount = 0
  } = signal;
  
  const overallScore = (intentScore + urgencyScore + valueScore + feasibilityScore) / 4;
  
  // BUY signals: High intent + urgency + value + feasibility
  if (overallScore >= 7.0 && matchingSuppliersCount >= 1) {
    // Additional checks for true buy intent
    const hasClearProduct = productDescription.length > 20;
    const hasTimeline = deliveryTimelineDays && deliveryTimelineDays > 0 && deliveryTimelineDays <= 90;
    const hasSignificantValue = estimatedValue >= 500000; // 5L+
    
    if (hasClearProduct && (hasTimeline || hasSignificantValue)) {
      return 'buy';
    }
  }
  
  // RESEARCH signals: Medium scores, gathering information
  if (overallScore >= 4.0 && overallScore < 7.0) {
    return 'research';
  }
  
  // Low intent or no feasibility = NOISE
  if (overallScore < 4.0 || matchingSuppliersCount === 0) {
    return 'noise';
  }
  
  // Default to research for edge cases
  return 'research';
}

// ============================================================
// MULTI-DIMENSIONAL SCORING
// ============================================================

export interface ScoreFactors {
  // Deal characteristics
  estimatedValue: number;
  quantity?: number;
  unit?: string;
  
  // Context
  category: string;
  subcategory: string;
  industry?: string;
  country?: string;
  deliveryLocation?: string;
  
  // Timeline
  deliveryTimelineDays?: number;
  
  // Buyer signals
  buyerType?: string;
  hasGstin?: boolean;
  repeatBuyer?: boolean;
  
  // Fulfilment context
  matchingSuppliersCount: number;
  avgSupplierMatchScore?: number;
}

/**
 * Calculate INTENT score (0-10)
 * How likely is this a real purchase intent?
 */
export function calculateIntentScore(factors: ScoreFactors): number {
  let score = 0;
  
  // Value weight (0-3 points)
  if (factors.estimatedValue >= 10000000) score += 3;
  else if (factors.estimatedValue >= 5000000) score += 2.5;
  else if (factors.estimatedValue >= 2500000) score += 2;
  else if (factors.estimatedValue >= 1000000) score += 1.5;
  else if (factors.estimatedValue >= 500000) score += 1;
  else score += 0.5;
  
  // Industry specificity (0-2 points)
  const highValueIndustries = [
    'construction', 'infrastructure', 'oil_gas', 'power', 
    'water_treatment', 'railways', 'metro', 'highways',
    'shipbuilding', 'defense', 'solar'
  ];
  if (factors.industry && highValueIndustries.some(i => factors.industry?.toLowerCase().includes(i))) {
    score += 2;
  } else if (factors.industry) {
    score += 1;
  }
  
  // Buyer type bonus (0-2 points)
  const highValueBuyerTypes = ['epc_contractor', 'exporter', 'municipal', 'government'];
  if (factors.buyerType && highValueBuyerTypes.includes(factors.buyerType)) {
    score += 2;
  } else if (factors.buyerType) {
    score += 0.5;
  }
  
  // Specificity bonus (0-2 points)
  if (factors.subcategory) score += 1;
  if (factors.quantity && factors.unit) score += 1;
  
  // GSTIN = verified buyer (0-1 point)
  if (factors.hasGstin) score += 1;
  
  return Math.min(10, Math.max(0, score));
}

/**
 * Calculate URGENCY score (0-10)
 * How soon does this need to be fulfilled?
 */
export function calculateUrgencyScore(factors: ScoreFactors): number {
  let score = 5; // Base score
  
  // Timeline urgency
  if (factors.deliveryTimelineDays) {
    if (factors.deliveryTimelineDays <= 7) score += 4;
    else if (factors.deliveryTimelineDays <= 14) score += 3;
    else if (factors.deliveryTimelineDays <= 30) score += 2;
    else if (factors.deliveryTimelineDays <= 60) score += 1;
    else score -= 1;
  }
  
  // High-value = likely urgent
  if (factors.estimatedValue >= 5000000) score += 1;
  
  return Math.min(10, Math.max(0, score));
}

/**
 * Calculate VALUE score (0-10)
 * How valuable is this opportunity for the platform?
 */
export function calculateValueScore(factors: ScoreFactors): number {
  let score = 0;
  
  // Direct value from deal size (0-5 points)
  if (factors.estimatedValue >= 50000000) score += 5; // 5Cr+
  else if (factors.estimatedValue >= 10000000) score += 4; // 1Cr+
  else if (factors.estimatedValue >= 5000000) score += 3; // 50L+
  else if (factors.estimatedValue >= 2500000) score += 2; // 25L+
  else if (factors.estimatedValue >= 1000000) score += 1.5; // 10L+
  else score += 1;
  
  // Export = higher value (0-2 points)
  const highValueCountries = ['uae', 'usa', 'germany', 'saudi-arabia', 'qatar', 'oman'];
  if (factors.country && highValueCountries.includes(factors.country.toLowerCase())) {
    score += 2;
  }
  
  // Repeat buyer = higher LTV (0-2 points)
  if (factors.repeatBuyer) score += 2;
  
  // Verified buyer = higher conversion (0-1 point)
  if (factors.hasGstin) score += 1;
  
  return Math.min(10, Math.max(0, score));
}

/**
 * Calculate FEASIBILITY score (0-10)
 * Can we actually fulfil this?
 */
export function calculateFeasibilityScore(factors: ScoreFactors): number {
  let score = 0;
  
  // Supplier availability (0-5 points) - MOST IMPORTANT
  if (factors.matchingSuppliersCount >= 5) score += 5;
  else if (factors.matchingSuppliersCount >= 3) score += 4;
  else if (factors.matchingSuppliersCount >= 2) score += 3;
  else if (factors.matchingSuppliersCount >= 1) score += 2;
  else score += 0; // No suppliers = not feasible
  
  // Supplier match quality (0-3 points)
  if (factors.avgSupplierMatchScore) {
    if (factors.avgSupplierMatchScore >= 8) score += 3;
    else if (factors.avgSupplierMatchScore >= 6) score += 2;
    else if (factors.avgSupplierMatchScore >= 4) score += 1;
  }
  
  // Delivery location feasibility (0-2 points)
  if (factors.deliveryLocation) {
    // India delivery = easier
    const indianCities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'hyderabad', 'pune', 'ahmedabad'];
    if (indianCities.some(city => factors.deliveryLocation?.toLowerCase().includes(city))) {
      score += 2;
    } else {
      score += 1;
    }
  }
  
  return Math.min(10, Math.max(0, score));
}

/**
 * Calculate all scores for a signal
 */
export function calculateAllScores(factors: ScoreFactors): {
  intentScore: number;
  urgencyScore: number;
  valueScore: number;
  feasibilityScore: number;
  overallScore: number;
} {
  const intentScore = calculateIntentScore(factors);
  const urgencyScore = calculateUrgencyScore(factors);
  const valueScore = calculateValueScore(factors);
  const feasibilityScore = calculateFeasibilityScore(factors);
  
  const overallScore = (intentScore + urgencyScore + valueScore + feasibilityScore) / 4;
  
  return {
    intentScore: Math.round(intentScore * 10) / 10,
    urgencyScore: Math.round(urgencyScore * 10) / 10,
    valueScore: Math.round(valueScore * 10) / 10,
    feasibilityScore: Math.round(feasibilityScore * 10) / 10,
    overallScore: Math.round(overallScore * 10) / 10,
  };
}

// ============================================================
// DECISION LOGIC
// ============================================================

/**
 * Determine what action to take based on scores and settings
 */
export function determineDecisionAction(
  signal: DemandSignal,
  settings: DISettings
): DecisionAction {
  const overallScore = signal.overallScore ?? 
    (signal.intentScore + signal.urgencyScore + signal.valueScore + signal.feasibilityScore) / 4;
  
  // Check fulfilment requirement
  if (settings.requireSupplierAvailability) {
    if (signal.matchingSuppliersCount < settings.minMatchingSuppliers) {
      return 'ignore'; // Can't fulfil = ignore
    }
    if (signal.bestSupplierMatchScore < settings.minSupplierMatchScore) {
      return 'admin_review'; // Low match quality = review
    }
  }
  
  // Score-based decisions
  if (overallScore >= settings.autoRfqMinScore && signal.fulfilmentFeasible) {
    return 'auto_rfq';
  }
  
  if (overallScore >= settings.adminReviewMinScore) {
    return 'admin_review';
  }
  
  return 'ignore';
}

// ============================================================
// SUPPLIER AVAILABILITY CHECK
// ============================================================

/**
 * Check supplier availability for a demand signal
 * Returns count and best match score
 */
export async function checkSupplierAvailability(
  category: string,
  subcategory: string,
  deliveryLocation?: string
): Promise<{ count: number; bestMatchScore: number; feasible: boolean }> {
  try {
    // Count suppliers using type assertion to avoid TS2589
    // The profiles table has deeply nested types that cause infinite instantiation
    const response = await (supabase.from('profiles') as any)
      .select('id')
      .eq('role', 'supplier');
    
    if (response.error) {
      console.error('Error checking supplier availability:', response.error);
      return { count: 0, bestMatchScore: 0, feasible: false };
    }
    
    const supplierCount = (response.data as any[])?.length ?? 0;
    
    // Calculate best match score based on supplier count
    const bestMatchScore = supplierCount > 0 
      ? Math.min(10, 5 + (supplierCount / 10))
      : 0;
    
    return {
      count: supplierCount,
      bestMatchScore: Math.round(bestMatchScore * 10) / 10,
      feasible: supplierCount >= 1
    };
  } catch (error) {
    console.error('Error checking supplier availability:', error);
    return { count: 0, bestMatchScore: 0, feasible: false };
  }
}

// ============================================================
// SIGNAL CREATION
// ============================================================

/**
 * Create a demand intelligence signal with full scoring
 */
export async function createDemandSignal(
  input: Omit<DemandSignal, 'overallScore' | 'classification' | 'decisionAction'>,
  settings?: DISettings
): Promise<DemandSignal | null> {
  try {
    // Get settings if not provided
    if (!settings) {
      const { data } = await supabase
        .from('demand_intelligence_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (data) {
        settings = {
          id: data.id,
          autoRfqMinScore: Number(data.auto_rfq_min_score) || 8.0,
          adminReviewMinScore: Number(data.admin_review_min_score) || 5.0,
          buyClassificationMinScore: Number(data.buy_classification_min_score) || 7.0,
          requireSupplierAvailability: data.require_supplier_availability ?? true,
          minMatchingSuppliers: data.min_matching_suppliers ?? 1,
          minSupplierMatchScore: Number(data.min_supplier_match_score) || 6.0,
          enabledCategories: (data.enabled_categories as string[]) || [],
          enabledCountries: (data.enabled_countries as string[]) || ['india'],
          enabled: data.enabled ?? false,
          frequency: (data.frequency as 'hourly' | 'daily' | 'weekly') || 'daily',
          lastRunAt: data.last_run_at ?? undefined,
        };
      }
    }
    
    // Calculate overall score
    const overallScore = (input.intentScore + input.urgencyScore + input.valueScore + input.feasibilityScore) / 4;
    
    // Classify signal
    const classification = classifySignal({ ...input, overallScore });
    
    // Determine decision
    const signalWithScores: DemandSignal = {
      ...input,
      overallScore,
      classification,
      decisionAction: 'pending',
    };
    
    if (settings) {
      signalWithScores.decisionAction = determineDecisionAction(signalWithScores, settings);
    }
    
    // Insert into database
    const { data, error } = await supabase
      .from('demand_intelligence_signals')
      .insert({
        run_id: input.runId,
        signal_source: input.signalSource,
        external_source_url: input.externalSourceUrl,
        classification: signalWithScores.classification,
        confidence_score: input.confidenceScore,
        intent_score: input.intentScore,
        urgency_score: input.urgencyScore,
        value_score: input.valueScore,
        feasibility_score: input.feasibilityScore,
        category: input.category,
        subcategory: input.subcategory,
        industry: input.industry,
        product_description: input.productDescription,
        estimated_quantity: input.estimatedQuantity,
        estimated_unit: input.estimatedUnit,
        estimated_value: input.estimatedValue,
        delivery_location: input.deliveryLocation,
        delivery_timeline_days: input.deliveryTimelineDays,
        buyer_type: input.buyerType,
        matching_suppliers_count: input.matchingSuppliersCount,
        best_supplier_match_score: input.bestSupplierMatchScore,
        fulfilment_feasible: input.fulfilmentFeasible,
        decision_action: signalWithScores.decisionAction,
        decision_notes: input.decisionNotes,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating demand signal:', error);
      return null;
    }
    
    return {
      ...signalWithScores,
      id: data.id,
    };
  } catch (error) {
    console.error('Error in createDemandSignal:', error);
    return null;
  }
}

// ============================================================
// METRICS
// ============================================================

/**
 * Calculate DI metrics from real data
 */
export async function calculateDIMetrics(): Promise<DIMetrics> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();
    
    // Get today's signals
    const { data: signals } = await supabase
      .from('demand_intelligence_signals')
      .select('*')
      .gte('created_at', todayIso);
    
    // Get pending review count
    const { count: pendingCount } = await supabase
      .from('demand_intelligence_signals')
      .select('*', { count: 'exact', head: true })
      .eq('decision_action', 'pending');
    
    // Get auto-RFQs created
    const { count: autoRfqCount } = await supabase
      .from('demand_intelligence_signals')
      .select('*', { count: 'exact', head: true })
      .eq('decision_action', 'auto_rfq')
      .not('converted_to_rfq_id', 'is', null);
    
    // Calculate category breakdown
    const categoryMap = new Map<string, number>();
    signals?.forEach(s => {
      if (s.category) {
        categoryMap.set(s.category, (categoryMap.get(s.category) || 0) + 1);
      }
    });
    
    const topCategories = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate averages
    const buySignals = signals?.filter(s => s.classification === 'buy') || [];
    const avgOverall = signals?.length 
      ? signals.reduce((sum, s) => sum + (Number(s.intent_score) + Number(s.urgency_score) + Number(s.value_score) + Number(s.feasibility_score)) / 4, 0) / signals.length
      : 0;
    const avgFeasibility = signals?.length
      ? signals.reduce((sum, s) => sum + Number(s.feasibility_score || 0), 0) / signals.length
      : 0;
    
    // Conversion rate
    const { count: totalSignals } = await supabase
      .from('demand_intelligence_signals')
      .select('*', { count: 'exact', head: true });
    
    const { count: convertedSignals } = await supabase
      .from('demand_intelligence_signals')
      .select('*', { count: 'exact', head: true })
      .not('converted_to_rfq_id', 'is', null);
    
    const conversionRate = totalSignals 
      ? ((convertedSignals || 0) / totalSignals) * 100
      : 0;
    
    return {
      totalSignalsToday: signals?.length || 0,
      buySignalsToday: buySignals.length,
      autoRfqsCreated: autoRfqCount || 0,
      pendingReview: pendingCount || 0,
      avgOverallScore: Math.round(avgOverall * 10) / 10,
      avgFeasibilityScore: Math.round(avgFeasibility * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      topCategories,
    };
  } catch (error) {
    console.error('Error calculating DI metrics:', error);
    return {
      totalSignalsToday: 0,
      buySignalsToday: 0,
      autoRfqsCreated: 0,
      pendingReview: 0,
      avgOverallScore: 0,
      avgFeasibilityScore: 0,
      conversionRate: 0,
      topCategories: [],
    };
  }
}

// ============================================================
// EXPORTS
// ============================================================

export {
  getMappedCategories,
  getAIDiscoverySubcategories,
  getIndustriesForSubcategory,
  getAllIndustriesForCategory
};
