/**
 * ============================================================
 * DEMAND GRID GENERATOR
 * ============================================================
 * 
 * SINGLE SOURCE OF TRUTH for auto-generated demand rows.
 * Uses centralized countryMaster for global coverage.
 * NO new URLs created - purely for internal demand intelligence.
 * 
 * Architecture:
 * - Taxonomy-driven (categories + subcategories)
 * - Country coverage (ALL countries from countryMaster - 50+ countries)
 * - GEO-SAFE language (no fake stats, no revenue claims)
 * - NO hardcoded country filters
 * 
 * Usage:
 *   import { generateDemandGrid, logDemandGridStats } from '@/lib/demandGridGenerator';
 *   const grid = generateDemandGrid();
 *   logDemandGridStats(); // DEV-only console output
 */

import { categoriesData } from '@/data/categories';
import { countryMaster, getCountryFlag, type CountryConfig } from '@/data/countryMaster';
import { nameToSlug } from '@/data/marketplacePages';

// ============= TYPES =============

export interface DemandGridRow {
  id: string; // Unique identifier for row
  category_slug: string;
  category_name: string;
  subcategory_slug: string;
  subcategory_name: string;
  country_code: string;
  country_name: string;
  state: 'Detected' | 'No Signal';
  intent_score: number; // Always 0 for taxonomy-derived
  estimated_value: number; // Always 0 - no fake numbers
  capacity: number | null;
  status: 'No Lane' | 'Lane Active' | 'Lane Pending';
  source: 'seo_taxonomy';
  last_detected_at: string | null;
}

export interface DemandGridStats {
  totalCountries: number;
  totalCategories: number;
  totalSubcategories: number;
  totalProducts: number;
  totalGridRows: number;
  source: 'seo_taxonomy';
}

export interface DemandGridFilters {
  country?: string; // 'all' or country code
  category?: string; // 'all' or category slug
  subcategory?: string; // 'all' or subcategory slug
  status?: 'all' | 'No Lane' | 'Lane Active' | 'Lane Pending';
}

// ============= CORE GENERATOR =============

/**
 * Generate unique row ID from taxonomy
 */
const generateRowId = (countryCode: string, subcategorySlug: string): string => {
  return `${countryCode.toLowerCase()}-${subcategorySlug}`;
};

/**
 * Generate ALL demand grid rows from taxonomy.
 * This creates rows for EVERY country × EVERY subcategory.
 * 
 * @returns Array of DemandGridRow objects
 */
export const generateDemandGrid = (): DemandGridRow[] => {
  const rows: DemandGridRow[] = [];
  
  // Iterate: ALL countries from countryMaster × ALL categories × ALL subcategories
  // NO hardcoded filters - all 50+ countries participate
  countryMaster.forEach(country => {
    categoriesData.forEach(category => {
      const categorySlug = nameToSlug(category.name);
      
      category.subcategories.forEach(subcategory => {
        const subcategorySlug = nameToSlug(subcategory);
        
        rows.push({
          id: generateRowId(country.code, subcategorySlug),
          category_slug: categorySlug,
          category_name: category.name,
          subcategory_slug: subcategorySlug,
          subcategory_name: subcategory,
          country_code: country.code,
          country_name: country.name,
          state: 'Detected', // All taxonomy-derived = "Detected"
          intent_score: 0, // No fake numbers
          estimated_value: 0, // No fake numbers
          capacity: null,
          status: 'No Lane', // Default until lane activated
          source: 'seo_taxonomy',
          last_detected_at: null,
        });
      });
    });
  });
  
  return rows;
};

/**
 * Get filtered demand grid rows.
 * Supports filtering by country, category, subcategory, and status.
 */
export const getFilteredDemandGrid = (
  filters: DemandGridFilters,
  limit: number = 100
): DemandGridRow[] => {
  let rows = generateDemandGrid();
  
  // Apply country filter
  if (filters.country && filters.country !== 'all') {
    rows = rows.filter(row => row.country_code === filters.country);
  }
  
  // Apply category filter
  if (filters.category && filters.category !== 'all') {
    rows = rows.filter(row => row.category_slug === filters.category);
  }
  
  // Apply subcategory filter
  if (filters.subcategory && filters.subcategory !== 'all') {
    rows = rows.filter(row => row.subcategory_slug === filters.subcategory);
  }
  
  // Apply status filter
  if (filters.status && filters.status !== 'all') {
    rows = rows.filter(row => row.status === filters.status);
  }
  
  // Return limited rows for performance
  return rows.slice(0, limit);
};

// ============= STATISTICS =============

/**
 * Calculate demand grid statistics without generating all rows.
 * Uses countryMaster for accurate global coverage stats.
 */
export const getDemandGridStats = (): DemandGridStats => {
  const totalCountries = countryMaster.length; // Now 50+ countries
  const totalCategories = categoriesData.length;
  
  // Count all subcategories (products)
  const totalSubcategories = categoriesData.reduce(
    (sum, cat) => sum + cat.subcategories.length, 
    0
  );
  
  // Total grid rows = countries × subcategories
  const totalGridRows = totalCountries * totalSubcategories;
  
  return {
    totalCountries,
    totalCategories,
    totalSubcategories,
    totalProducts: totalSubcategories, // Alias for clarity
    totalGridRows,
    source: 'seo_taxonomy',
  };
};

/**
 * Get all countries for dropdown (from countryMaster)
 * Returns ALL 50+ countries - no hardcoded filters
 */
export const getAllCountriesForGrid = (): Array<{ code: string; name: string; flag: string; region: string }> => {
  return countryMaster.map(c => ({ code: c.code, name: c.name, flag: c.flag, region: c.region }));
};

/**
 * Get all categories for dropdown (from categories.ts)
 */
export const getAllCategoriesForGrid = (): Array<{ slug: string; name: string }> => {
  return categoriesData.map(cat => ({
    slug: nameToSlug(cat.name),
    name: cat.name,
  }));
};

/**
 * Get subcategories for a specific category
 */
export const getSubcategoriesForCategory = (
  categorySlug: string
): Array<{ slug: string; name: string }> => {
  const category = categoriesData.find(
    cat => nameToSlug(cat.name) === categorySlug
  );
  
  if (!category) return [];
  
  return category.subcategories.map(sub => ({
    slug: nameToSlug(sub),
    name: sub,
  }));
};

// ============= AI INSIGHTS HELPERS =============

/**
 * Get top countries by detection count (for AI Insights panel).
 * Since all are "Detected", this returns countries with most products.
 */
export const getTopCountriesByDetection = (limit: number = 5): Array<{
  country: string;
  countryCode: string;
  detectedCount: number;
}> => {
  // All countries have same product count in taxonomy
  const stats = getDemandGridStats();
  const productsPerCountry = stats.totalSubcategories;
  
  return countryMaster.slice(0, limit).map(c => ({
    country: c.name,
    countryCode: c.code,
    detectedCount: productsPerCountry,
  }));
};

/**
 * Get top categories by detection (for AI Insights panel).
 */
export const getTopCategoriesByDetection = (limit: number = 5): Array<{
  category: string;
  categorySlug: string;
  detectedCount: number;
}> => {
  // Sort categories by subcategory count
  const sorted = [...categoriesData].sort(
    (a, b) => b.subcategories.length - a.subcategories.length
  );
  
  const stats = getDemandGridStats();
  const countriesCount = stats.totalCountries;
  
  return sorted.slice(0, limit).map(cat => ({
    category: cat.name,
    categorySlug: nameToSlug(cat.name),
    // Detection count = countries × subcategories in this category
    detectedCount: countriesCount * cat.subcategories.length,
  }));
};

/**
 * Get lanes needing activation (No Lane + Detected = recommendation)
 */
export const getLanesNeedingActivation = (
  countryCode?: string,
  categorySlug?: string,
  limit: number = 10
): DemandGridRow[] => {
  const filters: DemandGridFilters = {
    country: countryCode || 'all',
    category: categorySlug || 'all',
    status: 'No Lane',
  };
  
  return getFilteredDemandGrid(filters, limit);
};

// ============= DEV TRACEABILITY =============

/**
 * Log demand grid statistics to console.
 * Only executes in DEV mode.
 */
export const logDemandGridStats = (): void => {
  if (import.meta.env.DEV) {
    const stats = getDemandGridStats();
    
    console.group('🌍 Demand Grid – AUTO-GENERATED FROM TAXONOMY');
    console.log('COUNTRIES:', stats.totalCountries);
    console.log('CATEGORIES:', stats.totalCategories);
    console.log('PRODUCTS (subcategories):', stats.totalProducts);
    console.log('GRID ROWS:', stats.totalGridRows.toLocaleString());
    console.log('SOURCE:', stats.source);
    console.log('---');
    console.log('Sample countries:', countryMaster.slice(0, 10).map(c => c.name).join(', '), '...');
    console.log('Sample categories:', categoriesData.slice(0, 5).map(c => c.name).join(', '), '...');
    console.groupEnd();
  }
};
