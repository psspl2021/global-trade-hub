/**
 * Module 4: Auto-Generated Comparison Page
 * Renders a rich comparison for any product pair in the autoComparisonPairs registry.
 */
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getAutoComparisonBySlug } from '@/data/autoComparisonPairs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, Scale, ChevronRight, HelpCircle } from 'lucide-react';
import type { DemandProduct } from '@/data/demandProducts';

const BASE = 'https://www.procuresaathi.com';

function ComparisonTable({ a, b }: { a: DemandProduct; b: DemandProduct }) {
  const rows = [
    { label: 'Category', valA: a.category, valB: b.category },
    { label: 'Key Grades', valA: a.grades.slice(0, 4).join(', '), valB: b.grades.slice(0, 4).join(', ') },
    { label: 'Standards', valA: a.standards.slice(0, 3).join(', '), valB: b.standards.slice(0, 3).join(', ') },
    { label: 'Typical Order Size', valA: a.orderSizes, valB: b.orderSizes },
    { label: 'Price Range', valA: a.priceRange, valB: b.priceRange },
    { label: 'HSN Codes', valA: a.hsnCodes.slice(0, 2).join(', '), valB: b.hsnCodes.slice(0, 2).join(', ') },
    { label: 'Key Industries', valA: a.industries.slice(0, 3).join(', '), valB: b.industries.slice(0, 3).join(', ') },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="text-left p-4 font-semibold text-foreground">Property</th>
            <th className="text-left p-4 font-semibold text-primary">{a.name}</th>
            <th className="text-left p-4 font-semibold text-primary">{b.name}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
              <td className="p-4 font-medium text-foreground">{row.label}</td>
              <td className="p-4 text-muted-foreground">{row.valA}</td>
              <td className="p-4 text-muted-foreground">{row.valB}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AutoComparisonPage() {
  const { slug } = useParams<{ slug: string }>();
  const pair = slug ? getAutoComparisonBySlug(slug) : undefined;

  if (!pair) return null; // Let parent route handle fallback

  const { productA: a, productB: b } = pair;
  const canonicalUrl = `${BASE}/compare/${pair.slug}`;

  const commonIndustries = a.industries.filter(ind => b.industries.includes(ind));
  const uniqueA = a.industries.filter(ind => !b.industries.includes(ind)).slice(0, 3);
  const uniqueB = b.industries.filter(ind => !a.industries.includes(ind)).slice(0, 3);

  const faqs = [
    {
      question: `What is the main difference between ${a.name} and ${b.name}?`,
      answer: `${a.name} is ${a.definition.split('.')[0].toLowerCase()}, while ${b.name} is ${b.definition.split('.')[0].toLowerCase()}. The key differences lie in mechanical properties, available grades, pricing, and end-use applications. ${a.name} is typically used in ${a.industries.slice(0, 2).join(' and ')}, whereas ${b.name} is preferred for ${b.industries.slice(0, 2).join(' and ')}.`
    },
    {
      question: `Which is cheaper: ${a.name} or ${b.name}?`,
      answer: `Pricing depends on grade, quantity, origin, and market conditions. ${a.name} typically ranges ${a.priceRange} while ${b.name} ranges ${b.priceRange}. ProcureSaathi's sealed bidding system ensures you get the most competitive pricing for either material from verified suppliers.`
    },
    {
      question: `Can ${a.name} be substituted with ${b.name}?`,
      answer: `Substitution depends on the specific application requirements including mechanical properties, corrosion resistance, dimensional tolerances, and compliance standards. Consult with ProcureSaathi's procurement experts to evaluate if ${b.name} can meet your technical specifications before switching from ${a.name}.`
    },
    {
      question: `Which industries use both ${a.name} and ${b.name}?`,
      answer: commonIndustries.length > 0
        ? `Both materials are commonly used in ${commonIndustries.join(', ')} industries. The choice between them depends on specific application requirements, cost optimization goals, and performance characteristics needed.`
        : `${a.name} and ${b.name} serve different industrial segments. ${a.name} is used in ${a.industries.slice(0, 3).join(', ')}, while ${b.name} is used in ${b.industries.slice(0, 3).join(', ')}.`
    },
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": pair.title,
    "description": pair.metaDescription,
    "author": { "@type": "Organization", "name": "ProcureSaathi" },
    "publisher": { "@type": "Organization", "name": "ProcureSaathi" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": { "@type": "Answer", "text": f.answer },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Comparisons", item: `${BASE}/steel-comparisons` },
      { "@type": "ListItem", position: 3, name: `${a.name} vs ${b.name}`, item: canonicalUrl },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{pair.metaTitle}</title>
        <meta name="description" content={pair.metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 max-w-5xl py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-8 flex items-center gap-1" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/steel-comparisons" className="hover:text-primary">Comparisons</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{a.name} vs {b.name}</span>
          </nav>

          <Badge className="bg-primary/10 text-primary mb-4 gap-1">
            <Scale className="h-3.5 w-3.5" /> Auto-Generated Comparison
          </Badge>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            {a.name} vs {b.name} – Procurement Comparison
          </h1>

          <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-3xl">
            Industrial buyers evaluating {a.name} and {b.name} must consider mechanical properties, available grades,
            pricing factors, and application suitability. This comparison provides the procurement intelligence needed
            to make an informed material selection decision for your project requirements.
          </p>

          {/* ─── KEY DIFFERENCES ─────────────────── */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Key Differences</h2>
            <p className="text-muted-foreground mb-6">
              {a.definition.split('.')[0]}. In contrast, {b.definition.split('.')[0].toLowerCase()}.
              The selection between these two materials depends on your specific application requirements,
              budget constraints, and compliance needs.
            </p>
            <ComparisonTable a={a} b={b} />
          </section>

          {/* ─── SPECIFICATIONS DEEP DIVE ─────── */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Specification Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">{a.name} Specifications</h3>
                  <ul className="space-y-2">
                    {a.specifications.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">{b.name} Specifications</h3>
                  <ul className="space-y-2">
                    {b.specifications.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ─── USE CASE DIFFERENCES ──────────── */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Procurement Considerations</h2>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p>
                <strong className="text-foreground">Price Difference:</strong> {a.name} is typically priced at {a.priceRange} while
                {b.name} ranges at {b.priceRange}. Price differentials are influenced by manufacturing process complexity,
                raw material inputs, and current market supply-demand dynamics.
              </p>
              <p>
                <strong className="text-foreground">Lead Time:</strong> Both materials are widely available through domestic mills
                and import channels. Delivery timelines typically range from 7–21 days for domestic sourcing and 30–60 days for imports,
                depending on grade, quantity, and source location.
              </p>
              <p>
                <strong className="text-foreground">Supplier Availability:</strong> ProcureSaathi maintains a verified supplier network
                for both {a.name} and {b.name}, covering major production hubs across India and international import corridors.
              </p>
            </div>
          </section>

          {/* ─── INDUSTRY USE CASES ───────────── */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Which Should You Buy?</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-3">Choose {a.name} when:</h3>
                <ul className="space-y-2">
                  {a.applications.slice(0, 4).map((app, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span> {app}
                    </li>
                  ))}
                  {uniqueA.map((ind, i) => (
                    <li key={`ind-${i}`} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span> {ind} industry applications
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-3">Choose {b.name} when:</h3>
                <ul className="space-y-2">
                  {b.applications.slice(0, 4).map((app, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span> {app}
                    </li>
                  ))}
                  {uniqueB.map((ind, i) => (
                    <li key={`ind-${i}`} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span> {ind} industry applications
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ─── FAQs ────────────────────────── */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-6">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-lg border border-border p-5">
                  <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ─── RELATED LINKS ───────────────── */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-4">Explore Products</h2>
            <div className="flex flex-wrap gap-3">
              <Link to={`/demand/${a.slug}`}>
                <Button variant="outline" size="sm">{a.name} Procurement</Button>
              </Link>
              <Link to={`/demand/${b.slug}`}>
                <Button variant="outline" size="sm">{b.name} Procurement</Button>
              </Link>
              <Link to="/steel-comparisons">
                <Button variant="outline" size="sm">All Comparisons</Button>
              </Link>
              <Link to="/demand">
                <Button variant="outline" size="sm">All Demand Pages</Button>
              </Link>
            </div>
          </section>

          {/* ─── CTA ─────────────────────────── */}
          <section className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Need Help Choosing?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Submit your requirement and our procurement experts will recommend the right material
              with competitive quotes from verified suppliers.
            </p>
            <Link to="/post-rfq">
              <Button size="lg" className="gap-2 text-lg px-8 py-6">
                Get Expert Recommendation <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
