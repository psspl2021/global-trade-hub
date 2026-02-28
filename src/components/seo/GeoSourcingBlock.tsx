import { Link } from "react-router-dom";
import { strategicCountriesData } from "@/data/strategicCountries";

export default function GeoSourcingBlock() {
  return (
    <section className="mt-16 rounded-xl bg-primary/5 p-8">
      <h3 className="text-lg font-bold mb-4 text-foreground">
        Global Sourcing &amp; Import Options
      </h3>
      <div className="grid gap-4 md:grid-cols-3">
        {strategicCountriesData.slice(0, 6).map(country => (
          <Link
            key={country.slug}
            to={`/source/${country.slug}`}
            className="rounded-lg border border-border p-4 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:border-primary/40"
          >
            Import from {country.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
