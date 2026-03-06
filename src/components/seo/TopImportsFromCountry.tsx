import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Package } from "lucide-react";
import { getCountrySkuOptions, type CountrySkuEntry } from "@/data/countrySkuMapping";

const BASE = "https://www.procuresaathi.com";

interface Props {
  countrySlug: string;
  countryName: string;
}

export default function TopImportsFromCountry({ countrySlug, countryName }: Props) {
  const corridors = [...getCountrySkuOptions(countrySlug)]
    .sort((a, b) => (b.demandRank ?? 0) - (a.demandRank ?? 0))
    .slice(0, 6);

  if (corridors.length === 0) return null;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Top Imports From ${countryName}`,
    numberOfItems: corridors.length,
    itemListElement: corridors.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE}/import/${c.sku}-from-${c.countrySlug}`,
      name: `${c.skuLabel} from ${countryName}`,
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      </Helmet>

      <section className="py-12 bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              Top Imports From {countryName}
            </h2>
          </div>
          <p className="text-muted-foreground mb-6 text-sm">
            High-demand industrial products sourced from {countryName} with verified suppliers, landed cost benchmarks, and duty intelligence.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {corridors.map((c, i) => (
              <Link
                key={`${c.sku}-${c.countrySlug}`}
                to={`/import/${c.sku}-from-${c.countrySlug}`}
                title={`Import ${c.skuLabel} from ${countryName} – pricing, suppliers & duty`}
                className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="text-xs font-bold text-muted-foreground mt-0.5 w-5 shrink-0">
                  {i + 1}.
                </span>
                <div className="flex-1">
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    Import {c.skuLabel} from {countryName}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.costAdvantage} · {c.leadTimeDays} days
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 mt-1 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
