/**
 * ============================================================
 * COUNTRY REGIONS CONFIG - REUSABLE EVERYWHERE
 * ============================================================
 * 
 * Clean, structured country configuration for:
 * - RFQ Forms (Domestic vs Import/Export)
 * - Demand Sensors
 * - Analytics
 * - Pricing Rules
 * - Supplier Matching
 * 
 * USAGE:
 * import { COUNTRY_REGIONS, getAllCountries, getCountryByCode } from '@/config/countryConfig';
 */

export interface Country {
  code: string;  // ISO 3166-1 alpha-2
  name: string;  // Human-readable name
}

export interface RegionConfig {
  label: string;
  countries: Country[];
}

export type RegionKey = 
  | 'INDIA' 
  | 'AMERICAS' 
  | 'OCEANIA' 
  | 'MIDDLE_EAST' 
  | 'AFRICA' 
  | 'EUROPE' 
  | 'ASIA';

// ============= COUNTRY REGIONS =============

export const COUNTRY_REGIONS: Record<RegionKey, RegionConfig> = {
  INDIA: {
    label: "Domestic (India)",
    countries: [
      { code: "IN", name: "India" }
    ]
  },

  ASIA: {
    label: "Asia",
    countries: [
      { code: "CN", name: "China" },
      { code: "JP", name: "Japan" },
      { code: "KR", name: "South Korea" },
      { code: "SG", name: "Singapore" },
      { code: "MY", name: "Malaysia" },
      { code: "TH", name: "Thailand" },
      { code: "VN", name: "Vietnam" },
      { code: "ID", name: "Indonesia" },
      { code: "PH", name: "Philippines" },
      { code: "BD", name: "Bangladesh" },
      { code: "LK", name: "Sri Lanka" },
      { code: "PK", name: "Pakistan" },
      { code: "TW", name: "Taiwan" },
      { code: "HK", name: "Hong Kong" }
    ]
  },

  MIDDLE_EAST: {
    label: "Middle East",
    countries: [
      { code: "AE", name: "United Arab Emirates" },
      { code: "SA", name: "Saudi Arabia" },
      { code: "QA", name: "Qatar" },
      { code: "KW", name: "Kuwait" },
      { code: "OM", name: "Oman" },
      { code: "BH", name: "Bahrain" },
      { code: "TR", name: "Turkey" },
      { code: "IL", name: "Israel" },
      { code: "JO", name: "Jordan" },
      { code: "IQ", name: "Iraq" }
    ]
  },

  EUROPE: {
    label: "Europe",
    countries: [
      { code: "DE", name: "Germany" },
      { code: "GB", name: "United Kingdom" },
      { code: "FR", name: "France" },
      { code: "IT", name: "Italy" },
      { code: "ES", name: "Spain" },
      { code: "NL", name: "Netherlands" },
      { code: "BE", name: "Belgium" },
      { code: "PL", name: "Poland" },
      { code: "CZ", name: "Czech Republic" },
      { code: "RO", name: "Romania" },
      { code: "HU", name: "Hungary" },
      { code: "SE", name: "Sweden" },
      { code: "NO", name: "Norway" },
      { code: "DK", name: "Denmark" },
      { code: "AT", name: "Austria" },
      { code: "CH", name: "Switzerland" },
      { code: "PT", name: "Portugal" },
      { code: "IE", name: "Ireland" },
      { code: "FI", name: "Finland" }
    ]
  },

  AFRICA: {
    label: "Africa",
    countries: [
      { code: "NG", name: "Nigeria" },
      { code: "KE", name: "Kenya" },
      { code: "ZA", name: "South Africa" },
      { code: "EG", name: "Egypt" },
      { code: "TZ", name: "Tanzania" },
      { code: "GH", name: "Ghana" },
      { code: "ET", name: "Ethiopia" },
      { code: "MA", name: "Morocco" },
      { code: "UG", name: "Uganda" },
      { code: "DZ", name: "Algeria" }
    ]
  },

  AMERICAS: {
    label: "Americas",
    countries: [
      { code: "US", name: "United States" },
      { code: "CA", name: "Canada" },
      { code: "MX", name: "Mexico" },
      { code: "BR", name: "Brazil" },
      { code: "AR", name: "Argentina" },
      { code: "CL", name: "Chile" },
      { code: "CO", name: "Colombia" },
      { code: "PE", name: "Peru" },
      { code: "EC", name: "Ecuador" },
      { code: "PA", name: "Panama" }
    ]
  },

  OCEANIA: {
    label: "Oceania",
    countries: [
      { code: "AU", name: "Australia" },
      { code: "NZ", name: "New Zealand" }
    ]
  }
};

// ============= UTILITY FUNCTIONS =============

/**
 * Get all countries as a flat array
 */
export function getAllCountries(): Country[] {
  const all: Country[] = [];
  Object.values(COUNTRY_REGIONS).forEach(region => {
    all.push(...region.countries);
  });
  return all;
}

/**
 * Get country by ISO code
 */
export function getCountryByCode(code: string): Country | undefined {
  const upperCode = code.toUpperCase();
  for (const region of Object.values(COUNTRY_REGIONS)) {
    const found = region.countries.find(c => c.code === upperCode);
    if (found) return found;
  }
  return undefined;
}

/**
 * Get country name by code (with fallback)
 */
export function getCountryName(code: string): string {
  const country = getCountryByCode(code);
  return country?.name || code;
}

/**
 * Get all country codes
 */
export function getAllCountryCodes(): string[] {
  return getAllCountries().map(c => c.code);
}

/**
 * Check if code is valid
 */
export function isValidCountryCode(code: string): boolean {
  return getCountryByCode(code) !== undefined;
}

/**
 * Get region order for dropdown display
 * (Export regions only - excludes INDIA since it's for Domestic)
 */
export function getExportRegionOrder(): RegionKey[] {
  return ['ASIA', 'MIDDLE_EAST', 'EUROPE', 'AFRICA', 'AMERICAS', 'OCEANIA'];
}

/**
 * Get regions for export dropdown (excludes domestic India)
 */
export function getExportRegions(): Array<{ key: RegionKey; config: RegionConfig }> {
  return getExportRegionOrder().map(key => ({
    key,
    config: COUNTRY_REGIONS[key]
  }));
}

/**
 * Parse comma-separated country string to array
 */
export function parseCountryString(str: string): string[] {
  if (!str) return [];
  return str.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
}

/**
 * Convert country array to comma-separated string
 */
export function toCountryString(codes: string[]): string {
  return codes.map(c => c.toUpperCase()).join(',');
}

/**
 * Check if country code is domestic (India)
 */
export function isDomestic(code: string): boolean {
  return code.toUpperCase() === 'IN';
}

/**
 * Get display string for multiple countries
 */
export function getCountryDisplayString(codes: string[]): string {
  if (!codes.length) return '';
  if (codes.length === 1) return getCountryName(codes[0]);
  if (codes.length === 2) return codes.map(getCountryName).join(' & ');
  return `${getCountryName(codes[0])} +${codes.length - 1} more`;
}
