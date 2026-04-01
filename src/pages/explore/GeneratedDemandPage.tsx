import { useParams, Link } from 'react-router-dom';
import { trackDemandPageView, trackDemandRFQClick } from '@/utils/demandPageAnalytics';
import { renderSafeAnswer } from '@/utils/safeHtmlRenderer';
import { Helmet } from 'react-helmet-async';
import { getDemandProductBySlug, demandProducts, getRelatedDemandProducts, type DemandProduct } from '@/data/demandProducts';
import { useDemandProduct } from '@/hooks/useDemandProduct';
import { generateDemandContent } from '@/utils/demandContentEngine';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  TrendingUp, Shield, Brain, ArrowRight, CheckCircle2,
  Factory, Globe, BarChart3, ChevronRight, Package, Ship, Wrench,
  Activity, Layers, GitCompare, HelpCircle, Building
} from 'lucide-react';
import { PostRFQModal } from '@/components/PostRFQModal';
import { useState, useEffect, useMemo, useCallback } from 'react';
import GSCQueryInjection from '@/components/seo/GSCQueryInjection';
import RevenueWeightedLinksLive from '@/components/seo/RevenueWeightedLinksLive';
import DemandIntelligenceTable from '@/components/seo/DemandIntelligenceTable';
import IntentKeywordSection from '@/components/seo/IntentKeywordSection';
import CommercialCTA from '@/components/seo/CommercialCTA';
import BuyerTrustSection from '@/components/seo/BuyerTrustSection';
import BreadcrumbHierarchy from '@/components/seo/BreadcrumbHierarchy';

function FAQAccordion({ allFaqs, productName }: { allFaqs: Array<{ question: string; answer: string }>; productName: string }) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);

  useEffect(() => {
    if (typeof document !== "undefined" && document.referrer.includes("google")) {
      setOpenIndexes([0, 1]);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 800) {
        setOpenIndexes(prev => prev.includes(2) ? prev : [...prev, 2]);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const toggle = useCallback((i: number) => {
    setOpenIndexes(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }, []);

  const faqs = useMemo(() => allFaqs, [allFaqs]);

  return (
    <section aria-label="Frequently Asked Questions">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
      </div>
      <div className="divide-y divide-border">
        {faqs.map((faq, i) => (
          <div id={`faq-${i}`} key={i} className="py-4">
            <button
              onClick={() => toggle(i)}
              aria-expanded={openIndexes.includes(i)}
              aria-controls={`faq-content-${i}`}
              className="font-semibold text-foreground cursor-pointer flex items-center justify-between gap-4 w-full text-left"
            >
              <h3 className="text-left">{faq.question}</h3>
              <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${openIndexes.includes(i) ? 'rotate-90' : ''}`} />
            </button>
            {openIndexes.includes(i) && (
              <div id={`faq-content-${i}`} role="region" className="text-muted-foreground mt-3 leading-relaxed">
                {renderSafeAnswer(faq.answer)}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground/70 mt-6">
        Also searched: {productName} suppliers near me, bulk {productName} price,{' '}
        {productName} manufacturers India, {productName} wholesale rate,{' '}
        best {productName} dealer in India
      </p>
    </section>
  );
}

function BreadcrumbNav({ product }: { product: DemandProduct }) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.procuresaathi.com/" },
      { "@type": "ListItem", "position": 2, "name": "Demand", "item": "https://www.procuresaathi.com/demand" },
      { "@type": "ListItem", "position": 3, "name": product.name, "item": `https://www.procuresaathi.com/demand/${product.slug}` }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <nav className="text-sm text-muted-foreground mb-6 flex flex-wrap items-center gap-1" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/demand" className="hover:text-primary">Demand</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{product.name}</span>
      </nav>
    </>
  );
}

/** Sidebar: Popular Procurement Pages */
function DemandClusterSidebar({ currentSlug, category }: { currentSlug: string; category: string }) {
  const related = demandProducts
    .filter(p => p.categorySlug === category && p.slug !== currentSlug)
    .slice(0, 6);

  if (related.length === 0) return null;

  return (
    <aside className="lg:col-span-1">
      <div className="sticky top-24 space-y-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Popular Procurement Pages
          </h3>
          <ul className="space-y-2 list-none p-0 m-0">
            {related.map(p => (
              <li key={p.slug}>
                <Link
                  to={`/demand/${p.slug}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <ArrowRight className="h-3 w-3 shrink-0" />
                  {p.name} Procurement
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick RFQ sidebar CTA */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center">
          <p className="text-sm font-medium text-foreground mb-3">Need a quick quote?</p>
          <Link to="/post-rfq">
            <Button size="sm" className="w-full gap-1">
              Submit RFQ <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default function GeneratedDemandPage() {
  const { slug } = useParams<{ slug: string }>();
  const [rfqOpen, setRfqOpen] = useState(false);

  const { product, isLoading } = useDemandProduct(slug);

  // Analytics: track page view once per slug per session
  useEffect(() => {
    if (slug && !isLoading && product) {
      trackDemandPageView(slug);
    }
  }, [slug, isLoading, product]);

  const handleRFQOpen = useCallback(() => {
    if (slug) trackDemandRFQClick(slug);
    setRfqOpen(true);
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!product) return null;

  const content = generateDemandContent(product);
  const canonicalUrl = `https://www.procuresaathi.com/demand/${product.slug}`;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `${product.name} Procurement via Reverse Auction`,
    "description": `Source ${product.name} in India with verified suppliers and managed procurement.`,
    "url": canonicalUrl,
    "provider": {
      "@type": "Organization",
      "name": "ProcureSaathi",
      "url": "https://www.procuresaathi.com"
    },
    "areaServed": "India",
    "serviceType": "B2B Industrial Procurement"
  };

  // All FAQs combined for schema
  const allFaqs = [
    {
      question: `What is the price of ${product.name} in India?`,
      answer: `${product.name} prices in India typically range around ${product.priceRange} depending on grade, quantity, and source. Check real-time pricing on our <a href="${canonicalUrl}">${product.name} procurement page</a>.`
    },
    {
      question: `Which industries procure ${product.name}?`,
      answer: `${product.name} is primarily procured by ${product.industries.join(', ')} industries in India. Explore more categories on our <a href="/demand">procurement directory</a>.`
    },
    {
      question: `What are the key grades of ${product.name}?`,
      answer: `Key grades include ${product.grades.slice(0, 5).join(', ')}. Grade selection depends on specific application requirements and industry standards.`
    },
    {
      question: `How to source ${product.name} with verified suppliers?`,
      answer: `ProcureSaathi connects industrial buyers with AI-verified ${product.name} suppliers through managed procurement, sealed bidding, and quality-assured sourcing. <a href="/buyer">Start a reverse auction</a> to get competitive quotes.`
    },
    ...content.extraFaqs,
  ];

  // Strip HTML from answers for schema (plain text only)
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allFaqs.slice(0, 5).map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": { "@type": "Answer", "text": stripHtml(f.answer) }
    }))
  };

  return (
    <>
      <Helmet>
        <title>Buy {product.name} in India | Procurement & Suppliers | ProcureSaathi</title>
        <meta name="description" content={`Source ${product.name} in India with verified suppliers, import intelligence, and procurement insights for industrial buyers.`} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={`Buy ${product.name} in India | Procurement & Suppliers`} />
        <meta property="og:description" content={`Source ${product.name} in India with verified suppliers and procurement insights.`} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
      </Helmet>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([serviceSchema, faqSchema]) }} />

      <main className="min-h-screen bg-background">
        {/* ─── HERO ──────────────────────────────────────────── */}
        <section className="relative py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 max-w-6xl">
            <BreadcrumbNav product={product} />

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 gap-1">
                    <Shield className="h-3.5 w-3.5" /> AI Verified Suppliers
                  </Badge>
                  <Badge className="bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 gap-1">
                    <Brain className="h-3.5 w-3.5" /> Live Demand Intelligence
                  </Badge>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
                  {product.name} Procurement in India
                </h1>

                <p className="text-lg text-muted-foreground mb-4 leading-relaxed max-w-3xl">
                  {content.heroIntro}
                </p>
                <p className="text-xs text-muted-foreground/70 mb-8">
                  Updated daily with live RFQs and supplier activity · Last refreshed {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button size="lg" onClick={handleRFQOpen} className="gap-2 text-lg px-8 py-6">
                    Get Verified Supplier Quotes <ArrowRight className="h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" asChild className="gap-2 text-lg px-8 py-6">
                    <Link to="/seller">List as Supplier</Link>
                  </Button>
                </div>
              </div>

              {product.heroImage && (
                <div className="rounded-xl overflow-hidden border border-border bg-card shadow-sm">
                  <img
                    src={product.heroImage}
                    alt={product.heroImageAlt || `${product.name} - Industrial product`}
                    className="w-full h-auto object-cover"
                    loading="eager"
                    width={800}
                    height={512}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── MAIN CONTENT + SIDEBAR ─────────────────────────── */}
        <div className="container mx-auto px-4 max-w-6xl py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {/* Main content */}
            <div className="lg:col-span-3 space-y-16">

              {/* ─── AI DEMAND WIDGET ──────────────────────────── */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">ProcureSaathi Demand Intelligence</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{content.demandSignals.recentRfqs}+</p>
                      <p className="text-xs text-muted-foreground mt-1">Recent RFQs</p>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{content.demandSignals.avgOrderSize}</p>
                      <p className="text-xs text-muted-foreground mt-1">Avg. Order Size</p>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm font-bold text-primary">{content.demandSignals.topBuyingIndustries.join(', ')}</p>
                      <p className="text-xs text-muted-foreground mt-1">Top Buying Industries</p>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{content.demandSignals.priceTrend}</p>
                      <p className="text-xs text-muted-foreground mt-1">Price Trend</p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* ─── INDUSTRY CLUSTERS ─────────────────────────── */}
              {content.industryClusters.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <Building className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Industries That Procure {product.name}</h2>
                  </div>
                  <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 list-none p-0 m-0">
                    {content.industryClusters.map(cluster => (
                      <li key={cluster.slug}>
                        <Link
                          to={`/industries/${cluster.slug}`}
                          className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                        >
                          <Factory className="h-5 w-5 text-primary shrink-0" />
                          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{cluster.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* ─── INDUSTRY DEMAND INTELLIGENCE ─────────────────── */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Factory className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Industry Demand Intelligence</h2>
                </div>
                <div className="prose prose-lg max-w-none text-muted-foreground dark:prose-invert">
                  {content.industryDemand.split('\n').map((line, i) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <h3 key={i} className="text-lg font-semibold text-foreground mt-6 mb-3">{line.replace(/\*\*/g, '')}</h3>;
                    }
                    if (line.startsWith('•')) {
                      const parts = line.replace('• ', '').split(':**');
                      if (parts.length === 2) {
                        return <p key={i} className="ml-4 mb-2"><strong className="text-foreground">{parts[0].replace('**', '')}:</strong> {parts[1]}</p>;
                      }
                      return <p key={i} className="ml-4 mb-2">{line.replace('• ', '')}</p>;
                    }
                    if (line.trim() === '') return null;
                    return <p key={i} className="mb-3">{line}</p>;
                  })}
                </div>
              </section>

              {/* ─── PROCUREMENT SPECIFICATIONS ───────────────────── */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Wrench className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Procurement Specifications</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <Card className="border-border">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" /> Available Grades
                      </h3>
                      <ul className="space-y-2">
                        {product.grades.map((g, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span> {g}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" /> Key Specifications
                      </h3>
                      <ul className="space-y-2">
                        {product.specifications.map((s, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span> {s}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-sm"><strong className="text-foreground">Standards:</strong> <span className="text-muted-foreground">{product.standards.join(', ')}</span></p>
                        <p className="text-sm mt-2"><strong className="text-foreground">HSN Codes:</strong> <span className="text-muted-foreground">{product.hsnCodes.join(', ')}</span></p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  {content.procurementSpecs.split('\n').filter(l => !l.startsWith('**Available') && !l.startsWith('**Key Spec') && !l.startsWith('**Applicable') && !l.startsWith('**Typical Price') && !l.startsWith('•')).map((line, i) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <h3 key={i} className="text-lg font-semibold text-foreground mt-6 mb-3">{line.replace(/\*\*/g, '')}</h3>;
                    }
                    if (line.trim() === '') return null;
                    return <p key={i} className="mb-3">{line.replace(/\*\*/g, '')}</p>;
                  })}
                </div>
              </section>

              {/* ─── IMPORT CORRIDOR LINKS ────────────────────────── */}
              {product.importCountries.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <Ship className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Global Sourcing Options for {product.name}</h2>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    India imports {product.name} from multiple international sources. Explore country-specific import corridors for pricing, duty structures, and supplier intelligence.
                  </p>
                  <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 list-none p-0 m-0">
                    {product.importCountries.slice(0, 8).map(country => {
                      const countrySlug = country.toLowerCase().replace(/\s+/g, '-');
                      const productBase = product.slug.replace('-india', '');
                      return (
                        <li key={country}>
                          <Link
                            to={`/import/${productBase}-from-${countrySlug}`}
                            title={`Import ${product.name} from ${country} – pricing, suppliers & duty`}
                            className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors"
                          >
                            <Globe className="h-5 w-5 text-primary shrink-0" />
                            <span className="text-sm font-medium text-foreground">Import {product.name} from {country}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {/* ─── COMPARISON LINKS ─────────────────────────────── */}
              {content.comparisonLinks.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <GitCompare className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Compare Materials</h2>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Not sure which material to choose? Compare {product.name} with alternatives to find the right fit for your application.
                  </p>
                  <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 list-none p-0 m-0">
                    {content.comparisonLinks.map(comp => (
                      <li key={comp.slug}>
                        <Link
                          to={`/compare/${comp.slug}`}
                          className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                        >
                          <BarChart3 className="h-5 w-5 text-primary shrink-0" />
                          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{comp.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* ─── RFQ DEMAND SIGNALS ──────────────────────────── */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">RFQ Demand Signals</h2>
                </div>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  {content.rfqSignals.split('\n').map((line, i) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <h3 key={i} className="text-lg font-semibold text-foreground mt-6 mb-3">{line.replace(/\*\*/g, '')}</h3>;
                    }
                    if (line.startsWith('•')) {
                      const parts = line.replace('• ', '').split(':');
                      if (parts.length >= 2) {
                        return <p key={i} className="ml-4 mb-2"><strong className="text-foreground">{parts[0]}:</strong> {parts.slice(1).join(':')}</p>;
                      }
                      return <p key={i} className="ml-4 mb-2">{line.replace('• ', '')}</p>;
                    }
                    if (line.trim() === '') return null;
                    return <p key={i} className="mb-3">{line}</p>;
                  })}
                </div>
              </section>

              {/* ─── APPLICATIONS / USE CASES ────────────────────── */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Key Applications & Use Cases</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {product.applications.map((app, i) => (
                    <Card key={i} className="border-border">
                      <CardContent className="p-4 flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{app}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* ─── MODULE 3: REGIONAL DEMAND INTELLIGENCE ─────── */}
              <DemandIntelligenceTable product={product} />

              {/* ─── MODULE 1: GSC QUERY INJECTION ────────────────── */}
              <GSCQueryInjection slug={product.slug} productName={product.name} />

              {/* ─── MODULE 2: REVENUE WEIGHTED LINKS ────────────── */}
              <RevenueWeightedLinksLive currentSlug={product.slug} />

              {/* ─── WHY PROCURESAATHI ────────────────────────────── */}
              <section className="bg-primary/5 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Why Source {product.name} Through ProcureSaathi?</h2>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  {content.whyProcureSaathi.split('\n').map((line, i) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <h3 key={i} className="text-lg font-semibold text-foreground mt-4 mb-3">{line.replace(/\*\*/g, '')}</h3>;
                    }
                    if (line.startsWith('•')) {
                      const parts = line.replace('• ', '').split(':**');
                      if (parts.length === 2) {
                        return <p key={i} className="ml-4 mb-2"><strong className="text-foreground">{parts[0].replace('**', '')}:</strong> {parts[1]}</p>;
                      }
                      return <p key={i} className="ml-4 mb-2">{line.replace('• ', '')}</p>;
                    }
                    if (line.trim() === '') return null;
                    return <p key={i} className="mb-3">{line}</p>;
                  })}
                </div>
              </section>

              {/* ─── RELATED PRODUCTS ─────────────────────────────── */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-6">Related Products</h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {product.relatedSlugs.slice(0, 6).map(relSlug => {
                    const relName = relSlug
                      .replace('-india', '')
                      .split('-')
                      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ');
                    return (
                      <Link
                        key={relSlug}
                        to={`/demand/${relSlug}`}
                        className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                      >
                        <ArrowRight className="h-4 w-4 text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
                        <span className="text-sm font-medium text-foreground">{relName}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* ─── INTERNAL LINKS ──────────────────────────────── */}
              <section className="border-t border-border pt-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Explore More</h2>
                <div className="flex flex-wrap gap-3">
                  {content.industryClusters.slice(0, 3).map(c => (
                    <Link key={c.slug} to={`/industries/${c.slug}`}>
                      <Button variant="outline" size="sm">{c.name}</Button>
                    </Link>
                  ))}
                  <Link to="/global-sourcing-countries">
                    <Button variant="outline" size="sm">Global Sourcing Countries</Button>
                  </Link>
                  <Link to="/steel-comparisons">
                    <Button variant="outline" size="sm">Steel Comparisons</Button>
                  </Link>
                  <Link to="/industrial-use-cases">
                    <Button variant="outline" size="sm">Industrial Use Cases</Button>
                  </Link>
                  <Link to="/demand">
                    <Button variant="outline" size="sm">All Demand Pages</Button>
                  </Link>
                </div>
              </section>

              {/* ─── INTENT KEYWORD LAYER ────────────────────────── */}
              <IntentKeywordSection
                productName={product.name}
                slug={product.slug}
                priceRange={product.priceRange}
                recentRFQs={content.demandSignals.recentRfqs}
              />

              {/* ─── COMMERCIAL CTA + FRESHNESS ──────────────────── */}
              <CommercialCTA
                productName={product.name}
                recentRFQs={content.demandSignals.recentRfqs}
                onOpenRFQ={() => setRfqOpen(true)}
              />

              {/* ─── BREADCRUMB HIERARCHY ─────────────────────────── */}
              <BreadcrumbHierarchy
                industrySlug={product.industrySlug || product.category.toLowerCase().replace(/\s+/g, '-')}
                industryName={product.category}
                productName={product.name}
              />

              {/* ─── BUYER TRUST (E-E-A-T) ────────────────────────── */}
              <BuyerTrustSection />

              {/* ─── FAQ SECTION (ACCORDION) ─────────────────── */}
              <FAQAccordion allFaqs={allFaqs} productName={product.name} />

              {/* ─── RELATED DEMAND PRODUCTS (SAME CATEGORY or DB-linked) ─── */}
              {(() => {
                const staticRelated = getRelatedDemandProducts(product.slug, 6);
                // For DB-generated pages, use relatedSlugs from the DB
                const dbRelatedSlugs = (product as any).relatedSlugs || [];
                const dbRelated = dbRelatedSlugs
                  .map((s: string) => getDemandProductBySlug(s))
                  .filter(Boolean) as DemandProduct[];
                // Merge: DB links first, then static, deduplicated
                const seen = new Set<string>();
                const mergedRelated: DemandProduct[] = [];
                for (const item of [...dbRelated, ...staticRelated]) {
                  if (!seen.has(item.slug) && item.slug !== product.slug) {
                    seen.add(item.slug);
                    mergedRelated.push(item);
                  }
                  if (mergedRelated.length >= 6) break;
                }
                // If DB slugs exist but aren't in static taxonomy, render as simple links
                const unmappedDbSlugs = dbRelatedSlugs.filter(
                  (s: string) => s !== product.slug && !seen.has(s)
                );
                if (!mergedRelated.length && !unmappedDbSlugs.length) return null;
                return (
                  <section className="mt-10">
                    <h2 className="text-lg font-semibold text-foreground mb-4">
                      Related {product.category} Products
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {mergedRelated.map(item => (
                        <a
                          key={item.slug}
                          href={`/demand/${item.slug}`}
                          className="p-4 border border-border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all group"
                        >
                          <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.priceRange}</p>
                        </a>
                      ))}
                      {unmappedDbSlugs.slice(0, 6 - mergedRelated.length).map((s: string) => (
                        <a
                          key={s}
                          href={`/demand/${s}`}
                          className="p-4 border border-border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all group"
                        >
                          <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                            {s.replace(/-suppliers-india$/, '').replace(/-suppliers$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </p>
                        </a>
                      ))}
                    </div>
                  </section>
                );
              })()}

              {/* ─── CROSS-CATEGORY INTERNAL LINKS ────────────── */}
              {(() => {
                // Deterministic shuffle based on current slug for varied linking
                const hash = product.slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                const crossCategory = demandProducts
                  .filter(p => p.slug !== product.slug && p.categorySlug !== product.categorySlug)
                  .sort((a, b) => {
                    const aHash = a.slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                    const bHash = b.slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                    return ((aHash * 31 + hash) % 97) - ((bHash * 31 + hash) % 97);
                  })
                  .slice(0, 6);
                if (!crossCategory.length) return null;
                return (
                  <section className="mt-10">
                    <h2 className="text-lg font-semibold text-foreground mb-3">
                      Related Procurement Categories
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {crossCategory.map(p => (
                        <a
                          key={p.slug}
                          href={`/demand/${p.slug}`}
                          className="text-sm text-primary hover:underline transition-colors"
                        >
                          {p.name}
                        </a>
                      ))}
                    </div>
                  </section>
                );
              })()}
            </div>

            {/* Sidebar */}
            <DemandClusterSidebar currentSlug={product.slug} category={product.categorySlug} />
          </div>
        </div>
      </main>

      <PostRFQModal open={rfqOpen} onOpenChange={setRfqOpen} />
    </>
  );
}
