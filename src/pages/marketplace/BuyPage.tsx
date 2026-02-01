import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, ArrowRight, Package, Shield, 
  Factory, TrendingUp, Users, FileText 
} from 'lucide-react';
import { PageHeader } from '@/components/landing/PageHeader';
import { Footer } from '@/components/landing/Footer';
import { AICitationParagraph, GlobalDemandVisibility, TrustSignalsGlobal, SEODemandSensor } from '@/components/seo';
import { IllustrativeDisclaimer } from '@/components/IllustrativeDisclaimer';
import { AIGlobalDemandSignals } from '@/components/ai/AIGlobalDemandSignals';
import { getBuyPageConfig, nameToSlug, BuyPageConfig } from '@/data/marketplacePages';
import { useGlobalSEO, getGlobalServiceSchema } from '@/hooks/useGlobalSEO';
import { useDemandCapture } from '@/hooks/useDemandCapture';

/**
 * Generate a fallback config for slugs not in registry
 * This ensures sitemap URLs always render content
 */
const generateFallbackConfig = (slug: string): BuyPageConfig => {
  // Convert slug back to display name: "pharmaceuticals-drugs" → "Pharmaceuticals Drugs"
  const displayName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    slug,
    productName: displayName,
    categorySlug: slug,
    categoryName: displayName,
    metaTitle: `Buy ${displayName} in Bulk | Verified Suppliers India | ProcureSaathi`,
    metaDescription: `Source ${displayName.toLowerCase()} from verified suppliers. Competitive pricing, quality assurance, managed procurement.`,
    h1: `Buy ${displayName} in Bulk from Verified Suppliers`,
    industries: ['Manufacturing', 'Trading & Distribution', 'Industrial Projects', 'Export & Import', 'Retail & Wholesale'],
    useCases: [`Bulk ${displayName.toLowerCase()} procurement`, 'Project-based sourcing', 'Regular supply contracts', 'Quality-certified materials'],
    relatedProducts: [],
    supplierPageSlug: `${slug}-suppliers`
  };
};

export default function BuyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { captureRFQClick } = useDemandCapture();
  
  // Extract slug from pathname: /buy-steel-pipes -> steel-pipes
  // Also handle trailing slashes and clean the path
  const cleanPath = location.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  const slug = cleanPath.startsWith('buy-') ? cleanPath.replace(/^buy-/, '') : '';
  
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('[BuyPage] pathname:', location.pathname, '| cleanPath:', cleanPath, '| slug:', slug);
  }
  
  // Try to get config from registry, fallback to generated config
  const registryConfig = slug ? getBuyPageConfig(slug) : undefined;
  const config = registryConfig || (slug ? generateFallbackConfig(slug) : null);
  
  if (import.meta.env.DEV && !registryConfig) {
    console.warn('[BuyPage] Using fallback config for slug:', slug);
  }
  
  // Only show 404 if there's no slug at all
  if (!config || !slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-4">Looking for: {slug || cleanPath}</p>
          <Button onClick={() => navigate('/categories')}>Browse Categories</Button>
        </div>
      </div>
    );
  }
  
  // Handle RFQ button click with demand capture
  const handleRFQClick = () => {
    captureRFQClick(config.categorySlug, config.slug, 'product');
    navigate('/post-rfq');
  };

  // Global SEO enhancement with country context
  const globalSEO = useGlobalSEO({
    title: config.metaTitle,
    description: config.metaDescription,
    productName: config.productName,
    categoryName: config.categoryName,
    canonical: `https://procuresaathi.com/buy-${config.slug}`
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": config.productName,
    "description": globalSEO.enhancedDescription,
    "category": config.categoryName,
    "brand": {
      "@type": "Brand",
      "name": "ProcureSaathi"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "ProcureSaathi"
      }
    }
  };

  // Global service schema for international reach
  const serviceSchema = getGlobalServiceSchema(config.productName, globalSEO.countryContext);

  return (
    <>
      <Helmet>
        <title>{globalSEO.enhancedTitle}</title>
        <meta name="description" content={globalSEO.enhancedDescription} />
        <meta name="geo.region" content={globalSEO.geoMeta.region} />
        <meta name="geo.placename" content={globalSEO.geoMeta.placename} />
        <meta property="og:title" content={globalSEO.enhancedTitle} />
        <meta property="og:description" content={globalSEO.enhancedDescription} />
        <link rel="canonical" href={`https://procuresaathi.com/buy-${config.slug}`} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
      </Helmet>

      <PageHeader />

      {/* SEO Demand Sensor - AI learns from this page visit */}
      <SEODemandSensor 
        pageType="product"
        categorySlug={config.categorySlug}
        subcategorySlug={config.slug}
        productSlug={config.slug}
      />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4">
                {config.categoryName}
              </Badge>
              
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                {config.h1}
              </h1>
              
              <AICitationParagraph variant="compact" />
              
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Source quality {config.productName.toLowerCase()} from verified suppliers. 
                Competitive pricing, managed procurement, single-point accountability.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={handleRFQClick} className="gap-2">
                  <FileText className="h-5 w-5" />
                  Post RFQ – Get Quotes
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/browseproducts')}>
                  Browse Products
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Global Demand Visibility - Country-aware content block */}
        <GlobalDemandVisibility 
          productName={config.productName}
          categorySlug={config.categorySlug}
          variant="section"
        />

        {/* AI Global Demand Signals */}
        <AIGlobalDemandSignals 
          productName={config.productName} 
          categorySlug={config.categorySlug}
          variant="default"
        />

        {/* Why ProcureSaathi Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              Why Source {config.productName} Through ProcureSaathi?
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { icon: Shield, title: 'Verified Suppliers', desc: 'Quality-checked partners with documentation' },
                { icon: TrendingUp, title: 'Competitive Pricing', desc: 'Multiple quotes, transparent comparison' },
                { icon: Package, title: 'Managed Logistics', desc: 'Delivery coordination included' },
                { icon: Users, title: 'Single Counterparty', desc: 'ProcureSaathi handles everything' }
              ].map((item, i) => (
                <Card key={i} className="text-center p-6">
                  <item.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Industries Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              Industries We Serve
            </h2>
            
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
              {config.industries.map((industry, i) => (
                <Badge key={i} variant="outline" className="px-4 py-2 text-sm">
                  <Factory className="h-4 w-4 mr-2" />
                  {industry}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              Typical Use Cases
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {config.useCases.map((useCase, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{useCase}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Products Section */}
        {config.relatedProducts.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Related Products
              </h2>
              
              <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
                {config.relatedProducts.map((productSlug, i) => (
                  <Link key={i} to={`/buy-${productSlug}`}>
                    <Badge variant="secondary" className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                      {productSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      <ArrowRight className="h-3 w-3 ml-2" />
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Source {config.productName}?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Post your requirement and receive competitive quotes from verified suppliers within 24-48 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/post-rfq')}
                className="gap-2"
              >
                Post RFQ Now
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Link to={`/${config.supplierPageSlug}`}>
                <Button size="lg" variant="outline" className="bg-white text-primary border-white hover:bg-white/90">
                  Become a Supplier
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Internal Links */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to={`/categories/${config.categorySlug}`} className="text-primary hover:underline">
                {config.categoryName} →
              </Link>
              <Link to={`/${config.supplierPageSlug}`} className="text-primary hover:underline">
                Become a {config.productName} Supplier →
              </Link>
              <Link to="/categories" className="text-primary hover:underline">
                All Categories →
              </Link>
            </div>
          </div>
        </section>

        <IllustrativeDisclaimer variant="compact" className="bg-muted/50 py-6" />
      </main>

      <Footer />
    </>
  );
}
