import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, Package, Users, FileText, 
  ChevronRight, Grid3X3 
} from 'lucide-react';
import { PageHeader } from '@/components/landing/PageHeader';
import { Footer } from '@/components/landing/Footer';
import { AICitationParagraph } from '@/components/seo';
import { IllustrativeDisclaimer } from '@/components/IllustrativeDisclaimer';
import { AIGlobalDemandSignals } from '@/components/ai/AIGlobalDemandSignals';
import { getCategoryHubConfig, nameToSlug } from '@/data/marketplacePages';

export default function CategoryHub() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const config = slug ? getCategoryHubConfig(slug) : undefined;
  
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <Button onClick={() => navigate('/categories')}>Browse All Categories</Button>
        </div>
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": config.categoryName,
    "description": config.metaDescription,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": config.subcategories.slice(0, 10).map((sub, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": sub,
        "url": `https://procuresaathi.lovable.app/buy-${nameToSlug(sub)}`
      }))
    }
  };

  return (
    <>
      <Helmet>
        <title>{config.metaTitle}</title>
        <meta name="description" content={config.metaDescription} />
        <meta property="og:title" content={config.metaTitle} />
        <meta property="og:description" content={config.metaDescription} />
        <link rel="canonical" href={`https://procuresaathi.lovable.app/categories/${config.slug}`} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <PageHeader />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-muted/50 via-background to-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Link to="/categories" className="text-sm text-muted-foreground hover:text-primary">
                  Categories
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

        {/* AI Global Demand Signals */}
        <AIGlobalDemandSignals 
          productName={config.categoryName} 
          categorySlug={config.slug}
          variant="compact"
          className="mx-4 md:mx-auto max-w-4xl my-8"
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
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {config.subcategories.map((subcategory, i) => {
                const productSlug = nameToSlug(subcategory);
                return (
                  <Link key={i} to={`/buy-${productSlug}`}>
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
              <Button 
                size="lg" 
                variant="outline" 
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate('/browseproducts')}
              >
                Browse Suppliers
              </Button>
            </div>
          </div>
        </section>

        {/* Related Categories */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Grid3X3 className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Explore More Categories</span>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/categories" className="text-primary hover:underline text-sm">
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
