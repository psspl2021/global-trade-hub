import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useCasePagesData } from "@/data/useCasePages";
import { Wrench, ArrowRight } from "lucide-react";

const BASE = "https://www.procuresaathi.com";

export default function IndustrialUseCasesHub() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Industrial Use Cases", item: `${BASE}/industrial-use-cases` },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Industrial Steel Application Guides",
    description: "Technical procurement guides for steel in EPC projects, industrial sheds, high-rise buildings, oil & gas, automotive manufacturing, and infrastructure.",
    url: `${BASE}/industrial-use-cases`,
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Industrial Application Guides",
    itemListElement: useCasePagesData.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.title,
      url: `${BASE}/use-case/${p.slug}`,
    })),
  };

  return (
    <>
      <Helmet>
        <title>Industrial Steel Use Cases | EPC, Construction, Oil & Gas Procurement Guides</title>
        <meta name="description" content="Technical procurement guides for steel in EPC projects, warehouses, high-rise buildings, oil & gas pipelines, and automotive manufacturing. Grade selection and sourcing intelligence." />
        <link rel="canonical" href={`${BASE}/industrial-use-cases`} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(collectionSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Industrial Use Cases</span>
          </nav>

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Wrench className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Industrial Steel Application Guides
              </h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Technical procurement guides tailored for specific industrial applications. Each guide covers grade selection, compliance standards, risk factors, cost considerations, and procurement recommendations for EPC contractors, fabricators, and industrial buyers.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {useCasePagesData.map(page => (
              <Link
                key={page.slug}
                to={`/use-case/${page.slug}`}
                className="group rounded-xl border border-border p-5 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <h2 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {page.title.split("–")[0].trim()}
                </h2>
                <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                  {page.metaDescription}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Read Guide <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/steel-comparisons" className="text-sm font-medium text-primary hover:underline">
              Steel Grade Comparisons →
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
