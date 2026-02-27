import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Globe, ShieldCheck, TrendingUp, Truck } from "lucide-react";
import { useSEOHead } from "@/hooks/useSEOHead";
import { Footer } from "@/components/landing/Footer";

const BASE = "https://www.procuresaathi.com";

const strategicCountries = [
  { name: "China", slug: "china", flag: "🇨🇳", desc: "World's largest manufacturing hub — steel, electronics, machinery, chemicals." },
  { name: "UAE", slug: "uae", flag: "🇦🇪", desc: "Middle East trade gateway — metals, polymers, petrochemicals, re-exports." },
  { name: "Germany", slug: "germany", flag: "🇩🇪", desc: "Precision engineering leader — automotive parts, industrial machinery, chemicals." },
  { name: "USA", slug: "usa", flag: "🇺🇸", desc: "Advanced manufacturing — aerospace components, tech equipment, specialty chemicals." },
  { name: "Japan", slug: "japan", flag: "🇯🇵", desc: "Quality-first manufacturing — automotive, electronics, steel, precision tools." },
  { name: "South Korea", slug: "south-korea", flag: "🇰🇷", desc: "Tech & heavy industry — semiconductors, shipbuilding, steel, petrochemicals." },
  { name: "Saudi Arabia", slug: "saudi-arabia", flag: "🇸🇦", desc: "Energy & petrochemicals — petroleum products, plastics, industrial chemicals." },
  { name: "Vietnam", slug: "vietnam", flag: "🇻🇳", desc: "Emerging manufacturing — textiles, electronics assembly, agricultural products." },
  { name: "Indonesia", slug: "indonesia", flag: "🇮🇩", desc: "Resource-rich economy — palm oil, mining, textiles, rubber products." },
  { name: "Italy", slug: "italy", flag: "🇮🇹", desc: "Craftsmanship & design — machinery, food processing, textiles, ceramics." },
];

export default function GlobalSourcingPage() {
  useSEOHead({
    title: "Global Industrial Sourcing Countries | ProcureSaathi",
    description: "AI-powered sourcing intelligence across 10 strategic industrial supplier nations. Compare trade corridors from China, UAE, Germany, USA, Japan and more.",
  });

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Global Industrial Sourcing Countries",
    "description": "AI-powered sourcing intelligence across global industrial supplier nations including China, UAE, Germany, USA and Japan.",
    "url": `${BASE}/global-sourcing-countries`,
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Strategic Industrial Supplier Countries",
    "itemListElement": strategicCountries.map((c, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": c.name,
      "url": `${BASE}/source/${c.slug}`,
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Which countries are major industrial suppliers to India?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "China, UAE, Germany, USA, Japan and South Korea are among the largest global industrial supply corridors for Indian manufacturers and EPC contractors.",
        },
      },
      {
        "@type": "Question",
        "name": "How does ProcureSaathi verify global suppliers?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Suppliers undergo compliance verification, trade documentation validation and demand intelligence scoring before being matched with procurement requirements.",
        },
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE },
      { "@type": "ListItem", "position": 2, "name": "Global Sourcing Countries", "item": `${BASE}/global-sourcing-countries` },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Global Industrial Sourcing Countries | ProcureSaathi</title>
        <meta name="description" content="AI-powered sourcing intelligence across 10 strategic industrial supplier nations. Compare trade corridors from China, UAE, Germany, USA, Japan and more." />
        <link rel="canonical" href={`${BASE}/global-sourcing-countries`} />
        <script type="application/ld+json">{JSON.stringify(collectionSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Globe className="h-4 w-4" />
              10 Strategic Trade Corridors
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Global Industrial Sourcing Countries
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              ProcureSaathi provides AI-driven global sourcing intelligence across key industrial supplier nations.
              We analyze trade corridors, compliance risk, shipping infrastructure, and industrial output to help EPC
              contractors and manufacturers make informed procurement decisions.
            </p>
          </div>
        </section>

        {/* Country Grid */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold text-foreground mb-8">Strategic Supplier Nations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {strategicCountries.map((c) => (
                <Link
                  key={c.slug}
                  to={`/source/${c.slug}`}
                  className="group block p-6 rounded-xl border border-border bg-card hover:border-primary hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{c.flag}</span>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {c.name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Risk & Compliance */}
        <section className="py-12 px-4 bg-muted/30 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Procurement Risk Intelligence</h2>
            <p className="text-muted-foreground mb-8">
              Global sourcing introduces regulatory, shipping, geopolitical, and currency volatility risks.
              Our demand intelligence system monitors HS codes, export controls, trade agreements,
              and compliance frameworks to ensure secure procurement.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-foreground">Trade Compliance</h3>
                  <p className="text-sm text-muted-foreground">BIS standards, customs documentation, anti-dumping duties, and export certifications.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-foreground">Demand Intelligence</h3>
                  <p className="text-sm text-muted-foreground">Real-time RFQ signals and price benchmarks across corridors.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Truck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-foreground">Logistics Scoring</h3>
                  <p className="text-sm text-muted-foreground">Port connectivity, transit times, and shipping infrastructure analysis.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border">
                <h3 className="font-medium text-foreground mb-2">Which countries are major industrial suppliers to India?</h3>
                <p className="text-sm text-muted-foreground">China, UAE, Germany, USA, Japan and South Korea are among the largest global industrial supply corridors for Indian manufacturers and EPC contractors.</p>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <h3 className="font-medium text-foreground mb-2">How does ProcureSaathi verify global suppliers?</h3>
                <p className="text-sm text-muted-foreground">Suppliers undergo compliance verification, trade documentation validation and demand intelligence scoring before being matched with procurement requirements.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
