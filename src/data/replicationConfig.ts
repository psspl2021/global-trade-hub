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
  // Core Infrastructure Steel (canonical slugs)
  'structural-steel-infrastructure',
  'tmt-bars-epc-projects',
  'hot-rolled-coil-industrial',
  'cold-rolled-coil-manufacturing', // canonical for cold-rolled-coils
  'galvanized-steel-coils',
  'steel-plates-heavy',
  'steel-wire-rods',
  'chequered-plates',
  'peb-steel-structures',
  'colour-coated-steel',
  // Non-Ferrous & Metals
  'aluminium-industrial-export',
  'aluminium-extrusions',
  'non-ferrous-metals',
  // Construction Materials
  'cement-bulk-infra',
  'ready-mix-concrete-rmc', // canonical for rmc-concrete
  'fly-ash-procurement', // canonical for fly-ash
  'construction-aggregates',
  // Pipes & Tubes
  'industrial-pipes-tubes',
  // Hardware & Consumables
  'industrial-fasteners',
  'bearings-industrial', // canonical for industrial-bearings
  'welding-consumables',
  'gaskets-seals', // canonical for industrial-gaskets
  // Electrical (Basic)
  'power-cables',
  'control-cables',
  'transformers-power', // canonical for power-transformers
  // Equipment (Basic)
  'industrial-valves',
  'centrifugal-pumps', // canonical for industrial-pumps
  'diesel-generators', // canonical for dg-sets
  'hvac-equipment', // canonical for hvac-systems
  // Export
  'export-industrial-materials',
] as const;

// =============================================================
// PHASE 2: ENTERPRISE VERTICALS (HIGH-VALUE LANES)
// =============================================================

export const PHASE2_SLUGS = [
  // Batch 1 - Enterprise Verticals (Pharma, Electrical, Water, Medical)
  'pharmaceutical-apis-intermediates',
  'electrical-equipment-power-distribution',
  'water-treatment-chemicals-systems',
  'industrial-storage-tanks-silos',
  'medical-equipment-diagnostics',
  // Batch 2 - Revenue First (Energy, Oil & Gas, Power, Fabrication)
  'energy-power-equipment', // canonical for solar-equipment-power
  'industrial-pipes-tubes-oil-gas', // canonical for industrial-pipes-oil-gas
  'petroleum-bitumen-procurement', // canonical for petroleum-bitumen
  'steel-fabrication-structures-epc', // canonical for steel-fabrication-structures
  'gfrp-composites-industrial', // canonical for gfrp-composites
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
  // Plus select Phase-1 high-value export lanes
  'export-industrial-materials',
  'aluminium-industrial-export',
  'industrial-pipes-tubes',
  'non-ferrous-metals',
  'transformers-power',
  'industrial-valves',
  // Enterprise categories from Phase 1
  'structural-steel-infrastructure',
  'tmt-bars-epc-projects',
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
  // Batch 2 categories
  'energy_power',
  'petroleum',
  'steel_fabrication',
  'composites',
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
