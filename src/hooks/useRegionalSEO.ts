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
  china: {
    country: "China",
    countryCode: "CN",
    region: "East Asia",
    currency: "CNY",
    telephone: "+91-8368127357",
    languages: ["zh-CN", "en-CN"],
  },
  "antigua-and-barbuda": {
    country: "Antigua and Barbuda",
    countryCode: "AG",
    region: "Caribbean",
    currency: "XCD",
    telephone: "+91-8368127357",
    languages: ["en-AG"],
  },
  argentina: {
    country: "Argentina",
    countryCode: "AR",
    region: "South America",
    currency: "ARS",
    telephone: "+91-8368127357",
    languages: ["es-AR", "en-AR"],
  },
  armenia: {
    country: "Armenia",
    countryCode: "AM",
    region: "Caucasus",
    currency: "AMD",
    telephone: "+91-8368127357",
    languages: ["hy-AM", "en-AM"],
  },
  australia: {
    country: "Australia",
    countryCode: "AU",
    region: "Oceania",
    currency: "AUD",
    telephone: "+91-8368127357",
    languages: ["en-AU"],
  },
  austria: {
    country: "Austria",
    countryCode: "AT",
    region: "Europe",
    currency: "EUR",
    telephone: "+91-8368127357",
    languages: ["de-AT", "en-AT"],
  },
  azerbaijan: {
    country: "Azerbaijan",
    countryCode: "AZ",
    region: "Caucasus",
    currency: "AZN",
    telephone: "+91-8368127357",
    languages: ["az-AZ", "en-AZ"],
  },
  bhutan: {
    country: "Bhutan",
    countryCode: "BT",
    region: "South Asia",
    currency: "BTN",
    telephone: "+91-8368127357",
    languages: ["dz-BT", "en-BT"],
  },
  denmark: {
    country: "Denmark",
    countryCode: "DK",
    region: "Europe",
    currency: "DKK",
    telephone: "+91-8368127357",
    languages: ["da-DK", "en-DK"],
  },
  dominica: {
    country: "Dominica",
    countryCode: "DM",
    region: "Caribbean",
    currency: "XCD",
    telephone: "+91-8368127357",
    languages: ["en-DM"],
  },
  italy: {
    country: "Italy",
    countryCode: "IT",
    region: "Europe",
    currency: "EUR",
    telephone: "+91-8368127357",
    languages: ["it-IT", "en-IT"],
  },
  japan: {
    country: "Japan",
    countryCode: "JP",
    region: "East Asia",
    currency: "JPY",
    telephone: "+91-8368127357",
    languages: ["ja-JP", "en-JP"],
  },
  kuwait: {
    country: "Kuwait",
    countryCode: "KW",
    region: "Middle East",
    currency: "KWD",
    telephone: "+91-8368127357",
    languages: ["ar-KW", "en-KW"],
  },
  malawi: {
    country: "Malawi",
    countryCode: "MW",
    region: "Africa",
    currency: "MWK",
    telephone: "+91-8368127357",
    languages: ["en-MW"],
  },
  malaysia: {
    country: "Malaysia",
    countryCode: "MY",
    region: "Southeast Asia",
    currency: "MYR",
    telephone: "+91-8368127357",
    languages: ["ms-MY", "en-MY"],
  },
  maldives: {
    country: "Maldives",
    countryCode: "MV",
    region: "South Asia",
    currency: "MVR",
    telephone: "+91-8368127357",
    languages: ["dv-MV", "en-MV"],
  },
  malta: {
    country: "Malta",
    countryCode: "MT",
    region: "Europe",
    currency: "EUR",
    telephone: "+91-8368127357",
    languages: ["mt-MT", "en-MT"],
  },
  mexico: {
    country: "Mexico",
    countryCode: "MX",
    region: "North America",
    currency: "MXN",
    telephone: "+91-8368127357",
    languages: ["es-MX", "en-MX"],
  },
  nepal: {
    country: "Nepal",
    countryCode: "NP",
    region: "South Asia",
    currency: "NPR",
    telephone: "+91-8368127357",
    languages: ["ne-NP", "en-NP"],
  },
  "new-zealand": {
    country: "New Zealand",
    countryCode: "NZ",
    region: "Oceania",
    currency: "NZD",
    telephone: "+91-8368127357",
    languages: ["en-NZ"],
  },
  russia: {
    country: "Russia",
    countryCode: "RU",
    region: "Europe/Asia",
    currency: "RUB",
    telephone: "+91-8368127357",
    languages: ["ru-RU", "en-RU"],
  },
  "south-africa": {
    country: "South Africa",
    countryCode: "ZA",
    region: "Africa",
    currency: "ZAR",
    telephone: "+91-8368127357",
    languages: ["en-ZA"],
  },
  "sri-lanka": {
    country: "Sri Lanka",
    countryCode: "LK",
    region: "South Asia",
    currency: "LKR",
    telephone: "+91-8368127357",
    languages: ["si-LK", "ta-LK", "en-LK"],
  },
  sweden: {
    country: "Sweden",
    countryCode: "SE",
    region: "Europe",
    currency: "SEK",
    telephone: "+91-8368127357",
    languages: ["sv-SE", "en-SE"],
  },
  switzerland: {
    country: "Switzerland",
    countryCode: "CH",
    region: "Europe",
    currency: "CHF",
    telephone: "+91-8368127357",
    languages: ["de-CH", "fr-CH", "it-CH", "en-CH"],
  },
  taiwan: {
    country: "Taiwan",
    countryCode: "TW",
    region: "East Asia",
    currency: "TWD",
    telephone: "+91-8368127357",
    languages: ["zh-TW", "en-TW"],
  },
  tajikistan: {
    country: "Tajikistan",
    countryCode: "TJ",
    region: "Central Asia",
    currency: "TJS",
    telephone: "+91-8368127357",
    languages: ["tg-TJ", "ru-TJ", "en-TJ"],
  },
  thailand: {
    country: "Thailand",
    countryCode: "TH",
    region: "Southeast Asia",
    currency: "THB",
    telephone: "+91-8368127357",
    languages: ["th-TH", "en-TH"],
  },
  turkey: {
    country: "Turkey",
    countryCode: "TR",
    region: "Europe/Asia",
    currency: "TRY",
    telephone: "+91-8368127357",
    languages: ["tr-TR", "en-TR"],
  },
  uganda: {
    country: "Uganda",
    countryCode: "UG",
    region: "Africa",
    currency: "UGX",
    telephone: "+91-8368127357",
    languages: ["en-UG", "sw-UG"],
  },
  ukraine: {
    country: "Ukraine",
    countryCode: "UA",
    region: "Europe",
    currency: "UAH",
    telephone: "+91-8368127357",
    languages: ["uk-UA", "en-UA"],
  },
  vietnam: {
    country: "Vietnam",
    countryCode: "VN",
    region: "Southeast Asia",
    currency: "VND",
    telephone: "+91-8368127357",
    languages: ["vi-VN", "en-VN"],
  },
  zimbabwe: {
    country: "Zimbabwe",
    countryCode: "ZW",
    region: "Africa",
    currency: "ZWL",
    telephone: "+91-8368127357",
    languages: ["en-ZW"],
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
    { "@type": "Country", "name": "United Arab Emirates" },
    { "@type": "Country", "name": "China" },
    { "@type": "Country", "name": "Antigua and Barbuda" },
    { "@type": "Country", "name": "Argentina" },
    { "@type": "Country", "name": "Armenia" },
    { "@type": "Country", "name": "Australia" },
    { "@type": "Country", "name": "Austria" },
    { "@type": "Country", "name": "Azerbaijan" },
    { "@type": "Country", "name": "Bhutan" },
    { "@type": "Country", "name": "Denmark" },
    { "@type": "Country", "name": "Dominica" },
    { "@type": "Country", "name": "Italy" },
    { "@type": "Country", "name": "Japan" },
    { "@type": "Country", "name": "Kuwait" },
    { "@type": "Country", "name": "Malawi" },
    { "@type": "Country", "name": "Malaysia" },
    { "@type": "Country", "name": "Maldives" },
    { "@type": "Country", "name": "Malta" },
    { "@type": "Country", "name": "Mexico" },
    { "@type": "Country", "name": "Nepal" },
    { "@type": "Country", "name": "New Zealand" },
    { "@type": "Country", "name": "Russia" },
    { "@type": "Country", "name": "South Africa" },
    { "@type": "Country", "name": "Sri Lanka" },
    { "@type": "Country", "name": "Sweden" },
    { "@type": "Country", "name": "Switzerland" },
    { "@type": "Country", "name": "Taiwan" },
    { "@type": "Country", "name": "Tajikistan" },
    { "@type": "Country", "name": "Thailand" },
    { "@type": "Country", "name": "Turkey" },
    { "@type": "Country", "name": "Uganda" },
    { "@type": "Country", "name": "Ukraine" },
    { "@type": "Country", "name": "Vietnam" },
    { "@type": "Country", "name": "Zimbabwe" }
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
