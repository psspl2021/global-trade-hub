import { useState, useEffect } from 'react';
import { countries } from '@/data/countries';

interface GeoData {
  countryCode: string;
  countryName: string;
  region: string;
  nearbyRegions: string[];
  tradingPartners: string[];
  languageHint: string;
  isDetected: boolean;
}

// Region mappings for trading context
const REGION_MAPPING: Record<string, { name: string; countries: string[]; tradingPartners: string[] }> = {
  'south-asia': {
    name: 'South Asia',
    countries: ['IN', 'BD', 'PK', 'LK', 'NP', 'BT', 'MV'],
    tradingPartners: ['Middle East', 'Southeast Asia', 'Africa']
  },
  'middle-east': {
    name: 'Middle East',
    countries: ['AE', 'SA', 'QA', 'KW', 'OM', 'BH', 'JO', 'IQ', 'IL', 'LB'],
    tradingPartners: ['South Asia', 'Africa', 'Europe']
  },
  'africa': {
    name: 'Africa',
    countries: ['ZA', 'NG', 'KE', 'GH', 'TZ', 'UG', 'EG', 'MA', 'ET'],
    tradingPartners: ['South Asia', 'Middle East', 'Europe']
  },
  'europe': {
    name: 'Europe',
    countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'PL', 'RO', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'GR', 'CZ', 'HU'],
    tradingPartners: ['South Asia', 'Middle East', 'Americas']
  },
  'north-america': {
    name: 'North America',
    countries: ['US', 'CA', 'MX'],
    tradingPartners: ['South Asia', 'Europe', 'Asia Pacific']
  },
  'asia-pacific': {
    name: 'Asia Pacific',
    countries: ['CN', 'JP', 'KR', 'SG', 'MY', 'TH', 'VN', 'ID', 'PH', 'AU', 'NZ', 'TW', 'HK'],
    tradingPartners: ['South Asia', 'Middle East', 'Europe']
  },
  'south-america': {
    name: 'South America',
    countries: ['BR', 'AR', 'CL', 'CO', 'PE'],
    tradingPartners: ['North America', 'Europe', 'Asia Pacific']
  }
};

// Get region for a country code
function getRegionForCountry(countryCode: string): string {
  for (const [regionKey, regionData] of Object.entries(REGION_MAPPING)) {
    if (regionData.countries.includes(countryCode)) {
      return regionData.name;
    }
  }
  return 'Global Markets';
}

// Get nearby regions for trading context
function getNearbyRegions(countryCode: string): string[] {
  for (const [_, regionData] of Object.entries(REGION_MAPPING)) {
    if (regionData.countries.includes(countryCode)) {
      return regionData.tradingPartners;
    }
  }
  return ['South Asia', 'Middle East', 'Africa'];
}

// Get trading partners for a region
function getTradingPartners(region: string): string[] {
  for (const [_, regionData] of Object.entries(REGION_MAPPING)) {
    if (regionData.name === region) {
      return regionData.tradingPartners;
    }
  }
  return ['South Asia', 'Middle East', 'Africa'];
}

// Language mapping for hreflang
const LANGUAGE_MAP: Record<string, string> = {
  'IN': 'en-IN', 'US': 'en-US', 'GB': 'en-GB', 'AU': 'en-AU', 'CA': 'en-CA',
  'AE': 'en-AE', 'SA': 'ar-SA', 'DE': 'de-DE', 'FR': 'fr-FR', 'ES': 'es-ES',
  'IT': 'it-IT', 'NL': 'nl-NL', 'JP': 'ja-JP', 'CN': 'zh-CN', 'KR': 'ko-KR',
  'RU': 'ru-RU', 'BR': 'pt-BR', 'MX': 'es-MX', 'AR': 'es-AR'
};

/**
 * Geo Detection Hook
 * 
 * Detects user country client-side for personalized content.
 * - Does NOT create new URLs
 * - Returns neutral/global for bots
 * - SSR-safe with fallbacks
 */
export function useGeoDetection(): GeoData {
  const [geoData, setGeoData] = useState<GeoData>({
    countryCode: '',
    countryName: '',
    region: 'Global Markets',
    nearbyRegions: ['South Asia', 'Middle East', 'Africa'],
    tradingPartners: ['Asia', 'Middle East', 'Africa'],
    languageHint: 'en',
    isDetected: false
  });

  useEffect(() => {
    // Skip detection for bots/crawlers - serve neutral content
    const userAgent = navigator.userAgent.toLowerCase();
    const isBot = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|embedly|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator/i.test(userAgent);
    
    if (isBot) {
      // Bots get neutral/global content
      setGeoData({
        countryCode: 'GLOBAL',
        countryName: 'Worldwide',
        region: 'Global Markets',
        nearbyRegions: ['South Asia', 'Middle East', 'Africa', 'Europe', 'Americas'],
        tradingPartners: ['Asia', 'Middle East', 'Africa', 'Europe', 'Americas'],
        languageHint: 'en',
        isDetected: true
      });
      return;
    }

    // Try timezone-based detection (privacy-friendly, no API needed)
    const detectFromTimezone = () => {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const timezoneCountryMap: Record<string, string> = {
          'Asia/Kolkata': 'IN', 'Asia/Mumbai': 'IN', 'Asia/Calcutta': 'IN',
          'America/New_York': 'US', 'America/Los_Angeles': 'US', 'America/Chicago': 'US',
          'Europe/London': 'GB', 'Europe/Berlin': 'DE', 'Europe/Paris': 'FR',
          'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Singapore': 'SG',
          'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN', 'Asia/Seoul': 'KR',
          'Australia/Sydney': 'AU', 'Europe/Amsterdam': 'NL', 'Europe/Rome': 'IT',
          'Africa/Lagos': 'NG', 'Africa/Johannesburg': 'ZA', 'Africa/Nairobi': 'KE',
          'America/Sao_Paulo': 'BR', 'Asia/Jakarta': 'ID', 'Asia/Bangkok': 'TH',
          'Europe/Madrid': 'ES', 'Europe/Warsaw': 'PL', 'Europe/Stockholm': 'SE'
        };
        
        return timezoneCountryMap[timezone] || 'IN'; // Default to India
      } catch {
        return 'IN';
      }
    };

    // Detect language preference
    const detectLanguage = () => {
      const browserLang = navigator.language || 'en';
      return browserLang.split('-')[0];
    };

    const countryCode = detectFromTimezone();
    const country = countries.find(c => c.code === countryCode);
    const region = getRegionForCountry(countryCode);
    const nearbyRegions = getNearbyRegions(countryCode);
    const tradingPartners = getTradingPartners(region);
    const languageHint = LANGUAGE_MAP[countryCode]?.split('-')[0] || detectLanguage();

    setGeoData({
      countryCode,
      countryName: country?.name || 'Your Region',
      region,
      nearbyRegions,
      tradingPartners,
      languageHint,
      isDetected: true
    });
  }, []);

  return geoData;
}

/**
 * Get rotating country mentions for trust signals
 * Returns different countries on each call for dynamic display
 */
export function getRotatingCountryMentions(count: number = 5): string[] {
  const highValueCountries = [
    'United States', 'United Kingdom', 'Germany', 'France', 'Netherlands',
    'United Arab Emirates', 'Saudi Arabia', 'Singapore', 'Japan', 'Australia',
    'Canada', 'South Africa', 'Nigeria', 'Kenya', 'Brazil'
  ];
  
  // Shuffle and return requested count
  const shuffled = [...highValueCountries].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get demand status text (geo-safe language)
 */
export function getDemandStatus(): 'Detected' | 'Emerging' | 'Monitoring' {
  const statuses: ('Detected' | 'Emerging' | 'Monitoring')[] = ['Detected', 'Emerging', 'Monitoring'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

export default useGeoDetection;
