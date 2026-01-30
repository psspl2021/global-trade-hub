import { Suspense } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, ArrowRight, TrendingUp, Shield, 
  Zap, Users, Bell, BarChart 
} from 'lucide-react';
import { PageHeader } from '@/components/landing/PageHeader';
import { Footer } from '@/components/landing/Footer';
import { EarlyPartnerOffer } from '@/components/landing/EarlyPartnerOffer';
import { AICitationParagraph } from '@/components/seo';
import { IllustrativeDisclaimer } from '@/components/IllustrativeDisclaimer';
import { getSupplierPageConfig } from '@/data/marketplacePages';
import { usePartnerCounts } from '@/hooks/usePartnerCounts';

export default function SupplierPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { supplierCount, logisticsCount, isLoading } = usePartnerCounts();
  
  // Slug format: {product-slug}-suppliers
  const productSlug = slug?.replace(/-suppliers$/, '') || '';
  const config = slug ? getSupplierPageConfig(slug) : undefined;
  
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
          <Button onClick={() => navigate('/seller')}>Become a Supplier</Button>
        </div>
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": config.metaTitle,
    "description": config.metaDescription,
    "mainEntity": {
      "@type": "Organization",
      "name": "ProcureSaathi",
      "description": `Platform for ${config.productName} suppliers to connect with verified buyers`
    }
  };

  return (
    <>
      <Helmet>
        <title>{config.metaTitle}</title>
        <meta name="description" content={config.metaDescription} />
        <meta property="og:title" content={config.metaTitle} />
        <meta property="og:description" content={config.metaDescription} />
        <link rel="canonical" href={`https://procuresaathi.lovable.app/${config.slug}`} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <PageHeader />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-accent/5 via-background to-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-4">
                Supplier Onboarding
              </Badge>
              
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                {config.h1}
              </h1>
              
              <AICitationParagraph variant="compact" />
              
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join ProcureSaathi's verified supplier network. Access AI-detected buyer demand 
                for {config.productName.toLowerCase()} and grow your B2B sales.
              </p>
              
              <Button 
                size="lg" 
                onClick={() => navigate('/signup?role=supplier')} 
                className="gap-2"
              >
                <Zap className="h-5 w-5" />
                Join as Supplier – Free
              </Button>
            </div>
          </div>
        </section>

        {/* Early Partner Offer - With countdown and numbers */}
        <Suspense fallback={null}>
          <EarlyPartnerOffer
            showCountdown={true}
            showNumbers={true}
            supplierCount={isLoading ? 38 : supplierCount}
            logisticsCount={isLoading ? 5 : logisticsCount}
            ctaLabel="Join Early Partner Program"
            onCTAClick={() => navigate('/signup?role=supplier')}
          />
        </Suspense>

        {/* Demand Signals Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
              Live Buyer Demand for {config.productName}
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Our AI continuously tracks buyer intent signals. Here's what we're detecting:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {config.demandSignals.map((signal, i) => (
                <Card key={i} className="border-primary/20">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{signal}</p>
                      <p className="text-sm text-muted-foreground mt-1">AI-detected demand signal</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              What {config.productName} Suppliers Get
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { icon: TrendingUp, title: 'AI-Matched RFQs', desc: 'Receive relevant buyer inquiries automatically' },
                { icon: Shield, title: 'Verified Badge', desc: 'Build trust with quality verification' },
                { icon: BarChart, title: 'Performance Analytics', desc: 'Track quotes, conversions, and growth' },
                { icon: Users, title: 'No Cold Calls', desc: 'Managed trade – buyers come to you' }
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

        {/* Supplier Benefits List */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              Why Suppliers Choose ProcureSaathi
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {config.benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Grow Your {config.productName} Business?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join ProcureSaathi's verified supplier network and start receiving buyer inquiries today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/signup?role=supplier')}
                className="gap-2"
              >
                Join as Supplier
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Link to={`/buy-${productSlug}`}>
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Looking to Buy?
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
              <Link to={`/buy-${productSlug}`} className="text-primary hover:underline">
                Buy {config.productName} →
              </Link>
              <Link to="/seller" className="text-primary hover:underline">
                Supplier Benefits →
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
