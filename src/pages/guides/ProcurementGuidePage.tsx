/**
 * Module 5: Procurement Guide Authority Page
 * Renders 2500+ word authority guides from the procurementGuides registry.
 */
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getGuideBySlug, procurementGuides } from '@/data/procurementGuides';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ChevronRight, BookOpen, HelpCircle } from 'lucide-react';

const BASE = 'https://www.procuresaathi.com';

export default function ProcurementGuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? getGuideBySlug(slug) : undefined;

  if (!guide) return <Navigate to="/404" replace />;

  const canonicalUrl = `${BASE}/guides/${guide.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": guide.title,
    "description": guide.metaDescription,
    "author": { "@type": "Organization", "name": "ProcureSaathi" },
    "publisher": { "@type": "Organization", "name": "ProcureSaathi" },
    "datePublished": "2026-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
    "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": guide.faqs.map(f => ({
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
      { "@type": "ListItem", position: 2, name: "Guides", item: `${BASE}/guides` },
      { "@type": "ListItem", position: 3, name: guide.title.split('–')[0].trim(), item: canonicalUrl },
    ],
  };

  const otherGuides = procurementGuides.filter(g => g.slug !== guide.slug);

  return (
    <>
      <Helmet>
        <title>{guide.metaTitle}</title>
        <meta name="description" content={guide.metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 max-w-4xl py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-8 flex items-center gap-1" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Guide</span>
          </nav>

          <Badge className="bg-primary/10 text-primary mb-4 gap-1">
            <BookOpen className="h-3.5 w-3.5" /> Procurement Guide
          </Badge>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            {guide.title}
          </h1>

          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            {guide.heroIntro}
          </p>

          {/* Table of Contents */}
          <nav className="rounded-xl border border-border bg-muted/30 p-6 mb-12">
            <h2 className="font-semibold text-foreground mb-3">In This Guide</h2>
            <ol className="space-y-2 list-decimal list-inside">
              {guide.sections.map((section, i) => (
                <li key={i}>
                  <a href={`#section-${i}`} className="text-sm text-primary hover:underline">
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Sections */}
          {guide.sections.map((section, i) => (
            <section key={i} id={`section-${i}`} className="mb-14">
              <h2 className="text-2xl font-bold text-foreground mb-6">{section.title}</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground dark:prose-invert">
                {section.content.split('\n\n').map((para, j) => {
                  if (para.trim().startsWith('**') && para.includes(':')) {
                    const [title, ...rest] = para.split(':');
                    return (
                      <p key={j} className="mb-4">
                        <strong className="text-foreground">{title.replace(/\*\*/g, '')}:</strong>
                        {rest.join(':')}
                      </p>
                    );
                  }
                  if (para.match(/^\d+\./)) {
                    return (
                      <div key={j} className="mb-4">
                        {para.split('\n').map((line, k) => (
                          <p key={k} className="mb-2">{line.replace(/\*\*/g, '')}</p>
                        ))}
                      </div>
                    );
                  }
                  return <p key={j} className="mb-4">{para}</p>;
                })}
              </div>
            </section>
          ))}

          {/* FAQs */}
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-6">
              {guide.faqs.map((faq, i) => (
                <div key={i} className="rounded-lg border border-border p-5">
                  <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related Demand Pages */}
          {guide.relatedDemandSlugs.length > 0 && (
            <section className="mb-14">
              <h2 className="text-xl font-bold text-foreground mb-4">Related Procurement Pages</h2>
              <div className="flex flex-wrap gap-3">
                {guide.relatedDemandSlugs.map(slug => (
                  <Link key={slug} to={`/demand/${slug}`}>
                    <Button variant="outline" size="sm" className="capitalize">
                      {slug.replace(/-india$/, '').replace(/-/g, ' ')} <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Other Guides */}
          {otherGuides.length > 0 && (
            <section className="mb-14">
              <h2 className="text-xl font-bold text-foreground mb-4">More Procurement Guides</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {otherGuides.map(g => (
                  <Link
                    key={g.slug}
                    to={`/guides/${g.slug}`}
                    className="rounded-xl border border-border p-5 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <h3 className="font-semibold text-foreground mb-1">{g.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{g.metaDescription}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Ready to Optimize Your Procurement?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Submit your requirement and get competitive quotes from AI-verified suppliers within 24 hours.
            </p>
            <Link to="/post-rfq">
              <Button size="lg" className="gap-2 text-lg px-8 py-6">
                Submit RFQ Now <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
