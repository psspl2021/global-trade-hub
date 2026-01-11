export const categoryIndustryMap: Record<string, string[]> = {
  steel: [
    'construction_infrastructure',
    'fabrication_structural_steel',
    'machinery_manufacturing',
    'automotive_manufacturing',
    'oil_gas_energy',
    'aerospace_defense',
    'shipbuilding'
  ],

  chemicals: [
    'construction_infrastructure',
    'paints_coatings',
    'pharmaceutical_manufacturing',
    'fmcg_personal_care',
    'agrochemicals_fertilizers',
    'textile_processing_dyeing',
    'water_treatment_environmental',
    'oil_gas_energy',
    'electronics_manufacturing'
  ],

  polymers: [
    'packaging_film',
    'automotive_parts_interiors',
    'medical_devices_disposables',
    'construction_pipes_fittings',
    'consumer_durables'
  ],

  textiles: [
    'garment_manufacturing',
    'home_textiles_furnishing',
    'technical_textiles',
    'textile_processing_dyeing'
  ],

  pharmaceuticals: [
    'api_intermediates',
    'formulation_manufacturing',
    'biopharma',
    'contract_manufacturing'
  ],

  electronics: [
    'semiconductor_fabs',
    'pcb_assembly',
    'electronics_contract_manufacturing'
  ],

  agriculture: [
    'fertilizer_blending_distribution',
    'pesticide_manufacturers',
    'seed_treatment'
  ],

  food: [
    'processed_foods_snacks',
    'dairy_beverages',
    'bakery_confectionery',
    'animal_feed'
  ],

  aluminium: [
    'automotive_manufacturing',
    'construction_infrastructure',
    'aerospace_defense',
    'packaging_containers',
    'electrical_electronics'
  ],

  copper: [
    'electrical_electronics',
    'construction_infrastructure',
    'automotive_manufacturing',
    'industrial_machinery'
  ],

  bitumen: [
    'road_construction',
    'roofing_waterproofing',
    'industrial_applications'
  ],

  'food additives': [
    'processed_foods_snacks',
    'dairy_beverages',
    'bakery_confectionery',
    'nutraceuticals'
  ],

  'cosmetics_personal_care': [
    'skincare_beauty',
    'haircare',
    'oral_care',
    'fragrances'
  ],

  'flavors_fragrances': [
    'food_beverage',
    'cosmetics_personal_care',
    'household_products'
  ]
};

// Get all unique industries across all categories
export const getAllIndustries = (): string[] => {
  const allIndustries = new Set<string>();
  Object.values(categoryIndustryMap).forEach(industries => {
    industries.forEach(industry => allIndustries.add(industry));
  });
  return Array.from(allIndustries).sort();
};

// Get industries for a specific category
export const getIndustriesForCategory = (category: string): string[] => {
  const normalizedCategory = category.toLowerCase();
  return categoryIndustryMap[normalizedCategory] || getAllIndustries();
};

// Convert slug to human-readable format for UI display
export const prettyIndustry = (slug: string): string => {
  return slug
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

// Convert human-readable to slug format for DB storage
export const slugifyIndustry = (industry: string): string => {
  return industry
    .toLowerCase()
    .replace(/\s*&\s*/g, '_')
    .replace(/\s*\/\s*/g, '_')
    .replace(/\s*\(\s*/g, '_')
    .replace(/\s*\)\s*/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};
