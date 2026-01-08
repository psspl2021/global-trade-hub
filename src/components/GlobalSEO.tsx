import { useEffect } from 'react';
import { injectStructuredData, getOrganizationSchema } from '@/hooks/useSEO';

// All supported countries with their language codes
const SUPPORTED_COUNTRIES = [
  { code: 'en', country: 'default', url: 'https://procuresaathi.com' },
  { code: 'en-US', country: 'us', url: 'https://procuresaathi.com/source/usa' },
  { code: 'en-GB', country: 'uk', url: 'https://procuresaathi.com/source/uk' },
  { code: 'en-AU', country: 'au', url: 'https://procuresaathi.com/source/australia' },
  { code: 'en-CA', country: 'ca', url: 'https://procuresaathi.com/source/canada' },
  { code: 'en-AE', country: 'ae', url: 'https://procuresaathi.com/source/uae' },
  { code: 'de-DE', country: 'de', url: 'https://procuresaathi.com/source/germany' },
  { code: 'fr-FR', country: 'fr', url: 'https://procuresaathi.com/source/france' },
  { code: 'es-ES', country: 'es', url: 'https://procuresaathi.com/source/spain' },
  { code: 'nl-NL', country: 'nl', url: 'https://procuresaathi.com/source/netherlands' },
  { code: 'it-IT', country: 'it', url: 'https://procuresaathi.com/source/italy' },
  { code: 'ja-JP', country: 'jp', url: 'https://procuresaathi.com/source/japan' },
  { code: 'zh-CN', country: 'cn', url: 'https://procuresaathi.com/source/china' },
  { code: 'ru-RU', country: 'ru', url: 'https://procuresaathi.com/source/russia' },
  { code: 'ar-SA', country: 'sa', url: 'https://procuresaathi.com/source/saudi-arabia' },
  { code: 'en-SG', country: 'sg', url: 'https://procuresaathi.com/source/singapore' },
  { code: 'en-ZA', country: 'za', url: 'https://procuresaathi.com/source/south-africa' },
  { code: 'en-NG', country: 'ng', url: 'https://procuresaathi.com/source/nigeria' },
  { code: 'en-KE', country: 'ke', url: 'https://procuresaathi.com/source/kenya' },
  { code: 'pt-BR', country: 'br', url: 'https://procuresaathi.com/source/brazil' },
  { code: 'en-IN', country: 'in', url: 'https://procuresaathi.com' },
];

// Global website schema for export/import
const getWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "ProcureSaathi",
  "alternateName": ["Procure Saathi", "ProcureSaathi Global", "India Export Platform"],
  "url": "https://procuresaathi.com",
  "description": "Global B2B export import platform connecting international buyers with verified Indian exporters & manufacturers for steel, chemicals, textiles, machinery, and industrial commodities.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://procuresaathi.com/browse?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  },
  "inLanguage": ["en", "hi", "de", "fr", "es", "zh", "ja", "ar", "pt", "ru", "nl", "it", "ko"],
  "publisher": {
    "@type": "Organization",
    "name": "ProcureSaathi",
    "logo": {
      "@type": "ImageObject",
      "url": "https://procuresaathi.com/procuresaathi-logo.png"
    }
  },
  "audience": {
    "@type": "Audience",
    "audienceType": "Global Importers, International Buyers, Trading Companies, Export Agents, Procurement Managers"
  }
});

// B2B Export Import Marketplace schema
const getB2BMarketplaceSchema = () => ({
  "@context": "https://schema.org",
  "@type": "OnlineBusiness",
  "@id": "https://procuresaathi.com/#business",
  "name": "ProcureSaathi Global Export Import Marketplace",
  "description": "Connect with 1000+ verified Indian exporters & manufacturers. Global buyers source steel, chemicals, textiles, machinery. Trusted by importers in 50+ countries across all continents.",
  "url": "https://procuresaathi.com",
  "logo": "https://procuresaathi.com/procuresaathi-logo.png",
  "image": "https://procuresaathi.com/og-early-adopter.png",
  "telephone": "+91-8368127357",
  "email": "sales@procuresaathi.com",
  "foundingDate": "2021",
  "founder": {
    "@type": "Organization",
    "name": "ProcureSaathi Team"
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "IN",
    "addressLocality": "India"
  },
  "areaServed": [
    { "@type": "Country", "name": "India" },
    { "@type": "Country", "name": "United States" },
    { "@type": "Country", "name": "United Kingdom" },
    { "@type": "Country", "name": "United Arab Emirates" },
    { "@type": "Country", "name": "Germany" },
    { "@type": "Country", "name": "France" },
    { "@type": "Country", "name": "Australia" },
    { "@type": "Country", "name": "Canada" },
    { "@type": "Country", "name": "Japan" },
    { "@type": "Country", "name": "South Korea" },
    { "@type": "Country", "name": "China" },
    { "@type": "Country", "name": "Singapore" },
    { "@type": "Country", "name": "Saudi Arabia" },
    { "@type": "Country", "name": "South Africa" },
    { "@type": "Country", "name": "Brazil" },
    { "@type": "Country", "name": "Nigeria" },
    { "@type": "Country", "name": "Kenya" },
    { "@type": "Country", "name": "Netherlands" },
    { "@type": "Country", "name": "Italy" },
    { "@type": "Country", "name": "Spain" },
    { "@type": "Continent", "name": "Africa" },
    { "@type": "Continent", "name": "Asia" },
    { "@type": "Continent", "name": "Europe" },
    { "@type": "Continent", "name": "North America" },
    { "@type": "Continent", "name": "South America" },
    { "@type": "Continent", "name": "Oceania" }
  ],
  "knowsLanguage": ["en", "hi", "de", "fr", "es", "zh", "ja", "ar", "pt", "ru", "ko"],
  "sameAs": [
    "https://twitter.com/ProcureSaathi",
    "https://linkedin.com/company/procuresaathi",
    "https://facebook.com/procuresaathi"
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Indian Export Categories",
    "itemListElement": [
      { "@type": "OfferCatalog", "name": "Steel & Iron Products - Export from India" },
      { "@type": "OfferCatalog", "name": "Chemicals & Solvents - Indian Manufacturers" },
      { "@type": "OfferCatalog", "name": "Textiles & Fabrics - Made in India" },
      { "@type": "OfferCatalog", "name": "Machinery & Equipment - Indian Exporters" },
      { "@type": "OfferCatalog", "name": "Pharmaceuticals & APIs" },
      { "@type": "OfferCatalog", "name": "Agricultural Products & Spices" },
      { "@type": "OfferCatalog", "name": "Gems & Jewelry" },
      { "@type": "OfferCatalog", "name": "Leather & Footwear" },
      { "@type": "OfferCatalog", "name": "Handicrafts & Home Decor" },
      { "@type": "OfferCatalog", "name": "Auto Parts & Accessories" },
      { "@type": "OfferCatalog", "name": "Plastics & Polymers" },
      { "@type": "OfferCatalog", "name": "Electronics & Components" }
    ]
  }
});

// Service schema for B2B sourcing
const getSourcingServiceSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "B2B Sourcing Platform",
  "name": "ProcureSaathi B2B Sourcing Services",
  "description": "Connect with verified suppliers worldwide. Post requirements, receive sealed bids, and source products with complete transparency.",
  "provider": {
    "@type": "Organization",
    "name": "ProcureSaathi",
    "url": "https://procuresaathi.com"
  },
  "areaServed": "Worldwide",
  "availableChannel": {
    "@type": "ServiceChannel",
    "serviceUrl": "https://procuresaathi.com/post-rfq",
    "servicePhone": "+91-8368127357"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR",
    "description": "Free account creation and RFQ posting"
  },
  "termsOfService": "https://procuresaathi.com/terms",
  "serviceOutput": {
    "@type": "Thing",
    "name": "Competitive supplier quotations"
  }
});

export const GlobalSEO = () => {
  useEffect(() => {
    // Inject global structured data schemas
    injectStructuredData(getWebsiteSchema(), 'global-website-schema');
    injectStructuredData(getOrganizationSchema(), 'global-organization-schema');
    injectStructuredData(getB2BMarketplaceSchema(), 'global-marketplace-schema');
    injectStructuredData(getSourcingServiceSchema(), 'global-service-schema');

    // Add global hreflang tags
    SUPPORTED_COUNTRIES.forEach(({ code, url }) => {
      const existingLink = document.querySelector(`link[hreflang="${code}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = code;
        link.href = url;
        document.head.appendChild(link);
      }
    });

    // Add x-default hreflang
    const xDefaultLink = document.querySelector('link[hreflang="x-default"]');
    if (!xDefaultLink) {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = 'x-default';
      link.href = 'https://procuresaathi.com';
      document.head.appendChild(link);
    }

    // Add additional global meta tags
    const addMetaTag = (name: string, content: string) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    // Global SEO meta tags
    addMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    addMetaTag('googlebot', 'index, follow, max-image-preview:large');
    addMetaTag('bingbot', 'index, follow');
    addMetaTag('revisit-after', '7 days');
    addMetaTag('author', 'ProcureSaathi');
    addMetaTag('generator', 'ProcureSaathi Platform');
    addMetaTag('rating', 'general');
    addMetaTag('distribution', 'global');
    addMetaTag('language', 'en');
    addMetaTag('coverage', 'worldwide');
    addMetaTag('target', 'all');
    addMetaTag('HandheldFriendly', 'true');
    addMetaTag('MobileOptimized', '320');
    addMetaTag('format-detection', 'telephone=yes');
    
    // Note: Add verification codes via index.html or environment variables when available
    // addMetaTag('google-site-verification', 'YOUR_CODE');
    // addMetaTag('msvalidate.01', 'YOUR_CODE');

    // Cleanup on unmount
    return () => {
      // Schemas and hreflang tags persist across navigation for SEO benefit
    };
  }, []);

  return null;
};

export default GlobalSEO;
