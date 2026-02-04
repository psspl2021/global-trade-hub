/**
 * ============================================================
 * SUPPORTED COUNTRIES - LEGACY COMPATIBILITY LAYER
 * ============================================================
 * 
 * This file now wraps the centralized countryMaster for backward compatibility.
 * All new code should import directly from '@/data/countryMaster'.
 * 
 * DEPRECATED: Use countryMaster.ts instead
 */

import {
  countryMaster,
  getCountryByCode as _getCountryByCode,
  type CountryConfig,
  type Region,
} from './countryMaster';

// Legacy interface for backward compatibility
export interface SupportedCountry {
  code: string;
  name: string;
  seoLabel: string;
  currency: string;
  currencySymbol: string;
  hreflangCode: string;
  logisticsHint: string;
  region?: 'asia' | 'middle-east' | 'africa' | 'americas' | 'europe' | 'oceania';
}

// Convert countryMaster to legacy format
export const supportedCountries: SupportedCountry[] = countryMaster.map(country => ({
  code: country.code.toLowerCase(),
  name: country.name,
  seoLabel: country.name,
  currency: country.currency || 'USD',
  currencySymbol: country.currencySymbol || '$',
  hreflangCode: country.hreflangCode || 'en',
  logisticsHint: `Delivered to ${country.name}`,
  region: country.region,
}));

// Quick lookup by code (lowercase for legacy compatibility)
export const supportedCountriesMap: Record<string, SupportedCountry> = 
  supportedCountries.reduce((acc, country) => {
    acc[country.code] = country;
    return acc;
  }, {} as Record<string, SupportedCountry>);

// Get country by code (case-insensitive) - LEGACY
export function getCountryByCode(code: string): SupportedCountry | undefined {
  return supportedCountriesMap[code.toLowerCase()];
}

// Check if country is supported - LEGACY
export function isCountrySupported(code: string): boolean {
  return !!supportedCountriesMap[code.toLowerCase()];
}

// Get all country codes - LEGACY
export function getAllCountryCodes(): string[] {
  return supportedCountries.map(c => c.code);
}

// Get countries by region - LEGACY
export function getCountriesByRegion(region: SupportedCountry['region']): SupportedCountry[] {
  return supportedCountries.filter(c => c.region === region);
}

// Default country (for non-country routes) - LEGACY
export const DEFAULT_COUNTRY = supportedCountries.find(c => c.code === 'in') || supportedCountries[0];

