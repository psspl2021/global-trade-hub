/**
 * SEO Static Renderer
 * 
 * Renders static, crawlable HTML for search engine bots.
 * This component bypasses the SPA loading state and provides
 * immediate, indexable content for Googlebot and other crawlers.
 * 
 * RULES:
 * - No loaders or async gates
 * - No API calls
 * - Pure HTML output
 * - Uses data from static configs
 */

import { useMemo } from 'react';
import { categoriesData } from '@/data/categories';
import { signalPagesConfig } from '@/data/signalPages';
import { demandProducts } from '@/data/demandProducts';
import { transactionalImportPages } from '@/data/transactionalImportPages';

// Generate slugs for categories
const categoryWithSlugs = categoriesData.map(cat => ({
  ...cat,
  slug: cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}));

interface SEOStaticRendererProps {
  /** Current route path */
  pathname: string;
}

/**
 * Get page data from static config based on route
 */
interface PageData {
  type: string;
  title: string;
  description: string;
  category: string;
  slug: string;
  subcategory?: string | null;
  subcategories?: string[];
  h1?: string;
  subheading?: string;
  bodyText?: string;
  useCases?: string[];
  whatBuyerGets?: string[];
  intentKeywords?: string[];
  productName?: string;
}

function getPageData(pathname: string): PageData | null {
  // Category page: /category/{slug} or /category/{slug}/{subcategorySlug}
  const categoryMatch = pathname.match(/^\/category\/([^/]+)(?:\/(.+))?$/);
  if (categoryMatch) {
    const slug = categoryMatch[1];
    const subSlug = categoryMatch[2];
    const category = categoryWithSlugs.find(c => c.slug === slug);
    const categoryName = category?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const subName = subSlug ? subSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : null;
    
    return {
      type: 'category',
      title: subName 
        ? `${subName} Suppliers India | ${categoryName} | ProcureSaathi`
        : `${categoryName} Suppliers & Manufacturers India | ProcureSaathi B2B`,
      description: subName 
        ? `Find verified ${subName.toLowerCase()} suppliers and manufacturers in India. Get best prices, bulk orders, quality products. Part of ${categoryName}. 500+ verified suppliers.`
        : `India's largest B2B marketplace for ${categoryName.toLowerCase()} with 500+ verified suppliers. Post RFQ, receive competitive quotes within 24-48 hours. Export-ready, bulk pricing.`,
      category: categoryName,
      subcategory: subName,
      slug,
      subcategories: category?.subcategories || [],
    };
  }

  // Procurement signal page: /procurement/{slug}
  const signalMatch = pathname.match(/^\/procurement\/(.+)$/);
  if (signalMatch) {
    const slug = signalMatch[1];
    const signalPage = signalPagesConfig.find(p => p.slug === slug);
    return {
      type: 'signal',
      title: signalPage?.metaTitle || signalPage?.h1 || `${slug.replace(/-/g, ' ')} Procurement | ProcureSaathi`,
      description: signalPage?.metaDescription || signalPage?.subheading || `Source ${slug.replace(/-/g, ' ')} from verified suppliers on ProcureSaathi. AI-powered procurement with competitive bidding.`,
      category: signalPage?.signalMapping?.category || slug.replace(/-/g, ' '),
      slug,
      h1: signalPage?.h1,
      subheading: signalPage?.subheading,
      bodyText: signalPage?.bodyText,
      useCases: signalPage?.useCases || [],
      whatBuyerGets: signalPage?.whatBuyerGets || [],
      intentKeywords: signalPage?.intentKeywords || [],
    };
  }

  // Demand page: /demand/{slug}
  const demandMatch = pathname.match(/^\/demand\/(.+)$/);
  if (demandMatch) {
    const slug = demandMatch[1];
    const product = demandProducts.find(p => p.slug === slug);
    return {
      type: 'demand',
      title: product ? `${product.name} Suppliers India | Buy ${product.category} | ProcureSaathi` : `${slug.replace(/-/g, ' ')} | ProcureSaathi`,
      description: product 
        ? `Source ${product.name} from verified suppliers in India. Get competitive quotes for ${product.category}. AI-powered B2B procurement platform.`
        : `Find verified suppliers for ${slug.replace(/-/g, ' ')} on ProcureSaathi B2B marketplace.`,
      category: product?.category || slug.replace(/-/g, ' '),
      slug,
      productName: product?.name,
    };
  }

  // Solutions page: /solutions/{slug}
  const solutionsMatch = pathname.match(/^\/solutions\/(.+)$/);
  if (solutionsMatch) {
    const slug = solutionsMatch[1];
    const signalPage = signalPagesConfig.find(p => p.slug === slug);
    return {
      type: 'solutions',
      title: signalPage?.metaTitle || `${slug.replace(/-/g, ' ')} Solutions | ProcureSaathi`,
      description: signalPage?.metaDescription || `End-to-end ${slug.replace(/-/g, ' ')} procurement solutions. Verified suppliers, competitive bidding, managed fulfillment.`,
      category: signalPage?.signalMapping?.category || slug.replace(/-/g, ' '),
      slug,
    };
  }

  // Source country: /source/{country}
  const sourceMatch = pathname.match(/^\/source\/(.+)$/);
  if (sourceMatch) {
    const country = sourceMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return {
      type: 'source',
      title: `Source from ${country} | B2B Industrial Sourcing | ProcureSaathi`,
      description: `Source industrial products from ${country} through ProcureSaathi. Verified suppliers, export documentation, managed logistics for cross-border B2B procurement.`,
      category: country,
      slug: sourceMatch[1],
    };
  }

  // Import corridor page: /import/{slug}
  const importMatch = pathname.match(/^\/import\/(.+)$/);
  if (importMatch) {
    const slug = importMatch[1];
    const importPage = transactionalImportPages.find(p => p.slug === slug);
    if (importPage) {
      return {
        type: 'import',
        title: `Import ${importPage.skuLabel} from ${importPage.country} to India | ProcureSaathi`,
        description: `Source ${importPage.skuLabel} from ${importPage.country}. Get pricing, lead times, duty analysis, and verified supplier connections through ProcureSaathi's managed import desk.`,
        category: importPage.skuLabel,
        slug,
      };
    }
    // Fallback for unknown import slugs
    const label = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return {
      type: 'import',
      title: `Import ${label} | Cross-Border Sourcing | ProcureSaathi`,
      description: `Source ${label} through ProcureSaathi's managed import desk. Verified suppliers, duty analysis, quality inspection, and end-to-end logistics.`,
      category: label,
      slug,
    };
  }

  // RFQ detail page: /rfq/{id}
  const rfqMatch = pathname.match(/^\/rfq\/(.+)$/);
  if (rfqMatch) {
    return {
      type: 'rfq',
      title: 'Procurement Requirement | Get Supplier Quotes | ProcureSaathi',
      description: 'View this procurement requirement on ProcureSaathi. Verified suppliers can submit competitive quotes. AI-powered matching ensures best pricing and quality.',
      category: 'RFQ',
      slug: rfqMatch[1],
    };
  }

  // Buy page: /buy-{slug}
  const buyMatch = pathname.match(/^\/buy-(.+)$/);
  if (buyMatch) {
    const slug = buyMatch[1];
    const category = categoryWithSlugs.find(c => c.slug === slug);
    return {
      type: 'buy',
      title: category ? `Buy ${category.name} from Verified Suppliers` : `Buy ${slug.replace(/-/g, ' ')} | ProcureSaathi`,
      description: category 
        ? `Source verified ${category.name} suppliers on ProcureSaathi. Post RFQ, receive competitive quotes, and close deals with trusted manufacturers.`
        : `Find verified suppliers for ${slug.replace(/-/g, ' ')} on ProcureSaathi B2B marketplace.`,
      category: category?.name || slug.replace(/-/g, ' '),
      slug,
    };
  }

  // Supplier page: /{slug}-suppliers
  const supplierMatch = pathname.match(/^\/(.+)-suppliers$/);
  if (supplierMatch) {
    const slug = supplierMatch[1];
    const category = categoryWithSlugs.find(c => c.slug === slug);
    return {
      type: 'supplier',
      title: category ? `${category.name} Suppliers & Manufacturers` : `${slug.replace(/-/g, ' ')} Suppliers | ProcureSaathi`,
      description: category 
        ? `Join ProcureSaathi as a ${category.name} supplier. AI detects buyer demand and matches you with verified procurement opportunities.`
        : `List your ${slug.replace(/-/g, ' ')} products on ProcureSaathi. Get matched with verified buyers.`,
      category: category?.name || slug.replace(/-/g, ' '),
      slug,
    };
  }

  // Browse page: /browse or /browseproducts
  if (pathname.startsWith('/browse')) {
    return {
      type: 'browse',
      title: 'Browse Products & Suppliers | ProcureSaathi B2B Marketplace',
      description: 'Browse verified B2B suppliers across 40+ industrial categories. Steel, chemicals, polymers, electronics, food, textiles, and more. AI-powered procurement platform.',
      category: 'All Categories',
      slug: 'browse',
    };
  }

  // Blogs: /blogs or /blogs/{slug}
  const blogMatch = pathname.match(/^\/blogs(?:\/(.+))?$/);
  if (blogMatch) {
    const blogSlug = blogMatch[1];
    if (blogSlug) {
      const title = blogSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return {
        type: 'blog',
        title: `${title} | ProcureSaathi Blog`,
        description: `Read about ${title.toLowerCase()} — insights on B2B procurement, sourcing strategies, and supply chain optimization from ProcureSaathi.`,
        category: 'Blog',
        slug: blogSlug,
      };
    }
    return {
      type: 'blog',
      title: 'ProcureSaathi Blog | B2B Procurement Insights & Industry News',
      description: 'Expert articles on B2B procurement, sourcing strategies, supply chain optimization, and industrial market intelligence from ProcureSaathi.',
      category: 'Blog',
      slug: 'blogs',
    };
  }

  // Static standalone pages
  const staticPages: Record<string, { title: string; description: string }> = {
    '/post-rfq': {
      title: 'Post RFQ Free | Get Quotes from Verified Suppliers | ProcureSaathi',
      description: 'Post your procurement requirement for free. Receive competitive quotes from verified suppliers within 24-48 hours. AI-powered B2B sourcing platform.',
    },
    '/seller': {
      title: 'Sell on ProcureSaathi | Register as Verified Supplier',
      description: 'Join ProcureSaathi as a verified supplier. Get matched with real buyer demand, receive RFQs, and grow your B2B business with AI-powered procurement.',
    },
    '/private-label': {
      title: 'Private Label Manufacturing India | Custom OEM Products | ProcureSaathi',
      description: 'Source private label and OEM manufacturing from verified Indian suppliers. Custom branding, quality-certified products, export-ready across 40+ categories.',
    },
    '/find-verified-b2b-suppliers': {
      title: 'Find Verified B2B Suppliers India | ProcureSaathi',
      description: 'Discover verified B2B suppliers across India. Quality-certified manufacturers, competitive pricing, and managed procurement for every industrial category.',
    },
    '/ai-procurement-vs-traditional-rfq': {
      title: 'AI Procurement vs Traditional RFQ Process | ProcureSaathi',
      description: 'Compare AI-powered procurement with traditional RFQ processes. See how automated supplier matching, real-time bidding, and smart analytics reduce costs by 15-30%.',
    },
    '/ai-b2b-procurement-platform-guide': {
      title: 'AI B2B Procurement Platform Guide 2026 | ProcureSaathi',
      description: 'Complete guide to AI-powered B2B procurement platforms. Learn how AI transforms sourcing, supplier discovery, and cost optimization for enterprises.',
    },
  };

  if (staticPages[pathname]) {
    const page = staticPages[pathname];
    return {
      type: 'static',
      title: page.title,
      description: page.description,
      category: '',
      slug: pathname.replace(/^\//, ''),
    };
  }

  // Arabic/locale prefix for procurement pages: /ar/procurement/{slug}
  const arMatch = pathname.match(/^\/ar\/procurement\/(.+)$/);
  if (arMatch) {
    const slug = arMatch[1];
    const signalPage = signalPagesConfig.find(p => p.slug === slug);
    return {
      type: 'signal',
      title: signalPage?.metaTitle || `${slug.replace(/-/g, ' ')} Procurement | ProcureSaathi`,
      description: signalPage?.metaDescription || `Source ${slug.replace(/-/g, ' ')} from verified suppliers.`,
      category: signalPage?.signalMapping?.category || slug.replace(/-/g, ' '),
      slug,
    };
  }

  // Homepage
  if (pathname === '/') {
    return {
      type: 'home',
      title: 'ProcureSaathi | AI-Powered B2B Procurement Platform',
      description: 'ProcureSaathi is an AI-powered B2B procurement and sourcing platform helping buyers and suppliers connect across domestic and export-import markets.',
      category: '',
      slug: '',
    };
  }

  // Default for other pages
  return null;
}

/**
 * Generate structured data schemas based on page type
 */
function generateSchemas(pageData: NonNullable<ReturnType<typeof getPageData>>) {
  const schemas: object[] = [];

  // Organization schema (always present)
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ProcureSaathi',
    url: 'https://www.procuresaathi.com',
    description: 'AI-powered B2B procurement platform connecting verified buyers and suppliers.',
  });

  // Breadcrumb
  const breadcrumbs: { name: string; url: string }[] = [
    { name: 'Home', url: 'https://www.procuresaathi.com/' },
  ];

  if (pageData.type === 'category') {
    breadcrumbs.push({ name: 'Categories', url: 'https://www.procuresaathi.com/categories' });
    breadcrumbs.push({ name: pageData.category, url: `https://www.procuresaathi.com/category/${pageData.slug}` });
    if ('subcategory' in pageData && pageData.subcategory) {
      breadcrumbs.push({ name: pageData.subcategory, url: `https://www.procuresaathi.com${window?.location?.pathname || ''}` });
    }
  } else if (pageData.type === 'signal' || pageData.type === 'solutions') {
    breadcrumbs.push({ name: 'Procurement', url: 'https://www.procuresaathi.com/categories' });
    breadcrumbs.push({ name: pageData.category, url: `https://www.procuresaathi.com/procurement/${pageData.slug}` });
  } else if (pageData.type === 'demand') {
    breadcrumbs.push({ name: 'Products', url: 'https://www.procuresaathi.com/categories' });
    breadcrumbs.push({ name: pageData.category, url: `https://www.procuresaathi.com/demand/${pageData.slug}` });
  } else if (pageData.type === 'import') {
    breadcrumbs.push({ name: 'Global Sourcing', url: 'https://www.procuresaathi.com/global-sourcing-countries' });
    breadcrumbs.push({ name: pageData.category, url: `https://www.procuresaathi.com/import/${pageData.slug}` });
  } else if (pageData.type === 'rfq') {
    breadcrumbs.push({ name: 'Requirements', url: 'https://www.procuresaathi.com/requirements' });
    breadcrumbs.push({ name: 'RFQ Detail', url: `https://www.procuresaathi.com/rfq/${pageData.slug}` });
  }

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((bc, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: bc.name,
      item: bc.url,
    })),
  });

  // Category-specific: ItemList with subcategories
  if (pageData.type === 'category' && 'subcategories' in pageData && pageData.subcategories.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: pageData.category,
      description: pageData.description,
      numberOfItems: pageData.subcategories.length,
      itemListElement: pageData.subcategories.slice(0, 15).map((sub: string, i: number) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: sub,
        url: `https://www.procuresaathi.com/category/${pageData.slug}/${sub.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
      })),
    });
  }

  // Service schema for procurement/signal pages
  if (pageData.type === 'signal' || pageData.type === 'solutions' || pageData.type === 'demand' || pageData.type === 'import') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `${pageData.category} Procurement`,
      description: pageData.description,
      provider: { '@type': 'Organization', name: 'ProcureSaathi', url: 'https://www.procuresaathi.com' },
      areaServed: { '@type': 'Country', name: 'India' },
      serviceType: `B2B ${pageData.category} Sourcing`,
    });
  }

  // FAQ schema
  const faqs = [
    {
      question: `How do I source ${pageData.category || 'products'} on ProcureSaathi?`,
      answer: `Post a free RFQ describing your ${pageData.category || 'product'} requirements. Verified suppliers will submit competitive quotes within 24-48 hours. Compare quotes and close deals with complete transparency.`
    },
    {
      question: `Are ${pageData.category || ''} suppliers on ProcureSaathi verified?`,
      answer: `Yes, all suppliers undergo verification before listing. We verify business registration, manufacturing capacity, and quality certifications to ensure reliable sourcing.`
    },
    {
      question: 'Is there a fee for posting RFQ?',
      answer: 'Posting RFQs on ProcureSaathi is completely free for buyers. We only charge a small platform fee upon successful deal closure.'
    },
    {
      question: `What is the delivery timeline for ${pageData.category || 'products'}?`,
      answer: `Delivery timelines vary by product and supplier. Typically, domestic orders are delivered within 7-21 days. ProcureSaathi provides managed logistics with real-time tracking for all orders.`
    },
  ];

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  });

  return schemas;
}

/**
 * SEO Static Renderer Component
 * 
 * Renders static HTML for bots. No loaders, no async.
 */
export function SEOStaticRenderer({ pathname }: SEOStaticRendererProps) {
  const pageData = useMemo(() => getPageData(pathname), [pathname]);

  // If we don't have page data, render generic SEO content
  if (!pageData) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <a href="/" className="text-xl font-bold text-primary">ProcureSaathi</a>
            <nav className="hidden gap-6 md:flex">
              <a href="/buyer" className="text-foreground hover:text-primary">For Buyers</a>
              <a href="/seller" className="text-foreground hover:text-primary">For Suppliers</a>
              <a href="/categories" className="text-foreground hover:text-primary">Categories</a>
              <a href="/post-rfq" className="text-foreground hover:text-primary">Post RFQ</a>
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold">AI-Powered B2B Procurement Platform</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            ProcureSaathi connects verified buyers and suppliers across domestic and export-import markets.
          </p>
        </main>
      </div>
    );
  }

  const schemas = generateSchemas(pageData);

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Schemas */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      
      {/* Static Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <a href="/" className="text-xl font-bold text-primary">ProcureSaathi</a>
          <nav className="hidden gap-6 md:flex">
            <a href="/buyer" className="text-foreground hover:text-primary">For Buyers</a>
            <a href="/seller" className="text-foreground hover:text-primary">For Suppliers</a>
            <a href="/categories" className="text-foreground hover:text-primary">Categories</a>
            <a href="/post-rfq" className="text-foreground hover:text-primary">Post RFQ</a>
          </nav>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav className="bg-muted/50 py-3 border-b" aria-label="Breadcrumb">
        <div className="container mx-auto px-4">
          <ol className="flex items-center gap-2 text-sm flex-wrap">
            <li><a href="/" className="text-muted-foreground hover:text-primary">Home</a></li>
            <li className="text-muted-foreground">›</li>
            {pageData.type === 'category' && (
              <>
                <li><a href="/categories" className="text-muted-foreground hover:text-primary">Categories</a></li>
                <li className="text-muted-foreground">›</li>
                <li className="font-medium">{pageData.category}</li>
              </>
            )}
            {(pageData.type === 'signal' || pageData.type === 'solutions') && (
              <li className="font-medium">{pageData.category} Procurement</li>
            )}
            {pageData.type === 'demand' && (
              <li className="font-medium">{'productName' in pageData ? pageData.productName : pageData.category}</li>
            )}
            {pageData.type === 'source' && (
              <li className="font-medium">Source from {pageData.category}</li>
            )}
            {pageData.type === 'browse' && (
              <li className="font-medium">Browse Products</li>
            )}
            {pageData.type === 'import' && (
              <>
                <li><a href="/global-sourcing-countries" className="text-muted-foreground hover:text-primary">Global Sourcing</a></li>
                <li className="text-muted-foreground">›</li>
                <li className="font-medium">{pageData.category}</li>
              </>
            )}
            {pageData.type === 'rfq' && (
              <li className="font-medium">RFQ Detail</li>
            )}
          </ol>
        </div>
      </nav>

      {/* Main Content - Static HTML */}
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold md:text-4xl">{pageData.title}</h1>
        
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          {pageData.description}
        </p>

        {/* Signal page rich content */}
        {pageData.type === 'signal' && 'bodyText' in pageData && pageData.bodyText && (
          <section className="mt-8">
            <p className="text-base text-muted-foreground leading-relaxed">{pageData.bodyText}</p>
          </section>
        )}

        {/* Use cases for signal pages */}
        {pageData.type === 'signal' && 'useCases' in pageData && pageData.useCases.length > 0 && (
          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Key Applications</h2>
            <ul className="list-disc pl-5 space-y-2">
              {pageData.useCases.map((uc: string, i: number) => (
                <li key={i} className="text-muted-foreground">{uc}</li>
              ))}
            </ul>
          </section>
        )}

        {/* What buyer gets */}
        {pageData.type === 'signal' && 'whatBuyerGets' in pageData && pageData.whatBuyerGets.length > 0 && (
          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">What You Get</h2>
            <ul className="list-disc pl-5 space-y-2">
              {pageData.whatBuyerGets.map((item: string, i: number) => (
                <li key={i} className="text-muted-foreground">{item}</li>
              ))}
            </ul>
          </section>
        )}

        {/* AI Citation Paragraph */}
        <section className="mt-8 rounded-lg border border-border bg-muted/50 p-6">
          <p className="text-base text-foreground">
            <strong>ProcureSaathi</strong> is an AI-powered B2B procurement and sourcing platform 
            that connects verified buyers and suppliers using demand intelligence. Our AI tracks 
            live buyer intent across industries and converts it into actionable procurement opportunities.
            {pageData.type === 'category' && ` We have 500+ verified suppliers in the ${pageData.category} category offering competitive pricing and quality-certified products.`}
            {pageData.type === 'signal' && ` Our managed procurement desk handles ${pageData.category} sourcing end-to-end with quality inspection and delivery tracking.`}
            {pageData.type === 'source' && ` Cross-border sourcing from ${pageData.category} includes export documentation, quality inspection, and managed logistics.`}
          </p>
        </section>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap gap-4">
          <a 
            href="/post-rfq" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
          >
            Post RFQ – Free
          </a>
          <a 
            href="/categories" 
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-6 py-3 text-base font-medium text-foreground hover:bg-accent"
          >
            Browse All Categories
          </a>
        </div>

        {/* Subcategories for category pages */}
        {pageData.type === 'category' && 'subcategories' in pageData && pageData.subcategories.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Browse {pageData.category} Subcategories</h2>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
              {pageData.subcategories.map((sub: string) => {
                const subSlug = sub.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                return (
                  <a 
                    key={sub}
                    href={`/category/${pageData.slug}/${subSlug}`}
                    className="block rounded-lg border border-border p-4 hover:border-primary transition-colors"
                  >
                    <span className="font-medium">{sub}</span>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Internal Links Grid */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Explore More Categories</h2>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categoryWithSlugs.slice(0, 16).map(cat => (
              <a 
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="block rounded-lg border border-border p-4 hover:border-primary transition-colors"
              >
                <span className="font-medium">{cat.name}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Demand pages quick links */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Popular Products</h2>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            {demandProducts.slice(0, 12).map(p => (
              <a 
                key={p.slug}
                href={`/demand/${p.slug}`}
                className="block rounded-lg border border-border p-3 hover:border-primary transition-colors text-sm"
              >
                <span className="font-medium">{p.name}</span>
              </a>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium">How do I source {pageData.category || 'products'} on ProcureSaathi?</h3>
              <p className="mt-2 text-muted-foreground">
                Post a free RFQ describing your requirements. Verified suppliers will submit 
                competitive quotes within 24-48 hours. Compare quotes and close deals with 
                complete transparency.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Are suppliers on ProcureSaathi verified?</h3>
              <p className="mt-2 text-muted-foreground">
                Yes, all suppliers undergo verification before listing. We verify business 
                registration, manufacturing capacity, and quality certifications to ensure 
                reliable sourcing.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Is there a fee for posting RFQ?</h3>
              <p className="mt-2 text-muted-foreground">
                Posting RFQs on ProcureSaathi is completely free for buyers. We only charge 
                a small platform fee upon successful deal closure.
              </p>
            </div>
            <div>
              <h3 className="font-medium">What is the delivery timeline for {pageData.category || 'products'}?</h3>
              <p className="mt-2 text-muted-foreground">
                Delivery timelines vary by product and supplier. Typically, domestic orders 
                are delivered within 7-21 days. ProcureSaathi provides managed logistics 
                with real-time tracking for all orders.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Static Footer */}
      <footer className="border-t border-border bg-muted mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 md:grid-cols-3 mb-8">
            <div>
              <h3 className="font-semibold mb-3">For Buyers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/post-rfq" className="hover:text-primary">Post RFQ</a></li>
                <li><a href="/categories" className="hover:text-primary">Browse Categories</a></li>
                <li><a href="/reverse-auction" className="hover:text-primary">Reverse Auction</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">For Suppliers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/signup?role=supplier" className="hover:text-primary">Register as Supplier</a></li>
                <li><a href="/seller" className="hover:text-primary">Supplier Benefits</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/blogs" className="hover:text-primary">Blog</a></li>
                <li><a href="/global-sourcing-countries" className="hover:text-primary">Global Sourcing</a></li>
                <li><a href="/contact" className="hover:text-primary">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} ProcureSaathi. AI-Powered B2B Procurement Platform.
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            ProcureSaathi does not sell leads. AI matches verified buyers and suppliers based on real demand signals.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default SEOStaticRenderer;
