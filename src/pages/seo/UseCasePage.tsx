import { useParams, Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useCasePagesData } from "@/data/useCasePages";
import { getComparisonsForUseCase, getRelatedUseCases } from "@/utils/related";
import { injectContextualLinks } from "@/utils/internalLinkingEngine";
import { enhanceIntent } from "@/utils/intentEnhancer";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, AlertTriangle, HelpCircle, Link2, Wrench } from "lucide-react";
import FloatingRFQ from "@/components/FloatingRFQ";
import AuthorityInsightBlock from "@/components/seo/AuthorityInsightBlock";
import GeoSourcingBlock from "@/components/seo/GeoSourcingBlock";
import SteelNetworkFooter from "@/components/seo/SteelNetworkFooter";

const BASE = "https://www.procuresaathi.com";

export default function UseCasePage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useCasePagesData.find(p => p.slug === slug);

  if (!page) return <Navigate to="/404" replace />;

  const relatedComparisons = getComparisonsForUseCase(page.slug);
  const relatedUseCases = getRelatedUseCases(page.slug);

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
      "@id": `${BASE}/use-case/${page.slug}`,
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
      { "@type": "ListItem", position: 2, name: "Industrial Use Cases", item: `${BASE}/industrial-use-cases` },
      { "@type": "ListItem", position: 3, name: page.title.split("–")[0].trim(), item: `${BASE}/use-case/${page.slug}` },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{page.metaTitle}</title>
        <meta name="description" content={page.metaDescription} />
        <link rel="canonical" href={`${BASE}/use-case/${page.slug}`} />
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
            <Link to="/industrial-use-cases" className="hover:text-primary">Industrial Use Cases</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{page.title.split("–")[0].trim()}</span>
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

          {/* Technical Requirements */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">Technical Requirements</h2>
            </div>
            <ul className="space-y-2">
              {page.technicalRequirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {req}
                </li>
              ))}
            </ul>
          </section>

          {/* Recommended Grades Table */}
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">Recommended Grades</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  {page.recommendedGrades.headers.map(h => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.recommendedGrades.rows.map((row, i) => (
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

          {/* Compliance & Standards */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">Compliance & Standards</h2>
            </div>
            <ul className="mb-4 space-y-2">
              {page.complianceStandards.map(s => (
                <li key={s.code} className="flex gap-2">
                  <Badge variant="outline" className="shrink-0">{s.code}</Badge>
                  <span className="text-muted-foreground">{s.description}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground leading-relaxed">{page.complianceExplanation}</p>
          </section>

          {/* Risk Factors */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h2 className="text-2xl font-semibold text-foreground">Procurement Risk Factors</h2>
            </div>
            <div className="space-y-4">
              {page.riskFactors.map((risk, i) => (
                <div key={i} className="rounded-lg border border-border p-4">
                  <h3 className="mb-1 font-semibold text-foreground">{risk.factor}</h3>
                  <p className="text-sm text-muted-foreground">{risk.detail}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Cost Considerations with Auto-Linking */}
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">Cost & Supply Considerations</h2>
            <div
              className="text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: injectContextualLinks(page.costConsiderations),
              }}
            />
            <div className="mt-4">
              <Link to="/post-rfq">
                <Button size="lg" className="gap-2">
                  Get Competitive Quotes <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
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
          {relatedComparisons.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Link2 className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">Related Grade Comparisons</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedComparisons.map(c => (
                  <Link
                    key={c.slug}
                    to={`/compare/${c.slug}`}
                    className="rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                  >
                    <span className="text-sm font-medium text-foreground">{c.gradeA} vs {c.gradeB}</span>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.metaDescription}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Related Use Cases */}
          {relatedUseCases.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 text-xl font-semibold text-foreground">More Application Guides</h2>
              <div className="grid gap-3 sm:grid-cols-3">
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
                  Source from {page.relatedCountrySlug.charAt(0).toUpperCase() + page.relatedCountrySlug.slice(1).replace(/-/g, " ")}
                </Button>
              </Link>
              <Link to="/global-sourcing-countries">
                <Button variant="outline" size="sm">Global Sourcing Hub</Button>
              </Link>
              <Link to="/industrial-use-cases">
                <Button variant="outline" size="sm">All Use Cases</Button>
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
