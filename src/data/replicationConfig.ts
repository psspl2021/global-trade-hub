/**
 * ============================================================
 * PHASE 1 + PHASE 2 GLOBAL DEMAND SENSOR REPLICATION ENGINE
 * ============================================================
 * 
 * This configuration drives the geo-replication of demand sensors
 * across all supported countries. One canonical slug → 6 countries.
 * 
 * Phase 1: Infrastructure/Steel (already live revenue pages)
 * Phase 2: Enterprise verticals (pharma, electrical, water, tanks, medical)
 * 
 * ============================================================
 */

// =============================================================
// PHASE 1: INFRASTRUCTURE & STEEL (ALREADY LIVE)
// =============================================================

export const PHASE1_SLUGS = [
  'structural-steel-infrastructure',
  'tmt-bars-epc-projects',
  'hot-rolled-coil-industrial',
  'peb-steel-structures',
  'colour-coated-steel',
  'aluminium-industrial-export',
  'non-ferrous-metals',
  'cement-bulk-infra',
  'industrial-pipes-tubes',
  'export-industrial-materials',
  // Phase 1 expansion - Agriculture, Auto, Chemicals, Hardware
  'agricultural-machinery-equipment-procurement',
  'auto-parts-vehicle-components-procurement',
  'industrial-chemicals-bulk-procurement',
  'hardware-fasteners-tools-procurement',
] as const;

// =============================================================
// PHASE 2: ENTERPRISE VERTICALS (HIGH-VALUE LANES)
// =============================================================

export const PHASE2_SLUGS = [
  'pharmaceutical-apis-intermediates',
  'electrical-equipment-power-distribution',
  'water-treatment-chemicals-systems',
  'industrial-storage-tanks-silos',
  'medical-equipment-diagnostics',
] as const;

// =============================================================
// ALL SLUGS TO REPLICATE GLOBALLY
// =============================================================

export const REPLICATE_SLUGS = [
  ...PHASE1_SLUGS,
  ...PHASE2_SLUGS
] as const;

// =============================================================
// REVENUE-HIGH PRIORITY LANES (Enterprise first)
// =============================================================

export const REVENUE_HIGH_SLUGS = [
  // All Phase-2 are enterprise/revenue-high
  ...PHASE2_SLUGS,
  // Plus select Phase-1 export lanes
  'export-industrial-materials',
  'aluminium-industrial-export',
  'industrial-pipes-tubes',
  'non-ferrous-metals',
] as const;

// =============================================================
// ENTERPRISE CATEGORIES (for heatmap prioritization)
// =============================================================

export const ENTERPRISE_CATEGORIES = [
  'pharmaceuticals',
  'medical_healthcare',
  'electrical_equipment',
  'water_treatment',
  'storage_tanks',
  'export',
  'non_ferrous',
  'pipes',
] as const;

// =============================================================
// PRIORITY TYPE
// =============================================================

export type SignalPriority = 'revenue_high' | 'normal';

// =============================================================
// HELPER FUNCTIONS
// =============================================================

/**
 * Check if a slug should be tagged as revenue_high priority
 */
export function isRevenueHighSlug(slug: string): boolean {
  return REVENUE_HIGH_SLUGS.includes(slug as any);
}

/**
 * Check if a category is an enterprise category
 */
export function isEnterpriseCategory(category: string): boolean {
  return ENTERPRISE_CATEGORIES.includes(category as any);
}

/**
 * Get priority for a slug
 */
export function getSlugPriority(slug: string): SignalPriority {
  return isRevenueHighSlug(slug) ? 'revenue_high' : 'normal';
}

/**
 * Get priority for a category
 */
export function getCategoryPriority(category: string): SignalPriority {
  return isEnterpriseCategory(category) ? 'revenue_high' : 'normal';
}

// =============================================================
// PHASE METADATA
// =============================================================

export const PHASE_METADATA = {
  phase1: {
    name: 'Infrastructure & Steel',
    slugCount: PHASE1_SLUGS.length,
    description: 'Core infrastructure and steel demand sensors'
  },
  phase2: {
    name: 'Enterprise Verticals',
    slugCount: PHASE2_SLUGS.length,
    description: 'High-value enterprise procurement lanes'
  },
  total: {
    slugCount: REPLICATE_SLUGS.length,
    countriesSupported: 6, // From supportedCountries
    get totalSensors() {
      return this.slugCount * this.countriesSupported;
    }
  }
} as const;
