import { useParams, Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { comparisonPagesData } from "@/data/comparisonPages";
import { getRelatedComparisons, getUseCasesForComparison } from "@/utils/related";
import { injectContextualLinks } from "@/utils/internalLinkingEngine";
import { enhanceIntent } from "@/utils/intentEnhancer";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Scale, ShieldCheck, TrendingUp, HelpCircle, Link2 } from "lucide-react";
import FloatingRFQ from "@/components/FloatingRFQ";
import AuthorityInsightBlock from "@/components/seo/AuthorityInsightBlock";
import GeoSourcingBlock from "@/components/seo/GeoSourcingBlock";
import SteelNetworkFooter from "@/components/seo/SteelNetworkFooter";

const BASE = "https://www.procuresaathi.com";

export default function ComparisonPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = comparisonPagesData.find(p => p.slug === slug);

  if (!page) return <Navigate to="/404" replace />;

  const related = getRelatedComparisons(page.slug);
  const relatedUseCases = getUseCasesForComparison(page.slug);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: page.title,
    description: page.metaDescription,
    author: { "@type": "Organization", name: "ProcureSaathi Global Trade Hub" },
    publisher: {
      "@type": "Organization",
      name: "ProcureSaathi",
      logo: { "@type": "ImageObject", url: `${BASE}/logo.png` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE}/compare/${page.slug}`,
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map(f => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Steel Comparisons", item: `${BASE}/steel-comparisons` },
      { "@type": "ListItem", position: 3, name: page.title.split("–")[0].trim(), item: `${BASE}/compare/${page.slug}` },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{page.metaTitle}</title>
        <meta name="description" content={page.metaDescription} />
        <link rel="canonical" href={`${BASE}/compare/${page.slug}`} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/steel-comparisons" className="hover:text-primary">Steel Comparisons</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{page.gradeA} vs {page.gradeB}</span>
          </nav>

          {/* H1 */}
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {page.title}
          </h1>

          {/* Intent-Enhanced Intro with Auto-Linking */}
          <div
            className="mb-8 text-lg leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: injectContextualLinks(enhanceIntent(page.title, page.intro)),
            }}
          />

          {/* Authority Amplification */}
          <AuthorityInsightBlock />

          {/* Quick Decision Box */}
          <section className="mb-10 rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Quick Procurement Decision</h2>
            </div>
            <p className="text-muted-foreground mb-4">{page.procurementRecommendation}</p>
            <Link to="/post-rfq">
              <Button size="lg" className="gap-2">
                Submit RFQ for {page.gradeA} / {page.gradeB} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </section>

          {/* Chemical Composition Table */}
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">Chemical Composition Comparison</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  {page.chemicalComposition.headers.map(h => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.chemicalComposition.rows.map((row, i) => (
                  <TableRow key={i}>
                    {row.map((cell, j) => (
                      <TableCell key={j} className={j === 0 ? "font-medium" : ""}>
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {/* Mechanical Properties Table */}
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">Mechanical Properties Comparison</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  {page.mechanicalProperties.headers.map(h => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.mechanicalProperties.rows.map((row, i) => (
                  <TableRow key={i}>
                    {row.map((cell, j) => (
                      <TableCell key={j} className={j === 0 ? "font-medium" : ""}>
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {/* IS / BIS Standards */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">Applicable IS / BIS Standards</h2>
            </div>
            <ul className="mb-4 space-y-2">
              {page.standards.map(s => (
                <li key={s.code} className="flex gap-2">
                  <Badge variant="outline" className="shrink-0">{s.code}</Badge>
                  <span className="text-muted-foreground">{s.description}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground leading-relaxed">{page.standardsExplanation}</p>
          </section>

          {/* Use Case Differences */}
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">Use Case Differences</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-border p-5">
                <h3 className="mb-3 font-semibold text-foreground">{page.gradeA} — Best For</h3>
                <ul className="space-y-2">
                  {page.useCaseDifferences.gradeA.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border p-5">
                <h3 className="mb-3 font-semibold text-foreground">{page.gradeB} — Best For</h3>
                <ul className="space-y-2">
                  {page.useCaseDifferences.gradeB.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Price Implication with Auto-Linking */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">Price & Cost Implication</h2>
            </div>
            <div
              className="text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: injectContextualLinks(page.priceImplication),
              }}
            />
          </section>

          {/* FAQs */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-6">
              {page.faqs.map((faq, i) => (
                <div key={i} className="rounded-lg border border-border p-5">
                  <h3 className="mb-2 font-semibold text-foreground">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related Comparisons */}
          {related.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Link2 className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">Related Technical Comparisons</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {related.map(r => (
                  <Link
                    key={r.slug}
                    to={`/compare/${r.slug}`}
                    className="rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                  >
                    <span className="text-sm font-medium text-foreground">{r.gradeA} vs {r.gradeB}</span>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.metaDescription}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Related Use Cases */}
          {relatedUseCases.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 text-xl font-semibold text-foreground">Related Application Guides</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedUseCases.map(uc => (
                  <Link
                    key={uc.slug}
                    to={`/use-case/${uc.slug}`}
                    className="rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                  >
                    <span className="text-sm font-medium text-foreground">{uc.title.split("–")[0].trim()}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Geo Sourcing Block */}
          <GeoSourcingBlock />

          {/* Cross-Linking Footer */}
          <section className="mt-10 rounded-xl border border-border bg-muted/20 p-6">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Explore More</h2>
            <div className="flex flex-wrap gap-3">
              <Link to={`/demand/${page.relatedDemandSlug}`}>
                <Button variant="outline" size="sm">View Live Pricing</Button>
              </Link>
              <Link to={`/source/${page.relatedCountrySlug}`}>
                <Button variant="outline" size="sm">
                  Import from {page.relatedCountrySlug.charAt(0).toUpperCase() + page.relatedCountrySlug.slice(1).replace(/-/g, " ")}
                </Button>
              </Link>
              <Link to="/global-sourcing-countries">
                <Button variant="outline" size="sm">Global Sourcing Hub</Button>
              </Link>
              <Link to="/steel-comparisons">
                <Button variant="outline" size="sm">All Comparisons</Button>
              </Link>
            </div>
          </section>

          {/* Steel Intelligence Network */}
          <SteelNetworkFooter />
        </div>
      </main>

      <FloatingRFQ />
    </>
  );
}
