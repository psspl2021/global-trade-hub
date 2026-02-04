/**
 * ============================================================
 * COUNTRY MASTER - SINGLE SOURCE OF TRUTH
 * ============================================================
 * 
 * Centralized country configuration used across:
 * - RFQ Forms (destination country selection)
 * - Demand Intelligence (signal tracking)
 * - Dashboard Grid (country filters)
 * - Homepage (live demand display)
 * - SEO/Discovery (human-readable country names)
 * 
 * ADDING A NEW COUNTRY:
 * 1. Add entry to the appropriate region section
 * 2. That's it! No other code changes needed.
 * 
 * Architecture:
 * - ISO 3166-1 alpha-2 codes (standard)
 * - Flag emoji for visual display
 * - Region grouping for UI organization
 * - Trade priority for business focus
 */

// ============= TYPES =============

export type Region = 'asia' | 'middle-east' | 'europe' | 'africa' | 'americas' | 'oceania';
export type TradePriority = 'high' | 'medium' | 'exploratory';

export interface CountryConfig {
  code: string;           // ISO 3166-1 alpha-2 (e.g., 'IN', 'US')
  name: string;           // Full country name (e.g., 'India', 'United States')
  flag: string;           // Flag emoji (e.g., '🇮🇳')
  region: Region;         // Geographic region for grouping
  tradePriority: TradePriority; // Business priority tier
  currency?: string;      // Optional: ISO 4217 currency code
  currencySymbol?: string; // Optional: Currency symbol
  hreflangCode?: string;  // Optional: For SEO hreflang tags
}

// ============= COUNTRY MASTER DATA =============

export const countryMaster: CountryConfig[] = [
  // ============= ASIA (Primary Markets) =============
  { code: 'IN', name: 'India', flag: '🇮🇳', region: 'asia', tradePriority: 'high', currency: 'INR', currencySymbol: '₹', hreflangCode: 'en-in' },
  { code: 'CN', name: 'China', flag: '🇨🇳', region: 'asia', tradePriority: 'high', currency: 'CNY', currencySymbol: '¥', hreflangCode: 'zh-cn' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', region: 'asia', tradePriority: 'high', currency: 'JPY', currencySymbol: '¥', hreflangCode: 'ja-jp' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', region: 'asia', tradePriority: 'high', currency: 'KRW', currencySymbol: '₩', hreflangCode: 'ko-kr' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', region: 'asia', tradePriority: 'medium', currency: 'VND', currencySymbol: '₫' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', region: 'asia', tradePriority: 'medium', currency: 'THB', currencySymbol: '฿' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', region: 'asia', tradePriority: 'medium', currency: 'IDR', currencySymbol: 'Rp' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', region: 'asia', tradePriority: 'medium', currency: 'MYR', currencySymbol: 'RM' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', region: 'asia', tradePriority: 'high', currency: 'SGD', currencySymbol: 'S$', hreflangCode: 'en-sg' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', region: 'asia', tradePriority: 'medium', currency: 'PHP', currencySymbol: '₱' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', region: 'asia', tradePriority: 'medium', currency: 'BDT', currencySymbol: '৳' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', region: 'asia', tradePriority: 'medium', currency: 'LKR', currencySymbol: 'Rs' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', region: 'asia', tradePriority: 'medium', currency: 'PKR', currencySymbol: '₨' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', region: 'asia', tradePriority: 'exploratory', currency: 'NPR', currencySymbol: 'Rs' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲', region: 'asia', tradePriority: 'exploratory', currency: 'MMK', currencySymbol: 'K' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭', region: 'asia', tradePriority: 'exploratory', currency: 'KHR', currencySymbol: '៛' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', region: 'asia', tradePriority: 'medium', currency: 'TWD', currencySymbol: 'NT$' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', region: 'asia', tradePriority: 'high', currency: 'HKD', currencySymbol: 'HK$' },

  // ============= MIDDLE EAST (High Priority Markets) =============
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', region: 'middle-east', tradePriority: 'high', currency: 'AED', currencySymbol: 'AED', hreflangCode: 'en-ae' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', region: 'middle-east', tradePriority: 'high', currency: 'SAR', currencySymbol: 'SAR', hreflangCode: 'en-sa' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', region: 'middle-east', tradePriority: 'high', currency: 'QAR', currencySymbol: 'QAR', hreflangCode: 'en-qa' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', region: 'middle-east', tradePriority: 'high', currency: 'KWD', currencySymbol: 'KD' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', region: 'middle-east', tradePriority: 'medium', currency: 'OMR', currencySymbol: 'OMR' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', region: 'middle-east', tradePriority: 'medium', currency: 'BHD', currencySymbol: 'BD' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', region: 'middle-east', tradePriority: 'medium', currency: 'ILS', currencySymbol: '₪' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', region: 'middle-east', tradePriority: 'high', currency: 'TRY', currencySymbol: '₺' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', region: 'middle-east', tradePriority: 'exploratory', currency: 'JOD', currencySymbol: 'JD' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', region: 'middle-east', tradePriority: 'exploratory', currency: 'LBP', currencySymbol: 'L£' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶', region: 'middle-east', tradePriority: 'exploratory', currency: 'IQD', currencySymbol: 'ID' },

  // ============= EUROPE (Developed Markets) =============
  { code: 'DE', name: 'Germany', flag: '🇩🇪', region: 'europe', tradePriority: 'high', currency: 'EUR', currencySymbol: '€', hreflangCode: 'de-de' },
  { code: 'FR', name: 'France', flag: '🇫🇷', region: 'europe', tradePriority: 'high', currency: 'EUR', currencySymbol: '€', hreflangCode: 'fr-fr' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', region: 'europe', tradePriority: 'high', currency: 'EUR', currencySymbol: '€', hreflangCode: 'it-it' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', region: 'europe', tradePriority: 'high', currency: 'EUR', currencySymbol: '€', hreflangCode: 'es-es' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', region: 'europe', tradePriority: 'high', currency: 'EUR', currencySymbol: '€', hreflangCode: 'nl-nl' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', region: 'europe', tradePriority: 'medium', currency: 'EUR', currencySymbol: '€' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', region: 'europe', tradePriority: 'medium', currency: 'PLN', currencySymbol: 'zł' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', region: 'europe', tradePriority: 'medium', currency: 'CZK', currencySymbol: 'Kč' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', region: 'europe', tradePriority: 'medium', currency: 'RON', currencySymbol: 'lei' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', region: 'europe', tradePriority: 'medium', currency: 'HUF', currencySymbol: 'Ft' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', region: 'europe', tradePriority: 'medium', currency: 'SEK', currencySymbol: 'kr' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', region: 'europe', tradePriority: 'medium', currency: 'NOK', currencySymbol: 'kr' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', region: 'europe', tradePriority: 'medium', currency: 'DKK', currencySymbol: 'kr' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', region: 'europe', tradePriority: 'high', currency: 'GBP', currencySymbol: '£', hreflangCode: 'en-gb' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', region: 'europe', tradePriority: 'medium', currency: 'EUR', currencySymbol: '€' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', region: 'europe', tradePriority: 'high', currency: 'CHF', currencySymbol: 'CHF' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', region: 'europe', tradePriority: 'exploratory', currency: 'EUR', currencySymbol: '€' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', region: 'europe', tradePriority: 'exploratory', currency: 'EUR', currencySymbol: '€' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', region: 'europe', tradePriority: 'medium', currency: 'EUR', currencySymbol: '€' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', region: 'europe', tradePriority: 'exploratory', currency: 'EUR', currencySymbol: '€' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', region: 'europe', tradePriority: 'exploratory', currency: 'RUB', currencySymbol: '₽' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', region: 'europe', tradePriority: 'exploratory', currency: 'UAH', currencySymbol: '₴' },

  // ============= AFRICA (Emerging Markets) =============
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', region: 'africa', tradePriority: 'high', currency: 'NGN', currencySymbol: '₦', hreflangCode: 'en-ng' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', region: 'africa', tradePriority: 'high', currency: 'KES', currencySymbol: 'KES', hreflangCode: 'en-ke' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', region: 'africa', tradePriority: 'high', currency: 'ZAR', currencySymbol: 'R' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', region: 'africa', tradePriority: 'high', currency: 'EGP', currencySymbol: 'E£' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', region: 'africa', tradePriority: 'medium', currency: 'TZS', currencySymbol: 'TSh' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', region: 'africa', tradePriority: 'medium', currency: 'GHS', currencySymbol: '₵' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', region: 'africa', tradePriority: 'medium', currency: 'ETB', currencySymbol: 'Br' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', region: 'africa', tradePriority: 'medium', currency: 'MAD', currencySymbol: 'DH' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', region: 'africa', tradePriority: 'exploratory', currency: 'UGX', currencySymbol: 'USh' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', region: 'africa', tradePriority: 'exploratory', currency: 'XOF', currencySymbol: 'CFA' },
  { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮', region: 'africa', tradePriority: 'exploratory', currency: 'XOF', currencySymbol: 'CFA' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', region: 'africa', tradePriority: 'exploratory', currency: 'XAF', currencySymbol: 'FCFA' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', region: 'africa', tradePriority: 'medium', currency: 'DZD', currencySymbol: 'DA' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', region: 'africa', tradePriority: 'exploratory', currency: 'TND', currencySymbol: 'DT' },

  // ============= AMERICAS (Strategic Markets) =============
  { code: 'US', name: 'United States', flag: '🇺🇸', region: 'americas', tradePriority: 'high', currency: 'USD', currencySymbol: '$', hreflangCode: 'en-us' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', region: 'americas', tradePriority: 'high', currency: 'CAD', currencySymbol: 'C$' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', region: 'americas', tradePriority: 'high', currency: 'MXN', currencySymbol: 'MX$' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', region: 'americas', tradePriority: 'high', currency: 'BRL', currencySymbol: 'R$' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', region: 'americas', tradePriority: 'medium', currency: 'ARS', currencySymbol: '$' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', region: 'americas', tradePriority: 'medium', currency: 'CLP', currencySymbol: '$' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', region: 'americas', tradePriority: 'medium', currency: 'COP', currencySymbol: '$' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', region: 'americas', tradePriority: 'medium', currency: 'PEN', currencySymbol: 'S/' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', region: 'americas', tradePriority: 'exploratory', currency: 'USD', currencySymbol: '$' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', region: 'americas', tradePriority: 'exploratory', currency: 'VES', currencySymbol: 'Bs' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦', region: 'americas', tradePriority: 'exploratory', currency: 'PAB', currencySymbol: 'B/' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', region: 'americas', tradePriority: 'exploratory', currency: 'CRC', currencySymbol: '₡' },

  // ============= OCEANIA =============
  { code: 'AU', name: 'Australia', flag: '🇦🇺', region: 'oceania', tradePriority: 'high', currency: 'AUD', currencySymbol: 'A$' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', region: 'oceania', tradePriority: 'medium', currency: 'NZD', currencySymbol: 'NZ$' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', region: 'oceania', tradePriority: 'exploratory', currency: 'FJD', currencySymbol: 'FJ$' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬', region: 'oceania', tradePriority: 'exploratory', currency: 'PGK', currencySymbol: 'K' },
];

// ============= LOOKUP UTILITIES =============

/**
 * Get country by ISO code (case-insensitive)
 */
export function getCountryByCode(code: string): CountryConfig | undefined {
  return countryMaster.find(c => c.code.toUpperCase() === code.toUpperCase());
}

/**
 * Get country name by code (with fallback)
 */
export function getCountryName(code: string): string {
  const country = getCountryByCode(code);
  return country?.name || code;
}

/**
 * Get flag emoji by country code
 */
export function getCountryFlag(code: string): string {
  const country = getCountryByCode(code);
  return country?.flag || '🌍';
}

/**
 * Check if country code is valid
 */
export function isValidCountryCode(code: string): boolean {
  return countryMaster.some(c => c.code.toUpperCase() === code.toUpperCase());
}

// ============= REGION UTILITIES =============

/**
 * Get human-readable region name
 */
export function getRegionName(region: Region): string {
  const regionNames: Record<Region, string> = {
    'asia': 'Asia',
    'middle-east': 'Middle East',
    'europe': 'Europe',
    'africa': 'Africa',
    'americas': 'Americas',
    'oceania': 'Oceania',
  };
  return regionNames[region] || region;
}

/**
 * Get all countries in a region
 */
export function getCountriesByRegion(region: Region): CountryConfig[] {
  return countryMaster.filter(c => c.region === region);
}

/**
 * Get all unique regions
 */
export function getAllRegions(): Region[] {
  return ['asia', 'middle-east', 'europe', 'africa', 'americas', 'oceania'];
}

/**
 * Get countries grouped by region
 */
export function getCountriesGroupedByRegion(): Record<Region, CountryConfig[]> {
  const grouped: Record<Region, CountryConfig[]> = {
    'asia': [],
    'middle-east': [],
    'europe': [],
    'africa': [],
    'americas': [],
    'oceania': [],
  };
  
  countryMaster.forEach(country => {
    grouped[country.region].push(country);
  });
  
  return grouped;
}

// ============= TRADE PRIORITY UTILITIES =============

/**
 * Get countries by trade priority
 */
export function getCountriesByPriority(priority: TradePriority): CountryConfig[] {
  return countryMaster.filter(c => c.tradePriority === priority);
}

/**
 * Get high-priority countries (for featured displays)
 */
export function getHighPriorityCountries(): CountryConfig[] {
  return countryMaster.filter(c => c.tradePriority === 'high');
}

// ============= RFQ FORM HELPERS =============

/**
 * Get countries for RFQ dropdown (grouped by region)
 * Returns in order: High priority first, then by region
 */
export function getCountriesForRFQDropdown(): Array<{
  region: string;
  regionName: string;
  countries: CountryConfig[];
}> {
  const grouped = getCountriesGroupedByRegion();
  const regionOrder: Region[] = ['asia', 'middle-east', 'europe', 'africa', 'americas', 'oceania'];
  
  return regionOrder.map(region => ({
    region,
    regionName: getRegionName(region),
    countries: grouped[region].sort((a, b) => {
      // Sort by priority first (high > medium > exploratory)
      const priorityOrder = { high: 0, medium: 1, exploratory: 2 };
      const priorityDiff = priorityOrder[a.tradePriority] - priorityOrder[b.tradePriority];
      if (priorityDiff !== 0) return priorityDiff;
      // Then alphabetically
      return a.name.localeCompare(b.name);
    }),
  }));
}

/**
 * Get default country (India)
 */
export function getDefaultCountry(): CountryConfig {
  return countryMaster.find(c => c.code === 'IN') || countryMaster[0];
}

// ============= DEMAND INTELLIGENCE HELPERS =============

/**
 * Get all country codes for demand tracking
 * NO hardcoded filters - all countries participate
 */
export function getAllCountryCodes(): string[] {
  return countryMaster.map(c => c.code);
}

/**
 * Get country count by region (for dashboard stats)
 */
export function getCountryCountByRegion(): Record<Region, number> {
  const counts: Record<Region, number> = {
    'asia': 0,
    'middle-east': 0,
    'europe': 0,
    'africa': 0,
    'americas': 0,
    'oceania': 0,
  };
  
  countryMaster.forEach(country => {
    counts[country.region]++;
  });
  
  return counts;
}

// ============= HOMEPAGE DISPLAY HELPERS =============

/**
 * Get top countries for homepage rotation
 * Prioritizes diversity across regions
 */
export function getTopCountriesForHomepage(limit: number = 8): CountryConfig[] {
  const regions = getAllRegions();
  const selected: CountryConfig[] = [];
  
  // First pass: get one high-priority from each region
  for (const region of regions) {
    if (selected.length >= limit) break;
    const highPriority = getCountriesByRegion(region).find(c => c.tradePriority === 'high');
    if (highPriority) selected.push(highPriority);
  }
  
  // Second pass: fill remaining slots with other high-priority countries
  if (selected.length < limit) {
    const remaining = getHighPriorityCountries().filter(
      c => !selected.some(s => s.code === c.code)
    );
    selected.push(...remaining.slice(0, limit - selected.length));
  }
  
  return selected;
}

// ============= SPECIAL ENTRIES =============

/**
 * Get "Global" entry for worldwide RFQs
 */
export function getGlobalEntry(): { code: string; name: string; flag: string } {
  return { code: 'GLOBAL', name: 'Worldwide', flag: '🌍' };
}

// ============= DEV UTILITIES =============

/**
 * Log country master stats (DEV only)
 */
export function logCountryMasterStats(): void {
  if (import.meta.env.DEV) {
    const counts = getCountryCountByRegion();
    console.group('🌍 Country Master Statistics');
    console.log('Total Countries:', countryMaster.length);
    console.log('By Region:', counts);
    console.log('High Priority:', getHighPriorityCountries().length);
    console.log('Medium Priority:', getCountriesByPriority('medium').length);
    console.log('Exploratory:', getCountriesByPriority('exploratory').length);
    console.groupEnd();
  }
}

// ============= EXPORTS =============

export default countryMaster;
