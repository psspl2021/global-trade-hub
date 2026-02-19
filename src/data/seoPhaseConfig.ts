export interface PriorityCorridor {
  slug: string;
  country: string;
  category: string;
  phase: number;
}

export const PHASE_1_CORRIDORS: PriorityCorridor[] = [
  { slug: 'in-metals-ferrous-steel-iron', country: 'India', category: 'Steel', phase: 1 },
  { slug: 'sa-metals-ferrous-steel-iron', country: 'Saudi Arabia', category: 'Steel', phase: 1 },
  { slug: 'ae-polymers-resins', country: 'UAE', category: 'Polymers', phase: 1 },
  { slug: 'de-chemicals-raw-materials', country: 'Germany', category: 'Chemicals', phase: 1 },
  { slug: 'us-machinery-equipment', country: 'USA', category: 'Machinery', phase: 1 },
  { slug: 'gb-textiles-fabrics', country: 'UK', category: 'Textiles', phase: 1 },
  { slug: 'qa-pipes-tubes', country: 'Qatar', category: 'Pipes', phase: 1 },
  { slug: 'ng-food-beverages', country: 'Nigeria', category: 'Food', phase: 1 },
  { slug: 'sg-electronic-components', country: 'Singapore', category: 'Electronics', phase: 1 },
  { slug: 'ke-pharmaceuticals-drugs', country: 'Kenya', category: 'Pharma', phase: 1 },
];

export const PHASE_1_SLUGS = PHASE_1_CORRIDORS.map(c => c.slug);
