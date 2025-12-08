import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Static pages
const staticPages = [
  { url: '/', priority: 1.0, changefreq: 'daily' },
  { url: '/categories', priority: 0.9, changefreq: 'weekly' },
  { url: '/browse', priority: 0.8, changefreq: 'daily' },
  { url: '/book-truck', priority: 0.8, changefreq: 'weekly' },
  { url: '/login', priority: 0.5, changefreq: 'monthly' },
  { url: '/signup', priority: 0.6, changefreq: 'monthly' },
];

// International landing pages
const internationalPages = [
  { url: '/source/usa', priority: 0.8, changefreq: 'weekly' },
  { url: '/source/uae', priority: 0.8, changefreq: 'weekly' },
  { url: '/source/uk', priority: 0.8, changefreq: 'weekly' },
  { url: '/source/germany', priority: 0.8, changefreq: 'weekly' },
  { url: '/source/australia', priority: 0.8, changefreq: 'weekly' },
  { url: '/source/africa', priority: 0.8, changefreq: 'weekly' },
];

// All 40+ categories with their subcategories
const categories = [
  { name: 'Agriculture Equipment & Supplies', subcategories: ['Agricultural Machinery', 'Irrigation Equipment', 'Seeds & Plants', 'Fertilizers & Pesticides', 'Farm Tools & Equipment', 'Animal Feed', 'Greenhouse Equipment', 'Harvesting Equipment', 'Storage & Silos', 'Dairy Equipment'] },
  { name: 'Apparel & Clothing', subcategories: ['Men\'s Clothing', 'Women\'s Clothing', 'Children\'s Clothing', 'Sportswear', 'Work Uniforms', 'Traditional Wear', 'Winter Wear', 'Innerwear'] },
  { name: 'Arts, Crafts & Gifts', subcategories: ['Handicrafts', 'Art Supplies', 'Gift Items', 'Home Decor Crafts', 'Festive Decorations', 'Souvenirs', 'Candles & Fragrances'] },
  { name: 'Auto Vehicle & Accessories', subcategories: ['Car Parts', 'Truck Parts', 'Motorcycle Parts', 'Auto Batteries', 'Tires & Wheels', 'Auto Electronics', 'Body Parts', 'Engine Components', 'Lubricants & Oils', 'Interior Accessories'] },
  { name: 'Bags, Luggage & Cases', subcategories: ['Travel Bags', 'Backpacks', 'Handbags', 'Laptop Bags', 'Luggage Sets', 'Briefcases', 'Wallets & Purses', 'Promotional Bags'] },
  { name: 'Beauty & Personal Care', subcategories: ['Skincare Products', 'Hair Care', 'Cosmetics', 'Fragrances', 'Men\'s Grooming', 'Organic Beauty', 'Salon Equipment', 'Personal Hygiene'] },
  { name: 'Building & Construction', subcategories: ['Cement & Concrete', 'Steel & Iron', 'Tiles & Flooring', 'Sanitary Ware', 'Doors & Windows', 'Roofing Materials', 'Paints & Coatings', 'Plumbing Supplies', 'Electrical Fittings', 'Glass & Glazing'] },
  { name: 'Chemicals & Raw Materials', subcategories: ['Industrial Chemicals', 'Lab Chemicals', 'Dyes & Pigments', 'Solvents', 'Adhesives & Sealants', 'Petrochemicals', 'Agrochemicals', 'Specialty Chemicals'] },
  { name: 'Computer Hardware & Software', subcategories: ['Desktop Computers', 'Laptops', 'Computer Components', 'Printers & Scanners', 'Networking Equipment', 'Storage Devices', 'Software Solutions', 'Computer Peripherals'] },
  { name: 'Consumer Electronics', subcategories: ['Mobile Phones', 'Tablets', 'Audio Equipment', 'Cameras', 'Home Appliances', 'Wearable Tech', 'Gaming Consoles', 'Smart Home Devices'] },
  { name: 'Electrical Equipment & Supplies', subcategories: ['Wires & Cables', 'Switches & Sockets', 'Circuit Breakers', 'Transformers', 'Motors & Drives', 'Control Panels', 'Electrical Fittings', 'Power Distribution'] },
  { name: 'Electronic Components', subcategories: ['Semiconductors', 'Capacitors', 'Resistors', 'PCBs', 'Connectors', 'LEDs', 'Sensors', 'Integrated Circuits'] },
  { name: 'Energy & Power', subcategories: ['Solar Equipment', 'Wind Energy', 'Generators', 'Batteries & UPS', 'Power Cables', 'Energy Storage', 'Grid Equipment', 'Energy Meters'] },
  { name: 'Environment & Recycling', subcategories: ['Waste Management', 'Recycling Equipment', 'Water Treatment', 'Air Purification', 'Eco-friendly Products', 'Pollution Control', 'Composting Systems'] },
  { name: 'Food & Beverages', subcategories: ['Grains & Cereals', 'Spices & Herbs', 'Oils & Fats', 'Dairy Products', 'Beverages', 'Processed Foods', 'Frozen Foods', 'Organic Foods', 'Snacks & Confectionery'] },
  { name: 'Furniture & Home Decor', subcategories: ['Living Room Furniture', 'Bedroom Furniture', 'Office Furniture', 'Outdoor Furniture', 'Home Textiles', 'Decorative Items', 'Kitchenware', 'Storage Solutions'] },
  { name: 'Hardware & Tools', subcategories: ['Hand Tools', 'Power Tools', 'Fasteners', 'Locks & Security', 'Garden Tools', 'Measuring Tools', 'Abrasives', 'Tool Storage'] },
  { name: 'Health Care Products', subcategories: ['Medical Supplies', 'Health Supplements', 'First Aid', 'Wellness Products', 'Therapeutic Equipment', 'Diagnostic Devices', 'Rehabilitation Aids'] },
  { name: 'Industrial Supplies', subcategories: ['Industrial Tools', 'Safety Equipment', 'Material Handling', 'Pumps & Valves', 'Bearings & Seals', 'Industrial Hoses', 'Cleaning Supplies', 'Packaging Materials'] },
  { name: 'Jewelry & Watches', subcategories: ['Gold Jewelry', 'Silver Jewelry', 'Fashion Jewelry', 'Gemstones', 'Watches', 'Jewelry Components', 'Wedding Jewelry', 'Men\'s Jewelry'] },
  { name: 'Lights & Lighting', subcategories: ['LED Lights', 'Decorative Lighting', 'Industrial Lighting', 'Street Lights', 'Ceiling Lights', 'Outdoor Lighting', 'Emergency Lighting', 'Smart Lighting'] },
  { name: 'Machinery & Equipment', subcategories: ['CNC Machines', 'Pumps & Motors', 'Compressors', 'Packaging Machines', 'Printing Machines', 'Textile Machinery', 'Food Processing', 'Woodworking Machines'] },
  { name: 'Medical & Healthcare', subcategories: ['Medical Equipment', 'Surgical Instruments', 'Hospital Furniture', 'Lab Equipment', 'Diagnostic Equipment', 'Rehabilitation Equipment', 'Dental Equipment', 'Veterinary Equipment'] },
  { name: 'Metals - Ferrous (Steel, Iron)', subcategories: ['Steel Sheets', 'Steel Bars & Rods', 'Steel Pipes', 'Iron Castings', 'Stainless Steel', 'Alloy Steel', 'Structural Steel', 'Tool Steel', 'TMT Bar', 'HR Plates', 'HR Coil', 'CR Sheet', 'CR Coil'] },
  { name: 'Metals - Non-Ferrous (Copper, Aluminium)', subcategories: ['Copper Products', 'Aluminum Products', 'Brass Products', 'Zinc Products', 'Lead Products', 'Nickel Alloys', 'Titanium Products', 'Bronze Products'] },
  { name: 'Mining & Minerals', subcategories: ['Coal & Coke', 'Iron Ore', 'Limestone', 'Marble & Granite', 'Sand & Gravel', 'Precious Metals', 'Industrial Minerals', 'Mining Equipment'] },
  { name: 'Mother, Kids & Toys', subcategories: ['Baby Products', 'Kids Clothing', 'Toys & Games', 'Educational Toys', 'Baby Furniture', 'Feeding Supplies', 'Maternity Products', 'Outdoor Play'] },
  { name: 'Office & School Supplies', subcategories: ['Stationery', 'Office Equipment', 'Filing & Storage', 'Writing Instruments', 'Art Supplies', 'Presentation Supplies', 'Office Furniture', 'Educational Materials'] },
  { name: 'Packaging & Printing', subcategories: ['Corrugated Boxes', 'Plastic Packaging', 'Labels & Tags', 'Printing Services', 'Packaging Machines', 'Flexible Packaging', 'Glass Packaging', 'Promotional Printing'] },
  { name: 'Paper & Paper Products', subcategories: ['Printing Paper', 'Packaging Paper', 'Tissue Paper', 'Specialty Paper', 'Paper Boards', 'Notebooks & Diaries', 'Paper Bags', 'Recycled Paper'] },
  { name: 'Pharmaceuticals & Drugs', subcategories: ['Generic Medicines', 'API', 'Formulations', 'Herbal Medicines', 'Veterinary Drugs', 'OTC Products', 'Pharmaceutical Packaging', 'Medical Devices'] },
  { name: 'Plastic & Rubber', subcategories: ['Plastic Raw Materials', 'Plastic Products', 'Rubber Products', 'Plastic Machinery', 'Recycled Plastics', 'Industrial Rubber', 'Foam Products', 'Polymer Products'] },
  { name: 'GFRP & Composites', subcategories: ['GFRP Sheets', 'GFRP Pipes', 'GFRP Gratings', 'GFRP Profiles', 'GFRP Tanks', 'FRP Rebar', 'Carbon Fiber Products'] },
  { name: 'Polymers & Resins', subcategories: ['Polyethylene', 'Polypropylene', 'PVC', 'Epoxy Resins', 'Polyester Resins', 'Acrylic Resins', 'Silicone Products'] },
  { name: 'Safety & Security', subcategories: ['CCTV Systems', 'Fire Safety', 'Personal Protective Equipment', 'Access Control', 'Alarm Systems', 'Safety Signs', 'Security Services'] },
  { name: 'Sports & Fitness', subcategories: ['Gym Equipment', 'Sports Goods', 'Outdoor Sports', 'Team Sports', 'Water Sports', 'Fitness Accessories', 'Yoga & Wellness'] },
  { name: 'Telecom & Communication', subcategories: ['Telecom Equipment', 'Networking', 'Cables & Wires', 'Antennas', 'Broadcasting Equipment', 'VoIP Systems', 'Communication Accessories'] },
  { name: 'Textiles & Fabrics', subcategories: ['Cotton Fabrics', 'Silk Fabrics', 'Synthetic Fabrics', 'Home Textiles', 'Technical Textiles', 'Denim', 'Linen', 'Wool'] },
  { name: 'Transportation & Logistics', subcategories: ['Trucks & Trailers', 'Shipping Containers', 'Material Handling', 'Warehouse Equipment', 'Fleet Management', 'Logistics Services'] },
];

const baseUrl = 'https://procuresaathi.com';

function generateSitemap(): string {
  const today = new Date().toISOString().split('T')[0];
  
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

  // International pages with hreflang
  for (const page of internationalPages) {
    xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />
  </url>
`;
  }

  // Category pages
  for (const category of categories) {
    const categoryUrl = `/browse?category=${encodeURIComponent(category.name)}`;
    xml += `  <url>
    <loc>${baseUrl}${categoryUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;

    // Subcategory pages
    for (const sub of category.subcategories) {
      const subUrl = `/browse?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(sub)}`;
      xml += `  <url>
    <loc>${baseUrl}${subUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }
  }

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
    
    const sitemap = generateSitemap();
    
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