/**
 * ============================================================
 * PROCURESAATHI TAXONOMY PHILOSOPHY (LOCKED – DO NOT VIOLATE)
 * ============================================================
 *
 * ProcureSaathi ≠ IndiaMART dump
 *
 * Subcategories are added ONLY if:
 *
 * 1️⃣ Buyers actually search for it
 * 2️⃣ Suppliers actually sell it
 * 3️⃣ AI discovery quality improves because of it
 *
 * ❌ No generic dumping
 * ❌ No SEO spam categories
 * ❌ No supplier-only or buyer-only noise
 *
 * Quality > Quantity (Always)
 *
 * ============================================================
 * 
 * MASTER DATA: Category → Subcategory → Industry Mapping
 * This is the single source of truth for lead discovery targeting
 * 
 * ✅ AI-discovery ready
 * ✅ Deduplication & fingerprint friendly
 * ✅ Scalable (India + global)
 * ✅ Role-aware visibility (Buyer / Supplier / AI)
 * ✅ 31 Categories with full subcategory coverage
 */

export interface SubcategoryRule {
  industries: string[];        // demand-side intent
  buyer_visible: boolean;      // buyers search intent
  supplier_visible: boolean;   // suppliers sell capability
  ai_discovery: boolean;       // used by AI engine or not
}

export interface SubcategoryIndustryMap {
  subcategories: Record<string, SubcategoryRule>;
}

// Helper to create default rule (all visible)
const rule = (industries: string[]): SubcategoryRule => ({
  industries,
  buyer_visible: true,
  supplier_visible: true,
  ai_discovery: true
});

export const categorySubcategoryMap: Record<string, SubcategoryIndustryMap> = {
  agriculture_equipment_supplies: {
    subcategories: {
      'agricultural machinery': rule([
        'crop farming',
        'commercial agriculture',
        'plantations',
        'agro contractors'
      ]),
      'irrigation equipment': rule([
        'agriculture farms',
        'horticulture',
        'greenhouse farming'
      ]),
      'seeds plants': rule([
        'seed companies',
        'nurseries',
        'commercial farming'
      ]),
      'fertilizers pesticides': rule([
        'agrochemical companies',
        'crop protection',
        'organic farming'
      ]),
      'farm tools equipment': rule([
        'small farmers',
        'agro traders',
        'plantation estates'
      ]),
      'animal feed': rule([
        'dairy farms',
        'poultry farms',
        'livestock farms'
      ])
    }
  },

  auto_vehicle_accessories: {
    subcategories: {
      'car parts': rule([
        'automobile workshops',
        'vehicle manufacturers',
        'aftermarket distributors'
      ]),
      'truck parts': rule([
        'logistics fleets',
        'transport companies',
        'fleet operators'
      ]),
      'motorcycle parts': rule([
        'two wheeler manufacturers',
        'service centers'
      ]),
      'auto batteries': rule([
        'automotive service centers',
        'fleet operators',
        'battery distributors'
      ]),
      'tires wheels': rule([
        'transport companies',
        'vehicle dealerships'
      ])
    }
  },

  building_construction: {
    subcategories: {
      'cement concrete': rule([
        'real estate developers',
        'infrastructure projects',
        'construction contractors',
        'commercial construction'
      ]),
      'roofing sheets': rule([
        'industrial sheds',
        'warehouses',
        'factory buildings'
      ]),
      'roofing materials': rule([
        'industrial sheds',
        'warehouses',
        'factories'
      ]),
      'doors windows': rule([
        'real estate projects',
        'commercial buildings',
        'residential developers'
      ]),
      'paints coatings': rule([
        'construction projects',
        'industrial maintenance',
        'real estate finishing'
      ]),
      'plumbing supplies': rule([
        'real estate developers',
        'commercial complexes',
        'infrastructure projects',
        'residential construction'
      ]),
      'electrical fittings': rule([
        'builders',
        'epc contractors',
        'industrial construction'
      ])
    }
  },

  chemicals_raw_materials: {
    subcategories: {
      'industrial chemicals': rule([
        'manufacturing plants',
        'process industries',
        'bulk chemical users'
      ]),
      'specialty chemicals': rule([
        'electronics manufacturing',
        'pharmaceutical formulation',
        'textile processing'
      ]),
      'water treatment chemicals': rule([
        'water treatment plants',
        'municipal corporations',
        'industrial utilities'
      ]),
      'surfactants': rule([
        'detergents',
        'personal care',
        'industrial cleaning'
      ]),
      'paint coating chemicals': rule([
        'paint manufacturers',
        'coating industries'
      ])
    }
  },

  electrical_equipment_supplies: {
    subcategories: {
      'wires cables': rule([
        'infrastructure projects',
        'power utilities',
        'industrial plants',
        'power distribution'
      ]),
      'transformers': rule([
        'power distribution',
        'renewable energy',
        'utility companies',
        'industrial substations',
        'power utilities'
      ]),
      'control panels': rule([
        'industrial automation',
        'manufacturing plants',
        'process industries',
        'automation systems'
      ]),
      'switchgear': rule([
        'industrial automation',
        'commercial buildings',
        'power distribution'
      ])
    }
  },

  electronics_components: {
    subcategories: {
      'semiconductors': rule([
        'electronics manufacturing',
        'telecom equipment',
        'automotive electronics'
      ]),
      'pcbs': rule([
        'consumer electronics',
        'industrial controls',
        'iot manufacturers'
      ]),
      'connectors': rule([
        'electronics assembly',
        'automotive wiring'
      ])
    }
  },

  energy_power: {
    subcategories: {
      'solar equipment': rule([
        'solar projects',
        'renewable energy developers',
        'epc contractors'
      ]),
      'generators': rule([
        'industrial backup power',
        'commercial buildings',
        'data centers',
        'construction sites',
        'commercial facilities'
      ]),
      'energy storage': rule([
        'renewable integration',
        'grid storage',
        'industrial power backup',
        'power utilities'
      ])
    }
  },

  food_beverages: {
    subcategories: {
      'grains cereals': rule([
        'food processing plants',
        'flour mills',
        'exporters'
      ]),
      'dairy products': rule([
        'dairy processors',
        'food brands',
        'institutional buyers'
      ]),
      'nutraceuticals': rule([
        'health brands',
        'supplement manufacturers',
        'pharma nutrition'
      ])
    }
  },

  flavors_fragrances: {
    subcategories: {
      'food flavors': rule([
        'food processing',
        'beverage manufacturing',
        'snack brands'
      ]),
      'fine fragrances': rule([
        'cosmetics brands',
        'luxury perfumery',
        'personal care'
      ])
    }
  },

  hardware_tools: {
    subcategories: {
      'hand tools': rule([
        'construction contractors',
        'industrial maintenance',
        'workshops'
      ]),
      'fasteners': rule([
        'machinery manufacturing',
        'fabrication units',
        'automotive assembly'
      ])
    }
  },

  medical_healthcare: {
    subcategories: {
      'medical equipment': rule([
        'hospitals',
        'diagnostic centers',
        'healthcare chains'
      ]),
      'lab equipment': rule([
        'research labs',
        'diagnostic labs',
        'pharma r&d'
      ]),
      'surgical instruments': rule([
        'hospitals',
        'medical distributors',
        'surgical centers'
      ]),
      'diagnostic devices': rule([
        'labs',
        'healthcare providers',
        'diagnostic centers'
      ])
    }
  },

  industrial_supplies: {
    subcategories: {
      'pumps valves': rule([
        'process industries',
        'oil gas',
        'water treatment'
      ]),
      'bearings seals': rule([
        'machinery manufacturing',
        'industrial maintenance',
        'automotive',
        'heavy engineering'
      ]),
      'industrial hoses': rule([
        'chemical plants',
        'refineries',
        'manufacturing units'
      ])
    }
  },

  metals_ferrous: {
    subcategories: {
      'tmt bars': rule([
        'construction projects',
        'real estate developers',
        'infrastructure contractors'
      ]),
      'hr cr coils': rule([
        'automotive manufacturing',
        'engineering industries',
        'pipe manufacturers'
      ]),
      'steel pipes': rule([
        'oil gas',
        'water pipelines',
        'industrial fabrication'
      ])
    }
  },

  metals_non_ferrous: {
    subcategories: {
      'aluminium products': rule([
        'automotive',
        'packaging',
        'construction'
      ]),
      'copper products': rule([
        'electrical cables',
        'hvac',
        'electronics'
      ])
    }
  },

  pharmaceuticals_drugs: {
    subcategories: {
      'apis': rule([
        'formulation manufacturers',
        'contract manufacturing',
        'export pharma'
      ]),
      'intermediates': rule([
        'api synthesis',
        'custom synthesis',
        'bulk drug manufacturers'
      ]),
      'excipients': rule([
        'tablet manufacturing',
        'capsule formulation'
      ])
    }
  },

  polymers_resins: {
    subcategories: {
      'polyethylene': rule([
        'packaging',
        'pipes fittings',
        'blow molding'
      ]),
      'polypropylene': rule([
        'automotive parts',
        'consumer goods'
      ])
    }
  },

  pipes_tubes: {
    subcategories: {
      'ms pipes': rule([
        'fabrication units',
        'structural projects',
        'industrial piping',
        'oil gas'
      ]),
      'gi pipes': rule([
        'plumbing contractors',
        'building construction',
        'infrastructure projects',
        'plumbing',
        'construction'
      ]),
      'hdpe pipes': rule([
        'water supply',
        'irrigation',
        'sewage projects'
      ]),
      'di pipes': rule([
        'municipal water supply',
        'smart city projects',
        'infrastructure',
        'municipal projects'
      ])
    }
  },

  petroleum_bitumen: {
    subcategories: {
      'bitumen': rule([
        'road construction',
        'highway projects',
        'infrastructure'
      ]),
      'lubricants': rule([
        'industrial machinery',
        'automotive service',
        'fleet operators'
      ])
    }
  },

  steel_fabrication_structures: {
    subcategories: {
      'ms structures': rule([
        'industrial sheds',
        'warehouses',
        'factory buildings'
      ]),
      'cable trays': rule([
        'power plants',
        'industrial installations',
        'data centers'
      ]),
      'steel gratings': rule([
        'platforms',
        'industrial flooring',
        'infrastructure'
      ])
    }
  },

  road_safety_infrastructure: {
    subcategories: {
      'crash barriers': rule([
        'highway projects',
        'road authorities',
        'infrastructure epc'
      ]),
      'road marking materials': rule([
        'municipal corporations',
        'road contractors',
        'epc contractors'
      ]),
      'traffic signs': rule([
        'smart cities',
        'highway authorities',
        'urban infrastructure'
      ])
    }
  },

  plastic_rubber: {
    subcategories: {
      'plastic raw materials': rule([
        'injection molding',
        'extrusion units',
        'blow molding'
      ]),
      'rubber products': rule([
        'automotive components',
        'industrial sealing',
        'tyre manufacturing'
      ]),
      'recycled plastics': rule([
        'packaging',
        'construction products',
        'industrial reuse'
      ])
    }
  },

  gfrp_composites: {
    subcategories: {
      'gfrp sheets': rule([
        'industrial roofing',
        'chemical plants',
        'infrastructure'
      ]),
      'gfrp tanks': rule([
        'water treatment',
        'chemical storage',
        'effluent treatment'
      ]),
      'frp gratings': rule([
        'industrial flooring',
        'platforms',
        'walkways'
      ])
    }
  },

  solar_renewable_energy: {
    subcategories: {
      'solar panels': rule([
        'solar power plants',
        'epc contractors',
        'commercial rooftops'
      ]),
      'solar inverters': rule([
        'renewable energy projects',
        'industrial rooftops'
      ]),
      'solar mounting structures': rule([
        'solar farms',
        'industrial installations',
        'epc contractors'
      ])
    }
  },

  industrial_storage_tanks: {
    subcategories: {
      'storage tanks': rule([
        'chemical plants',
        'water utilities',
        'industrial storage'
      ]),
      'grain silos': rule([
        'food storage',
        'agriculture supply chain',
        'warehousing',
        'food corporations'
      ]),
      'gfs tanks': rule([
        'municipal water',
        'fire water storage',
        'industrial utilities'
      ])
    }
  },

  packaging_printing: {
    subcategories: {
      'corrugated boxes': rule([
        'ecommerce',
        'logistics',
        'manufacturing'
      ]),
      'flexible packaging': rule([
        'food packaging',
        'pharmaceutical packaging',
        'pharma packaging'
      ]),
      'labels tags': rule([
        'fmcg',
        'retail',
        'pharma'
      ])
    }
  },

  paper_paper_products: {
    subcategories: {
      'kraft paper': rule([
        'packaging industry',
        'corrugated box plants'
      ]),
      'tissue paper': rule([
        'hospitality',
        'healthcare',
        'consumer goods'
      ])
    }
  },

  telecommunication: {
    subcategories: {
      'fiber optics': rule([
        'telecom operators',
        'internet service providers',
        'isp companies'
      ]),
      'telecom towers': rule([
        'network infrastructure',
        '5g deployment'
      ])
    }
  },

  safety_security: {
    subcategories: {
      'ppe': rule([
        'manufacturing plants',
        'construction sites',
        'industrial safety'
      ]),
      'cctv systems': rule([
        'commercial buildings',
        'industrial security',
        'infrastructure'
      ]),
      'fire safety equipment': rule([
        'factories',
        'warehouses',
        'commercial complexes'
      ]),
      'fire safety': rule([
        'factories',
        'warehouses',
        'industrial plants'
      ])
    }
  },

  mining_minerals: {
    subcategories: {
      'coal coke': rule([
        'power plants',
        'steel plants',
        'cement plants'
      ]),
      'industrial minerals': rule([
        'cement plants',
        'manufacturing',
        'construction materials'
      ]),
      'iron ore': rule([
        'steel plants',
        'foundries',
        'metal processing'
      ]),
      'limestone': rule([
        'cement plants',
        'steel plants',
        'chemical industry'
      ])
    }
  },

  environment_recycling: {
    subcategories: {
      'waste management': rule([
        'municipal corporations',
        'industrial plants',
        'smart cities'
      ]),
      'recycling equipment': rule([
        'plastic recycling units',
        'metal recycling plants',
        'waste processors'
      ]),
      'water treatment': rule([
        'water utilities',
        'industrial effluent treatment',
        'municipal water projects'
      ]),
      'air pollution control': rule([
        'thermal power plants',
        'cement plants',
        'industrial boilers'
      ]),
      'eco friendly products': rule([
        'green buildings',
        'sustainable manufacturing',
        'corporate procurement'
      ])
    }
  },

  textiles_leather: {
    subcategories: {
      'fabrics': rule([
        'garment manufacturing',
        'home textiles',
        'export houses'
      ]),
      'yarns & threads': rule([
        'spinning mills',
        'weaving units',
        'knitting factories'
      ]),
      'technical textiles': rule([
        'automotive interiors',
        'medical textiles',
        'geotextiles'
      ]),
      'leather raw materials': rule([
        'tanneries',
        'footwear manufacturing',
        'leather goods exporters'
      ]),
      'leather products': rule([
        'fashion brands',
        'export houses',
        'retail chains'
      ])
    }
  }
};

// ============================================================
// ROLE-AWARE VISIBILITY FUNCTIONS
// ============================================================

/**
 * Get subcategories visible to BUYERS
 * Buyer ko sirf wahi dikhe jo wo search karta hai
 */
export const getBuyerSubcategories = (category: string): string[] => {
  const normalizedCategory = category.toLowerCase().replace(/[\s&]+/g, '_');
  const cat = categorySubcategoryMap[normalizedCategory];
  if (!cat) return [];

  return Object.entries(cat.subcategories)
    .filter(([_, cfg]) => cfg.buyer_visible)
    .map(([sub]) => sub);
};

/**
 * Get subcategories visible to SUPPLIERS
 * Supplier ko sirf wahi dikhe jo wo realistically sell karta hai
 */
export const getSupplierSubcategories = (category: string): string[] => {
  const normalizedCategory = category.toLowerCase().replace(/[\s&]+/g, '_');
  const cat = categorySubcategoryMap[normalizedCategory];
  if (!cat) return [];

  return Object.entries(cat.subcategories)
    .filter(([_, cfg]) => cfg.supplier_visible)
    .map(([sub]) => sub);
};

/**
 * Get subcategories for AI DISCOVERY
 * AI sirf high-signal categories pe kaam kare
 */
export const getAIDiscoverySubcategories = (category: string): string[] => {
  const normalizedCategory = category.toLowerCase().replace(/[\s&]+/g, '_');
  const cat = categorySubcategoryMap[normalizedCategory];
  if (!cat) return [];

  return Object.entries(cat.subcategories)
    .filter(([_, cfg]) => cfg.ai_discovery)
    .map(([sub]) => sub);
};

// ============================================================
// LEGACY COMPATIBILITY FUNCTIONS
// ============================================================

// Get all subcategories for a category (legacy - returns all)
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
  return categoryData.subcategories[normalizedSubcategory]?.industries || [];
};

// Get all industries for a category (across all subcategories)
export const getAllIndustriesForCategory = (category: string): string[] => {
  const normalizedCategory = category.toLowerCase().replace(/[\s&]+/g, '_');
  const categoryData = categorySubcategoryMap[normalizedCategory];
  if (!categoryData) return [];
  
  const allIndustries = new Set<string>();
  Object.values(categoryData.subcategories).forEach(rule => {
    rule.industries.forEach(ind => allIndustries.add(ind));
  });
  return Array.from(allIndustries).sort();
};

// Get all unique industries across all categories
export const getAllIndustries = (): string[] => {
  const allIndustries = new Set<string>();
  Object.values(categorySubcategoryMap).forEach(categoryData => {
    Object.values(categoryData.subcategories).forEach(rule => {
      rule.industries.forEach(ind => allIndustries.add(ind));
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
