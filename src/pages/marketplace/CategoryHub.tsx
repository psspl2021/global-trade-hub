import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, Package, Users, FileText, 
  ChevronRight, Grid3X3, TrendingUp, ShieldCheck, BarChart3
} from 'lucide-react';
import { PageHeader } from '@/components/landing/PageHeader';
import { Footer } from '@/components/landing/Footer';
import { AICitationParagraph, GlobalDemandVisibility, TrustSignalsGlobal, SEODemandSensor } from '@/components/seo';
import { IllustrativeDisclaimer } from '@/components/IllustrativeDisclaimer';
import { AIGlobalDemandSignals } from '@/components/ai/AIGlobalDemandSignals';
import { getCategoryHubConfig, nameToSlug, CategoryHubConfig } from '@/data/marketplacePages';
import { useGlobalSEO, getGlobalServiceSchema } from '@/hooks/useGlobalSEO';
import { useDemandCapture } from '@/hooks/useDemandCapture';

/**
 * Generate a fallback config for slugs not in registry
 * This ensures sitemap URLs always render content
 */
const generateFallbackConfig = (slug: string): CategoryHubConfig => {
  // Convert slug back to display name: "textiles-fabrics" → "Textiles Fabrics"
  const displayName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    slug,
    categoryName: displayName,
    metaTitle: `${displayName} Suppliers India | B2B Sourcing | ProcureSaathi`,
    metaDescription: `Find verified ${displayName.toLowerCase()} suppliers. Browse products, post RFQs, get competitive quotes.`,
    h1: `${displayName} – B2B Sourcing & Procurement`,
    overview: `ProcureSaathi connects buyers with verified ${displayName.toLowerCase()} suppliers across India. Browse products, post your requirements, and receive competitive quotes.`,
    subcategories: [],
    buyPageSlugs: [],
    supplierPageSlugs: []
  };
};

export default function CategoryHub() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  // Get config from registry, fallback to generated config
  const registryConfig = slug ? getCategoryHubConfig(slug) : undefined;
  const config = registryConfig || (slug ? generateFallbackConfig(slug) : null);
  
  if (import.meta.env.DEV && !registryConfig && slug) {
    console.warn('[CategoryHub] Using fallback config for slug:', slug);
  }
  
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <Button onClick={() => navigate('/industries')}>Browse All Categories</Button>
        </div>
      </div>
    );
  }

  // Global SEO enhancement
  const globalSEO = useGlobalSEO({
    title: config.metaTitle,
    description: config.metaDescription,
    categoryName: config.categoryName,
    canonical: `https://www.procuresaathi.com/categories/${config.slug}`
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": config.categoryName,
    "description": globalSEO.enhancedDescription,
    "url": `https://www.procuresaathi.com/categories/${config.slug}`,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": config.subcategories.slice(0, 10).map((sub, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": sub,
        "url": `https://www.procuresaathi.com/demand/${nameToSlug(sub)}`
      }))
    }
  };

  const serviceSchema = getGlobalServiceSchema(config.categoryName, globalSEO.countryContext);

  return (
    <>
      <Helmet>
        <title>{globalSEO.enhancedTitle}</title>
        <meta name="description" content={globalSEO.enhancedDescription} />
        <meta name="geo.region" content={globalSEO.geoMeta.region} />
        <meta name="geo.placename" content={globalSEO.geoMeta.placename} />
        <meta property="og:title" content={globalSEO.enhancedTitle} />
        <meta property="og:description" content={globalSEO.enhancedDescription} />
        <link rel="canonical" href={`https://www.procuresaathi.com/categories/${config.slug}`} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
      </Helmet>

      <PageHeader />

      {/* SEO Demand Sensor - AI learns from this page visit */}
      <SEODemandSensor 
        pageType="hub"
        categorySlug={config.slug}
      />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-muted/50 via-background to-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Link to="/industries" className="text-sm text-muted-foreground hover:text-primary">
                  All Categories
                </Link>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{config.categoryName}</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                {config.h1}
              </h1>
              
              <AICitationParagraph variant="compact" />
              
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                {config.overview}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/post-rfq')} className="gap-2">
                  <FileText className="h-5 w-5" />
                  Post RFQ
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/signup?role=supplier')}>
                  <Users className="h-5 w-5 mr-2" />
                  Become a Supplier
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Content Depth — Procurement Context */}
        <section className="py-10 bg-background border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-xl md:text-2xl font-bold mb-4">
              {config.categoryName} Suppliers & Buyers in India
            </h2>
            <p className="text-muted-foreground mb-4">
              ProcureSaathi is India's AI-powered B2B procurement platform connecting verified {config.categoryName.toLowerCase()} suppliers
              with industrial buyers. Whether you're sourcing raw materials, semi-finished goods, or finished products in {config.categoryName.toLowerCase()},
              our marketplace provides transparent pricing, competitive bidding, and managed procurement workflows.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="text-sm font-medium">Verified Suppliers</span>
                  <p className="text-xs text-muted-foreground">Every supplier undergoes KYC and compliance checks</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                <TrendingUp className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="text-sm font-medium">Competitive Bidding</span>
                  <p className="text-xs text-muted-foreground">Multiple suppliers bid on your RFQ for best pricing</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                <BarChart3 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="text-sm font-medium">Market Intelligence</span>
                  <p className="text-xs text-muted-foreground">Real-time demand signals and price benchmarks</p>
                </div>
              </div>
            </div>
            {/* Internal link to live RFQs */}
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <Link to="/requirements" className="text-primary hover:underline font-medium">
                View live {config.categoryName} buyer RFQs →
              </Link>
              {config.subcategories.length > 0 && (
                <Link to={`/demand/${nameToSlug(config.subcategories[0])}`} className="text-primary hover:underline font-medium">
                  Explore {config.subcategories[0]} demand →
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* AI Global Demand Signals */}
        <AIGlobalDemandSignals 
          productName={config.categoryName} 
          categorySlug={config.slug}
          variant="compact"
          className="mx-4 md:mx-auto max-w-4xl my-8"
        />

        {/* Global Demand Visibility - Country-aware content */}
        <GlobalDemandVisibility 
          productName={config.categoryName}
          categorySlug={config.slug}
          variant="inline"
          className="container mx-auto px-4 mb-8"
        />

        {/* Products Grid - BUY Pages */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  Buy {config.categoryName}
                </h2>
                <p className="text-muted-foreground mt-2">
                  Source from verified suppliers with managed procurement
                </p>
              </div>
              <Badge variant="secondary" className="hidden md:flex">
                <Package className="h-4 w-4 mr-2" />
                {config.subcategories.length} Products
              </Badge>
            </div>
            
            {config.subcategories.length > 0 ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {config.subcategories.map((subcategory, i) => {
                  const productSlug = nameToSlug(subcategory);
                  return (
                    <Link key={i} to={`/demand/${productSlug}`}>
                      <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                        <CardContent className="p-4 flex items-center justify-between">
                          <span className="font-medium text-sm group-hover:text-primary transition-colors">
                            {subcategory}
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-muted/30 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Products coming soon</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  We're onboarding verified {config.categoryName.toLowerCase()} suppliers. Post your requirement to get early access.
                </p>
                <Button onClick={() => navigate('/post-rfq')} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Post Your Requirement
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Supplier Pages Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  Become a Supplier
                </h2>
                <p className="text-muted-foreground mt-2">
                  Join as a verified supplier and access buyer demand
                </p>
              </div>
              <Badge variant="outline" className="hidden md:flex">
                <Users className="h-4 w-4 mr-2" />
                Supplier Onboarding
              </Badge>
            </div>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {config.subcategories.slice(0, 12).map((subcategory, i) => {
                const productSlug = nameToSlug(subcategory);
                return (
                  <Link key={i} to={`/${productSlug}-suppliers`}>
                    <Card className="h-full hover:border-accent/50 hover:shadow-md transition-all cursor-pointer group border-dashed">
                      <CardContent className="p-4 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {subcategory} Suppliers
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
            
            {config.subcategories.length > 12 && (
              <div className="text-center mt-8">
                <Button variant="outline" onClick={() => navigate('/seller')}>
                  View All Supplier Opportunities
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Need {config.categoryName}?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Post your requirement and receive competitive quotes from verified suppliers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/post-rfq')}
                className="gap-2"
              >
                Post RFQ – Get Quotes
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Link to="/requirements">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-white text-primary border-white hover:bg-white/90 w-full"
                >
                  Browse Live RFQs
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Related Categories with real internal links */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Grid3X3 className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Explore More Categories</span>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/industries" className="text-primary hover:underline text-sm">
                All Categories →
              </Link>
              <Link to="/requirements" className="text-primary hover:underline text-sm">
                Live RFQ Marketplace →
              </Link>
              <Link to="/reverse-auction-procurement" className="text-primary hover:underline text-sm">
                Reverse Auction Procurement →
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
