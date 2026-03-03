import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { getTransactionalImportPage } from "@/data/transactionalImportPages";
import { getSkuCountryOptions } from "@/data/countrySkuMapping";
import { getProductBySlug } from "@/data/industrialProducts";
import { CheckCircle2, XCircle, ChevronRight, ArrowRight, AlertTriangle, TrendingUp, Shield, Clock } from "lucide-react";

const BASE = "https://www.procuresaathi.com";

/**
 * Auto-generative Transactional Import Page.
 * If a rich data entry exists in transactionalImportPages → render full page.
 * Otherwise auto-generate a baseline page from countrySkuMapping taxonomy.
 */
export default function TransactionalImportPage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return null;

  // Try rich data first
  const richPage = slug ? getTransactionalImportPage(slug) : undefined;
  if (richPage) return <RichImportPage page={richPage} />;

  // Auto-generate from taxonomy
  const parts = slug.split("-from-");
  if (parts.length !== 2) return null;

  const [skuPart, countryPart] = parts;
  const product = getProductBySlug(skuPart);
  const corridorEntries = getSkuCountryOptions(skuPart);
  const match = corridorEntries.find((e) => e.countrySlug === countryPart);

  if (!match) return null;

  const skuLabel = match.skuLabel;
  const country = match.bestCountry;
  const canonical = `${BASE}/import/${slug}`;
  const h1 = `Import ${skuLabel} from ${country} to India — Sourcing Corridor Analysis`;
  const metaTitle = `Import ${skuLabel} from ${country} to India — Pricing & Lead Time | ProcureSaathi`;
  const metaDesc = `Source ${skuLabel} from ${country} with competitive pricing. ${match.costAdvantage}. Lead time: ${match.leadTimeDays} days. AI-verified suppliers on ProcureSaathi.`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Global Sourcing", item: `${BASE}/global-sourcing-countries` },
      { "@type": "ListItem", position: 3, name: `Source from ${country}`, item: `${BASE}/source/${match.countrySlug}` },
      { "@type": "ListItem", position: 4, name: `${skuLabel} from ${country}`, item: canonical },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        <article className="max-w-4xl mx-auto px-4 py-12 space-y-10">
          <nav className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/global-sourcing-countries" className="hover:text-primary">Global Sourcing</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/source/${match.countrySlug}`} className="hover:text-primary">{country}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{skuLabel} from {country}</span>
          </nav>

          <header>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{h1}</h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Direct sourcing corridor analysis for importing {skuLabel} from {country} to India.
              Includes pricing benchmarks, duty considerations, and lead time analysis.
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border rounded-xl p-6 bg-card">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Cost Advantage</h2>
              </div>
              <p className="text-sm text-muted-foreground">{match.costAdvantage}</p>
            </div>

            <div className="border border-border rounded-xl p-6 bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Lead Time</h2>
              </div>
              <p className="text-sm text-muted-foreground">{match.leadTimeDays} days typical transit</p>
            </div>
          </div>

          <section className="border border-border rounded-xl p-6 bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Corridor Notes</h2>
            </div>
            <p className="text-sm text-muted-foreground">{match.notes}</p>
          </section>

          {/* Other corridors for same SKU */}
          {corridorEntries.length > 1 && (
            <section className="bg-muted rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Other Import Corridors for {skuLabel}
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {corridorEntries
                  .filter((e) => e.countrySlug !== match.countrySlug)
                  .map((e) => (
                    <Link
                      key={e.countrySlug}
                      to={`/import/${e.sku}-from-${e.countrySlug}`}
                      className="flex items-center justify-between border border-border rounded-lg p-3 bg-card hover:border-primary/50 transition text-sm"
                    >
                      <span className="text-foreground">
                        {skuLabel} from {e.bestCountry}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
              </div>
            </section>
          )}

          {/* Internal links */}
          <section className="bg-muted rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Related Procurement Intelligence</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link
                to={`/demand/${match.sku}`}
                className="flex items-center justify-between border border-border rounded-lg p-3 bg-card hover:border-primary/50 transition text-sm"
              >
                <span className="text-foreground">{skuLabel} — Full Procurement Guide</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                to={`/source/${match.countrySlug}`}
                className="flex items-center justify-between border border-border rounded-lg p-3 bg-card hover:border-primary/50 transition text-sm"
              >
                <span className="text-foreground">Source from {country} — Overview</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </section>

          <div className="text-center pt-4">
            <Link
              to="/post-rfq"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition"
            >
              Get Quotes for {skuLabel} from {country} <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

/* ─── Rich page renderer (existing rich data) ─── */
import type { TransactionalImportEntry } from "@/data/transactionalImportPages";

function RichImportPage({ page }: { page: TransactionalImportEntry }) {
  const canonical = `${BASE}/import/${page.slug}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Global Sourcing", item: `${BASE}/global-sourcing-countries` },
      { "@type": "ListItem", position: 3, name: `Source from ${page.country}`, item: `${BASE}/source/${page.countrySlug}` },
      { "@type": "ListItem", position: 4, name: page.h1, item: canonical },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the landed cost of ${page.skuLabel} from ${page.country}?`,
        acceptedAnswer: { "@type": "Answer", text: page.pricingInsight },
      },
      {
        "@type": "Question",
        name: `What is the import duty on ${page.skuLabel} from ${page.country}?`,
        acceptedAnswer: { "@type": "Answer", text: page.dutyStructure },
      },
      {
        "@type": "Question",
        name: `How long does it take to import ${page.skuLabel} from ${page.country}?`,
        acceptedAnswer: { "@type": "Answer", text: page.leadTime },
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{page.metaTitle}</title>
        <meta name="description" content={page.metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        <article className="max-w-4xl mx-auto px-4 py-12 space-y-10">
          <nav className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/global-sourcing-countries" className="hover:text-primary">Global Sourcing</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/source/${page.countrySlug}`} className="hover:text-primary">{page.country}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{page.skuLabel} from {page.country}</span>
          </nav>

          <header>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{page.h1}</h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Direct sourcing corridor analysis for importing {page.skuLabel} from {page.country} to India.
              Includes landed cost benchmarks, duty structure, lead time analysis, and risk evaluation.
            </p>
          </header>

          <section className="grid md:grid-cols-2 gap-6">
            <div className="border border-border rounded-xl p-6 bg-card">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Pricing Analysis</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{page.pricingInsight}</p>
            </div>
            <div className="border border-border rounded-xl p-6 bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Duty Structure</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{page.dutyStructure}</p>
            </div>
          </section>

          <section className="border border-border rounded-xl p-6 bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Lead Time & Logistics</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{page.leadTime}</p>
          </section>

          <section className="border border-border rounded-xl p-6 bg-muted/50">
            <h2 className="text-xl font-semibold text-foreground mb-4">Risk Factors</h2>
            <ul className="space-y-3">
              {page.riskFactors.map((risk, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            <section className="rounded-xl border border-primary/20 bg-primary/5 p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">✅ Recommended For</h2>
              <ul className="space-y-3">
                {page.recommendedFor.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">❌ When NOT to Import</h2>
              <ul className="space-y-3">
                {page.antiImportReasons.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="bg-muted rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Related Procurement Intelligence</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link
                to={`/demand/${page.skuSlug}`}
                className="flex items-center justify-between border border-border rounded-lg p-3 bg-card hover:border-primary/50 transition text-sm"
              >
                <span className="text-foreground">{page.skuLabel} — Full Procurement Guide</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                to={`/source/${page.countrySlug}`}
                className="flex items-center justify-between border border-border rounded-lg p-3 bg-card hover:border-primary/50 transition text-sm"
              >
                <span className="text-foreground">Source from {page.country} — Overview</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </section>

          <div className="text-center pt-4">
            <Link
              to="/post-rfq"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition"
            >
              Get Quotes for {page.skuLabel} from {page.country} <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
