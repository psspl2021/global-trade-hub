export const categoryIndustryMap: Record<string, string[]> = {
  steel: [
    'construction & infrastructure',
    'fabrication & structural steel',
    'machinery manufacturing',
    'automotive manufacturing',
    'oil & gas / energy',
    'aerospace & defense',
    'shipbuilding'
  ],

  chemicals: [
    'construction & infrastructure',
    'paints & coatings',
    'pharmaceutical manufacturing',
    'fmcg & personal care',
    'agrochemicals & fertilizers',
    'textile processing & dyeing',
    'water treatment & environmental',
    'oil & gas',
    'electronics manufacturing'
  ],

  polymers: [
    'packaging & film',
    'automotive parts & interiors',
    'medical devices & disposables',
    'construction (pipes & fittings)',
    'consumer durables'
  ],

  textiles: [
    'garment manufacturing',
    'home textiles & furnishing',
    'technical textiles',
    'textile processing & dyeing'
  ],

  pharmaceuticals: [
    'api & intermediates',
    'formulation manufacturing',
    'biopharma',
    'contract manufacturing'
  ],

  electronics: [
    'semiconductor fabs',
    'pcb & assembly',
    'electronics contract manufacturing'
  ],

  agriculture: [
    'fertilizer blending & distribution',
    'pesticide manufacturers',
    'seed treatment'
  ],

  food: [
    'processed foods & snacks',
    'dairy & beverages',
    'bakery & confectionery',
    'animal feed'
  ],

  aluminium: [
    'automotive manufacturing',
    'construction & infrastructure',
    'aerospace & defense',
    'packaging & containers',
    'electrical & electronics'
  ],

  copper: [
    'electrical & electronics',
    'construction & infrastructure',
    'automotive manufacturing',
    'industrial machinery'
  ],

  bitumen: [
    'road construction',
    'roofing & waterproofing',
    'industrial applications'
  ],

  'food additives': [
    'processed foods & snacks',
    'dairy & beverages',
    'bakery & confectionery',
    'nutraceuticals'
  ],

  'cosmetics & personal care': [
    'skincare & beauty',
    'haircare',
    'oral care',
    'fragrances'
  ],

  'flavors & fragrances': [
    'food & beverage',
    'cosmetics & personal care',
    'household products'
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
