/**
 * B2B Marketplace Page Architecture
 * 
 * STRUCTURE:
 * - Category Hub: /categories/{category-slug} (informational)
 * - BUY Pages: /buy-{product-slug} (commercial intent - customer acquisition)
 * - SUPPLIER Pages: /{product-slug}-suppliers (supplier onboarding)
 * 
 * AUTO-GENERATED from categories.ts taxonomy
 */

import { categoriesData } from './categories';

// ============= SLUG UTILITIES =============

export const nameToSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[&,()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export const slugToName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// ============= PAGE CONFIGS =============

export interface BuyPageConfig {
  slug: string;           // URL: /buy-{slug}
  productName: string;
  categorySlug: string;
  categoryName: string;
  
  // SEO
  metaTitle: string;
  metaDescription: string;
  h1: string;
  
  // Content
  industries: string[];
  useCases: string[];
  
  // Internal Links
  relatedProducts: string[];  // Other BUY page slugs
  supplierPageSlug: string;   // Link to supplier page
}

export interface SupplierPageConfig {
  slug: string;           // URL: /{slug}-suppliers
  productName: string;
  categorySlug: string;
  categoryName: string;
  
  // SEO
  metaTitle: string;
  metaDescription: string;
  h1: string;
  
  // Content
  benefits: string[];
  demandSignals: string[];
  
  // Internal Links
  signupCTA: string;
  buyPageSlug: string;    // Link back to buy page
}

export interface CategoryHubConfig {
  slug: string;           // URL: /categories/{slug}
  categoryName: string;
  
  // SEO
  metaTitle: string;
  metaDescription: string;
  h1: string;
  
  // Content
  overview: string;
  subcategories: string[];
  
  // Internal Links
  buyPageSlugs: string[];
  supplierPageSlugs: string[];
}

// ============= INDUSTRY MAPPING =============

const categoryIndustries: Record<string, string[]> = {
  'metals-ferrous-steel-iron': [
    'Construction & Infrastructure',
    'Automotive Manufacturing',
    'Heavy Engineering',
    'Shipbuilding',
    'Oil & Gas'
  ],
  'metals-non-ferrous-copper-aluminium': [
    'Electrical & Electronics',
    'Automotive',
    'Aerospace',
    'Packaging',
    'Construction'
  ],
  'chemicals-raw-materials': [
    'Pharmaceuticals',
    'Textiles',
    'Paints & Coatings',
    'Water Treatment',
    'Manufacturing'
  ],
  'building-construction': [
    'Real Estate Development',
    'Infrastructure Projects',
    'Commercial Construction',
    'Industrial Buildings',
    'Government Works'
  ],
  'polymers-resins': [
    'Packaging',
    'Automotive Components',
    'Consumer Goods',
    'Pipes & Fittings',
    'Electronics'
  ],
  'pipes-tubes': [
    'Oil & Gas',
    'Water Infrastructure',
    'Construction',
    'Industrial Piping',
    'Plumbing'
  ],
  'petroleum-bitumen': [
    'Road Construction',
    'Roofing',
    'Waterproofing',
    'Industrial Fuel',
    'Highway Projects'
  ],
  'electrical-equipment-supplies': [
    'Power Distribution',
    'Industrial Automation',
    'Infrastructure',
    'Renewable Energy',
    'Manufacturing'
  ],
  'food-beverages': [
    'Food Processing',
    'HORECA',
    'Retail Chains',
    'Export Trading',
    'Institutional Buyers'
  ],
};

const getIndustriesForCategory = (categorySlug: string): string[] => {
  return categoryIndustries[categorySlug] || [
    'Manufacturing',
    'Trading & Distribution',
    'Industrial Projects',
    'Export & Import',
    'Retail & Wholesale'
  ];
};

// ============= PAGE GENERATORS =============

/**
 * Generate BUY page config for a subcategory
 */
export const generateBuyPageConfig = (
  subcategory: string,
  category: string
): BuyPageConfig => {
  const productSlug = nameToSlug(subcategory);
  const categorySlug = nameToSlug(category);
  const productName = subcategory;
  
  return {
    slug: productSlug,
    productName,
    categorySlug,
    categoryName: category,
    
    metaTitle: `Buy ${productName} in Bulk | Verified Suppliers India | ProcureSaathi`,
    metaDescription: `Source ${productName.toLowerCase()} from verified suppliers. Competitive pricing, quality assurance, managed procurement. Post RFQ for free quotes.`,
    h1: `Buy ${productName} in Bulk from Verified Suppliers`,
    
    industries: getIndustriesForCategory(categorySlug),
    useCases: [
      `Bulk ${productName.toLowerCase()} procurement`,
      'Project-based sourcing',
      'Regular supply contracts',
      'Quality-certified materials'
    ],
    
    relatedProducts: [], // Will be populated dynamically
    supplierPageSlug: `${productSlug}-suppliers`
  };
};

/**
 * Generate SUPPLIER page config for a subcategory
 */
export const generateSupplierPageConfig = (
  subcategory: string,
  category: string
): SupplierPageConfig => {
  const productSlug = nameToSlug(subcategory);
  const categorySlug = nameToSlug(category);
  const productName = subcategory;
  
  return {
    slug: `${productSlug}-suppliers`,
    productName,
    categorySlug,
    categoryName: category,
    
    metaTitle: `Become a ${productName} Supplier | List Products Free | ProcureSaathi`,
    metaDescription: `Join as a verified ${productName.toLowerCase()} supplier. Access AI-detected buyer demand, receive RFQs, grow your B2B sales.`,
    h1: `Become a ${productName} Supplier`,
    
    benefits: [
      'Access to verified buyer demand',
      'AI-powered RFQ matching',
      'Priority listing with Premium',
      'Managed trade – no cold calls'
    ],
    demandSignals: [
      `Active buyer inquiries for ${productName.toLowerCase()}`,
      'Regular bulk procurement requests',
      'Project-based demand signals',
      'Export opportunities'
    ],
    
    signupCTA: '/signup?role=supplier',
    buyPageSlug: `buy-${productSlug}`
  };
};

/**
 * Generate Category Hub config
 */
export const generateCategoryHubConfig = (
  categoryName: string,
  subcategories: string[]
): CategoryHubConfig => {
  const categorySlug = nameToSlug(categoryName);
  
  return {
    slug: categorySlug,
    categoryName,
    
    metaTitle: `${categoryName} Suppliers India | B2B Sourcing | ProcureSaathi`,
    metaDescription: `Find verified ${categoryName.toLowerCase()} suppliers. Browse products, post RFQs, get competitive quotes. Managed B2B procurement platform.`,
    h1: `${categoryName} – B2B Sourcing & Procurement`,
    
    overview: `ProcureSaathi connects buyers with verified ${categoryName.toLowerCase()} suppliers across India. Browse products, post your requirements, and receive competitive quotes from quality-verified partners.`,
    subcategories,
    
    buyPageSlugs: subcategories.map(sub => `buy-${nameToSlug(sub)}`),
    supplierPageSlugs: subcategories.map(sub => `${nameToSlug(sub)}-suppliers`)
  };
};

// ============= MASTER PAGE REGISTRY =============

export interface PageRegistry {
  buyPages: Map<string, BuyPageConfig>;
  supplierPages: Map<string, SupplierPageConfig>;
  categoryHubs: Map<string, CategoryHubConfig>;
}

/**
 * Generate BUY page config for a CATEGORY (not subcategory)
 * This handles URLs like /buy-pharmaceuticals-drugs
 */
export const generateCategoryBuyPageConfig = (
  categoryName: string,
  subcategories: string[]
): BuyPageConfig => {
  const categorySlug = nameToSlug(categoryName);
  
  return {
    slug: categorySlug,
    productName: categoryName,
    categorySlug,
    categoryName,
    
    metaTitle: `Buy ${categoryName} in Bulk | Verified Suppliers India | ProcureSaathi`,
    metaDescription: `Source ${categoryName.toLowerCase()} from verified suppliers. Browse ${subcategories.length}+ product types, competitive pricing, quality assurance.`,
    h1: `Buy ${categoryName} in Bulk from Verified Suppliers`,
    
    industries: getIndustriesForCategory(categorySlug),
    useCases: [
      `Bulk ${categoryName.toLowerCase()} procurement`,
      'Project-based sourcing',
      'Regular supply contracts',
      'Quality-certified materials'
    ],
    
    relatedProducts: subcategories.slice(0, 5).map(sub => nameToSlug(sub)),
    supplierPageSlug: `${categorySlug}-suppliers`
  };
};

/**
 * Generate SUPPLIER page config for a CATEGORY (not subcategory)
 * This handles URLs like /pharmaceuticals-drugs-suppliers
 */
export const generateCategorySupplierPageConfig = (
  categoryName: string,
  subcategories: string[]
): SupplierPageConfig => {
  const categorySlug = nameToSlug(categoryName);
  
  return {
    slug: `${categorySlug}-suppliers`,
    productName: categoryName,
    categorySlug,
    categoryName,
    
    metaTitle: `Become a ${categoryName} Supplier | List Products Free | ProcureSaathi`,
    metaDescription: `Join as a verified ${categoryName.toLowerCase()} supplier. Access AI-detected buyer demand across ${subcategories.length}+ product types.`,
    h1: `Become a ${categoryName} Supplier`,
    
    benefits: [
      'Access to verified buyer demand',
      'AI-powered RFQ matching',
      'Priority listing with Premium',
      'Managed trade – no cold calls'
    ],
    demandSignals: [
      `Active buyer inquiries for ${categoryName.toLowerCase()}`,
      'Regular bulk procurement requests',
      'Project-based demand signals',
      'Export opportunities'
    ],
    
    signupCTA: '/signup?role=supplier',
    buyPageSlug: `buy-${categorySlug}`
  };
};

/**
 * Generate all pages from categories.ts taxonomy
 * Now includes BOTH category-level AND subcategory-level pages
 */
export const generatePageRegistry = (): PageRegistry => {
  const buyPages = new Map<string, BuyPageConfig>();
  const supplierPages = new Map<string, SupplierPageConfig>();
  const categoryHubs = new Map<string, CategoryHubConfig>();
  
  categoriesData.forEach(category => {
    // Generate category hub
    const hubConfig = generateCategoryHubConfig(category.name, category.subcategories);
    categoryHubs.set(hubConfig.slug, hubConfig);
    
    // Generate CATEGORY-LEVEL BUY and SUPPLIER pages
    // These are the main SEO pages like /buy-pharmaceuticals-drugs
    const categoryBuyConfig = generateCategoryBuyPageConfig(category.name, category.subcategories);
    const categorySupplierConfig = generateCategorySupplierPageConfig(category.name, category.subcategories);
    
    // Debug: Log category-level slugs being generated
    if (import.meta.env.DEV) {
      console.log('[Registry] Category BUY slug:', categoryBuyConfig.slug, '| SUPPLIER slug:', categorySupplierConfig.slug);
    }
    
    buyPages.set(categoryBuyConfig.slug, categoryBuyConfig);
    supplierPages.set(categorySupplierConfig.slug, categorySupplierConfig);
    
    // Generate BUY and SUPPLIER pages for each subcategory
    category.subcategories.forEach(subcategory => {
      const buyConfig = generateBuyPageConfig(subcategory, category.name);
      const supplierConfig = generateSupplierPageConfig(subcategory, category.name);
      
      buyPages.set(buyConfig.slug, buyConfig);
      supplierPages.set(supplierConfig.slug, supplierConfig);
    });
  });
  
  // Populate related products (max 5 from same category)
  buyPages.forEach((config, slug) => {
    const sameCategoryProducts = Array.from(buyPages.values())
      .filter(p => p.categorySlug === config.categorySlug && p.slug !== slug)
      .slice(0, 5)
      .map(p => p.slug);
    config.relatedProducts = sameCategoryProducts;
  });
  
  // Log total counts in development
  if (import.meta.env.DEV) {
    console.log('[Registry] Generated pages - BUY:', buyPages.size, '| SUPPLIER:', supplierPages.size, '| CATEGORY:', categoryHubs.size);
  }
  
  return { buyPages, supplierPages, categoryHubs };
};

// Singleton registry
let _registry: PageRegistry | null = null;

export const getPageRegistry = (): PageRegistry => {
  if (!_registry) {
    _registry = generatePageRegistry();
  }
  return _registry;
};

// ============= LOOKUP FUNCTIONS =============

export const getBuyPageConfig = (slug: string): BuyPageConfig | undefined => {
  return getPageRegistry().buyPages.get(slug);
};

export const getSupplierPageConfig = (slug: string): SupplierPageConfig | undefined => {
  return getPageRegistry().supplierPages.get(slug);
};

export const getCategoryHubConfig = (slug: string): CategoryHubConfig | undefined => {
  return getPageRegistry().categoryHubs.get(slug);
};

export const getAllBuyPageSlugs = (): string[] => {
  return Array.from(getPageRegistry().buyPages.keys());
};

export const getAllSupplierPageSlugs = (): string[] => {
  return Array.from(getPageRegistry().supplierPages.keys());
};

export const getAllCategoryHubSlugs = (): string[] => {
  return Array.from(getPageRegistry().categoryHubs.keys());
};

/**
 * Check if a slug is a valid marketplace slug
 * Used for fallback rendering
 */
export const isValidMarketplaceSlug = (slug: string): boolean => {
  // Check buy pages
  if (slug.startsWith('buy-')) {
    const productSlug = slug.replace(/^buy-/, '');
    return getBuyPageConfig(productSlug) !== undefined;
  }
  
  // Check supplier pages
  if (slug.endsWith('-suppliers')) {
    return getSupplierPageConfig(slug) !== undefined;
  }
  
  // Check category hubs
  return getCategoryHubConfig(slug) !== undefined;
};
