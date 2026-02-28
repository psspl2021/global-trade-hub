import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to convert name to slug
const nameToSlug = (name: string) => {
  return name.toLowerCase()
    .replace(/[&,()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Static pages
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
  // Pillar / Guide pages
  { url: '/ai-b2b-procurement-platform-guide', priority: 0.95, changefreq: 'weekly' },
  { url: '/how-to-post-rfq-online', priority: 0.85, changefreq: 'monthly' },
  { url: '/find-verified-b2b-suppliers', priority: 0.85, changefreq: 'monthly' },
  { url: '/enterprise-procurement-guide', priority: 0.85, changefreq: 'monthly' },
  { url: '/export-import-sourcing-guide', priority: 0.85, changefreq: 'monthly' },
  // Comparison pages
  { url: '/best-b2b-procurement-platforms-india', priority: 0.85, changefreq: 'monthly' },
  { url: '/ai-procurement-vs-traditional-rfq', priority: 0.85, changefreq: 'monthly' },
  { url: '/managed-procurement-vs-b2b-marketplace', priority: 0.85, changefreq: 'monthly' },
  // Industry use-case pages
  { url: '/procurement-for-steel-manufacturers', priority: 0.8, changefreq: 'monthly' },
  { url: '/procurement-for-chemical-buyers', priority: 0.8, changefreq: 'monthly' },
  { url: '/procurement-for-construction-companies', priority: 0.8, changefreq: 'monthly' },
  { url: '/ai-helps-msmes-enterprise-supply-chains', priority: 0.8, changefreq: 'monthly' },
  // Founder & Case studies
  { url: '/founder', priority: 0.75, changefreq: 'monthly' },
  { url: '/customer-stories', priority: 0.8, changefreq: 'weekly' },
  { url: '/case-study-procurement-cost-reduction', priority: 0.75, changefreq: 'monthly' },
  { url: '/case-study-export-sourcing', priority: 0.75, changefreq: 'monthly' },
  { url: '/case-study-global-steel-procurement', priority: 0.85, changefreq: 'monthly' },
  { url: '/case-study-global-pulses-spices-sourcing', priority: 0.85, changefreq: 'monthly' },
  { url: '/case-study-middle-east-pulses-spices-import', priority: 0.85, changefreq: 'monthly' },
  // GEO landing pages
  { url: '/usa/ai-b2b-procurement', priority: 0.9, changefreq: 'weekly' },
  { url: '/uk/ai-b2b-procurement', priority: 0.9, changefreq: 'weekly' },
  { url: '/europe/ai-b2b-procurement', priority: 0.9, changefreq: 'weekly' },
  { url: '/germany/ai-b2b-procurement', priority: 0.9, changefreq: 'weekly' },
  { url: '/singapore/ai-b2b-procurement', priority: 0.9, changefreq: 'weekly' },
  // Global sourcing authority hub
  { url: '/global-sourcing-countries', priority: 0.9, changefreq: 'weekly' },
  // Steel comparison hub + individual pages
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
  // Industrial use-case hub + individual pages
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

// Strategic source country pages — only these 10 are indexed
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

// Supported countries for procurement signal pages
const procurementCountries = [
  { code: 'india', hreflang: 'en-in' },
  { code: 'uae', hreflang: 'en-ae' },
  { code: 'saudi', hreflang: 'en-sa' },
  { code: 'qatar', hreflang: 'en-qa' },
  { code: 'kenya', hreflang: 'en-ke' },
  { code: 'nigeria', hreflang: 'en-ng' },
];

// Phase 1 + Phase 2 Canonical Procurement Signal Pages (33 Enterprise Demand Sensors)
const procurementSignalPages = [
  // PHASE 1: Infrastructure & Steel (Canonicals)
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
  // Non-Ferrous & Metals
  { slug: 'aluminium-industrial-export', priority: 0.9, isEnterprise: true },
  { slug: 'aluminium-extrusions', priority: 0.85, isEnterprise: false },
  { slug: 'non-ferrous-metals', priority: 0.9, isEnterprise: true },
  // Construction Materials
  { slug: 'cement-bulk-infra', priority: 0.85, isEnterprise: false },
  { slug: 'ready-mix-concrete-rmc', priority: 0.85, isEnterprise: false },
  { slug: 'fly-ash-procurement', priority: 0.8, isEnterprise: false },
  { slug: 'construction-aggregates', priority: 0.8, isEnterprise: false },
  // Pipes & Tubes
  { slug: 'industrial-pipes-tubes', priority: 0.9, isEnterprise: true },
  // Hardware & Consumables
  { slug: 'industrial-fasteners', priority: 0.85, isEnterprise: false },
  { slug: 'bearings-industrial', priority: 0.85, isEnterprise: false },
  { slug: 'welding-consumables', priority: 0.85, isEnterprise: false },
  { slug: 'gaskets-seals', priority: 0.85, isEnterprise: false },
  // Electrical (Basic)
  { slug: 'power-cables', priority: 0.85, isEnterprise: false },
  { slug: 'control-cables', priority: 0.85, isEnterprise: false },
  { slug: 'transformers-power', priority: 0.9, isEnterprise: true },
  // Equipment (Basic)
  { slug: 'industrial-valves', priority: 0.9, isEnterprise: true },
  { slug: 'centrifugal-pumps', priority: 0.85, isEnterprise: false },
  { slug: 'diesel-generators', priority: 0.85, isEnterprise: false },
  { slug: 'hvac-equipment', priority: 0.85, isEnterprise: false },
  // Export
  { slug: 'export-industrial-materials', priority: 0.95, isEnterprise: true },
  // PHASE 2: Enterprise Verticals (Batch 1 - All revenue_high)
  { slug: 'pharmaceutical-apis-intermediates', priority: 0.95, isEnterprise: true },
  { slug: 'electrical-equipment-power-distribution', priority: 0.95, isEnterprise: true },
  { slug: 'water-treatment-chemicals-systems', priority: 0.95, isEnterprise: true },
  { slug: 'industrial-storage-tanks-silos', priority: 0.95, isEnterprise: true },
  { slug: 'medical-equipment-diagnostics', priority: 0.95, isEnterprise: true },
  // PHASE 2: Enterprise Verticals (Batch 2 - Revenue First)
  { slug: 'energy-power-equipment', priority: 0.95, isEnterprise: true },
  { slug: 'industrial-pipes-tubes-oil-gas', priority: 0.95, isEnterprise: true },
  { slug: 'petroleum-bitumen-procurement', priority: 0.9, isEnterprise: true },
  { slug: 'steel-fabrication-structures-epc', priority: 0.95, isEnterprise: true },
  { slug: 'gfrp-composites-industrial', priority: 0.9, isEnterprise: true },
];

// High-value categories (priority 0.9 for SEO)
const highValueCategories = [
  'Metals - Ferrous (Steel, Iron)',
  'Chemicals & Raw Materials',
  'Machinery & Equipment',
  'Building & Construction',
  'Pharmaceuticals & Drugs',
  'Textiles & Fabrics',
  'Food & Beverages',
];

// All categories with subcategories - Complete taxonomy for sitemap coverage
// This must match the frontend categoriesData for 1:1 sitemap alignment
const categories = [
  { name: 'Agriculture Equipment & Supplies', subcategories: ['Agricultural Machinery', 'Irrigation Equipment', 'Seeds & Plants', 'Fertilizers & Pesticides', 'Farm Tools & Equipment', 'Animal Feed', 'Greenhouse Equipment', 'Harvesting Equipment', 'Storage & Silos', 'Dairy Equipment', 'Agricultural Spades', 'Garden Spades', 'Trenching Spades', 'Agricultural Shovels', 'Scoop Shovels', 'Agricultural Forks', 'Digging Forks', 'Manure Forks', 'Agricultural Hoes', 'Garden Hoes', 'Weeding Hoes', 'Agricultural Rakes', 'Cane Knives', 'Sugarcane Tools', 'Plantation Tools'] },
  { name: 'Auto Vehicle & Accessories', subcategories: ['Car Parts', 'Truck Parts', 'Motorcycle Parts', 'Auto Batteries', 'Tires & Wheels', 'Auto Electronics', 'Body Parts', 'Engine Components', 'Lubricants & Oils', 'Interior Accessories'] },
  { name: 'Building & Construction', subcategories: ['Cement & Concrete', 'Tiles & Flooring', 'Sanitary Ware', 'Doors & Windows', 'Roofing Materials', 'Paints & Coatings', 'Plumbing Supplies', 'Electrical Fittings', 'Glass & Glazing', 'GC Roofing Sheets', 'GP Roofing Sheets', 'Color Coated Roofing Sheets', 'Metal Roofing', 'Galvanized Roofing', 'Pre-Painted Roofing Sheets', 'C Purlins', 'Z Purlins', 'Monopoles', 'Transmission Poles', 'Telecom Monopoles', 'Tata Wiron Products'] },
  { name: 'Chemicals & Raw Materials', subcategories: ['Industrial Chemicals', 'Lab Chemicals', 'Dyes & Pigments', 'Solvents', 'Adhesives & Sealants', 'Petrochemicals', 'Agrochemicals', 'Specialty Chemicals', 'Water Treatment Coagulants', 'Flocculants', 'Water Disinfectants', 'Biocides', 'Antiscalants', 'Corrosion Inhibitors', 'pH Adjusters', 'Water Treatment Dispersants', 'Anionic Surfactants', 'Nonionic Surfactants', 'Amphoteric Surfactants', 'Cationic Surfactants', 'Chelating Agents', 'Industrial Preservatives', 'Silicone Surfactants', 'Fine Chemicals', 'Electronic Chemicals', 'Textile Chemicals', 'Leather Chemicals', 'Rubber Additives', 'Plastic Additives', 'Foaming Agents', 'Refrigerants', 'Paint Resins', 'Coating Additives', 'Paint Solvents', 'Pigment Dispersants', 'Anti-Foaming Agents', 'Thickeners', 'Wetting Agents'] },
  { name: 'Electrical Equipment & Supplies', subcategories: ['Wires & Cables', 'Switches & Sockets', 'Circuit Breakers', 'Transformers', 'Motors & Drives', 'Control Panels', 'Power Distribution'] },
  { name: 'Electronic Components', subcategories: ['Semiconductors', 'Capacitors', 'Resistors', 'PCBs', 'Connectors', 'LEDs', 'Sensors', 'Integrated Circuits'] },
  { name: 'Energy & Power', subcategories: ['Solar Equipment', 'Wind Energy', 'Generators', 'Batteries & UPS', 'Power Cables', 'Energy Storage', 'Grid Equipment', 'Energy Meters'] },
  { name: 'Environment & Recycling', subcategories: ['Waste Management', 'Recycling Equipment', 'Water Treatment', 'Air Purification', 'Eco-friendly Products', 'Pollution Control', 'Composting Systems'] },
  { name: 'Food & Beverages', subcategories: ['Grains & Cereals', 'Spices & Herbs', 'Oils & Fats', 'Dairy Products', 'Beverages', 'Processed Foods', 'Frozen Foods', 'Organic Foods', 'Snacks & Confectionery', 'Food Preservatives', 'Food Emulsifiers', 'Food Colorants', 'Sweeteners', 'Flavor Enhancers', 'Thickening Agents', 'Stabilizers', 'Acidulants', 'Antioxidants', 'Nutraceuticals', 'Dietary Supplements', 'Protein Ingredients', 'Vitamins & Minerals', 'Probiotics & Prebiotics', 'Sports Nutrition'] },
  { name: 'Flavors & Fragrances', subcategories: ['Natural Flavors', 'Synthetic Flavors', 'Fruit Flavors', 'Dairy Flavors', 'Savory Flavors', 'Beverage Flavors', 'Confectionery Flavors', 'Mint & Menthol', 'Vanilla & Vanillin', 'Citrus Flavors', 'Fine Fragrances', 'Functional Fragrances', 'Aroma Chemicals', 'Fragrance Oils', 'Musk Compounds', 'Floral Notes', 'Woody Notes'] },
  { name: 'Hardware & Tools', subcategories: ['Hand Tools', 'Power Tools', 'Fasteners', 'Locks & Security', 'Garden Tools', 'Measuring Tools', 'Abrasives', 'Tool Storage', 'Spades & Shovels', 'D-Handle Spades', 'Square Mouth Shovels', 'Round Mouth Shovels', 'Post Hole Diggers', 'Crowbars & Pinch Bars', 'Pickaxes & Mattocks', 'Hammers', 'Axes & Hatchets', 'Chisels', 'Files & Rasps', 'Pliers & Cutters', 'Wrenches & Spanners', 'Screwdrivers', 'Masonry Tools', 'Plastering Trowels', 'Brick Trowels', 'Pointing Trowels', 'Floats', 'Mason Hammers', 'Tile Cutters', 'Concrete Tools', 'Leveling Tools', 'Bolts & Nuts', 'Washers', 'Screws', 'Anchors', 'Rivets', 'Nails & Pins', 'Hooks & Hangers', 'Hinges', 'Hasps & Staples', 'Wire Rope & Chains'] },
  { name: 'Medical & Healthcare', subcategories: ['Medical Equipment', 'Medical Supplies', 'Surgical Instruments', 'Hospital Furniture', 'Lab Equipment', 'Diagnostic Equipment', 'Diagnostic Devices', 'Rehabilitation Equipment', 'Rehabilitation Aids', 'Dental Equipment', 'Veterinary Equipment', 'Health Supplements', 'First Aid', 'Wellness Products', 'Therapeutic Equipment'] },
  { name: 'Industrial Supplies', subcategories: ['Industrial Tools', 'Safety Equipment', 'Material Handling', 'Pumps & Valves', 'Bearings & Seals', 'Industrial Hoses', 'Cleaning Supplies', 'Packaging Materials'] },
  { name: 'Metals - Ferrous (Steel, Iron)', subcategories: ['Pig Iron', 'Basic Pig Iron', 'Foundry Grade Pig Iron', 'CR Sheet', 'CR Coil', 'Cold Rolled GP Sheets', 'Cold Rolled Annealed Coils', 'Full Hard Cold Rolled Coils', 'HR Coil', 'HR Sheet', 'HR Plates', 'Hot Rolled Pickled & Oiled (HRPO)', 'Chequered Plates', 'Galvanised Plain (GP) Sheets', 'Galvanised Corrugated (GC) Sheets', 'Galvanised Coils', 'Color Coated Sheets', 'Steel Pipes', 'ERW Pipes', 'Spiral Welded Pipes', 'Seamless Pipes', 'API Grade Pipes', 'Billets', 'Blooms', 'Slabs', 'Ingots', 'Structural Steel', 'Angles', 'Channels', 'Beams (ISMB/ISJB/ISLB)', 'Joists', 'H-Beams', 'I-Beams', 'TMT Bar', 'TMT Bars Fe-500', 'TMT Bars Fe-500D', 'TMT Bars Fe-550', 'TMT Bars Fe-550D', 'TMT Bars Fe-600', 'SeQR TMT Bars', 'Earthquake Resistant TMT', 'Wire Rods', 'High Carbon Wire Rods', 'Low Carbon Wire Rods', 'Electrode Quality Wire Rods', 'Cold Heading Quality Wire Rods', 'PM Plates', 'Boiler Quality Plates', 'Shipbuilding Plates', 'Structural Plates', 'Pressure Vessel Plates', 'High Tensile Plates', 'Wear Resistant Plates', 'Rails', 'Crane Rails', 'Fish Plates', 'Railway Track Components', '60 Kg Rails', '52 Kg Rails', 'Head Hardened Rails', 'Railway Wheels', 'Railway Axles', 'Wheel Sets', 'Forged Wheels', 'Stainless Steel Sheets', 'Stainless Steel Coils', 'Stainless Steel Plates', 'Stainless Steel Bars', 'Austenitic Stainless Steel', 'Ferritic Stainless Steel', 'Duplex Stainless Steel', 'Electrical Steel Sheets', 'CRGO (Cold Rolled Grain Oriented)', 'CRNGO (Cold Rolled Non-Grain Oriented)', 'Silicon Steel', 'Transformer Grade Steel', 'Motor Grade Steel', 'Steel Sheets', 'Steel Bars & Rods', 'Iron Castings', 'Alloy Steel', 'Tool Steel', 'Scrap', 'Iron Ore'] },
  { name: 'Metals - Non-Ferrous (Copper, Aluminium)', subcategories: ['Copper Products', 'Aluminum Products', 'Brass Products', 'Zinc Products', 'Lead Products', 'Nickel Alloys', 'Titanium Products', 'Bronze Products', 'Aluminium Ingots', 'Aluminium Billets', 'Copper Cathodes', 'Copper Wire Rods', 'Zinc Ingots', 'Lead Ingots', 'Tin Ingots', 'Aluminium Sheets', 'Aluminium Coils', 'Copper Sheets', 'Brass Sheets', 'Aluminium Scrap', 'Copper Scrap', 'Brass Scrap'] },
  { name: 'Mining & Minerals', subcategories: ['Coal & Coke', 'Limestone', 'Marble & Granite', 'Sand & Gravel', 'Precious Metals', 'Industrial Minerals', 'Mining Equipment'] },
  { name: 'Packaging & Printing', subcategories: ['Corrugated Boxes', 'Plastic Packaging', 'Labels & Tags', 'Printing Services', 'Flexible Packaging', 'Glass Packaging', 'Promotional Printing'] },
  { name: 'Paper & Paper Products', subcategories: ['Printing Paper', 'Packaging Paper', 'Tissue Paper', 'Specialty Paper', 'Paper Boards', 'Notebooks & Diaries', 'Paper Bags', 'Recycled Paper'] },
  { name: 'Pharmaceuticals & Drugs', subcategories: ['Generic Medicines', 'API (Active Pharmaceutical Ingredients)', 'Formulations', 'Herbal Medicines', 'Veterinary Drugs', 'OTC Products', 'Pharmaceutical Packaging', 'Medical Devices', 'Analgesic Intermediates', 'Anesthetic Intermediates', 'Antibacterial Intermediates', 'Anticancer Intermediates', 'Antiviral Intermediates', 'Cardiovascular Intermediates', 'Diabetes Drug Intermediates', 'CNS Drug Intermediates', 'Respiratory Drug Intermediates', 'GI Drug Intermediates', 'Hormonal Intermediates', 'Vitamin Intermediates', 'Antibiotic Intermediates', 'Immunosuppressant Intermediates'] },
  { name: 'Pipes & Tubes', subcategories: ['Steel Pipes', 'PVC Pipes', 'HDPE Pipes', 'GI Pipes', 'MS Pipes', 'Seamless Tubes', 'ERW Pipes', 'Spiral Pipes', 'Copper Tubes', 'Aluminium Tubes', 'Stainless Steel Pipes', 'API Pipes', 'Boiler Tubes', 'Heat Exchanger Tubes', 'Structural Tubes'] },
  { name: 'Polymers & Resins', subcategories: ['Polyethylene', 'Polypropylene', 'PVC Resin', 'ABS Resin', 'Polystyrene', 'Polyurethane', 'Epoxy Resins', 'Polyester Resins', 'Acrylic Resins', 'Phenolic Resins', 'Melamine Resins', 'Urea Formaldehyde Resins', 'Alkyd Resins', 'Silicone Resins', 'Vinyl Resins', 'Engineering Plastics', 'Nylon Resins', 'Polycarbonate', 'PET Resin', 'Masterbatches', 'Color Masterbatch', 'Additive Masterbatch', 'Filler Masterbatch'] },
  { name: 'Petroleum & Bitumen', subcategories: ['Bitumen', 'VG 10 Bitumen', 'VG 30 Bitumen', 'VG 40 Bitumen', 'Polymer Modified Bitumen', 'Crumb Rubber Modified Bitumen', 'Emulsion Bitumen', 'Cutback Bitumen', 'Oxidized Bitumen', 'Natural Asphalt', 'Industrial Bitumen', 'Road Construction Bitumen', 'Waterproofing Bitumen', 'Roofing Bitumen', 'Base Oils', 'Lubricant Base Oils', 'Group I Base Oils', 'Group II Base Oils', 'Group III Base Oils', 'Petroleum Products', 'Fuel Oils', 'Industrial Fuels', 'Petroleum Waxes', 'Paraffin Wax', 'Microcrystalline Wax', 'Petroleum Jelly'] },
  { name: 'Rubber Products', subcategories: ['Natural Rubber', 'Synthetic Rubber', 'Rubber Sheets', 'Rubber Compounds', 'Rubber Hoses', 'Rubber Mats', 'Rubber Gaskets', 'Rubber Seals', 'O-Rings', 'V-Belts', 'Conveyor Belts', 'Rubber Rollers', 'Anti-Vibration Mounts', 'Rubber Flooring', 'Rubber Profiles', 'Latex Products', 'Reclaimed Rubber', 'Crumb Rubber'] },
  { name: 'Safety & Security', subcategories: ['CCTV Systems', 'Fire Safety', 'Personal Protective Equipment', 'Access Control', 'Alarm Systems', 'Safety Signs', 'Security Services', 'Road Safety Equipment', 'Traffic Signs', 'Road Barriers', 'Speed Breakers', 'Reflective Tapes', 'Warning Lights', 'Safety Cones', 'Crash Barriers', 'Guardrails', 'Delineators'] },
  { name: 'Textiles & Fabrics', subcategories: ['Cotton Fabrics', 'Silk Fabrics', 'Synthetic Fabrics', 'Home Textiles', 'Technical Textiles', 'Denim', 'Linen', 'Wool', 'Polyester Fabrics', 'Nylon Fabrics', 'Viscose Fabrics', 'Blended Fabrics', 'Knitted Fabrics', 'Woven Fabrics', 'Non-Woven Fabrics', 'Printed Fabrics', 'Dyed Fabrics', 'Embroidered Fabrics', 'Upholstery Fabrics', 'Industrial Fabrics'] },
  { name: 'Cosmetics & Personal Care', subcategories: ['Skincare Products', 'Haircare Products', 'Oral Care Products', 'Body Care Products', 'Color Cosmetics', 'Fragrances', 'Mens Grooming', 'Baby Care Products', 'Organic Cosmetics', 'Herbal Cosmetics', 'Private Label Cosmetics', 'Cosmetic Ingredients', 'Personal Care Ingredients', 'Emollients', 'Humectants', 'Surfactants', 'Conditioning Agents', 'UV Filters', 'Preservatives', 'Active Ingredients'] },
  { name: 'Machinery & Equipment', subcategories: ['CNC Machines', 'Lathes', 'Milling Machines', 'Drilling Machines', 'Grinding Machines', 'Pressing Machines', 'Packaging Machinery', 'Textile Machinery', 'Food Processing Machinery', 'Printing Machinery', 'Pharmaceutical Machinery', 'Chemical Process Equipment', 'Material Handling Equipment', 'Conveyors', 'Cranes', 'Forklifts', 'Compressors', 'Industrial Pumps', 'Industrial Valves', 'Heat Exchangers', 'Boilers', 'Furnaces', 'Cooling Towers', 'Air Compressors'] },
  { name: 'Industrial Storage Tanks', subcategories: ['Storage Tanks', 'FRP Tanks', 'SS Tanks', 'MS Tanks', 'Chemical Storage Tanks', 'Water Storage Tanks', 'Fuel Storage Tanks', 'Silos', 'Pressure Vessels', 'Process Tanks', 'IBC Containers', 'Intermediate Bulk Containers'] },
  { name: 'Steel Fabrication & Structures', subcategories: ['Structural Steel Fabrication', 'PEB Structures', 'Pre-Engineered Buildings', 'Industrial Sheds', 'Warehouse Structures', 'Steel Trusses', 'Steel Bridges', 'Transmission Towers', 'Communication Towers', 'Mezzanine Floors', 'Steel Staircases', 'Steel Platforms', 'Pipe Racks', 'Equipment Skids', 'Modular Structures'] },
  { name: 'Road Safety & Infrastructure', subcategories: ['Traffic Signs', 'Road Barriers', 'Crash Barriers', 'Guardrails', 'Speed Breakers', 'Road Studs', 'Reflective Tapes', 'Warning Lights', 'Solar Road Studs', 'Delineators', 'Safety Cones', 'Barricades', 'Bollards', 'Pedestrian Barriers', 'Road Marking Paint', 'Thermoplastic Road Marking', 'Road Construction Materials'] },
  { name: 'GFRP & Composites', subcategories: ['GFRP Sheets', 'GFRP Pipes', 'GFRP Gratings', 'GFRP Profiles', 'GFRP Tanks', 'FRP Rebar', 'Carbon Fiber Products', 'Fiberglass Products', 'Composite Panels', 'SMC/DMC Products'] },
];

const baseUrl = 'https://www.procuresaathi.com';

interface BlogPost {
  slug: string;
  published_at: string | null;
  updated_at: string;
}

async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('blogs')
      .select('slug, published_at, updated_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('[generate-sitemap] Error fetching blogs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[generate-sitemap] Error in fetchBlogPosts:', error);
    return [];
  }
}

// Fetch dynamic signal page slugs from admin_signal_pages table
async function fetchDynamicSignalPages(): Promise<{ slug: string; updated_at: string }[]> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('admin_signal_pages')
      .select('slug, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[generate-sitemap] Error fetching signal pages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[generate-sitemap] Error in fetchDynamicSignalPages:', error);
    return [];
  }
}

// Fetch seo_demand_pages for /demand URLs
async function fetchSeoDemandPages(): Promise<{ slug: string; intent_weight: number | null }[]> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('seo_demand_pages')
      .select('slug, intent_weight')
      .eq('is_active', true);

    if (error) {
      console.error('[generate-sitemap] Error fetching seo_demand_pages:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('[generate-sitemap] Error in fetchSeoDemandPages:', error);
    return [];
  }
}

// Fetch countries for /explore directory pages
async function fetchCountriesForExplore(): Promise<{ iso_code: string; region: string }[]> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('countries_master')
      .select('iso_code, region')
      .eq('is_active', true);

    if (error) {
      console.error('[generate-sitemap] Error fetching countries for explore:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('[generate-sitemap] Error in fetchCountriesForExplore:', error);
    return [];
  }
}

async function generateSitemap(): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const [blogPosts, dynamicSignalPages, seoDemandPages, exploreCountries] = await Promise.all([
    fetchBlogPosts(),
    fetchDynamicSignalPages(),
    fetchSeoDemandPages(),
    fetchCountriesForExplore(),
  ]);
  
  // Build a set of already-included signal slugs to avoid duplicates
  const staticSignalSlugs = new Set(procurementSignalPages.map(s => s.slug));
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

  // Static pages
  for (const page of staticPages) {
    xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  // Blog posts with high priority for SEO
  for (const blog of blogPosts) {
    const lastmod = blog.published_at 
      ? new Date(blog.published_at).toISOString().split('T')[0]
      : today;
    xml += `  <url>
    <loc>${baseUrl}/blogs/${blog.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }

  // International pages with hreflang annotations
  for (const page of internationalPages) {
    xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />
    <xhtml:link rel="alternate" hreflang="${page.hreflang}" href="${baseUrl}${page.url}" />
    <xhtml:link rel="alternate" hreflang="en-in" href="${baseUrl}/" />
  </url>
`;
  }


  // Category landing pages (SEO-optimized URLs)
  for (const category of categories) {
    const categorySlug = nameToSlug(category.name);
    const isHighValue = highValueCategories.includes(category.name);
    const priority = isHighValue ? 0.9 : 0.7;
    
    // Main category page
    xml += `  <url>
    <loc>${baseUrl}/category/${categorySlug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>
`;

    // Subcategory pages
    for (const sub of category.subcategories) {
      const subSlug = nameToSlug(sub);
      xml += `  <url>
    <loc>${baseUrl}/category/${categorySlug}/${subSlug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${isHighValue ? 0.8 : 0.6}</priority>
  </url>
`;
    }
  }

  // Procurement Signal Pages (Phase 1 + Phase 2) with country replication
  // These are high-value demand capture pages with hreflang for international SEO
  for (const signal of procurementSignalPages) {
    // India canonical (no country prefix)
    xml += `  <url>
    <loc>${baseUrl}/procurement/${signal.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${signal.priority}</priority>`;
    
    // Add hreflang for all countries
    for (const country of procurementCountries) {
      const href = country.code === 'india' 
        ? `${baseUrl}/procurement/${signal.slug}`
        : `${baseUrl}/${country.code}/procurement/${signal.slug}`;
      xml += `
    <xhtml:link rel="alternate" hreflang="${country.hreflang}" href="${href}" />`;
    }
    xml += `
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/procurement/${signal.slug}" />
  </url>
`;

    // Country-specific replicated pages (excluding India)
    for (const country of procurementCountries) {
      if (country.code === 'india') continue;
      
      xml += `  <url>
    <loc>${baseUrl}/${country.code}/procurement/${signal.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${signal.isEnterprise ? 0.9 : 0.85}</priority>`;
      
      // Add hreflang for all countries
      for (const hrefCountry of procurementCountries) {
        const href = hrefCountry.code === 'india' 
          ? `${baseUrl}/procurement/${signal.slug}`
          : `${baseUrl}/${hrefCountry.code}/procurement/${signal.slug}`;
        xml += `
    <xhtml:link rel="alternate" hreflang="${hrefCountry.hreflang}" href="${href}" />`;
      }
      xml += `
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/procurement/${signal.slug}" />
  </url>
`;
    }
  }

  // Dynamic signal pages from DB (not already in static list)
  for (const dbPage of dynamicSignalPages) {
    // Skip if slug contains country prefix (e.g. "uae/steel") or is already static
    const cleanSlug = dbPage.slug.includes('/') ? dbPage.slug.split('/').pop()! : dbPage.slug;
    if (staticSignalSlugs.has(cleanSlug) || staticSignalSlugs.has(dbPage.slug)) continue;
    
    const lastmod = dbPage.updated_at ? new Date(dbPage.updated_at).toISOString().split('T')[0] : today;
    xml += `  <url>
    <loc>${baseUrl}/procurement/${cleanSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }

  // Explore directory pages - /explore/:region/:country
  const regionSlugs = new Set<string>();
  for (const c of exploreCountries) {
    const regionSlug = (c.region || 'other').toLowerCase().replace(/\s+/g, '-');
    regionSlugs.add(regionSlug);
    xml += `  <url>
    <loc>${baseUrl}/explore/${regionSlug}/${c.iso_code.toLowerCase()}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  }

  // Priority corridors — 10 strategic corridors at highest priority
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
  const prioritySet = new Set(priorityCorridorSlugs);

  for (const slug of priorityCorridorSlugs) {
    xml += `  <url>
    <loc>${baseUrl}/demand/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;
  }

  // SEO demand pages - /demand/:slug (excluding priority corridors to avoid duplicates)
  for (const page of seoDemandPages) {
    if (prioritySet.has(page.slug)) continue;
    const priority = (page.intent_weight || 50) > 70 ? 0.9 : 0.6;
    xml += `  <url>
    <loc>${baseUrl}/demand/${page.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>
  </url>
`;
  }

  // NOTE: Mass 6,000+ country-category combos removed.
  // Only priority corridors + DB-registered demand pages are indexed.

  xml += '</urlset>';
  return xml;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[generate-sitemap] Generating dynamic sitemap...');
    
    const sitemap = await generateSitemap();
    
    // Count URLs
    const urlCount = (sitemap.match(/<url>/g) || []).length;
    console.log(`[generate-sitemap] Generated sitemap with ${urlCount} URLs`);

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('[generate-sitemap] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});