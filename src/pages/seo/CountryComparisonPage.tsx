import { useParams, Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { strategicCountriesData } from "@/data/strategicCountries";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import FloatingRFQ from "@/components/FloatingRFQ";
import SteelNetworkFooter from "@/components/seo/SteelNetworkFooter";
import RevenueLinksBlock from "@/components/seo/RevenueLinksBlock";
import TrustStrip from "@/components/seo/TrustStrip";

const BASE = "https://www.procuresaathi.com";

// Data for country comparison — extendable
const countryComparisonData: Record<string, {
  slugA: string;
  slugB: string;
  priceDelta: string;
  leadTimeDelta: string;
  dutyComparison: string;
  qualityRisk: string;
  currencyRisk: string;
  recommendedUseCase: string;
}> = {
  "japan-vs-china": {
    slugA: "japan",
    slugB: "china",
    priceDelta: "Japan steel averages 12–18% higher than Chinese equivalents due to premium JIS-grade quality.",
    leadTimeDelta: "China delivers 15–25 days vs Japan's 20–35 days for similar steel categories.",
    dutyComparison: "Japan benefits from India-Japan CEPA (0–5% duty on eligible items). China faces anti-dumping duties of 10–30% on select steel categories.",
    qualityRisk: "Japanese suppliers maintain strict JIS compliance with lower defect rates. Chinese supply requires enhanced QC inspection protocols.",
    currencyRisk: "JPY is more volatile against INR than CNY. Hedging recommended for orders >₹1Cr from Japan.",
    recommendedUseCase: "Choose Japan for precision/high-tensile applications (auto, aerospace). Choose China for volume-driven infrastructure procurement.",
  },
  "uae-vs-saudi-arabia": {
    slugA: "uae",
    slugB: "saudi-arabia",
    priceDelta: "UAE re-export hub pricing is 3–6% higher than Saudi direct manufacturing prices.",
    leadTimeDelta: "UAE: 5–7 days transit. Saudi Arabia: 7–12 days transit to Indian west coast.",
    dutyComparison: "Both benefit from GCC frameworks. UAE has India-UAE CEPA with tariff reductions on 80%+ goods.",
    qualityRisk: "UAE serves as quality gateway with international certifications. Saudi SABIC products meet global petrochemical standards.",
    currencyRisk: "Both AED and SAR are pegged to USD, offering currency stability for Indian importers.",
    recommendedUseCase: "Choose UAE for diversified industrial goods and faster transit. Choose Saudi Arabia for bulk petrochemicals and polymers.",
  },
};

export default function CountryComparisonPage() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug || !countryComparisonData[slug]) {
    return <Navigate to="/global-sourcing-countries" replace />;
  }

  const comparison = countryComparisonData[slug];
  const countryA = strategicCountriesData.find(c => c.slug === comparison.slugA);
  const countryB = strategicCountriesData.find(c => c.slug === comparison.slugB);

  if (!countryA || !countryB) return <Navigate to="/global-sourcing-countries" replace />;

  const title = `${countryA.name} vs ${countryB.name} — Import Sourcing Comparison for India`;
  const metaDesc = `Compare importing from ${countryA.name} vs ${countryB.name}: pricing, lead times, duties, quality, and currency risk for Indian procurement.`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: title,
    description: metaDesc,
    author: { "@type": "Organization", name: "ProcureSaathi Global Trade Hub" },
    publisher: {
      "@type": "Organization",
      name: "ProcureSaathi",
      logo: { "@type": "ImageObject", url: `${BASE}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE}/import/${slug}` },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Global Trade Hub", item: `${BASE}/global-sourcing-countries` },
      { "@type": "ListItem", position: 3, name: `${countryA.name} vs ${countryB.name}`, item: `${BASE}/import/${slug}` },
    ],
  };

  const sections = [
    { heading: "Price Delta", content: comparison.priceDelta },
    { heading: "Lead Time Delta", content: comparison.leadTimeDelta },
    { heading: "Duty Comparison", content: comparison.dutyComparison },
    { heading: "Quality Risk", content: comparison.qualityRisk },
    { heading: "Currency Risk", content: comparison.currencyRisk },
    { heading: "Recommended Use Case", content: comparison.recommendedUseCase },
  ];

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={`${BASE}/import/${slug}`} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/global-sourcing-countries" className="hover:text-primary">Global Trade Hub</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{countryA.name} vs {countryB.name}</span>
          </nav>

          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>

          <p className="mb-10 text-lg leading-relaxed text-muted-foreground">
            A detailed sourcing comparison between {countryA.name} and {countryB.name} for Indian
            industrial procurement. Use this guide to determine the optimal import corridor for
            your category, volume, and timeline requirements.
          </p>

          {/* Comparison Sections */}
          <div className="space-y-8">
            {sections.map((section, i) => (
              <section key={i} className="rounded-lg border border-border p-6">
                <h2 className="mb-3 text-xl font-semibold text-foreground">{section.heading}</h2>
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
              </section>
            ))}
          </div>

          {/* Trust Strip */}
          <TrustStrip />

          {/* Country Links */}
          <section className="mt-10 rounded-xl border border-border bg-muted/20 p-6">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Explore Source Countries</h2>
            <div className="flex flex-wrap gap-3">
              <Link to={`/source/${countryA.slug}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  {countryA.name} Intelligence <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
              <Link to={`/source/${countryB.slug}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  {countryB.name} Intelligence <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
              <Link to="/global-sourcing-countries">
                <Button variant="outline" size="sm">Global Sourcing Hub</Button>
              </Link>
            </div>
          </section>

          <RevenueLinksBlock limit={5} />
          <SteelNetworkFooter />
        </div>
      </main>

      <FloatingRFQ />
    </>
  );
}
