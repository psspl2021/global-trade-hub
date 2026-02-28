import { Link } from "react-router-dom";

export default function SteelNetworkFooter() {
  return (
    <section className="mt-20 border-t border-border pt-10">
      <h3 className="text-lg font-bold mb-4 text-foreground">
        Explore Complete Steel Intelligence Network
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/steel-comparisons" className="text-sm font-medium text-primary hover:underline">
          All Steel Comparisons →
        </Link>
        <Link to="/industrial-use-cases" className="text-sm font-medium text-primary hover:underline">
          All Industrial Use Cases →
        </Link>
        <Link to="/global-sourcing-countries" className="text-sm font-medium text-primary hover:underline">
          Global Sourcing Hub →
        </Link>
        <Link to="/demand-intelligence" className="text-sm font-medium text-primary hover:underline">
          Live Demand Intelligence →
        </Link>
      </div>
    </section>
  );
}
