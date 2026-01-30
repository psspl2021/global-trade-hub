import { useEffect, useMemo } from 'react';
import { useGeoDetection } from './useGeoDetection';

interface GlobalSEOProps {
  title: string;
  description: string;
  productName?: string;
  categoryName?: string;
  canonical?: string;
}

interface GlobalSEOResult {
  enhancedTitle: string;
  enhancedDescription: string;
  hreflangTags: { lang: string; url: string }[];
  geoMeta: {
    region: string;
    placename: string;
    targetCountry: string;
  };
  countryContext: string;
}

/**
 * Global SEO Enhancement Hook
 * 
 * Dynamically enhances meta tags with country context WITHOUT changing URLs.
 * - Title: Appends country context dynamically
 * - Description: Includes "available for buyers in {country}"
 * - hreflang: Language-only targeting (same URL)
 * - Googlebot sees neutral/global content
 */
export function useGlobalSEO({
  title,
  description,
  productName,
  categoryName,
  canonical
}: GlobalSEOProps): GlobalSEOResult {
  const geoData = useGeoDetection();

  const result = useMemo(() => {
    // For bots/crawlers - return neutral content
    if (!geoData.isDetected || geoData.countryCode === 'GLOBAL') {
      return {
        enhancedTitle: title,
        enhancedDescription: `${description} Available for buyers worldwide with managed procurement support.`,
        hreflangTags: getLanguageHreflangTags(canonical || ''),
        geoMeta: {
          region: 'GLOBAL',
          placename: 'Worldwide',
          targetCountry: 'Worldwide'
        },
        countryContext: 'worldwide'
      };
    }

    // For users - enhance with country context
    const countryContext = geoData.countryName;
    const regionContext = geoData.region;

    // Dynamic title enhancement (no keyword stuffing)
    const enhancedTitle = productName 
      ? `${title} | ${regionContext}`
      : title;

    // Dynamic description enhancement
    const enhancedDescription = productName
      ? `${description} Available for buyers in ${countryContext} with verified suppliers and managed procurement.`
      : `${description} Serving buyers in ${countryContext} and ${geoData.nearbyRegions[0]}.`;

    return {
      enhancedTitle,
      enhancedDescription,
      hreflangTags: getLanguageHreflangTags(canonical || ''),
      geoMeta: {
        region: geoData.countryCode,
        placename: countryContext,
        targetCountry: countryContext
      },
      countryContext
    };
  }, [geoData, title, description, productName, categoryName, canonical]);

  // Inject dynamic meta tags
  useEffect(() => {
    if (!geoData.isDetected) return;

    // Only update meta for real users, not bots
    if (geoData.countryCode === 'GLOBAL') return;

    // Update geo meta tags dynamically
    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMeta('geo.region', result.geoMeta.region);
    updateMeta('geo.placename', result.geoMeta.placename);

  }, [geoData, result]);

  return result;
}

/**
 * Generate language-only hreflang tags (same URL, different language)
 * This tells search engines the content is available in multiple languages
 * WITHOUT creating country-specific URLs.
 */
function getLanguageHreflangTags(baseUrl: string): { lang: string; url: string }[] {
  const url = baseUrl || 'https://procuresaathi.com';
  
  return [
    { lang: 'x-default', url },
    { lang: 'en', url },
    { lang: 'en-IN', url },
    { lang: 'en-US', url },
    { lang: 'en-GB', url },
    { lang: 'en-AE', url },
    { lang: 'ar', url },
    { lang: 'hi', url },
    // All point to same URL - language rendering varies
  ];
}

/**
 * Get structured data with geographic scope
 */
export function getGlobalServiceSchema(productName: string, countryName?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "B2B Procurement Platform",
    "name": productName 
      ? `${productName} Sourcing via ProcureSaathi` 
      : "ProcureSaathi B2B Procurement",
    "description": `Source ${productName || 'products'} from verified suppliers. ${countryName ? `Available for buyers in ${countryName}.` : 'Serving 195 countries worldwide.'}`,
    "provider": {
      "@type": "Organization",
      "name": "ProcureSaathi",
      "url": "https://procuresaathi.com"
    },
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": "20.5937",
        "longitude": "78.9629"
      },
      "geoRadius": "20000 km"
    },
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": "https://procuresaathi.com/post-rfq",
      "availableLanguage": ["English", "Hindi"]
    }
  };
}

export default useGlobalSEO;
