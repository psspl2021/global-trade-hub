import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const baseUrl = 'https://www.procuresaathi.com';

// Helper to convert name to slug
const nameToSlug = (name: string) => {
  return name.toLowerCase()
    .replace(/[&,()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// --- Page data (unchanged) ---

const staticPages = [
  { url: '/', priority: 1.0, changefreq: 'daily' },
  { url: '/explore', priority: 0.9, changefreq: 'daily' },
  { url: '/book-truck', priority: 0.8, changefreq: 'weekly' },
  { url: '/blogs', priority: 0.8, changefreq: 'daily' },
  { url: '/buyer', priority: 0.9, changefreq: 'weekly' },
  { url: '/seller', priority: 0.9, changefreq: 'weekly' },
  { url: '/post-rfq', priority: 0.9, changefreq: 'weekly' },
  { url: '/private-label', priority: 0.8, changefreq: 'weekly' },
  { url: '/contact', priority: 0.7, changefreq: 'monthly' },
  { url: '/invoice-generator', priority: 0.7, changefreq: 'monthly' },
  { url: '/affiliate', priority: 0.7, changefreq: 'monthly' },
  { url: '/affiliate-signup', priority: 0.7, changefreq: 'weekly' },
  { url: '/ai-b2b-procurement-platform-guide', priority: 0.95, changefreq: 'weekly' },
  { url: '/how-to-post-rfq-online', priority: 0.85, changefreq: 'monthly' },
  { url: '/find-verified-b2b-suppliers', priority: 0.85, changefreq: 'monthly' },
  { url: '/enterprise-procurement-guide', priority: 0.85, changefreq: 'monthly' },
  { url: '/export-import-sourcing-guide', priority: 0.85, changefreq: 'monthly' },
  { url: '/best-b2b-procurement-platforms-india', priority: 0.85, changefreq: 'monthly' },
  { url: '/ai-procurement-vs-traditional-rfq', priority: 0.85, changefreq: 'monthly' },
  { url: '/managed-procurement-vs-b2b-marketplace', priority: 0.85, changefreq: 'monthly' },
  { url: '/procurement-for-steel-manufacturers', priority: 0.8, changefreq: 'monthly' },
  { url: '/procurement-for-chemical-buyers', priority: 0.8, changefreq: 'monthly' },
  { url: '/procurement-for-construction-companies', priority: 0.8, changefreq: 'monthly' },
  { url: '/ai-helps-msmes-enterprise-supply-chains', priority: 0.8, changefreq: 'monthly' },
  { url: '/founder', priority: 0.75, changefreq: 'monthly' },
  { url: '/customer-stories', priority: 0.8, changefreq: 'weekly' },
  { url: '/case-study-procurement-cost-reduction', priority: 0.75, changefreq: 'monthly' },
  { url: '/case-study-export-sourcing', priority: 0.75, changefreq: 'monthly' },
  { url: '/case-study-global-steel-procurement', priority: 0.85, changefreq: 'monthly' },
  { url: '/case-study-global-pulses-spices-sourcing', priority: 0.85, changefreq: 'monthly' },
  { url: '/case-study-middle-east-pulses-spices-import', priority: 0.85, changefreq: 'monthly' },
  { url: '/usa/ai-b2b-procurement', priority: 0.9, changefreq: 'weekly' },
  { url: '/uk/ai-b2b-procurement', priority: 0.9, changefreq: 'weekly' },
  { url: '/europe/ai-b2b-procurement', priority: 0.9, changefreq: 'weekly' },
  { url: '/germany/ai-b2b-procurement', priority: 0.9, changefreq: 'weekly' },
  { url: '/singapore/ai-b2b-procurement', priority: 0.9, changefreq: 'weekly' },
  { url: '/global-sourcing-countries', priority: 0.9, changefreq: 'weekly' },
  { url: '/steel-comparisons', priority: 0.9, changefreq: 'weekly' },
  { url: '/compare/fe-500-vs-fe-500d-tmt-bars', priority: 0.8, changefreq: 'monthly' },
  { url: '/compare/fe-415-vs-fe-500-tmt', priority: 0.8, changefreq: 'monthly' },
  { url: '/compare/e250-vs-e350-structural-steel', priority: 0.8, changefreq: 'monthly' },
  { url: '/compare/ismb-vs-ishb-beam-comparison', priority: 0.8, changefreq: 'monthly' },
  { url: '/compare/ismb-vs-ismc-channel', priority: 0.8, changefreq: 'monthly' },
  { url: '/compare/hr-coil-vs-cr-coil', priority: 0.8, changefreq: 'monthly' },
  { url: '/compare/ms-plate-vs-hr-sheet', priority: 0.8, changefreq: 'monthly' },
  { url: '/compare/api-grade-vs-is-2062-steel', priority: 0.8, changefreq: 'monthly' },
  { url: '/compare/erw-pipe-vs-seamless-pipe', priority: 0.8, changefreq: 'monthly' },
  { url: '/compare/structural-steel-vs-tmt-bars', priority: 0.8, changefreq: 'monthly' },
  { url: '/industrial-use-cases', priority: 0.9, changefreq: 'weekly' },
  { url: '/use-case/tmt-bars-for-epc-projects', priority: 0.8, changefreq: 'monthly' },
  { url: '/use-case/structural-steel-for-industrial-sheds', priority: 0.8, changefreq: 'monthly' },
  { url: '/use-case/hr-coil-for-export-manufacturing', priority: 0.8, changefreq: 'monthly' },
  { url: '/use-case/ms-plates-for-heavy-fabrication', priority: 0.8, changefreq: 'monthly' },
  { url: '/use-case/steel-pipes-for-oil-gas-projects', priority: 0.8, changefreq: 'monthly' },
  { url: '/use-case/steel-for-high-rise-buildings', priority: 0.8, changefreq: 'monthly' },
  { url: '/use-case/structural-steel-for-warehouses', priority: 0.8, changefreq: 'monthly' },
  { url: '/use-case/tmt-bars-for-seismic-zones', priority: 0.8, changefreq: 'monthly' },
  { url: '/use-case/hr-coil-for-automotive-manufacturing', priority: 0.8, changefreq: 'monthly' },
  { url: '/use-case/ms-plates-for-infrastructure-projects', priority: 0.8, changefreq: 'monthly' },
];

const internationalPages = [
  { url: '/source/china', priority: 0.85, changefreq: 'weekly', hreflang: 'zh-cn' },
  { url: '/source/uae', priority: 0.85, changefreq: 'weekly', hreflang: 'en-ae' },
  { url: '/source/germany', priority: 0.8, changefreq: 'weekly', hreflang: 'de-de' },
  { url: '/source/usa', priority: 0.85, changefreq: 'weekly', hreflang: 'en-us' },
  { url: '/source/japan', priority: 0.8, changefreq: 'weekly', hreflang: 'ja-jp' },
  { url: '/source/south-korea', priority: 0.75, changefreq: 'weekly', hreflang: 'ko-kr' },
  { url: '/source/saudi-arabia', priority: 0.8, changefreq: 'weekly', hreflang: 'ar-sa' },
  { url: '/source/vietnam', priority: 0.75, changefreq: 'weekly', hreflang: 'vi-vn' },
  { url: '/source/indonesia', priority: 0.75, changefreq: 'weekly', hreflang: 'id-id' },
  { url: '/source/italy', priority: 0.75, changefreq: 'weekly', hreflang: 'it-it' },
];

const procurementCountries = [
  { code: 'india', hreflang: 'en-in' },
  { code: 'uae', hreflang: 'en-ae' },
  { code: 'saudi', hreflang: 'en-sa' },
  { code: 'qatar', hreflang: 'en-qa' },
  { code: 'kenya', hreflang: 'en-ke' },
  { code: 'nigeria', hreflang: 'en-ng' },
];

const procurementSignalPages = [
  { slug: 'structural-steel-infrastructure', priority: 0.95, isEnterprise: true },
  { slug: 'tmt-bars-epc-projects', priority: 0.95, isEnterprise: true },
  { slug: 'hot-rolled-coil-industrial', priority: 0.9, isEnterprise: false },
  { slug: 'cold-rolled-coil-manufacturing', priority: 0.9, isEnterprise: false },
  { slug: 'galvanized-steel-coils', priority: 0.9, isEnterprise: false },
  { slug: 'steel-plates-heavy', priority: 0.9, isEnterprise: false },
  { slug: 'steel-wire-rods', priority: 0.85, isEnterprise: false },
  { slug: 'chequered-plates', priority: 0.85, isEnterprise: false },
  { slug: 'peb-steel-structures', priority: 0.85, isEnterprise: false },
  { slug: 'colour-coated-steel', priority: 0.85, isEnterprise: false },
  { slug: 'aluminium-industrial-export', priority: 0.9, isEnterprise: true },
  { slug: 'aluminium-extrusions', priority: 0.85, isEnterprise: false },
  { slug: 'non-ferrous-metals', priority: 0.9, isEnterprise: true },
  { slug: 'cement-bulk-infra', priority: 0.85, isEnterprise: false },
  { slug: 'ready-mix-concrete-rmc', priority: 0.85, isEnterprise: false },
  { slug: 'fly-ash-procurement', priority: 0.8, isEnterprise: false },
  { slug: 'construction-aggregates', priority: 0.8, isEnterprise: false },
  { slug: 'industrial-pipes-tubes', priority: 0.9, isEnterprise: true },
  { slug: 'industrial-fasteners', priority: 0.85, isEnterprise: false },
  { slug: 'bearings-industrial', priority: 0.85, isEnterprise: false },
  { slug: 'welding-consumables', priority: 0.85, isEnterprise: false },
  { slug: 'gaskets-seals', priority: 0.85, isEnterprise: false },
  { slug: 'power-cables', priority: 0.85, isEnterprise: false },
  { slug: 'control-cables', priority: 0.85, isEnterprise: false },
  { slug: 'transformers-power', priority: 0.9, isEnterprise: true },
  { slug: 'industrial-valves', priority: 0.9, isEnterprise: true },
  { slug: 'centrifugal-pumps', priority: 0.85, isEnterprise: false },
  { slug: 'diesel-generators', priority: 0.85, isEnterprise: false },
  { slug: 'hvac-equipment', priority: 0.85, isEnterprise: false },
  { slug: 'export-industrial-materials', priority: 0.95, isEnterprise: true },
  { slug: 'pharmaceutical-apis-intermediates', priority: 0.95, isEnterprise: true },
  { slug: 'electrical-equipment-power-distribution', priority: 0.95, isEnterprise: true },
  { slug: 'water-treatment-chemicals-systems', priority: 0.95, isEnterprise: true },
  { slug: 'industrial-storage-tanks-silos', priority: 0.95, isEnterprise: true },
  { slug: 'medical-equipment-diagnostics', priority: 0.95, isEnterprise: true },
  { slug: 'energy-power-equipment', priority: 0.95, isEnterprise: true },
  { slug: 'industrial-pipes-tubes-oil-gas', priority: 0.95, isEnterprise: true },
  { slug: 'petroleum-bitumen-procurement', priority: 0.9, isEnterprise: true },
  { slug: 'steel-fabrication-structures-epc', priority: 0.95, isEnterprise: true },
  { slug: 'gfrp-composites-industrial', priority: 0.9, isEnterprise: true },
];

const highValueCategories = [
  'Metals - Ferrous (Steel, Iron)',
  'Chemicals & Raw Materials',
  'Machinery & Equipment',
  'Building & Construction',
  'Pharmaceuticals & Drugs',
  'Textiles & Fabrics',
  'Food & Beverages',
];

const categories = [
  { name: 'Agriculture Equipment & Supplies', subcategories: ['Agricultural Machinery', 'Irrigation Equipment', 'Seeds & Plants', 'Fertilizers & Pesticides', 'Farm Tools & Equipment', 'Animal Feed', 'Greenhouse Equipment', 'Harvesting Equipment', 'Storage & Silos', 'Dairy Equipment', 'Agricultural Spades', 'Garden Spades', 'Trenching Spades', 'Agricultural Shovels', 'Scoop Shovels', 'Agricultural Forks', 'Digging Forks', 'Manure Forks', 'Agricultural Hoes', 'Garden Hoes', 'Weeding Hoes', 'Agricultural Rakes', 'Cane Knives', 'Sugarcane Tools', 'Plantation Tools'] },
  { name: 'Auto Vehicle & Accessories', subcategories: ['Auto Parts', 'Vehicle Accessories', 'Tyres & Wheels', 'Lubricants & Fluids', 'Car Electronics', 'Body Parts', 'Engine Components', 'Brake Systems', 'Suspension Parts', 'Exhaust Systems'] },
  { name: 'Building & Construction', subcategories: ['Cement', 'Bricks & Blocks', 'Roofing Materials', 'Tiles & Flooring', 'Plumbing Materials', 'Sanitary Ware', 'Construction Chemicals', 'Waterproofing', 'Insulation Materials', 'Door & Window Fittings'] },
  { name: 'Chemicals & Raw Materials', subcategories: ['Industrial Chemicals', 'Organic Chemicals', 'Inorganic Chemicals', 'Solvents', 'Acids & Bases', 'Dyes & Pigments', 'Adhesives & Sealants', 'Specialty Chemicals', 'Lab Chemicals', 'Chemical Intermediates'] },
  { name: 'Electrical Equipment & Supplies', subcategories: ['Cables & Wires', 'Switchgear', 'Transformers', 'Circuit Breakers', 'Electrical Panels', 'Motors', 'Generators', 'LED Lighting', 'Industrial Lighting', 'Power Distribution'] },
  { name: 'Electronic Components', subcategories: ['Semiconductors', 'Resistors', 'Capacitors', 'Connectors', 'PCB Components', 'Sensors', 'Microcontrollers', 'Display Components', 'Power Supplies', 'Electronic Modules'] },
  { name: 'Energy & Power', subcategories: ['Solar Equipment', 'Wind Energy', 'Batteries', 'Power Plants', 'Energy Storage', 'Biomass', 'Fuel Cells', 'Grid Equipment', 'Smart Meters', 'Energy Management'] },
  { name: 'Food & Beverages', subcategories: ['Grains & Pulses', 'Spices', 'Oils & Fats', 'Dairy Products', 'Processed Foods', 'Beverages', 'Dry Fruits & Nuts', 'Sugar & Sweeteners', 'Seafood', 'Meat & Poultry'] },
  { name: 'Hardware & Tools', subcategories: ['Hand Tools', 'Power Tools', 'Cutting Tools', 'Measuring Instruments', 'Fasteners', 'Bolts & Nuts', 'Locks & Security', 'Abrasives', 'Welding Equipment', 'Workshop Equipment'] },
  { name: 'Industrial Supplies', subcategories: ['Safety Equipment', 'Packaging Materials', 'Cleaning Supplies', 'Material Handling', 'Industrial Tapes', 'Lubricants', 'Filters', 'Hoses & Fittings', 'Industrial Adhesives', 'Maintenance Supplies'] },
  { name: 'Machinery & Equipment', subcategories: ['CNC Machines', 'Lathe Machines', 'Milling Machines', 'Drilling Machines', 'Grinding Machines', 'Welding Machines', 'Compressors', 'Pumps', 'Boilers', 'Cranes & Hoists'] },
  { name: 'Medical & Healthcare', subcategories: ['Medical Devices', 'Surgical Instruments', 'Diagnostic Equipment', 'Hospital Furniture', 'PPE & Safety', 'Lab Equipment', 'Dental Equipment', 'Physiotherapy Equipment', 'Medical Consumables', 'Imaging Equipment'] },
  { name: 'Metals - Ferrous (Steel, Iron)', subcategories: ['TMT Bars', 'HR Coil', 'CR Coil', 'MS Plates', 'Structural Steel', 'Galvanized Steel', 'Steel Pipes', 'Wire Rods', 'Angles & Channels', 'Beams & Columns'] },
  { name: 'Metals - Non-Ferrous (Copper, Aluminium)', subcategories: ['Aluminium Sheets', 'Copper Wire', 'Brass Fittings', 'Zinc Products', 'Lead Products', 'Nickel Alloys', 'Titanium Products', 'Aluminium Extrusions', 'Copper Tubes', 'Bronze Products'] },
  { name: 'Mining & Minerals', subcategories: ['Iron Ore', 'Coal', 'Limestone', 'Bauxite', 'Manganese', 'Silica Sand', 'Feldspar', 'Kaolin', 'Graphite', 'Mica'] },
  { name: 'Packaging & Printing', subcategories: ['Corrugated Boxes', 'Plastic Packaging', 'Labels & Tags', 'Printing Inks', 'Packaging Machinery', 'Shrink Wrap', 'Bubble Wrap', 'Strapping', 'Flexible Packaging', 'Printing Paper'] },
  { name: 'Pharmaceuticals & Drugs', subcategories: ['APIs', 'Drug Intermediates', 'Formulations', 'Herbal Products', 'Nutraceuticals', 'Veterinary Products', 'Pharmaceutical Packaging', 'Lab Reagents', 'Medical Gases', 'Surgical Supplies'] },
  { name: 'Pipes & Tubes', subcategories: ['MS Pipes', 'GI Pipes', 'SS Pipes', 'PVC Pipes', 'HDPE Pipes', 'Copper Pipes', 'ERW Pipes', 'Seamless Pipes', 'Ductile Iron Pipes', 'Plastic Pipes'] },
  { name: 'Polymers & Resins', subcategories: ['PP Granules', 'HDPE', 'PVC Resin', 'ABS Granules', 'Polycarbonate', 'Nylon', 'PET Resin', 'Epoxy Resin', 'Polyurethane', 'Silicone'] },
  { name: 'Petroleum & Bitumen', subcategories: ['Bitumen', 'Petroleum Jelly', 'Paraffin Wax', 'Base Oils', 'Crude Oil', 'LPG', 'Diesel', 'Furnace Oil', 'Petroleum Coke', 'Lubricant Base'] },
  { name: 'Rubber Products', subcategories: ['Natural Rubber', 'Synthetic Rubber', 'Rubber Sheets', 'O-Rings', 'Rubber Moulded Parts', 'Rubber Hoses', 'Conveyor Belts', 'Rubber Rollers', 'Rubber Gaskets', 'Expansion Joints'] },
  { name: 'Safety & Security', subcategories: ['Fire Safety', 'CCTV Systems', 'Access Control', 'Safety Helmets', 'Safety Shoes', 'Reflective Wear', 'First Aid', 'Gas Detectors', 'Safety Nets', 'Barriers & Bollards'] },
  { name: 'Textiles & Fabrics', subcategories: ['Cotton Fabrics', 'Polyester Fabrics', 'Silk', 'Wool', 'Denim', 'Technical Textiles', 'Non-Woven Fabrics', 'Yarn', 'Thread', 'Garment Accessories'] },
  { name: 'Cosmetics & Personal Care', subcategories: ['Skincare', 'Hair Care', 'Oral Care', 'Fragrances', 'Makeup', 'Personal Hygiene', 'Ayurvedic Products', 'Men Grooming', 'Baby Care', 'Sun Protection'] },
  { name: 'Flavors & Fragrances', subcategories: ['Essential Oils', 'Aroma Chemicals', 'Natural Extracts', 'Food Flavors', 'Industrial Fragrances', 'Perfumery', 'Encapsulated Flavors', 'Organic Aromas', 'Synthetic Musks', 'Terpenes'] },
  { name: 'Industrial Storage Tanks', subcategories: ['FRP Tanks', 'SS Tanks', 'Chemical Tanks', 'Water Tanks', 'Fuel Tanks', 'Pressure Vessels', 'Cryogenic Tanks', 'Mixing Tanks', 'IBCs', 'Underground Tanks'] },
  { name: 'Steel Fabrication & Structures', subcategories: ['PEB Structures', 'Steel Trusses', 'Girders', 'Platforms', 'Mezzanine Floors', 'Industrial Sheds', 'Tower Structures', 'Bridge Components', 'Handrails', 'Steel Stairs'] },
  { name: 'GFRP & Composites', subcategories: ['GRP Pipes', 'FRP Gratings', 'Composite Panels', 'Carbon Fiber', 'Fiberglass', 'FRP Tanks', 'Composite Rebar', 'FRP Manhole Covers', 'Wind Turbine Blades', 'Marine Composites'] },
  { name: 'Road Safety & Infrastructure', subcategories: ['Crash Barriers', 'Road Signs', 'Traffic Lights', 'Speed Breakers', 'Road Marking Paint', 'Bollards', 'Highway Guardrails', 'Reflective Studs', 'Rumble Strips', 'Delineators'] },
  { name: 'Paper & Paper Products', subcategories: ['Kraft Paper', 'Printing Paper', 'Tissue Paper', 'Cardboard', 'Specialty Paper', 'Packaging Paper', 'Filter Paper', 'Newsprint', 'Art Paper', 'Coated Paper'] },
  { name: 'Environment & Recycling', subcategories: ['Waste Management', 'Recycling Equipment', 'Water Treatment', 'Air Purifiers', 'Effluent Treatment', 'Solar Waste', 'E-Waste', 'Composting', 'Biogas', 'Environmental Testing'] },
];

const priorityCorridorSlugs = [
  'in-metals-ferrous-steel-iron',
  'sa-metals-ferrous-steel-iron',
  'ae-polymers-resins',
  'de-chemicals-raw-materials',
  'us-machinery-equipment',
  'gb-textiles-fabrics',
  'qa-pipes-tubes',
  'ng-food-beverages',
  'sg-electronic-components',
  'ke-pharmaceuticals-drugs',
];

const importCorridorPages = [
  'ms-plates-india-from-japan',
  'ms-plates-india-from-china',
  'hr-coil-india-from-indonesia',
  'tmt-bars-india-from-vietnam',
  'structural-steel-india-from-japan',
];

const useCasePages = [
  { slug: 'tmt-bars-for-epc-projects', skuSlug: 'tmt-bars-india' },
  { slug: 'structural-steel-for-industrial-sheds', skuSlug: 'structural-steel-india' },
  { slug: 'hr-coil-for-export-manufacturing', skuSlug: 'hr-coil-india' },
  { slug: 'ms-plates-for-heavy-fabrication', skuSlug: 'ms-plates-india' },
  { slug: 'steel-pipes-for-oil-gas-projects', skuSlug: 'structural-steel-india' },
  { slug: 'steel-for-high-rise-buildings', skuSlug: 'structural-steel-india' },
  { slug: 'structural-steel-for-warehouses', skuSlug: 'structural-steel-india' },
  { slug: 'tmt-bars-for-seismic-zones', skuSlug: 'tmt-bars-india' },
  { slug: 'hr-coil-for-automotive-manufacturing', skuSlug: 'hr-coil-india' },
  { slug: 'ms-plates-for-infrastructure-projects', skuSlug: 'ms-plates-india' },
];

// --- DB fetchers ---

interface BlogPost { slug: string; published_at: string | null; updated_at: string | null; }

function getSupabase() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}

async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    const { data, error } = await getSupabase()
      .from('blogs').select('slug, published_at, updated_at').eq('is_published', true).order('published_at', { ascending: false });
    if (error) { console.error('[sitemap] blogs error:', error); return []; }
    return data || [];
  } catch { return []; }
}

async function fetchDynamicSignalPages(): Promise<{ slug: string; updated_at: string }[]> {
  try {
    const { data, error } = await getSupabase()
      .from('admin_signal_pages').select('slug, updated_at').eq('is_active', true).order('updated_at', { ascending: false });
    if (error) { console.error('[sitemap] signal pages error:', error); return []; }
    return data || [];
  } catch { return []; }
}

async function fetchSeoDemandPages(): Promise<{ slug: string; intent_weight: number | null; updated_at?: string }[]> {
  try {
    const { data, error } = await getSupabase()
      .from('seo_demand_pages').select('slug, intent_weight, updated_at').eq('is_active', true);
    if (error) { console.error('[sitemap] seo_demand_pages error:', error); return []; }
    return data || [];
  } catch { return []; }
}

async function fetchCountriesForExplore(): Promise<{ iso_code: string; region: string }[]> {
  try {
    const { data, error } = await getSupabase()
      .from('countries_master').select('iso_code, region').eq('is_active', true);
    if (error) { console.error('[sitemap] countries error:', error); return []; }
    return data || [];
  } catch { return []; }
}

async function fetchRevenueScores(): Promise<Map<string, number>> {
  try {
    const { data, error } = await getSupabase()
      .from('seo_revenue_dashboard').select('sku_slug, total_revenue');
    if (error || !data) return new Map();
    const scores = new Map<string, number>();
    for (const row of data) {
      if (!row.sku_slug) continue;
      scores.set(row.sku_slug, (scores.get(row.sku_slug) || 0) + (row.total_revenue || 0));
    }
    return scores;
  } catch { return new Map(); }
}

// Fetch the most recent updated_at from seo_demand_pages for demand lastmod
async function fetchDemandLastmod(): Promise<Map<string, string>> {
  try {
    const { data, error } = await getSupabase()
      .from('seo_demand_pages').select('slug, updated_at').eq('is_active', true);
    if (error || !data) return new Map();
    const m = new Map<string, string>();
    for (const row of data) {
      if (row.slug && row.updated_at) {
        m.set(row.slug, new Date(row.updated_at).toISOString().split('T')[0]);
      }
    }
    return m;
  } catch { return new Map(); }
}

// --- Helpers ---

function toLastmod(dateStr: string | null | undefined, fallback: string): string {
  if (!dateStr) return fallback;
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch { return fallback; }
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: number, extras = ''): string {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${extras}
  </url>
`;
}

// =============================================
// SITEMAP INDEX ARCHITECTURE
// =============================================

// 1. Static/pages sitemap
function generateSitemapPages(today: string): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

  for (const page of staticPages) {
    xml += urlEntry(`${baseUrl}${page.url}`, today, page.changefreq, page.priority);
  }

  // International source pages
  for (const page of internationalPages) {
    let extras = '';
    extras += `
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />`;
    extras += `
    <xhtml:link rel="alternate" hreflang="${page.hreflang}" href="${baseUrl}${page.url}" />`;
    extras += `
    <xhtml:link rel="alternate" hreflang="en-in" href="${baseUrl}/" />`;
    xml += urlEntry(`${baseUrl}${page.url}`, today, page.changefreq, page.priority, extras);
  }

  xml += '</urlset>';
  return xml;
}

// 2. Demand sitemap (priority corridors + DB demand pages + procurement signals)
async function generateSitemapDemand(
  today: string,
  seoDemandPages: { slug: string; intent_weight: number | null; updated_at?: string }[],
  revenueScores: Map<string, number>,
  demandLastmod: Map<string, string>,
  dynamicSignalPages: { slug: string; updated_at: string }[],
): Promise<string> {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

  const maxRevenue = Math.max(...[...revenueScores.values()], 1);
  const prioritySet = new Set(priorityCorridorSlugs);
  const staticSignalSlugs = new Set(procurementSignalPages.map(s => s.slug));

  // Priority corridors
  for (const slug of priorityCorridorSlugs) {
    const lm = demandLastmod.get(slug) || today;
    xml += urlEntry(`${baseUrl}/demand/${slug}`, lm, 'daily', 1.0);
  }

  // DB demand pages (revenue-weighted)
  for (const page of seoDemandPages) {
    if (prioritySet.has(page.slug)) continue;
    const revenueScore = revenueScores.get(page.slug) || 0;
    let priority: number;
    if (revenueScore > 0) {
      priority = Math.round((0.6 + (revenueScore / maxRevenue) * 0.35) * 100) / 100;
    } else {
      priority = (page.intent_weight || 50) > 70 ? 0.9 : 0.6;
    }
    const lm = toLastmod(page.updated_at, today);
    xml += urlEntry(`${baseUrl}/demand/${page.slug}`, lm, 'daily', priority);
  }

  // Procurement signal pages with hreflang (canonical + country variants)
  for (const signal of procurementSignalPages) {
    let extras = '';
    for (const country of procurementCountries) {
      const href = country.code === 'india'
        ? `${baseUrl}/procurement/${signal.slug}`
        : `${baseUrl}/${country.code}/procurement/${signal.slug}`;
      extras += `
    <xhtml:link rel="alternate" hreflang="${country.hreflang}" href="${href}" />`;
    }
    extras += `
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/procurement/${signal.slug}" />`;
    xml += urlEntry(`${baseUrl}/procurement/${signal.slug}`, today, 'weekly', signal.priority, extras);

    // Country variants
    for (const country of procurementCountries) {
      if (country.code === 'india') continue;
      let cExtras = '';
      for (const hrefCountry of procurementCountries) {
        const href = hrefCountry.code === 'india'
          ? `${baseUrl}/procurement/${signal.slug}`
          : `${baseUrl}/${hrefCountry.code}/procurement/${signal.slug}`;
        cExtras += `
    <xhtml:link rel="alternate" hreflang="${hrefCountry.hreflang}" href="${href}" />`;
      }
      cExtras += `
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/procurement/${signal.slug}" />`;
      xml += urlEntry(`${baseUrl}/${country.code}/procurement/${signal.slug}`, today, 'weekly', signal.isEnterprise ? 0.9 : 0.85, cExtras);
    }
  }

  // Dynamic signal pages from DB
  for (const dbPage of dynamicSignalPages) {
    const cleanSlug = dbPage.slug.includes('/') ? dbPage.slug.split('/').pop()! : dbPage.slug;
    if (staticSignalSlugs.has(cleanSlug) || staticSignalSlugs.has(dbPage.slug)) continue;
    const lm = toLastmod(dbPage.updated_at, today);
    xml += urlEntry(`${baseUrl}/procurement/${cleanSlug}`, lm, 'weekly', 0.8);
  }

  xml += '</urlset>';
  return xml;
}

// 3. Import corridors + use-case sitemap
function generateSitemapImport(today: string, revenueScores: Map<string, number>): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  const maxRevenue = Math.max(...[...revenueScores.values()], 1);

  for (const slug of importCorridorPages) {
    const skuSlug = slug.split('-from-')[0];
    const revenueScore = revenueScores.get(skuSlug) || 0;
    const priority = revenueScore > 0
      ? Math.round((0.6 + (revenueScore / maxRevenue) * 0.35) * 100) / 100
      : 0.8;
    xml += urlEntry(`${baseUrl}/import/${slug}`, today, 'weekly', priority);
  }

  const existingUrls = new Set(staticPages.map(p => p.url));
  for (const uc of useCasePages) {
    const ucUrl = `/use-case/${uc.slug}`;
    if (existingUrls.has(ucUrl)) continue;
    const revenueScore = revenueScores.get(uc.skuSlug) || 0;
    const priority = revenueScore > 0
      ? Math.round((0.6 + (revenueScore / maxRevenue) * 0.35) * 100) / 100
      : 0.8;
    xml += urlEntry(`${baseUrl}${ucUrl}`, today, 'weekly', priority);
  }

  xml += '</urlset>';
  return xml;
}

// 4. Industries/categories sitemap
function generateSitemapIndustries(today: string, exploreCountries: { iso_code: string; region: string }[]): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Category pages
  for (const category of categories) {
    const categorySlug = nameToSlug(category.name);
    const isHighValue = highValueCategories.includes(category.name);
    const priority = isHighValue ? 0.9 : 0.7;
    xml += urlEntry(`${baseUrl}/category/${categorySlug}`, today, 'weekly', priority);

    for (const sub of category.subcategories) {
      const subSlug = nameToSlug(sub);
      xml += urlEntry(`${baseUrl}/category/${categorySlug}/${subSlug}`, today, 'weekly', isHighValue ? 0.8 : 0.6);
    }
  }

  // Explore directory pages
  for (const c of exploreCountries) {
    const regionSlug = (c.region || 'other').toLowerCase().replace(/\s+/g, '-');
    xml += urlEntry(`${baseUrl}/explore/${regionSlug}/${c.iso_code.toLowerCase()}`, today, 'weekly', 0.6);
  }

  // Blog listing
  xml += urlEntry(`${baseUrl}/blogs`, today, 'daily', 0.8);

  xml += '</urlset>';
  return xml;
}

// 5. Blog sitemap
function generateSitemapBlogs(today: string, blogPosts: BlogPost[]): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const blog of blogPosts) {
    const lm = toLastmod(blog.updated_at || blog.published_at, today);
    xml += urlEntry(`${baseUrl}/blogs/${blog.slug}`, lm, 'weekly', 0.7);
  }

  xml += '</urlset>';
  return xml;
}

// Sitemap index
function generateSitemapIndex(today: string): string {
  const sitemaps = [
    'sitemap-pages.xml',
    'sitemap-demand.xml',
    'sitemap-import.xml',
    'sitemap-industries.xml',
    'sitemap-blogs.xml',
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const sm of sitemaps) {
    xml += `  <sitemap>
    <loc>${baseUrl}/${sm}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
`;
  }

  xml += '</sitemapindex>';
  return xml;
}

// Legacy combined sitemap (kept for backward compatibility at /sitemap.xml → redirects to index)
async function generateFullSitemap(): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const [blogPosts, dynamicSignalPages, seoDemandPages, exploreCountries, revenueScores, demandLastmod] = await Promise.all([
    fetchBlogPosts(),
    fetchDynamicSignalPages(),
    fetchSeoDemandPages(),
    fetchCountriesForExplore(),
    fetchRevenueScores(),
    fetchDemandLastmod(),
  ]);

  // Return sitemap index
  return generateSitemapIndex(today);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const today = new Date().toISOString().split('T')[0];

    let xml: string;

    if (type === 'pages') {
      xml = generateSitemapPages(today);
    } else if (type === 'demand') {
      const [seoDemandPages, revenueScores, demandLastmod, dynamicSignalPages] = await Promise.all([
        fetchSeoDemandPages(), fetchRevenueScores(), fetchDemandLastmod(), fetchDynamicSignalPages(),
      ]);
      xml = await generateSitemapDemand(today, seoDemandPages, revenueScores, demandLastmod, dynamicSignalPages);
    } else if (type === 'import') {
      const revenueScores = await fetchRevenueScores();
      xml = generateSitemapImport(today, revenueScores);
    } else if (type === 'industries') {
      const exploreCountries = await fetchCountriesForExplore();
      xml = generateSitemapIndustries(today, exploreCountries);
    } else if (type === 'blogs') {
      const blogPosts = await fetchBlogPosts();
      xml = generateSitemapBlogs(today, blogPosts);
    } else {
      // Default: return sitemap index
      xml = generateSitemapIndex(today);
    }

    const urlCount = (xml.match(/<url>|<sitemap>/g) || []).length;
    console.log(`[generate-sitemap] type=${type || 'index'}, entries=${urlCount}`);

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[generate-sitemap] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
