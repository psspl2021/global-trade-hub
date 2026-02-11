import { useEffect } from 'react';
import { injectStructuredData, getOrganizationSchema } from '@/hooks/useSEO';

// Language-only hreflang tags (all point to same URL)
// This tells search engines the content is available globally without URL duplication
const LANGUAGE_HREFLANG = [
  { code: 'x-default', url: 'https://www.procuresaathi.com' },
  { code: 'en', url: 'https://www.procuresaathi.com' },
  { code: 'en-IN', url: 'https://www.procuresaathi.com' },
  { code: 'en-US', url: 'https://www.procuresaathi.com' },
  { code: 'en-GB', url: 'https://www.procuresaathi.com' },
  { code: 'en-AE', url: 'https://www.procuresaathi.com' },
  { code: 'hi', url: 'https://www.procuresaathi.com' },
  { code: 'ar', url: 'https://www.procuresaathi.com' },
  { code: 'de', url: 'https://www.procuresaathi.com' },
  { code: 'fr', url: 'https://www.procuresaathi.com' },
  { code: 'es', url: 'https://www.procuresaathi.com' },
  { code: 'zh', url: 'https://www.procuresaathi.com' },
  { code: 'ja', url: 'https://www.procuresaathi.com' },
  { code: 'pt', url: 'https://www.procuresaathi.com' },
  { code: 'ru', url: 'https://www.procuresaathi.com' },
];

// Global website schema for AEO/GEO optimization
const getWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "ProcureSaathi",
  "alternateName": ["Procure Saathi", "ProcureSaathi Global", "AI B2B Procurement Platform"],
  "url": "https://www.procuresaathi.com",
  "description": "ProcureSaathi is an AI-powered B2B procurement and sourcing platform helping buyers and suppliers connect across domestic and export–import markets in India.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.procuresaathi.com/browseproducts"
    },
    "query-input": "required name=search_term_string"
  },
  "inLanguage": ["en", "hi"],
  "publisher": {
    "@type": "Organization",
    "name": "ProcureSaathi",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.procuresaathi.com/procuresaathi-logo.png"
    }
  },
  "audience": {
    "@type": "Audience",
    "audienceType": "B2B Buyers, Procurement Managers, MSMEs, Manufacturers, Traders, Enterprises"
  },
  "about": {
    "@type": "Thing",
    "name": "B2B Procurement Platform",
    "description": "AI-powered platform for posting RFQs, transparent bidding, and supplier discovery"
  }
});

// B2B Procurement Marketplace schema - AEO/GEO optimized
const getB2BMarketplaceSchema = () => ({
  "@context": "https://schema.org",
  "@type": "OnlineBusiness",
  "@id": "https://www.procuresaathi.com/#business",
  "name": "ProcureSaathi - AI-Powered B2B Procurement Platform",
  "description": "ProcureSaathi is an AI-powered B2B procurement and sourcing platform based in India. It helps buyers post requirements using AI RFQs, enables transparent bidding among verified suppliers, supports domestic and export–import trade, and provides free CRM, business leads, and logistics support to MSMEs, manufacturers, traders, and enterprises.",
  "url": "https://www.procuresaathi.com",
  "logo": "https://www.procuresaathi.com/procuresaathi-logo.png",
  "image": "https://www.procuresaathi.com/og-early-adopter.png",
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

// Service schema for B2B sourcing - AEO/GEO optimized
const getSourcingServiceSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "AI-Powered B2B Procurement Platform",
  "name": "ProcureSaathi B2B Procurement Services",
  "description": "ProcureSaathi helps buyers post requirements using AI RFQs, enables transparent bidding among verified suppliers, and supports domestic and export–import trade with free CRM and logistics support.",
  "provider": {
    "@type": "Organization",
    "name": "ProcureSaathi",
    "url": "https://www.procuresaathi.com"
  },
  "areaServed": "Worldwide",
  "availableChannel": {
    "@type": "ServiceChannel",
    "serviceUrl": "https://www.procuresaathi.com/post-rfq",
    "servicePhone": "+91-8368127357"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR",
    "description": "Free account creation, AI RFQ posting, and CRM tools"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "B2B Procurement Services",
    "itemListElement": [
      {"@type": "Offer", "name": "AI RFQ Generation"},
      {"@type": "Offer", "name": "Transparent Bidding Platform"},
      {"@type": "Offer", "name": "Verified Supplier Discovery"},
      {"@type": "Offer", "name": "Free CRM Software"},
      {"@type": "Offer", "name": "GST Invoice Generator"},
      {"@type": "Offer", "name": "Logistics Support"}
    ]
  },
  "termsOfService": "https://www.procuresaathi.com/terms",
  "serviceOutput": {
    "@type": "Thing",
    "name": "Competitive supplier quotations via transparent bidding"
  }
});

export const GlobalSEO = () => {
  useEffect(() => {
    // Inject global structured data schemas
    injectStructuredData(getWebsiteSchema(), 'global-website-schema');
    injectStructuredData(getOrganizationSchema(), 'global-organization-schema');
    injectStructuredData(getB2BMarketplaceSchema(), 'global-marketplace-schema');
    injectStructuredData(getSourcingServiceSchema(), 'global-service-schema');

    // Add language-only hreflang tags (all point to same URL for SEO safety)
    LANGUAGE_HREFLANG.forEach(({ code, url }) => {
      const existingLink = document.querySelector(`link[hreflang="${code}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = code;
        link.href = url;
        document.head.appendChild(link);
      }
    });

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
    // NOTE: robots meta is managed by useSEOHead — do NOT add duplicate here
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

    return () => {};
  }, []);

  return null;
};

export default GlobalSEO;
