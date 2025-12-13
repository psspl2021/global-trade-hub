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

export const useSEO = ({ 
  title, 
  description, 
  canonical, 
  keywords,
  ogImage = 'https://procuresaathi.com/og-image.png',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  ogSiteName = 'ProcureSaathi'
}: SEOProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta description
    if (description) {
      updateMetaTag('meta[name="description"]', 'description', description);
    }

    // Update or create meta keywords
    if (keywords) {
      updateMetaTag('meta[name="keywords"]', 'keywords', keywords);
    }

    // Update or create canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonical);
    }

    // Open Graph tags
    updateMetaTag('meta[property="og:title"]', 'og:title', title);
    updateMetaTag('meta[property="og:type"]', 'og:type', ogType);
    updateMetaTag('meta[property="og:site_name"]', 'og:site_name', ogSiteName);
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

  }, [title, description, canonical, keywords, ogImage, ogType, twitterCard, ogSiteName]);
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

// Organization schema for homepage
export const getOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ProcureSaathi",
  "url": "https://procuresaathi.com",
  "logo": "https://procuresaathi.com/logo.png",
  "description": "India's leading B2B sourcing and procurement platform connecting verified buyers and suppliers worldwide.",
  "sameAs": [
    "https://twitter.com/ProcureSaathi",
    "https://linkedin.com/company/procuresaathi"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "sales@procuresaathi.com",
    "contactType": "sales"
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

// Category page schema
export const getCategorySchema = (category: {
  name: string;
  description: string;
  subcategories: string[];
  url: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": `${category.name} Suppliers & Manufacturers in India`,
  "description": category.description,
  "url": category.url,
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
  "description": "India's leading B2B sourcing and procurement platform connecting verified buyers and suppliers.",
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
