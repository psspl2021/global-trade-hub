import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getHighIntentPageBySlug, highIntentPages, type HighIntentPage } from '@/data/highIntentPages';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  TrendingUp, Shield, Brain, ArrowRight, CheckCircle2,
  ChevronRight, AlertTriangle, Zap, BarChart3, Globe,
  Factory, Package, Building, Layers
} from 'lucide-react';
import { PostRFQModal } from '@/components/PostRFQModal';
import { useState, useMemo } from 'react';

const categoryIcons: Record<string, React.ElementType> = {
  metals: Factory,
  'pipes-fittings': Layers,
  construction: Building,
  electrical: Zap,
  packaging: Package,
  chemicals: Globe,
  'industrial-procurement': BarChart3,
  'cost-reduction': TrendingUp,
  'industry-specific': Factory,
};

export default function SolutionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [showRFQ, setShowRFQ] = useState(false);

  const page = useMemo(() => slug ? getHighIntentPageBySlug(slug) : undefined, [slug]);

  if (!page) {
    return <Navigate to="/solutions" replace />;
  }

  const canonicalUrl = `https://www.procuresaathi.com/solutions/${page.slug}`;
  const CategoryIcon = categoryIcons[page.categorySlug] || Factory;

  const relatedPages = page.relatedSlugs
    .map(s => highIntentPages.find(p => p.slug === s))
    .filter(Boolean) as HighIntentPage[];

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": page.h1,
    "description": page.metaDescription,
    "url": canonicalUrl,
    "provider": {
      "@type": "Organization",
      "name": "ProcureSaathi",
      "url": "https://www.procuresaathi.com"
    },
    "areaServed": "India",
    "serviceType": "B2B Industrial Procurement"
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `How to ${page.h1}`,
    "description": page.metaDescription,
    "step": page.howItWorks.map((step, i) => ({
      "@type": "HowToStep",
      "position": i + 1,
      "text": step
    }))
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `How does ProcureSaathi help with ${page.keyword}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": page.solution
        }
      },
      {
        "@type": "Question",
        "name": `What are the benefits of using ProcureSaathi for ${page.keyword}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": page.benefits.join('. ')
        }
      },
      {
        "@type": "Question",
        "name": `How does the reverse auction process work for ${page.keyword}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": page.howItWorks.join('. ')
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={page.metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <script type="application/ld+json">{JSON.stringify(pageSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-56 h-56 bg-accent/10 rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            {/* Breadcrumb */}
            <nav className="text-sm text-muted-foreground mb-6 flex flex-wrap items-center gap-1" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link to="/solutions" className="hover:text-primary transition-colors">Solutions</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{page.h1}</span>
            </nav>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 gap-1">
                    <Shield className="h-3.5 w-3.5" /> Verified Suppliers
                  </Badge>
                  <Badge className="bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 gap-1">
                    <Brain className="h-3.5 w-3.5" /> AI-Powered
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <CategoryIcon className="h-3.5 w-3.5" /> {page.category}
                  </Badge>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
                  {page.h1}
                </h1>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  {page.intro}
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button size="lg" onClick={() => setShowRFQ(true)} className="gap-2 text-lg px-8 py-6 group">
                    {page.ctaPrimary}
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => setShowRFQ(true)} className="gap-2 text-lg px-8 py-6">
                    {page.ctaSecondary}
                  </Button>
                </div>
              </div>

              {/* Trust Stats Card */}
              <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl">
                <CardContent className="p-8 space-y-6">
                  <h2 className="text-xl font-semibold text-foreground">Why Buyers Choose ProcureSaathi</h2>
                  {page.trustPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{point}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-border">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">500+</div>
                        <div className="text-xs text-muted-foreground">Verified Suppliers</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">18%</div>
                        <div className="text-xs text-muted-foreground">Avg. Savings</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">24h</div>
                        <div className="text-xs text-muted-foreground">Quote Turnaround</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-16 bg-destructive/5">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
              <AlertTriangle className="h-7 w-7 text-destructive" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                The Problem with Traditional Procurement
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {page.problemPoints.map((point, i) => (
                <Card key={i} className="border-destructive/20 bg-background animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <CardContent className="p-5 flex items-start gap-3">
                    <span className="text-destructive font-bold text-lg mt-0.5">✗</span>
                    <p className="text-muted-foreground">{point}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <Brain className="h-7 w-7 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                The ProcureSaathi Solution
              </h2>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {page.solution}
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {page.benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-foreground font-medium">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-3 mb-10">
              <Zap className="h-7 w-7 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                How It Works
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {page.howItWorks.map((step, i) => (
                <Card key={i} className="border-border/50 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 animate-slide-up" style={{ animationDelay: `${i * 120}ms` }}>
                  <CardContent className="p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mx-auto mb-4">
                      {i + 1}
                    </div>
                    <p className="text-sm text-muted-foreground">{step}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: `How does ProcureSaathi help with ${page.keyword}?`, a: page.solution },
                { q: `What are the benefits of using ProcureSaathi for ${page.keyword}?`, a: page.benefits.join('. ') + '.' },
                { q: `How does the reverse auction process work?`, a: page.howItWorks.join('. ') + '.' },
              ].map((faq, i) => (
                <details key={i} className="group border border-border rounded-lg" open={i === 0}>
                  <summary className="cursor-pointer p-5 font-medium text-foreground hover:text-primary transition-colors list-none flex items-center justify-between">
                    {faq.q}
                    <ChevronRight className="h-4 w-4 group-open:rotate-90 transition-transform shrink-0 ml-2" />
                  </summary>
                  <div className="px-5 pb-5 text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to Transform Your Procurement?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of Indian businesses saving 12-25% on every order through AI-powered reverse auctions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={() => setShowRFQ(true)} className="gap-2 text-lg px-10 py-6 group">
                {page.ctaPrimary}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link to="/demand">
                <Button size="lg" variant="outline" className="text-lg px-10 py-6">
                  Explore Demand Intelligence
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Related Pages */}
        {relatedPages.length > 0 && (
          <section className="py-12 bg-background border-t border-border/40">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-xl font-bold text-foreground mb-6">Related Procurement Solutions</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {relatedPages.map(rp => (
                  <Link
                    key={rp.slug}
                    to={`/solutions/${rp.slug}`}
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform shrink-0" />
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{rp.h1}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <PostRFQModal
        open={showRFQ}
        onOpenChange={setShowRFQ}
        signalPageCategory={page.category}
        signalPageSubcategory={page.keyword}
      />
    </>
  );
}
