/**
 * AI Lead Scoring Engine
 * Scores RFQs on submission: HOT / WARM / COLD
 * Runs client-side with rules-based logic (no API key needed)
 */
import { supabase } from '@/integrations/supabase/client';

interface RFQData {
  session_id: string;
  category?: string;
  trade_type?: string;
  items?: Array<{ item_name: string; quantity: number; unit: string }>;
  description?: string;
  quality_standards?: string;
  buyer_location?: string;
  buyer_company?: string;
}

interface LeadScore {
  lead_score: 'HOT' | 'WARM' | 'COLD';
  confidence_score: number;
  intent_strength: string;
  budget_confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  urgency: 'IMMEDIATE' | '30_DAYS' | 'EXPLORATORY';
  category_fit: string;
  ai_reason_summary: string;
  estimated_deal_value: number | null;
}

const CORE_CATEGORIES = [
  'steel', 'metals', 'chemicals', 'polymers', 'construction',
  'textiles', 'food', 'agriculture', 'packaging', 'industrial'
];

const URGENCY_KEYWORDS = ['urgent', 'immediately', 'asap', 'rush', 'within 7 days', 'within 15 days', 'emergency'];
const BUDGET_KEYWORDS = ['budget', 'price range', 'target price', 'not exceeding', 'max price', 'willing to pay'];

export function scoreRFQ(rfq: RFQData): LeadScore {
  let score = 50;
  const reasons: string[] = [];

  // 1. Intent strength — clear specs, quantity, quality
  const hasItems = rfq.items && rfq.items.length > 0;
  const hasQuantity = rfq.items?.some(i => i.quantity > 0);
  const hasQuality = !!rfq.quality_standards;
  const descLength = rfq.description?.length || 0;

  if (hasItems && hasQuantity && hasQuality) {
    score += 20;
    reasons.push('Detailed specs with quantity and quality standards');
  } else if (hasItems && hasQuantity) {
    score += 12;
    reasons.push('Clear items with quantities');
  } else if (descLength > 50) {
    score += 5;
    reasons.push('Descriptive requirement');
  }

  // 2. Budget confidence
  const desc = (rfq.description || '').toLowerCase();
  const hasBudgetSignal = BUDGET_KEYWORDS.some(k => desc.includes(k));
  let budgetConfidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (hasBudgetSignal) {
    budgetConfidence = 'HIGH';
    score += 10;
    reasons.push('Explicit budget/price reference');
  } else if (hasItems && hasQuantity) {
    budgetConfidence = 'MEDIUM';
    score += 5;
  }

  // 3. Urgency
  const hasUrgency = URGENCY_KEYWORDS.some(k => desc.includes(k));
  let urgency: 'IMMEDIATE' | '30_DAYS' | 'EXPLORATORY' = 'EXPLORATORY';
  if (hasUrgency) {
    urgency = 'IMMEDIATE';
    score += 15;
    reasons.push('Urgent delivery needed');
  } else if (descLength > 80 && hasQuantity) {
    urgency = '30_DAYS';
    score += 5;
  }

  // 4. Category fit
  const cat = (rfq.category || '').toLowerCase();
  const isCoreCat = CORE_CATEGORIES.some(c => cat.includes(c));
  let categoryFit = 'Non-core';
  if (isCoreCat) {
    categoryFit = 'Core category';
    score += 10;
    reasons.push(`Core category: ${rfq.category}`);
  }

  // 5. Trade type complexity
  if (rfq.trade_type === 'import' || rfq.trade_type === 'export') {
    score += 5;
    reasons.push(`${rfq.trade_type} trade — higher value potential`);
  }

  // 6. Estimate deal value from quantity
  let estimatedDealValue: number | null = null;
  if (rfq.items && rfq.items.length > 0) {
    const totalQty = rfq.items.reduce((s, i) => s + (i.quantity || 0), 0);
    if (totalQty > 0) {
      // Rough estimate: avg ₹50,000/MT for industrial goods
      estimatedDealValue = totalQty * 50000;
      if (estimatedDealValue > 5000000) {
        score += 10;
        reasons.push(`High estimated value: ₹${(estimatedDealValue / 100000).toFixed(0)}L`);
      }
    }
  }

  // Clamp score
  const confidence = Math.min(100, Math.max(0, score));

  // Determine lead tier
  let leadScore: 'HOT' | 'WARM' | 'COLD';
  let intentStrength: string;

  if (confidence >= 70) {
    leadScore = 'HOT';
    intentStrength = 'Strong buying intent with clear specs';
  } else if (confidence >= 45) {
    leadScore = 'WARM';
    intentStrength = 'Moderate intent — needs follow-up';
  } else {
    leadScore = 'COLD';
    intentStrength = 'Exploratory — auto-nurture';
  }

  return {
    lead_score: leadScore,
    confidence_score: confidence,
    intent_strength: intentStrength,
    budget_confidence: budgetConfidence,
    urgency,
    category_fit: categoryFit,
    ai_reason_summary: reasons.slice(0, 2).join('. ') || 'Basic requirement submitted',
    estimated_deal_value: estimatedDealValue,
  };
}

export async function scoreAndPersist(rfq: RFQData): Promise<LeadScore | null> {
  try {
    const result = scoreRFQ(rfq);

    await supabase.from('rfq_lead_scores').insert({
      session_id: rfq.session_id,
      lead_score: result.lead_score,
      confidence_score: result.confidence_score,
      intent_strength: result.intent_strength,
      budget_confidence: result.budget_confidence,
      urgency: result.urgency,
      category_fit: result.category_fit,
      ai_reason_summary: result.ai_reason_summary,
      estimated_deal_value: result.estimated_deal_value,
      category_slug: rfq.category,
      trade_type: rfq.trade_type,
      buyer_company: rfq.buyer_company || null,
      buyer_location: rfq.buyer_location || null,
    } as any);

    return result;
  } catch (err) {
    console.warn('[LeadScorer] Failed to persist:', err);
    return null;
  }
}
