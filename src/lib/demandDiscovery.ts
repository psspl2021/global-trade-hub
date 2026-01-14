/**
 * ============================================================
 * DEMAND DISCOVERY ENGINE
 * ============================================================
 * 
 * ProcureSaathi me AI SEO/SEM = DEMAND DISCOVERY, not marketing
 * 
 * Goal: Find HIGH-INTENT BUYERS, not website traffic
 * 
 * Keyword Source: categorySubcategoryMap taxonomy
 * Target: EPC contractors, exporters, large buyers
 * Conversion: RFQ submissions, not phone calls
 * 
 * ============================================================
 */

import { 
  categorySubcategoryMap,
  getAIDiscoverySubcategories,
  getIndustriesForSubcategory,
  getAllIndustriesForCategory,
  getMappedCategories,
  prettyLabel
} from '@/data/categorySubcategoryMap';

// ============================================================
// BUYER INTENT KEYWORDS (Not supplier keywords!)
// ============================================================

export interface BuyerIntentKeyword {
  keyword: string;
  category: string;
  subcategory: string;
  industry: string;
  intentType: 'project' | 'bulk' | 'export' | 'tender';
  intentScore: number; // 1-10, higher = more valuable buyer
}

// Project-based intent phrases (high-value EPC buyers)
const projectIntentPhrases = [
  '{subcategory} for {industry} project',
  '{subcategory} supplier for {industry}',
  'bulk {subcategory} for {industry}',
  '{subcategory} procurement {geography}',
  '{subcategory} contract supplier {industry}',
  'annual rate contract {subcategory}',
];

// Export buyer intent phrases
const exportIntentPhrases = [
  '{subcategory} import from india',
  'indian {subcategory} for {industry}',
  '{subcategory} exporter for {geography}',
  'bulk {subcategory} from india {industry}',
];

// Tender/Institutional intent
const tenderIntentPhrases = [
  '{subcategory} for government project',
  '{subcategory} for municipal {industry}',
  '{subcategory} tender supplier',
  'empaneled {subcategory} vendor',
];

/**
 * Generate buyer intent keywords from taxonomy
 * NOT generic "supplier india" marketing keywords
 */
export function generateBuyerIntentKeywords(
  category: string,
  country: string = 'india',
  maxKeywords: number = 50
): BuyerIntentKeyword[] {
  const normalizedCategory = category.toLowerCase().replace(/[\s&-]+/g, '_');
  const subcategories = getAIDiscoverySubcategories(normalizedCategory);
  
  if (subcategories.length === 0) return [];

  const keywords: BuyerIntentKeyword[] = [];
  
  for (const subcategory of subcategories) {
    const industries = getIndustriesForSubcategory(normalizedCategory, subcategory);
    
    for (const industry of industries) {
      // Project intent keywords (highest value)
      projectIntentPhrases.forEach(template => {
        const keyword = template
          .replace('{subcategory}', subcategory)
          .replace('{industry}', industry)
          .replace('{geography}', country);
        
        keywords.push({
          keyword,
          category: normalizedCategory,
          subcategory,
          industry,
          intentType: 'project',
          intentScore: 9,
        });
      });

      // Export intent (for international)
      if (country !== 'india') {
        exportIntentPhrases.forEach(template => {
          const keyword = template
            .replace('{subcategory}', subcategory)
            .replace('{industry}', industry)
            .replace('{geography}', country);
          
          keywords.push({
            keyword,
            category: normalizedCategory,
            subcategory,
            industry,
            intentType: 'export',
            intentScore: 8,
          });
        });
      }

      // Tender intent
      tenderIntentPhrases.forEach(template => {
        const keyword = template
          .replace('{subcategory}', subcategory)
          .replace('{industry}', industry);
        
        keywords.push({
          keyword,
          category: normalizedCategory,
          subcategory,
          industry,
          intentType: 'tender',
          intentScore: 7,
        });
      });
    }
  }

  // Sort by intent score, take top N
  return keywords
    .sort((a, b) => b.intentScore - a.intentScore)
    .slice(0, maxKeywords);
}

// ============================================================
// DEMAND DISCOVERY METRICS (Not vanity metrics!)
// ============================================================

export interface DemandDiscoveryMetrics {
  // Actual business metrics
  rfqsSubmitted: number;
  buyerInquiries: number;
  industryMatchRate: number; // % of leads matching target industries
  avgDealSize: number;
  qualifiedLeads: number;
  
  // Signal quality (not traffic)
  intentScore: number; // 1-10 avg buyer intent
  categoryDepth: number; // subcategories covered
  industryReach: number; // industries reached
  
  // Funnel health
  discoveryToRfq: number; // % of discoveries → RFQ
  rfqToQualified: number; // % of RFQs → qualified
}

/**
 * Calculate demand discovery metrics from runs
 */
export function calculateDiscoveryMetrics(runs: any[]): DemandDiscoveryMetrics {
  if (!runs.length) {
    return {
      rfqsSubmitted: 0,
      buyerInquiries: 0,
      industryMatchRate: 0,
      avgDealSize: 0,
      qualifiedLeads: 0,
      intentScore: 0,
      categoryDepth: 0,
      industryReach: 0,
      discoveryToRfq: 0,
      rfqToQualified: 0,
    };
  }

  const totalRfqs = runs.reduce((sum, r) => sum + (r.rfqs_submitted || 0), 0);
  const totalInquiries = runs.reduce((sum, r) => sum + (r.buyer_inquiries || 0), 0);
  const totalQualified = runs.reduce((sum, r) => sum + (r.qualified_leads || 0), 0);
  
  // Unique industries and subcategories discovered
  const industries = new Set<string>();
  const subcategories = new Set<string>();
  
  runs.forEach(r => {
    if (r.industries_reached) {
      r.industries_reached.forEach((i: string) => industries.add(i));
    }
    if (r.subcategories_covered) {
      r.subcategories_covered.forEach((s: string) => subcategories.add(s));
    }
  });

  return {
    rfqsSubmitted: totalRfqs,
    buyerInquiries: totalInquiries,
    industryMatchRate: runs[0]?.industry_match_rate || 0,
    avgDealSize: runs[0]?.avg_deal_size || 0,
    qualifiedLeads: totalQualified,
    intentScore: runs[0]?.intent_score || 0,
    categoryDepth: subcategories.size,
    industryReach: industries.size,
    discoveryToRfq: totalInquiries > 0 ? (totalRfqs / totalInquiries * 100) : 0,
    rfqToQualified: totalRfqs > 0 ? (totalQualified / totalRfqs * 100) : 0,
  };
}

// ============================================================
// SEM CAMPAIGN TARGETING (Industry-specific, not generic)
// ============================================================

export interface SEMCampaignTarget {
  name: string;
  subcategory: string;
  industries: string[];
  buyerType: 'epc_contractor' | 'exporter' | 'industrial' | 'municipal' | 'distributor';
  minDealSize: number; // Minimum deal value in INR
  keywords: string[];
  negativeKeywords: string[];
}

const buyerTypeMinDealSize: Record<string, number> = {
  'epc_contractor': 5000000, // 50L+
  'exporter': 2500000, // 25L+
  'industrial': 1000000, // 10L+
  'municipal': 2500000, // 25L+
  'distributor': 500000, // 5L+
};

/**
 * Generate SEM campaign targets from taxonomy
 * Only for high-value buyer segments
 */
export function generateSEMCampaigns(
  category: string,
  country: string = 'india'
): SEMCampaignTarget[] {
  const normalizedCategory = category.toLowerCase().replace(/[\s&-]+/g, '_');
  const subcategories = getAIDiscoverySubcategories(normalizedCategory);
  
  if (subcategories.length === 0) return [];

  const campaigns: SEMCampaignTarget[] = [];
  
  // EPC Contractor campaigns (highest value)
  subcategories.slice(0, 5).forEach(subcategory => {
    const industries = getIndustriesForSubcategory(normalizedCategory, subcategory);
    
    campaigns.push({
      name: `EPC - ${prettyLabel(subcategory)}`,
      subcategory,
      industries: industries.slice(0, 3),
      buyerType: 'epc_contractor',
      minDealSize: buyerTypeMinDealSize.epc_contractor,
      keywords: [
        `${subcategory} for construction project`,
        `bulk ${subcategory} epc`,
        `${subcategory} contract supply`,
      ],
      negativeKeywords: [
        'price',
        'cheap',
        'wholesale',
        'dealer',
        'retail',
      ],
    });
  });

  // Export buyer campaigns (international)
  if (country !== 'india') {
    subcategories.slice(0, 3).forEach(subcategory => {
      const industries = getIndustriesForSubcategory(normalizedCategory, subcategory);
      
      campaigns.push({
        name: `Export - ${prettyLabel(subcategory)} - ${country.toUpperCase()}`,
        subcategory,
        industries: industries.slice(0, 2),
        buyerType: 'exporter',
        minDealSize: buyerTypeMinDealSize.exporter,
        keywords: [
          `${subcategory} import from india`,
          `indian ${subcategory} supplier ${country}`,
          `${subcategory} exporter`,
        ],
        negativeKeywords: [
          'sample',
          'small quantity',
          'test order',
        ],
      });
    });
  }

  return campaigns;
}

// ============================================================
// ADMIN SIGNAL PAGE STRUCTURE (Not sales landing!)
// ============================================================

export interface AdminSignalPage {
  slug: string;
  title: string;
  category: string;
  subcategory: string;
  targetIndustries: string[];
  
  // Page structure (RFQ focused, not marketing)
  headline: string; // Problem statement, not sales pitch
  subheadline: string; // Value prop for buyer
  primaryCTA: string; // Always RFQ/requirement focused
  secondaryCTA: string;
  
  // Trust elements
  verifiedSuppliersCount: number;
  successfulDealsCount: number;
  
  // Form fields (minimal, admin-focused)
  requiredFields: string[];
  optionalFields: string[];
}

/**
 * Generate admin signal page structure
 * Goal: Capture RFQ, NOT sell to visitor
 */
export function generateSignalPage(
  category: string,
  subcategory: string,
  country: string
): AdminSignalPage {
  const industries = getIndustriesForSubcategory(category, subcategory);
  const prettySubcat = prettyLabel(subcategory);
  const prettyCountry = prettyLabel(country);
  
  return {
    slug: `${subcategory.replace(/\s+/g, '-')}-${country}-procurement`,
    title: `${prettySubcat} Procurement Assistance | ${prettyCountry}`,
    category,
    subcategory,
    targetIndustries: industries,
    
    // RFQ-focused headlines (NOT sales pitch)
    headline: `Procuring ${prettySubcat} for your project?`,
    subheadline: `Submit your requirement. We match with verified suppliers.`,
    primaryCTA: 'Submit Project Requirement',
    secondaryCTA: 'Talk to Procurement Expert',
    
    verifiedSuppliersCount: 0, // Will be filled from DB
    successfulDealsCount: 0,
    
    // Minimal form (admin intake, not lead gen)
    requiredFields: [
      'company_name',
      'requirement_description',
      'quantity_unit',
      'delivery_location',
    ],
    optionalFields: [
      'project_name',
      'timeline',
      'budget_range',
      'gstin', // For verification
    ],
  };
}

// ============================================================
// EXPORT ALL UTILITIES
// ============================================================

export function getCategoriesForDiscovery(): string[] {
  return getMappedCategories();
}

export function getSubcategoriesForDiscovery(category: string): string[] {
  return getAIDiscoverySubcategories(category);
}

export function getIndustriesForDiscovery(category: string): string[] {
  return getAllIndustriesForCategory(category);
}
