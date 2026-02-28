import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { comparisonPagesData } from "@/data/comparisonPages";
import { Scale, ArrowRight } from "lucide-react";

const BASE = "https://www.procuresaathi.com";

export default function SteelComparisonsHub() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Steel Comparisons", item: `${BASE}/steel-comparisons` },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Industrial Steel Grade Comparisons",
    description: "Technical comparison guides for TMT bars, structural steel, HR/CR coils, MS plates, and steel pipes — tailored for EPC procurement and industrial buyers.",
    url: `${BASE}/steel-comparisons`,
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Steel Grade Comparison Guides",
    itemListElement: comparisonPagesData.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.title,
      url: `${BASE}/compare/${p.slug}`,
    })),
  };

  return (
    <>
      <Helmet>
        <title>Steel Grade Comparisons | TMT, Structural Steel, HR Coil & MS Plate Guides</title>
        <meta name="description" content="Technical comparison guides for industrial steel grades — Fe 500 vs Fe 500D, E250 vs E350, HR vs CR Coil, ERW vs Seamless pipes. Data-driven procurement intelligence." />
        <link rel="canonical" href={`${BASE}/steel-comparisons`} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(collectionSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Steel Comparisons</span>
          </nav>

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Industrial Steel Grade Comparisons
              </h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Data-driven technical comparisons for EPC procurement heads, structural engineers, and industrial buyers. Each guide covers chemical composition, mechanical properties, IS/BIS standards, use-case differences, and procurement recommendations.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {comparisonPagesData.map(page => (
              <Link
                key={page.slug}
                to={`/compare/${page.slug}`}
                className="group rounded-xl border border-border p-5 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <h2 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {page.gradeA} vs {page.gradeB}
                </h2>
                <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                  {page.metaDescription}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Read Comparison <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/industrial-use-cases" className="text-sm font-medium text-primary hover:underline">
              Industrial Use Case Guides →
            </Link>
            <Link to="/global-sourcing-countries" className="text-sm font-medium text-primary hover:underline">
              Global Sourcing Hub →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
