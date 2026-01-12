/**
 * MASTER DATA: Category → Subcategory → Industry Mapping
 * This is the single source of truth for lead discovery targeting
 * 
 * ✅ AI-discovery ready
 * ✅ Deduplication & fingerprint friendly
 * ✅ Scalable (India + global)
 * ✅ IndiaMART / ProcureSaathi style
 */

export interface SubcategoryIndustryMap {
  subcategories: Record<string, string[]>;
}

export const categorySubcategoryMap: Record<string, SubcategoryIndustryMap> = {
  agriculture_equipment_supplies: {
    subcategories: {
      'agricultural machinery': [
        'crop farming',
        'commercial agriculture',
        'plantations',
        'agro contractors'
      ],
      'irrigation equipment': [
        'agriculture farms',
        'horticulture',
        'greenhouse farming'
      ],
      'seeds plants': [
        'seed companies',
        'nurseries',
        'commercial farming'
      ],
      'fertilizers pesticides': [
        'agrochemical companies',
        'crop protection',
        'organic farming'
      ],
      'farm tools equipment': [
        'small farmers',
        'agro traders',
        'plantation estates'
      ],
      'animal feed': [
        'dairy farms',
        'poultry farms',
        'livestock farms'
      ]
    }
  },

  auto_vehicle_accessories: {
    subcategories: {
      'car parts': [
        'automobile workshops',
        'vehicle manufacturers',
        'aftermarket distributors'
      ],
      'truck parts': [
        'logistics fleets',
        'transport companies',
        'fleet operators'
      ],
      'motorcycle parts': [
        'two wheeler manufacturers',
        'service centers'
      ],
      'auto batteries': [
        'automotive service centers',
        'fleet operators',
        'battery distributors'
      ],
      'tires wheels': [
        'transport companies',
        'vehicle dealerships'
      ]
    }
  },

  building_construction: {
    subcategories: {
      'cement concrete': [
        'real estate developers',
        'infrastructure projects',
        'construction contractors'
      ],
      'roofing sheets': [
        'industrial sheds',
        'warehouses',
        'factory buildings'
      ],
      'doors windows': [
        'real estate projects',
        'commercial buildings',
        'residential developers'
      ],
      'paints coatings': [
        'construction projects',
        'industrial maintenance',
        'real estate finishing'
      ],
      'plumbing supplies': [
        'real estate developers',
        'commercial complexes',
        'infrastructure projects'
      ]
    }
  },

  chemicals_raw_materials: {
    subcategories: {
      'industrial chemicals': [
        'manufacturing plants',
        'process industries',
        'bulk chemical users'
      ],
      'specialty chemicals': [
        'electronics manufacturing',
        'pharmaceutical formulation',
        'textile processing'
      ],
      'water treatment chemicals': [
        'water treatment plants',
        'municipal corporations',
        'industrial utilities'
      ],
      'surfactants': [
        'detergents',
        'personal care',
        'industrial cleaning'
      ],
      'paint coating chemicals': [
        'paint manufacturers',
        'coating industries'
      ]
    }
  },

  electrical_equipment_supplies: {
    subcategories: {
      'wires cables': [
        'infrastructure projects',
        'power utilities',
        'industrial plants'
      ],
      'transformers': [
        'power distribution',
        'renewable energy',
        'utility companies'
      ],
      'control panels': [
        'industrial automation',
        'manufacturing plants'
      ]
    }
  },

  electronics_components: {
    subcategories: {
      'semiconductors': [
        'electronics manufacturing',
        'telecom equipment',
        'automotive electronics'
      ],
      'pcbs': [
        'consumer electronics',
        'industrial controls',
        'iot manufacturers'
      ],
      'connectors': [
        'electronics assembly',
        'automotive wiring'
      ]
    }
  },

  energy_power: {
    subcategories: {
      'solar equipment': [
        'solar projects',
        'renewable energy developers',
        'epc contractors'
      ],
      'generators': [
        'industrial backup power',
        'commercial buildings',
        'data centers'
      ],
      'energy storage': [
        'renewable integration',
        'grid storage',
        'industrial power backup'
      ]
    }
  },

  food_beverages: {
    subcategories: {
      'grains cereals': [
        'food processing plants',
        'flour mills',
        'exporters'
      ],
      'dairy products': [
        'dairy processors',
        'food brands',
        'institutional buyers'
      ],
      'nutraceuticals': [
        'health brands',
        'supplement manufacturers',
        'pharma nutrition'
      ]
    }
  },

  flavors_fragrances: {
    subcategories: {
      'food flavors': [
        'food processing',
        'beverage manufacturing',
        'snack brands'
      ],
      'fine fragrances': [
        'cosmetics brands',
        'luxury perfumery',
        'personal care'
      ]
    }
  },

  hardware_tools: {
    subcategories: {
      'hand tools': [
        'construction contractors',
        'industrial maintenance',
        'workshops'
      ],
      'fasteners': [
        'machinery manufacturing',
        'fabrication units',
        'automotive assembly'
      ]
    }
  },

  medical_healthcare: {
    subcategories: {
      'medical equipment': [
        'hospitals',
        'diagnostic centers',
        'healthcare chains'
      ],
      'lab equipment': [
        'research labs',
        'diagnostic labs',
        'pharma r&d'
      ]
    }
  },

  industrial_supplies: {
    subcategories: {
      'pumps valves': [
        'process industries',
        'oil gas',
        'water treatment'
      ],
      'bearings seals': [
        'machinery manufacturing',
        'industrial maintenance'
      ]
    }
  },

  metals_ferrous: {
    subcategories: {
      'tmt bars': [
        'construction projects',
        'real estate developers',
        'infrastructure contractors'
      ],
      'hr cr coils': [
        'automotive manufacturing',
        'engineering industries',
        'pipe manufacturers'
      ],
      'steel pipes': [
        'oil gas',
        'water pipelines',
        'industrial fabrication'
      ]
    }
  },

  metals_non_ferrous: {
    subcategories: {
      'aluminium products': [
        'automotive',
        'packaging',
        'construction'
      ],
      'copper products': [
        'electrical cables',
        'hvac',
        'electronics'
      ]
    }
  },

  pharmaceuticals_drugs: {
    subcategories: {
      'apis': [
        'formulation manufacturers',
        'contract manufacturing',
        'export pharma'
      ],
      'intermediates': [
        'api synthesis',
        'custom synthesis',
        'bulk drug manufacturers'
      ],
      'excipients': [
        'tablet manufacturing',
        'capsule formulation'
      ]
    }
  },

  polymers_resins: {
    subcategories: {
      'polyethylene': [
        'packaging',
        'pipes fittings',
        'blow molding'
      ],
      'polypropylene': [
        'automotive parts',
        'consumer goods'
      ]
    }
  },

  pipes_tubes: {
    subcategories: {
      'ms pipes': [
        'fabrication units',
        'structural projects',
        'industrial piping'
      ],
      'hdpe pipes': [
        'water supply',
        'irrigation',
        'sewage projects'
      ]
    }
  },

  petroleum_bitumen: {
    subcategories: {
      'bitumen': [
        'road construction',
        'highway projects',
        'infrastructure'
      ],
      'lubricants': [
        'industrial machinery',
        'automotive service',
        'fleet operators'
      ]
    }
  },

  steel_fabrication_structures: {
    subcategories: {
      'ms structures': [
        'industrial sheds',
        'warehouses',
        'factory buildings'
      ],
      'cable trays': [
        'power plants',
        'industrial installations'
      ]
    }
  },

  road_safety_infrastructure: {
    subcategories: {
      'crash barriers': [
        'highway projects',
        'road authorities',
        'infrastructure epc'
      ],
      'road marking materials': [
        'municipal corporations',
        'road contractors'
      ]
    }
  }
};

// Get all subcategories for a category
export const getSubcategoriesForCategory = (category: string): string[] => {
  const normalizedCategory = category.toLowerCase().replace(/[\s&]+/g, '_');
  const categoryData = categorySubcategoryMap[normalizedCategory];
  if (!categoryData) return [];
  return Object.keys(categoryData.subcategories);
};

// Get industries for a specific subcategory
export const getIndustriesForSubcategory = (category: string, subcategory: string): string[] => {
  const normalizedCategory = category.toLowerCase().replace(/[\s&]+/g, '_');
  const normalizedSubcategory = subcategory.toLowerCase();
  const categoryData = categorySubcategoryMap[normalizedCategory];
  if (!categoryData) return [];
  return categoryData.subcategories[normalizedSubcategory] || [];
};

// Get all industries for a category (across all subcategories)
export const getAllIndustriesForCategory = (category: string): string[] => {
  const normalizedCategory = category.toLowerCase().replace(/[\s&]+/g, '_');
  const categoryData = categorySubcategoryMap[normalizedCategory];
  if (!categoryData) return [];
  
  const allIndustries = new Set<string>();
  Object.values(categoryData.subcategories).forEach(industries => {
    industries.forEach(ind => allIndustries.add(ind));
  });
  return Array.from(allIndustries).sort();
};

// Get all unique industries across all categories
export const getAllIndustries = (): string[] => {
  const allIndustries = new Set<string>();
  Object.values(categorySubcategoryMap).forEach(categoryData => {
    Object.values(categoryData.subcategories).forEach(industries => {
      industries.forEach(ind => allIndustries.add(ind));
    });
  });
  return Array.from(allIndustries).sort();
};

// Get all unique subcategories across all categories
export const getAllSubcategories = (): string[] => {
  const allSubcategories = new Set<string>();
  Object.values(categorySubcategoryMap).forEach(categoryData => {
    Object.keys(categoryData.subcategories).forEach(sub => allSubcategories.add(sub));
  });
  return Array.from(allSubcategories).sort();
};

// Convert slug to human-readable format
export const prettyLabel = (slug: string): string => {
  return slug
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get category options that have subcategory mapping
export const getMappedCategories = (): string[] => {
  return Object.keys(categorySubcategoryMap);
};

// Get category key from display name
export const getCategoryKey = (displayName: string): string => {
  return displayName.toLowerCase().replace(/[\s&]+/g, '_');
};

// Get display name from category key
export const getCategoryDisplayName = (key: string): string => {
  return prettyLabel(key);
};
