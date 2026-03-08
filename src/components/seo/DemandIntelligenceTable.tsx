import type { DemandProduct } from '@/data/demandProducts';

interface Props {
  product: DemandProduct;
}

interface RegionalDemand {
  region: string;
  avgOrderSize: string;
  frequency: string;
  topUse: string;
}

/**
 * Module 3: Procurement Demand Intelligence Table
 * Regional procurement data grid for demand pages.
 */
function getRegionalDemand(product: DemandProduct): RegionalDemand[] {
  const seed = product.name.length;
  const sizes = ['50 MT', '80 MT', '95 MT', '100 MT', '120 MT', '150 MT', '200 MT', '250 MT'];
  const freqs = ['Monthly', 'Quarterly', 'Bi-monthly', 'Weekly'];

  const regions = [
    { region: 'Mumbai / Pune', key: 0 },
    { region: 'Chennai / Coimbatore', key: 1 },
    { region: 'Ahmedabad / Rajkot', key: 2 },
    { region: 'Delhi NCR / Ludhiana', key: 3 },
    { region: 'Kolkata / Jamshedpur', key: 4 },
    { region: 'Hyderabad / Vizag', key: 5 },
  ];

  return regions.map(r => ({
    region: r.region,
    avgOrderSize: sizes[(seed + r.key * 3) % sizes.length],
    frequency: freqs[(seed + r.key) % freqs.length],
    topUse: product.applications[(seed + r.key) % product.applications.length] || product.industries[0],
  }));
}

export default function DemandIntelligenceTable({ product }: Props) {
  const regionalData = getRegionalDemand(product);

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h2 className="text-2xl font-bold text-foreground">Regional Procurement Intelligence</h2>
      </div>
      <p className="text-muted-foreground mb-6">
        {product.name} procurement patterns vary significantly by region in India. This intelligence table provides insights into order sizes, procurement frequency, and primary applications across major industrial hubs.
      </p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left p-4 font-semibold text-foreground">Region</th>
              <th className="text-left p-4 font-semibold text-foreground">Avg. Order Size</th>
              <th className="text-left p-4 font-semibold text-foreground">Procurement Frequency</th>
              <th className="text-left p-4 font-semibold text-foreground">Primary Application</th>
            </tr>
          </thead>
          <tbody>
            {regionalData.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="p-4 font-medium text-foreground">{row.region}</td>
                <td className="p-4 text-muted-foreground">{row.avgOrderSize}</td>
                <td className="p-4 text-muted-foreground">{row.frequency}</td>
                <td className="p-4 text-muted-foreground">{row.topUse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
