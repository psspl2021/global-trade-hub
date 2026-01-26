// Supported Countries for Geo-Replication Engine
// Phase 1: Middle East + Africa
// Phase 2: USA, UK, Europe, Singapore expansion

export interface SupportedCountry {
  code: string;
  name: string;
  seoLabel: string;
  currency: string;
  currencySymbol: string;
  hreflangCode: string; // ISO 639-1 + ISO 3166-1 alpha-2
  logisticsHint: string;
  region?: 'asia' | 'middle-east' | 'africa' | 'americas' | 'europe';
}

export const supportedCountries: SupportedCountry[] = [
  // India - Primary Market
  {
    code: 'india',
    name: 'India',
    seoLabel: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    hreflangCode: 'en-in',
    logisticsHint: 'Pan-India delivery via ProcureSaathi logistics network',
    region: 'asia'
  },
  // Middle East Markets
  {
    code: 'uae',
    name: 'United Arab Emirates',
    seoLabel: 'UAE',
    currency: 'AED',
    currencySymbol: 'AED',
    hreflangCode: 'en-ae',
    logisticsHint: 'Delivered to Dubai, Abu Dhabi, Sharjah',
    region: 'middle-east'
  },
  {
    code: 'saudi',
    name: 'Saudi Arabia',
    seoLabel: 'Saudi Arabia',
    currency: 'SAR',
    currencySymbol: 'SAR',
    hreflangCode: 'en-sa',
    logisticsHint: 'Delivered to Riyadh, Jeddah, Dammam',
    region: 'middle-east'
  },
  {
    code: 'qatar',
    name: 'Qatar',
    seoLabel: 'Qatar',
    currency: 'QAR',
    currencySymbol: 'QAR',
    hreflangCode: 'en-qa',
    logisticsHint: 'Delivered to Doha',
    region: 'middle-east'
  },
  // African Markets
  {
    code: 'kenya',
    name: 'Kenya',
    seoLabel: 'Kenya',
    currency: 'KES',
    currencySymbol: 'KES',
    hreflangCode: 'en-ke',
    logisticsHint: 'Delivered to Nairobi, Mombasa',
    region: 'africa'
  },
  {
    code: 'nigeria',
    name: 'Nigeria',
    seoLabel: 'Nigeria',
    currency: 'NGN',
    currencySymbol: '₦',
    hreflangCode: 'en-ng',
    logisticsHint: 'Delivered to Lagos, Abuja, Port Harcourt',
    region: 'africa'
  },
  // Phase 2: Americas
  {
    code: 'usa',
    name: 'United States',
    seoLabel: 'USA',
    currency: 'USD',
    currencySymbol: '$',
    hreflangCode: 'en-us',
    logisticsHint: 'Delivered to major US ports and cities',
    region: 'americas'
  },
  // Phase 2: Europe
  {
    code: 'uk',
    name: 'United Kingdom',
    seoLabel: 'UK',
    currency: 'GBP',
    currencySymbol: '£',
    hreflangCode: 'en-gb',
    logisticsHint: 'Delivered to London, Manchester, Birmingham',
    region: 'europe'
  },
  {
    code: 'europe',
    name: 'European Union',
    seoLabel: 'Europe',
    currency: 'EUR',
    currencySymbol: '€',
    hreflangCode: 'en',
    logisticsHint: 'Delivered to major EU ports and cities',
    region: 'europe'
  },
  // Phase 2: Asia-Pacific
  {
    code: 'singapore',
    name: 'Singapore',
    seoLabel: 'Singapore',
    currency: 'SGD',
    currencySymbol: 'S$',
    hreflangCode: 'en-sg',
    logisticsHint: 'Delivered to Singapore',
    region: 'asia'
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

// Get countries by region
export function getCountriesByRegion(region: SupportedCountry['region']): SupportedCountry[] {
  return supportedCountries.filter(c => c.region === region);
}

// Default country (for non-country routes)
export const DEFAULT_COUNTRY = supportedCountries[0]; // India
