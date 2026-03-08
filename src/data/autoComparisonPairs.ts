/**
 * Module 4: Automatic Comparison Page Generator
 * Registry of auto-generated comparison pairs from demand products.
 */
import { demandProducts, type DemandProduct } from '@/data/demandProducts';

export interface AutoComparisonPair {
  slug: string;
  productA: DemandProduct;
  productB: DemandProduct;
  title: string;
  metaTitle: string;
  metaDescription: string;
  searchVolume?: number;
}

/** Define comparison pairs by slug pairs */
const comparisonDefinitions: [string, string][] = [
  ['hr-coil-india', 'cr-coil-india'],
  ['hr-coil-india', 'ms-plates-india'],
  ['cr-coil-india', 'galvanized-coils-india'],
  ['hr-sheet-india', 'cr-sheet-india'],
  ['ms-pipes-india', 'gi-pipes-india'],
  ['hdpe-pipes-india', 'pvc-pipes-india'],
  ['lsaw-pipes-india', 'hsaw-pipes-india'],
  ['erw-pipes-india', 'seamless-pipes-india'],
  ['copper-cathodes-india', 'copper-wire-rods-india'],
  ['aluminium-ingots-india', 'aluminium-billets-india'],
  ['aluminium-sheets-india', 'copper-sheets-india'],
  ['polypropylene-pp-india', 'polyethylene-pe-india'],
  ['hdpe-granules-india', 'lldpe-granules-india'],
  ['ldpe-granules-india', 'hdpe-granules-india'],
  ['pvc-resin-india', 'abs-resin-india'],
  ['polycarbonate-india', 'abs-resin-india'],
  ['pet-resin-india', 'pvc-resin-india'],
  ['cement-india', 'concrete-india'],
  ['tmt-bars-india', 'structural-steel-india'],
  ['steel-angles-india', 'steel-channels-india'],
  ['di-pipes-india', 'hdpe-pipes-india'],
  ['api-pipes-india', 'erw-pipes-india'],
  ['zinc-ingots-india', 'lead-ingots-india'],
  ['pig-iron-india', 'basic-pig-iron-india'],
  ['aac-blocks-india', 'cement-india'],
  ['ready-mix-concrete-india', 'concrete-india'],
  ['stainless-steel-pipes-india', 'ms-pipes-india'],
  ['boiler-tubes-india', 'precision-tubes-india'],
  ['color-coated-sheets-india', 'galvanized-coils-india'],
  ['chequered-plates-india', 'ms-plates-india'],
];

function createComparisonSlug(a: DemandProduct, b: DemandProduct): string {
  const slugA = a.slug.replace('-india', '');
  const slugB = b.slug.replace('-india', '');
  return `${slugA}-vs-${slugB}`;
}

const productMap = new Map(demandProducts.map(p => [p.slug, p]));

export const autoComparisonPairs: AutoComparisonPair[] = comparisonDefinitions
  .map(([slugA, slugB]) => {
    const a = productMap.get(slugA);
    const b = productMap.get(slugB);
    if (!a || !b) return null;

    const slug = createComparisonSlug(a, b);
    return {
      slug,
      productA: a,
      productB: b,
      title: `${a.name} vs ${b.name} – Procurement Comparison, Specifications & Use Cases`,
      metaTitle: `${a.name} vs ${b.name} | Procurement Comparison India | ProcureSaathi`,
      metaDescription: `Compare ${a.name} and ${b.name} for industrial procurement. Detailed specifications, pricing factors, use cases, and supplier selection guidance for Indian buyers.`,
    };
  })
  .filter(Boolean) as AutoComparisonPair[];

export function getAutoComparisonBySlug(slug: string): AutoComparisonPair | undefined {
  return autoComparisonPairs.find(p => p.slug === slug);
}
