// Supported Countries for Geo-Replication Engine
// Phase 1: Middle East + Africa

export interface SupportedCountry {
  code: string;
  name: string;
  seoLabel: string;
  currency: string;
  currencySymbol: string;
  hreflangCode: string; // ISO 639-1 + ISO 3166-1 alpha-2
  logisticsHint: string;
}

export const supportedCountries: SupportedCountry[] = [
  {
    code: 'india',
    name: 'India',
    seoLabel: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    hreflangCode: 'en-in',
    logisticsHint: 'Pan-India delivery via ProcureSaathi logistics network'
  },
  {
    code: 'uae',
    name: 'United Arab Emirates',
    seoLabel: 'UAE',
    currency: 'AED',
    currencySymbol: 'AED',
    hreflangCode: 'en-ae',
    logisticsHint: 'Delivered to Dubai, Abu Dhabi, Sharjah'
  },
  {
    code: 'saudi',
    name: 'Saudi Arabia',
    seoLabel: 'Saudi Arabia',
    currency: 'SAR',
    currencySymbol: 'SAR',
    hreflangCode: 'en-sa',
    logisticsHint: 'Delivered to Riyadh, Jeddah, Dammam'
  },
  {
    code: 'qatar',
    name: 'Qatar',
    seoLabel: 'Qatar',
    currency: 'QAR',
    currencySymbol: 'QAR',
    hreflangCode: 'en-qa',
    logisticsHint: 'Delivered to Doha'
  },
  {
    code: 'kenya',
    name: 'Kenya',
    seoLabel: 'Kenya',
    currency: 'KES',
    currencySymbol: 'KES',
    hreflangCode: 'en-ke',
    logisticsHint: 'Delivered to Nairobi, Mombasa'
  },
  {
    code: 'nigeria',
    name: 'Nigeria',
    seoLabel: 'Nigeria',
    currency: 'NGN',
    currencySymbol: '₦',
    hreflangCode: 'en-ng',
    logisticsHint: 'Delivered to Lagos, Abuja, Port Harcourt'
  }
];

// Quick lookup by code
export const supportedCountriesMap: Record<string, SupportedCountry> = 
  supportedCountries.reduce((acc, country) => {
    acc[country.code] = country;
    return acc;
  }, {} as Record<string, SupportedCountry>);

// Get country by code (case-insensitive)
export function getCountryByCode(code: string): SupportedCountry | undefined {
  return supportedCountriesMap[code.toLowerCase()];
}

// Check if country is supported
export function isCountrySupported(code: string): boolean {
  return !!supportedCountriesMap[code.toLowerCase()];
}

// Get all country codes
export function getAllCountryCodes(): string[] {
  return supportedCountries.map(c => c.code);
}

// Default country (for non-country routes)
export const DEFAULT_COUNTRY = supportedCountries[0]; // India
