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
function getPageData(pathname: string) {
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

  // Category hub: /categories/{slug}
  const categoryMatch = pathname.match(/^\/categories\/(.+)$/);
  if (categoryMatch) {
    const slug = categoryMatch[1];
    const category = categoryWithSlugs.find(c => c.slug === slug);
    return {
      type: 'category',
      title: category ? `${category.name} B2B Marketplace` : `${slug.replace(/-/g, ' ')} | ProcureSaathi`,
      description: category 
        ? `Explore ${category.name} suppliers and buyers on ProcureSaathi. AI-powered procurement platform for transparent sourcing.`
        : `Browse ${slug.replace(/-/g, ' ')} products and suppliers.`,
      category: category?.name || slug.replace(/-/g, ' '),
      slug,
    };
  }

  // Procurement signal page: /procurement/{slug}
  const signalMatch = pathname.match(/^\/procurement\/(.+)$/);
  if (signalMatch) {
    const slug = signalMatch[1];
    const signalPage = signalPagesConfig.find(p => p.slug === slug);
    return {
      type: 'signal',
      title: signalPage?.h1 || `${slug.replace(/-/g, ' ')} Procurement | ProcureSaathi`,
      description: signalPage?.subheading || `Source ${slug.replace(/-/g, ' ')} from verified suppliers.`,
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
 * Generate FAQ schema for SEO
 */
function generateFAQSchema(pageType: string, category: string) {
  const faqs = [
    {
      question: `How do I source ${category} on ProcureSaathi?`,
      answer: `Post a free RFQ describing your ${category} requirements. Verified suppliers will submit competitive quotes within 24-48 hours. Compare quotes and close deals with complete transparency.`
    },
    {
      question: `Are ${category} suppliers on ProcureSaathi verified?`,
      answer: `Yes, all suppliers undergo verification before listing. We verify business registration, manufacturing capacity, and quality certifications to ensure reliable sourcing.`
    },
    {
      question: 'Is there a fee for posting RFQ?',
      answer: 'Posting RFQs on ProcureSaathi is completely free for buyers. We only charge a small platform fee upon successful deal closure.'
    }
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
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

  const faqSchema = generateFAQSchema(pageData.type, pageData.category);

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      
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

      {/* Main Content - Static HTML */}
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold md:text-4xl">{pageData.title}</h1>
        
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          {pageData.description}
        </p>

        {/* AI Citation Paragraph */}
        <section className="mt-8 rounded-lg border border-border bg-muted/50 p-6">
          <p className="text-base text-foreground">
            <strong>ProcureSaathi</strong> is an AI-powered B2B procurement and sourcing platform 
            that connects verified buyers and suppliers using demand intelligence. Our AI tracks 
            live buyer intent across industries and converts it into actionable procurement opportunities.
          </p>
        </section>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap gap-4">
          {pageData.type === 'buy' || pageData.type === 'signal' || pageData.type === 'category' ? (
            <>
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
            </>
          ) : pageData.type === 'supplier' ? (
            <>
              <a 
                href="/signup?role=supplier" 
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
              >
                AI Detected Demand – List Products
              </a>
              <a 
                href="/seller" 
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-6 py-3 text-base font-medium text-foreground hover:bg-accent"
              >
                Learn More
              </a>
            </>
          ) : (
            <a 
              href="/post-rfq" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              Post RFQ – Free
            </a>
          )}
        </div>

        {/* Internal Links Grid */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Explore More Categories</h2>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categoryWithSlugs.slice(0, 12).map(cat => (
              <a 
                key={cat.slug}
                href={`/buy-${cat.slug}`}
                className="block rounded-lg border border-border p-4 hover:border-primary transition-colors"
              >
                <span className="font-medium">{cat.name}</span>
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
          </div>
        </section>
      </main>

      {/* Static Footer */}
      <footer className="border-t border-border bg-muted mt-16">
        <div className="container mx-auto px-4 py-8">
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
