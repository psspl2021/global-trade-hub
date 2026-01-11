/**
 * MASTER DATA: Category → Subcategory → Industry Mapping
 * This is the single source of truth for lead discovery targeting
 */

export interface SubcategoryIndustryMap {
  subcategories: Record<string, string[]>;
}

export const categorySubcategoryMap: Record<string, SubcategoryIndustryMap> = {
  steel: {
    subcategories: {
      'tmt bars': [
        'construction & infrastructure',
        'real estate developers',
        'road & bridge projects'
      ],
      'ms pipes': [
        'oil & gas',
        'water pipelines',
        'industrial fabrication'
      ],
      'hr coil': [
        'automotive manufacturing',
        'heavy engineering',
        'shipbuilding'
      ],
      'cr coil': [
        'appliances',
        'precision engineering',
        'electronics enclosures'
      ],
      'structural steel': [
        'steel fabrication & structures',
        'warehouses',
        'industrial sheds'
      ],
      'stainless steel': [
        'food processing equipment',
        'pharmaceutical equipment',
        'kitchen & hospitality'
      ],
      'galvanized steel': [
        'roofing & cladding',
        'automotive parts',
        'electrical enclosures'
      ],
      'wire rods': [
        'fasteners manufacturing',
        'wire mesh production',
        'fencing'
      ]
    }
  },

  chemicals: {
    subcategories: {
      'solvents': [
        'pharmaceutical manufacturing',
        'paints & coatings',
        'adhesives'
      ],
      'resins': [
        'plastics & polymers',
        'laminates',
        'automotive parts'
      ],
      'acids': [
        'metal processing',
        'battery manufacturing',
        'fertilizers'
      ],
      'pigments': [
        'paints & coatings',
        'textiles',
        'printing inks'
      ],
      'surfactants': [
        'detergents & soaps',
        'personal care',
        'industrial cleaning'
      ],
      'catalysts': [
        'petrochemicals',
        'refining',
        'specialty chemicals'
      ],
      'specialty chemicals': [
        'electronics manufacturing',
        'pharmaceutical formulation',
        'water treatment'
      ]
    }
  },

  polymers: {
    subcategories: {
      'hdpe': [
        'packaging & film',
        'pipes & fittings',
        'blow molding'
      ],
      'ldpe': [
        'flexible packaging',
        'agriculture films',
        'cable insulation'
      ],
      'pp': [
        'automotive components',
        'consumer goods',
        'textile fibers'
      ],
      'pvc': [
        'construction pipes',
        'electrical conduits',
        'profiles & windows'
      ],
      'pet': [
        'beverage bottles',
        'food packaging',
        'textile fibers'
      ],
      'abs': [
        'electronics housings',
        'automotive interiors',
        'appliances'
      ],
      'engineering plastics': [
        'precision parts',
        'medical devices',
        'aerospace components'
      ]
    }
  },

  textiles: {
    subcategories: {
      'cotton fabric': [
        'garment manufacturing',
        'home textiles',
        'industrial textiles'
      ],
      'synthetic fabric': [
        'sportswear',
        'technical textiles',
        'automotive upholstery'
      ],
      'yarn': [
        'weaving mills',
        'knitting units',
        'embroidery'
      ],
      'dyes & chemicals': [
        'textile processing',
        'dyeing units',
        'printing mills'
      ],
      'technical textiles': [
        'automotive',
        'medical textiles',
        'geotextiles'
      ]
    }
  },

  pharmaceuticals: {
    subcategories: {
      'apis': [
        'formulation manufacturing',
        'contract manufacturing',
        'generic drugs'
      ],
      'intermediates': [
        'api synthesis',
        'custom synthesis',
        'specialty intermediates'
      ],
      'excipients': [
        'tablet manufacturing',
        'capsule formulation',
        'injectable formulation'
      ],
      'formulation': [
        'branded pharma',
        'generic pharma',
        'nutraceuticals'
      ]
    }
  },

  aluminium: {
    subcategories: {
      'ingots': [
        'die casting',
        'foundry',
        'extrusion'
      ],
      'sheets': [
        'automotive body panels',
        'packaging',
        'construction cladding'
      ],
      'extrusions': [
        'windows & doors',
        'structural framing',
        'heat sinks'
      ],
      'foil': [
        'flexible packaging',
        'pharmaceutical blister',
        'cable wrap'
      ],
      'wire rods': [
        'electrical cables',
        'conductors',
        'transmission lines'
      ]
    }
  },

  copper: {
    subcategories: {
      'cathodes': [
        'wire drawing',
        'rod manufacturing',
        'brass making'
      ],
      'wire rods': [
        'cable manufacturing',
        'winding wires',
        'electrical conductors'
      ],
      'strips': [
        'connectors',
        'heat exchangers',
        'busbars'
      ],
      'tubes': [
        'hvac systems',
        'plumbing',
        'heat exchangers'
      ]
    }
  },

  bitumen: {
    subcategories: {
      'vg grades': [
        'road construction',
        'highway projects',
        'airport runways'
      ],
      'modified bitumen': [
        'high traffic roads',
        'bridge decks',
        'industrial flooring'
      ],
      'emulsion': [
        'surface dressing',
        'tack coat',
        'cold mix'
      ],
      'cutback': [
        'prime coat',
        'maintenance works',
        'rural roads'
      ]
    }
  },

  'food additives': {
    subcategories: {
      'preservatives': [
        'processed foods',
        'beverages',
        'dairy products'
      ],
      'emulsifiers': [
        'bakery',
        'confectionery',
        'ice cream'
      ],
      'flavors': [
        'beverages',
        'snacks',
        'dairy'
      ],
      'colors': [
        'confectionery',
        'beverages',
        'processed foods'
      ],
      'sweeteners': [
        'beverages',
        'confectionery',
        'health foods'
      ],
      'stabilizers': [
        'dairy',
        'sauces',
        'frozen foods'
      ]
    }
  },

  'cosmetics & personal care': {
    subcategories: {
      'surfactants': [
        'shampoos',
        'body wash',
        'face cleansers'
      ],
      'emollients': [
        'creams & lotions',
        'lip care',
        'hair care'
      ],
      'active ingredients': [
        'anti-aging',
        'sunscreens',
        'acne treatment'
      ],
      'fragrances': [
        'perfumes',
        'body care',
        'hair care'
      ],
      'pigments': [
        'makeup',
        'nail polish',
        'hair color'
      ]
    }
  },

  'flavors & fragrances': {
    subcategories: {
      'food flavors': [
        'beverages',
        'dairy',
        'bakery'
      ],
      'fine fragrances': [
        'perfumery',
        'luxury cosmetics',
        'premium personal care'
      ],
      'functional fragrances': [
        'household products',
        'detergents',
        'air fresheners'
      ],
      'essential oils': [
        'aromatherapy',
        'natural cosmetics',
        'food & beverage'
      ]
    }
  },

  electronics: {
    subcategories: {
      'pcb': [
        'consumer electronics',
        'automotive electronics',
        'industrial controls'
      ],
      'semiconductors': [
        'computing devices',
        'telecom equipment',
        'automotive'
      ],
      'passive components': [
        'pcb assembly',
        'power electronics',
        'lighting'
      ],
      'connectors': [
        'automotive',
        'industrial machinery',
        'consumer electronics'
      ]
    }
  },

  agriculture: {
    subcategories: {
      'fertilizers': [
        'crop farming',
        'horticulture',
        'plantations'
      ],
      'pesticides': [
        'crop protection',
        'seed treatment',
        'post-harvest'
      ],
      'seeds': [
        'agriculture farms',
        'nurseries',
        'research institutions'
      ],
      'bio inputs': [
        'organic farming',
        'sustainable agriculture',
        'soil health'
      ]
    }
  },

  food: {
    subcategories: {
      'grains & cereals': [
        'flour mills',
        'breakfast cereals',
        'bakery'
      ],
      'oils & fats': [
        'food processing',
        'bakery',
        'snacks'
      ],
      'dairy ingredients': [
        'dairy processing',
        'bakery',
        'confectionery'
      ],
      'meat & poultry': [
        'restaurants',
        'food service',
        'processing plants'
      ],
      'spices & seasonings': [
        'food processing',
        'restaurants',
        'retail'
      ]
    }
  }
};

// Get all subcategories for a category
export const getSubcategoriesForCategory = (category: string): string[] => {
  const normalizedCategory = category.toLowerCase();
  const categoryData = categorySubcategoryMap[normalizedCategory];
  if (!categoryData) return [];
  return Object.keys(categoryData.subcategories);
};

// Get industries for a specific subcategory
export const getIndustriesForSubcategory = (category: string, subcategory: string): string[] => {
  const normalizedCategory = category.toLowerCase();
  const normalizedSubcategory = subcategory.toLowerCase();
  const categoryData = categorySubcategoryMap[normalizedCategory];
  if (!categoryData) return [];
  return categoryData.subcategories[normalizedSubcategory] || [];
};

// Get all industries for a category (across all subcategories)
export const getAllIndustriesForCategory = (category: string): string[] => {
  const normalizedCategory = category.toLowerCase();
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
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get category options that have subcategory mapping
export const getMappedCategories = (): string[] => {
  return Object.keys(categorySubcategoryMap);
};
