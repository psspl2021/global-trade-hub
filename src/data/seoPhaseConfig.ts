export interface PriorityCorridor {
  slug: string;
  country: string;
  category: string;
  phase: number;
  status: 'pending' | 'indexed' | 'warning';
}

export const PHASE_1_CORRIDORS: PriorityCorridor[] = [
  { slug: 'in-metals-ferrous-steel-iron', country: 'India', category: 'Steel', phase: 1, status: 'pending' },
  { slug: 'sa-metals-ferrous-steel-iron', country: 'Saudi Arabia', category: 'Steel', phase: 1, status: 'pending' },
  { slug: 'ae-polymers-resins', country: 'UAE', category: 'Polymers', phase: 1, status: 'pending' },
  { slug: 'de-chemicals-raw-materials', country: 'Germany', category: 'Chemicals', phase: 1, status: 'pending' },
  { slug: 'us-machinery-equipment', country: 'USA', category: 'Machinery', phase: 1, status: 'pending' },
  { slug: 'gb-textiles-fabrics', country: 'UK', category: 'Textiles', phase: 1, status: 'pending' },
  { slug: 'qa-pipes-tubes', country: 'Qatar', category: 'Pipes', phase: 1, status: 'pending' },
  { slug: 'ng-food-beverages', country: 'Nigeria', category: 'Food', phase: 1, status: 'pending' },
  { slug: 'sg-electronic-components', country: 'Singapore', category: 'Electronics', phase: 1, status: 'pending' },
  { slug: 'ke-pharmaceuticals-drugs', country: 'Kenya', category: 'Pharma', phase: 1, status: 'pending' },
];
