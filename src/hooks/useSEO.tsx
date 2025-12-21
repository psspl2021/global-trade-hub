import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  ogSiteName?: string;
  // International SEO props
  hreflang?: { lang: string; url: string }[];
  geoRegion?: string;
  geoPlacename?: string;
  targetCountry?: string;
}

const updateMetaTag = (selector: string, attribute: string, value: string, attrName: string = 'content') => {
  let meta = document.querySelector(selector);
  if (!meta) {
    meta = document.createElement('meta');
    if (selector.includes('property=')) {
      meta.setAttribute('property', attribute);
    } else {
      meta.setAttribute('name', attribute);
    }
    document.head.appendChild(meta);
  }
  meta.setAttribute(attrName, value);
};

const updateLinkTag = (rel: string, href: string, additionalAttrs?: Record<string, string>) => {
  const selector = additionalAttrs?.hreflang 
    ? `link[rel="${rel}"][hreflang="${additionalAttrs.hreflang}"]`
    : `link[rel="${rel}"]`;
  let link = document.querySelector(selector);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    if (additionalAttrs) {
      Object.entries(additionalAttrs).forEach(([key, value]) => {
        link!.setAttribute(key, value);
      });
    }
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

export const useSEO = ({ 
  title, 
  description, 
  canonical, 
  keywords,
  ogImage = 'https://procuresaathi.com/og-image.png',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  ogSiteName = 'ProcureSaathi',
  hreflang,
  geoRegion,
  geoPlacename,
  targetCountry
}: SEOProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta description
    if (description) {
      updateMetaTag('meta[name="description"]', 'description', description);
    }

    // Update or create meta keywords with global B2B terms
    const globalKeywords = keywords 
      ? `${keywords}, B2B marketplace, procurement platform, sourcing, wholesale suppliers, global trade, import export, industrial suppliers, manufacturing`
      : 'B2B marketplace, procurement platform, sourcing India, wholesale suppliers, bulk buying, industrial suppliers, manufacturing suppliers, trade platform, import export, global B2B trade';
    updateMetaTag('meta[name="keywords"]', 'keywords', globalKeywords);

    // Update or create canonical URL
    if (canonical) {
      updateLinkTag('canonical', canonical);
    }

    // Geo targeting meta tags
    if (geoRegion) {
      updateMetaTag('meta[name="geo.region"]', 'geo.region', geoRegion);
    }
    if (geoPlacename) {
      updateMetaTag('meta[name="geo.placename"]', 'geo.placename', geoPlacename);
    }
    if (targetCountry) {
      updateMetaTag('meta[name="geo.position"]', 'geo.position', targetCountry);
      updateMetaTag('meta[name="ICBM"]', 'ICBM', targetCountry);
    }

    // Dynamic hreflang tags for specific pages
    if (hreflang && hreflang.length > 0) {
      hreflang.forEach(({ lang, url }) => {
        updateLinkTag('alternate', url, { hreflang: lang });
      });
    }

    // Open Graph tags with international targeting
    updateMetaTag('meta[property="og:title"]', 'og:title', title);
    updateMetaTag('meta[property="og:type"]', 'og:type', ogType);
    updateMetaTag('meta[property="og:site_name"]', 'og:site_name', ogSiteName);
    updateMetaTag('meta[property="og:locale"]', 'og:locale', 'en_US');
    updateMetaTag('meta[property="og:locale:alternate"]', 'og:locale:alternate', 'en_IN');
    if (description) {
      updateMetaTag('meta[property="og:description"]', 'og:description', description);
    }
    if (canonical) {
      updateMetaTag('meta[property="og:url"]', 'og:url', canonical);
    }
    if (ogImage) {
      updateMetaTag('meta[property="og:image"]', 'og:image', ogImage);
      updateMetaTag('meta[property="og:image:width"]', 'og:image:width', '1200');
      updateMetaTag('meta[property="og:image:height"]', 'og:image:height', '630');
      updateMetaTag('meta[property="og:image:alt"]', 'og:image:alt', title);
    }

    // Twitter Card tags
    updateMetaTag('meta[name="twitter:card"]', 'twitter:card', twitterCard);
    updateMetaTag('meta[name="twitter:title"]', 'twitter:title', title);
    if (description) {
      updateMetaTag('meta[name="twitter:description"]', 'twitter:description', description);
    }
    if (ogImage) {
      updateMetaTag('meta[name="twitter:image"]', 'twitter:image', ogImage);
      updateMetaTag('meta[name="twitter:image:alt"]', 'twitter:image:alt', title);
    }

  }, [title, description, canonical, keywords, ogImage, ogType, twitterCard, ogSiteName, hreflang, geoRegion, geoPlacename, targetCountry]);
};

// Helper to inject JSON-LD structured data
export const injectStructuredData = (data: object, id: string) => {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
};

// Global Organization schema with international reach
export const getOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ProcureSaathi",
  "alternateName": ["Procure Saathi", "ProcureSaathi India", "ProcureSaathi Global"],
  "url": "https://procuresaathi.com",
  "logo": "https://procuresaathi.com/logo.png",
  "description": "Global B2B sourcing and procurement platform connecting verified buyers with suppliers worldwide for industrial raw materials, chemicals, and commodities.",
  "areaServed": [
    {"@type": "Country", "name": "India"},
    {"@type": "Country", "name": "United States"},
    {"@type": "Country", "name": "United Arab Emirates"},
    {"@type": "Country", "name": "United Kingdom"},
    {"@type": "Country", "name": "Germany"},
    {"@type": "Country", "name": "Australia"},
    {"@type": "Country", "name": "Singapore"},
    {"@type": "Continent", "name": "Africa"},
    {"@type": "Continent", "name": "Asia"},
    {"@type": "Continent", "name": "Europe"}
  ],
  "sameAs": [
    "https://twitter.com/ProcureSaathi",
    "https://linkedin.com/company/procuresaathi",
    "https://facebook.com/procuresaathi"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "sales@procuresaathi.com",
    "telephone": "+91-8368127357",
    "contactType": "sales",
    "areaServed": "Worldwide",
    "availableLanguage": ["English", "Hindi"]
  }
});

// FAQ schema
export const getFAQSchema = (faqs: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

// Breadcrumb schema
export const getBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

// Product schema for category/product pages
export const getProductSchema = (product: {
  name: string;
  description: string;
  image?: string;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  category?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": product.name,
  "description": product.description,
  "image": product.image || "https://procuresaathi.com/logo.png",
  "category": product.category,
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": product.currency || "INR",
    "lowPrice": product.priceMin || 0,
    "highPrice": product.priceMax || 999999,
    "offerCount": "100+",
    "availability": "https://schema.org/InStock"
  },
  "brand": {
    "@type": "Brand",
    "name": "Multiple Verified Suppliers"
  }
});

// Category page schema with international targeting
export const getCategorySchema = (category: {
  name: string;
  description: string;
  subcategories: string[];
  url: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": `${category.name} Suppliers & Manufacturers Worldwide`,
  "description": category.description,
  "url": category.url,
  "inLanguage": "en",
  "isPartOf": {
    "@type": "WebSite",
    "name": "ProcureSaathi",
    "url": "https://procuresaathi.com"
  },
  "mainEntity": {
    "@type": "ItemList",
    "name": category.name,
    "numberOfItems": category.subcategories.length,
    "itemListElement": category.subcategories.map((sub, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": sub,
      "url": `${category.url}?subcategory=${encodeURIComponent(sub)}`
    }))
  }
});

// LocalBusiness schema helper (for injection via JS if needed)
export const getLocalBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "ProcureSaathi",
  "description": "Global B2B sourcing and procurement platform connecting verified buyers and suppliers worldwide.",
  "url": "https://procuresaathi.com",
  "logo": "https://procuresaathi.com/logo.png",
  "telephone": "+91-8368127357",
  "email": "sales@procuresaathi.com",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "India",
    "addressCountry": "IN"
  },
  "priceRange": "$$",
  "openingHours": "Mo-Sa 09:00-18:00",
  "sameAs": [
    "https://twitter.com/ProcureSaathi",
    "https://linkedin.com/company/procuresaathi"
  ]
});

// International Trade Service schema
export const getInternationalTradeSchema = (targetCountry?: string) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "International B2B Trade Platform",
  "name": targetCountry 
    ? `ProcureSaathi - Source from India to ${targetCountry}` 
    : "ProcureSaathi Global B2B Marketplace",
  "description": targetCountry
    ? `Connect with verified Indian suppliers for export to ${targetCountry}. Get competitive quotes for raw materials, chemicals, and industrial products.`
    : "Connect with verified suppliers globally for raw materials, chemicals, commodities, and industrial products.",
  "provider": {
    "@type": "Organization",
    "name": "ProcureSaathi",
    "url": "https://procuresaathi.com"
  },
  "areaServed": targetCountry 
    ? { "@type": "Country", "name": targetCountry }
    : { "@type": "GeoCircle", "geoRadius": "20000 km" },
  "availableChannel": {
    "@type": "ServiceChannel",
    "serviceUrl": "https://procuresaathi.com",
    "servicePhone": "+91-8368127357",
    "availableLanguage": ["English", "Hindi"]
  }
});

// Country-specific landing page schema
export const getCountryLandingSchema = (country: {
  name: string;
  code: string;
  description: string;
  topCategories: string[];
}) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": `Source Products from India to ${country.name} | ProcureSaathi`,
  "description": country.description,
  "url": `https://procuresaathi.com/source/${country.code.toLowerCase()}`,
  "inLanguage": "en",
  "isPartOf": {
    "@type": "WebSite",
    "name": "ProcureSaathi",
    "url": "https://procuresaathi.com"
  },
  "about": {
    "@type": "Thing",
    "name": `India to ${country.name} B2B Trade`
  },
  "mainEntity": {
    "@type": "ItemList",
    "name": `Top Export Categories to ${country.name}`,
    "itemListElement": country.topCategories.map((cat, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": cat
    }))
  }
});
