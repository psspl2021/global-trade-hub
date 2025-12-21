import { useEffect } from 'react';
import { injectStructuredData } from './useSEO';

interface RegionalBusinessData {
  country: string;
  countryCode: string;
  region: string;
  currency: string;
  telephone: string;
  languages: string[];
  trafficShare?: string;
}

// Regional office data - Prioritized by actual traffic (Updated Dec 2024)
const regionalOffices: Record<string, RegionalBusinessData> = {
  // Primary market - 85% traffic
  india: {
    country: "India",
    countryCode: "IN",
    region: "South Asia",
    currency: "INR",
    telephone: "+91-8368127357",
    languages: ["en-IN", "hi-IN"],
    trafficShare: "85%",
  },
  // Secondary markets by traffic
  usa: {
    country: "United States",
    countryCode: "US",
    region: "North America",
    currency: "USD",
    telephone: "+91-8368127357",
    languages: ["en-US"],
    trafficShare: "6%",
  },
  uk: {
    country: "United Kingdom",
    countryCode: "GB",
    region: "Europe",
    currency: "GBP",
    telephone: "+91-8368127357",
    languages: ["en-GB"],
    trafficShare: "2%",
  },
  france: {
    country: "France",
    countryCode: "FR",
    region: "Europe",
    currency: "EUR",
    telephone: "+91-8368127357",
    languages: ["fr-FR", "en-FR"],
    trafficShare: "2%",
  },
  netherlands: {
    country: "Netherlands",
    countryCode: "NL",
    region: "Europe",
    currency: "EUR",
    telephone: "+91-8368127357",
    languages: ["nl-NL", "en-NL"],
    trafficShare: "1%",
  },
  romania: {
    country: "Romania",
    countryCode: "RO",
    region: "Europe",
    currency: "RON",
    telephone: "+91-8368127357",
    languages: ["ro-RO", "en-RO"],
    trafficShare: "1%",
  },
  spain: {
    country: "Spain",
    countryCode: "ES",
    region: "Europe",
    currency: "EUR",
    telephone: "+91-8368127357",
    languages: ["es-ES", "en-ES"],
    trafficShare: "1%",
  },
  canada: {
    country: "Canada",
    countryCode: "CA",
    region: "North America",
    currency: "CAD",
    telephone: "+91-8368127357",
    languages: ["en-CA", "fr-CA"],
  },
  germany: {
    country: "Germany",
    countryCode: "DE",
    region: "Europe",
    currency: "EUR",
    telephone: "+91-8368127357",
    languages: ["de-DE", "en-DE"],
  },
  uae: {
    country: "United Arab Emirates",
    countryCode: "AE",
    region: "Middle East",
    currency: "AED",
    telephone: "+91-8368127357",
    languages: ["en-AE", "ar-AE"],
  },
};

// Get all target countries for schema
export const getTargetCountries = () => Object.values(regionalOffices).map(r => r.country);

// Generate LocalBusiness schema for a specific region
export const getRegionalLocalBusinessSchema = (countryKey: string) => {
  const regional = regionalOffices[countryKey.toLowerCase()] || regionalOffices.india;
  
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `ProcureSaathi - ${regional.country}`,
    "description": `India's leading B2B sourcing platform serving importers in ${regional.country}. Connect with verified Indian suppliers for ${regional.region} market.`,
    "url": countryKey.toLowerCase() === 'india' 
      ? "https://procuresaathi.com" 
      : `https://procuresaathi.com/source/${countryKey.toLowerCase()}`,
    "logo": "https://procuresaathi.com/logo.png",
    "image": "https://procuresaathi.com/logo.png",
    "telephone": "+91-8368127357",
    "email": "sales@procuresaathi.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "B2B Sourcing Hub",
      "addressLocality": "Mumbai",
      "addressRegion": "Maharashtra",
      "postalCode": "400001",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "19.0760",
      "longitude": "72.8777"
    },
    "areaServed": {
      "@type": "Country",
      "name": regional.country
    },
    "priceRange": "$$",
    "currenciesAccepted": regional.currency,
    "paymentAccepted": "Bank Transfer, Letter of Credit, Wire Transfer",
    "openingHours": "Mo-Fr 09:00-18:00",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": `Indian Products for ${regional.country}`,
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "B2B Supplier Matching",
            "description": `Connect with verified Indian suppliers for ${regional.country} import`
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Logistics Integration",
            "description": `End-to-end shipping from India to ${regional.country}`
          }
        }
      ]
    },
    "sameAs": [
      "https://twitter.com/ProcureSaathi",
      "https://linkedin.com/company/procuresaathi"
    ]
  };
};

// Generate Service schema for B2B sourcing
export const getServiceSchema = (countryKey: string, countryName: string) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "name": `B2B Sourcing from India to ${countryName}`,
  "description": `Connect with verified Indian manufacturers and suppliers for import to ${countryName}. Quality assurance, competitive pricing, and integrated logistics.`,
  "provider": {
    "@type": "Organization",
    "name": "ProcureSaathi",
    "url": "https://procuresaathi.com"
  },
  "areaServed": {
    "@type": "Country",
    "name": countryName
  },
  "serviceType": "B2B Trade Facilitation",
  "availableChannel": {
    "@type": "ServiceChannel",
    "serviceUrl": countryKey.toLowerCase() === 'india' 
      ? "https://procuresaathi.com"
      : `https://procuresaathi.com/source/${countryKey}`,
    "servicePhone": "+91-8368127357",
    "availableLanguage": ["en", "hi"]
  }
});

// Generate ExportAction schema for target markets
export const getExportActionSchema = () => ({
  "@context": "https://schema.org",
  "@type": "TradeAction",
  "name": "Export from India",
  "agent": {
    "@type": "Organization",
    "name": "ProcureSaathi"
  },
  "object": {
    "@type": "Product",
    "category": "B2B Industrial Products"
  },
  "location": [
    { "@type": "Country", "name": "India" }
  ],
  "result": [
    { "@type": "Country", "name": "United States" },
    { "@type": "Country", "name": "United Kingdom" },
    { "@type": "Country", "name": "France" },
    { "@type": "Country", "name": "Netherlands" },
    { "@type": "Country", "name": "Romania" },
    { "@type": "Country", "name": "Spain" },
    { "@type": "Country", "name": "Canada" },
    { "@type": "Country", "name": "Germany" },
    { "@type": "Country", "name": "United Arab Emirates" }
  ]
});

// Hook to inject regional SEO schemas
export const useRegionalSEO = (countryKey: string, countryName: string) => {
  useEffect(() => {
    // Inject LocalBusiness schema
    injectStructuredData(
      getRegionalLocalBusinessSchema(countryKey),
      `local-business-${countryKey}`
    );

    // Inject Service schema
    injectStructuredData(
      getServiceSchema(countryKey, countryName),
      `service-schema-${countryKey}`
    );

    // Update hreflang tags for this page
    const hreflangLinks = document.querySelectorAll('link[hreflang]');
    const existingHreflangs = new Set<string>();
    hreflangLinks.forEach(link => {
      existingHreflangs.add(link.getAttribute('hreflang') || '');
    });

    // Add country-specific hreflang if not exists
    const regional = regionalOffices[countryKey.toLowerCase()];
    if (regional) {
      regional.languages.forEach(lang => {
        if (!existingHreflangs.has(lang.toLowerCase())) {
          const link = document.createElement('link');
          link.rel = 'alternate';
          link.hreflang = lang.toLowerCase();
          link.href = countryKey.toLowerCase() === 'india' 
            ? 'https://procuresaathi.com'
            : `https://procuresaathi.com/source/${countryKey}`;
          document.head.appendChild(link);
        }
      });
    }

    // Cleanup
    return () => {
      const localBusiness = document.getElementById(`local-business-${countryKey}`);
      const service = document.getElementById(`service-schema-${countryKey}`);
      if (localBusiness) localBusiness.remove();
      if (service) service.remove();
    };
  }, [countryKey, countryName]);
};

export default useRegionalSEO;
