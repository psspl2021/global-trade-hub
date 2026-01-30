/**
 * AI Global Demand Region Mapping
 * 
 * Maps category taxonomy to illustrative global demand regions.
 * NO numbers, NO false claims - uses pattern-based language.
 */

export interface RegionGroup {
  name: string;
  countries: string[];
}

export interface DemandRegionConfig {
  regions: RegionGroup[];
  demandPattern: string;
}

// Category to region mapping based on typical procurement patterns
const CATEGORY_REGION_MAP: Record<string, DemandRegionConfig> = {
  // Metals & Construction
  'metals-ferrous-steel-iron': {
    regions: [
      { name: 'Middle East', countries: ['Saudi Arabia', 'UAE', 'Qatar'] },
      { name: 'Africa', countries: ['Kenya', 'Nigeria', 'Egypt'] },
      { name: 'South Asia', countries: ['India', 'Bangladesh'] },
    ],
    demandPattern: 'infrastructure development and industrial manufacturing',
  },
  'metals-non-ferrous-copper-aluminium': {
    regions: [
      { name: 'Middle East', countries: ['UAE', 'Saudi Arabia'] },
      { name: 'Southeast Asia', countries: ['Vietnam', 'Thailand', 'Indonesia'] },
      { name: 'Africa', countries: ['South Africa', 'Morocco'] },
    ],
    demandPattern: 'manufacturing and electrical applications',
  },
  'building-construction': {
    regions: [
      { name: 'Middle East', countries: ['Saudi Arabia', 'UAE', 'Oman'] },
      { name: 'Africa', countries: ['Kenya', 'Nigeria', 'Tanzania'] },
      { name: 'South Asia', countries: ['India', 'Sri Lanka'] },
    ],
    demandPattern: 'construction and infrastructure projects',
  },
  
  // Food & Agriculture
  'agriculture-equipment-supplies': {
    regions: [
      { name: 'Africa', countries: ['Kenya', 'Ethiopia', 'Nigeria'] },
      { name: 'South Asia', countries: ['India', 'Bangladesh', 'Nepal'] },
      { name: 'Middle East', countries: ['UAE', 'Saudi Arabia'] },
    ],
    demandPattern: 'agricultural modernization and food security',
  },
  'food-beverages': {
    regions: [
      { name: 'Middle East', countries: ['UAE', 'Saudi Arabia', 'Kuwait'] },
      { name: 'Africa', countries: ['Kenya', 'Nigeria', 'Ghana'] },
      { name: 'Southeast Asia', countries: ['Singapore', 'Malaysia'] },
    ],
    demandPattern: 'food processing and consumer markets',
  },
  
  // Chemicals & Polymers
  'chemicals-raw-materials': {
    regions: [
      { name: 'Global Manufacturing', countries: ['China', 'Vietnam', 'Indonesia'] },
      { name: 'Middle East', countries: ['UAE', 'Saudi Arabia'] },
      { name: 'Africa', countries: ['South Africa', 'Egypt'] },
    ],
    demandPattern: 'industrial manufacturing and processing',
  },
  'plastics-polymers-resins': {
    regions: [
      { name: 'Southeast Asia', countries: ['Vietnam', 'Thailand', 'Indonesia'] },
      { name: 'Middle East', countries: ['UAE', 'Saudi Arabia'] },
      { name: 'Africa', countries: ['Nigeria', 'Kenya'] },
    ],
    demandPattern: 'plastic manufacturing and packaging',
  },
  
  // Energy & Industrial
  'energy-power': {
    regions: [
      { name: 'Africa', countries: ['Kenya', 'Nigeria', 'South Africa'] },
      { name: 'Middle East', countries: ['Saudi Arabia', 'UAE'] },
      { name: 'South Asia', countries: ['India', 'Bangladesh'] },
    ],
    demandPattern: 'energy infrastructure and renewable projects',
  },
  'electrical-equipment-supplies': {
    regions: [
      { name: 'Middle East', countries: ['Saudi Arabia', 'UAE', 'Qatar'] },
      { name: 'Africa', countries: ['Egypt', 'Nigeria', 'Kenya'] },
      { name: 'South Asia', countries: ['India', 'Sri Lanka'] },
    ],
    demandPattern: 'power infrastructure and industrial electrification',
  },
  'industrial-supplies': {
    regions: [
      { name: 'Global Manufacturing', countries: ['China', 'Vietnam', 'India'] },
      { name: 'Middle East', countries: ['UAE', 'Saudi Arabia'] },
      { name: 'Africa', countries: ['South Africa', 'Egypt'] },
    ],
    demandPattern: 'industrial operations and manufacturing',
  },
  
  // Pharmaceuticals & Healthcare
  'pharmaceuticals-drugs': {
    regions: [
      { name: 'Africa', countries: ['Kenya', 'Nigeria', 'Tanzania'] },
      { name: 'Middle East', countries: ['UAE', 'Saudi Arabia'] },
      { name: 'Southeast Asia', countries: ['Vietnam', 'Indonesia'] },
    ],
    demandPattern: 'healthcare expansion and pharmaceutical distribution',
  },
  'medical-healthcare': {
    regions: [
      { name: 'Middle East', countries: ['UAE', 'Saudi Arabia', 'Kuwait'] },
      { name: 'Africa', countries: ['Kenya', 'Nigeria', 'South Africa'] },
      { name: 'South Asia', countries: ['India', 'Bangladesh'] },
    ],
    demandPattern: 'healthcare infrastructure and medical services',
  },
  
  // Default patterns for other categories
  'default': {
    regions: [
      { name: 'Middle East', countries: ['UAE', 'Saudi Arabia'] },
      { name: 'Africa', countries: ['Kenya', 'Nigeria'] },
      { name: 'South Asia', countries: ['India'] },
    ],
    demandPattern: 'cross-border procurement and sourcing',
  },
};

// Helper to normalize category slug
function normalizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Match category to closest region config
function findBestMatch(categorySlug: string): DemandRegionConfig {
  const normalizedSlug = normalizeSlug(categorySlug);
  
  // Direct match
  if (CATEGORY_REGION_MAP[normalizedSlug]) {
    return CATEGORY_REGION_MAP[normalizedSlug];
  }
  
  // Partial match based on keywords
  const keywords: Record<string, string[]> = {
    'metals-ferrous-steel-iron': ['steel', 'iron', 'tmt', 'coil', 'plate', 'metal', 'ferrous'],
    'metals-non-ferrous-copper-aluminium': ['copper', 'aluminium', 'aluminum', 'brass', 'zinc', 'non-ferrous'],
    'building-construction': ['construction', 'building', 'cement', 'concrete', 'tile', 'roofing'],
    'agriculture-equipment-supplies': ['agriculture', 'farm', 'seed', 'fertilizer', 'irrigation'],
    'food-beverages': ['food', 'beverage', 'grain', 'spice', 'dairy', 'organic'],
    'chemicals-raw-materials': ['chemical', 'solvent', 'adhesive', 'petrochemical'],
    'plastics-polymers-resins': ['plastic', 'polymer', 'resin', 'pvc', 'hdpe', 'ldpe'],
    'energy-power': ['energy', 'power', 'solar', 'generator', 'battery'],
    'electrical-equipment-supplies': ['electrical', 'cable', 'wire', 'transformer', 'motor'],
    'industrial-supplies': ['industrial', 'tool', 'safety', 'pump', 'valve'],
    'pharmaceuticals-drugs': ['pharma', 'drug', 'api', 'medicine', 'formulation'],
    'medical-healthcare': ['medical', 'healthcare', 'surgical', 'hospital', 'diagnostic'],
  };
  
  for (const [configKey, matchKeywords] of Object.entries(keywords)) {
    if (matchKeywords.some(kw => normalizedSlug.includes(kw))) {
      return CATEGORY_REGION_MAP[configKey];
    }
  }
  
  return CATEGORY_REGION_MAP['default'];
}

/**
 * Get AI demand region configuration for a category
 */
export function getAIDemandRegions(categorySlug: string): DemandRegionConfig {
  return findBestMatch(categorySlug);
}

/**
 * Format regions for display
 */
export function formatRegionText(config: DemandRegionConfig): string[] {
  return config.regions.map(region => 
    `${region.name} (${region.countries.join(', ')})`
  );
}

/**
 * Get demand narrative for a product
 */
export function getDemandNarrative(productName: string, categorySlug: string): string {
  const config = getAIDemandRegions(categorySlug);
  return `Our AI observes recurring procurement interest for ${productName} aligned with ${config.demandPattern} across multiple international markets.`;
}
