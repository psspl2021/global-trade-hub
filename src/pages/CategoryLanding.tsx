import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, CheckCircle, Users, Package, Shield, 
  ArrowRight, Phone, Mail, Star, TrendingUp 
} from 'lucide-react';
import procureSaathiLogo from '@/assets/procuresaathi-logo.jpg';
import { categoriesData } from '@/data/categories';
import { useSEO, injectStructuredData, getBreadcrumbSchema, getProductSchema } from '@/hooks/useSEO';

// Convert slug to category name
const slugToName = (slug: string) => {
  return slug.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Convert category name to URL-friendly slug
export const nameToSlug = (name: string) => {
  return name.toLowerCase()
    .replace(/[&,()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Comprehensive SEO content for all B2B categories
const getCategoryContent = (categoryName: string) => {
  const content: Record<string, { 
    title: string; 
    description: string; 
    keywords: string[];
    benefits: string[];
    faqs: { q: string; a: string }[];
  }> = {
    'Agriculture Equipment & Supplies': {
      title: 'Agriculture Equipment Suppliers India | Farm Machinery, Tractors, Seeds, Fertilizers Export',
      description: 'India\'s largest B2B marketplace for agriculture equipment with 500+ verified suppliers. Source tractors, harvesters, irrigation systems, organic seeds, bio-fertilizers, pesticides & farm tools. APEDA certified, export-ready, bulk pricing for agri-dealers & exporters.',
      keywords: ['agricultural equipment India', 'farm machinery suppliers', 'irrigation equipment dealers', 'tractor parts wholesale', 'seeds suppliers India', 'fertilizers manufacturers', 'agri equipment exporters', 'drip irrigation suppliers', 'sprinkler systems India', 'harvester manufacturers', 'power tiller dealers', 'rotavator suppliers', 'organic seeds wholesale', 'bio fertilizers India', 'pesticides dealers', 'farm implements manufacturers', 'greenhouse equipment', 'cold storage suppliers', 'grain storage silos', 'agricultural pumps', 'crop protection chemicals', 'animal feed suppliers', 'dairy equipment manufacturers', 'poultry equipment India', 'horticulture supplies', 'soil testing equipment'],
      benefits: ['APEDA certified for exports', 'Farm equipment financing available', 'Technical agronomist support', 'Pan-India delivery network', 'Quality seeds ICAR certified', 'Organic & sustainable options', 'Bulk dealer discounts', 'After-sales service network'],
      faqs: [
        { q: 'What agricultural equipment can I source from India?', a: 'We offer tractors (Mahindra, Swaraj, John Deere dealers), harvesters, rotavators, irrigation systems (drip, sprinkler), greenhouse structures, cold storage, seeds, fertilizers, pesticides, and all farm implements.' },
        { q: 'Do you have organic farming supplies?', a: 'Yes, we have NPOP certified suppliers for organic seeds, bio-fertilizers, vermicompost, organic pesticides, and sustainable farming equipment.' },
        { q: 'Is export available for agricultural products?', a: 'Yes, most suppliers are APEDA registered with phytosanitary certification for export to USA, EU, Middle East, and Africa.' },
        { q: 'What irrigation equipment is available?', a: 'We supply drip irrigation systems, sprinkler systems, foggers, agricultural pumps, water tanks, and complete turnkey irrigation solutions.' },
        { q: 'Do you supply for government PMKSY schemes?', a: 'Yes, our suppliers are empaneled for PM Krishi Sinchayee Yojana and other government subsidy schemes with documentation support.' },
      ]
    },
    'Apparel & Clothing': {
      title: 'Apparel & Clothing Manufacturers India | Wholesale Garments, Fashion',
      description: 'Source wholesale garments, fashion apparel, uniforms, and clothing from 500+ verified manufacturers in India. Private label, custom manufacturing, bulk orders.',
      keywords: ['apparel manufacturers India', 'wholesale clothing suppliers', 'garment exporters', 'fashion wholesale', 'uniform manufacturers', 'private label clothing'],
      benefits: ['Private label options', 'Custom manufacturing', 'Export quality', 'Bulk discounts'],
      faqs: [
        { q: 'Do you offer private label manufacturing?', a: 'Yes, many manufacturers offer private label and custom branding services.' },
        { q: 'What is the MOQ for garments?', a: 'MOQ varies from 100-500 pieces depending on the product and manufacturer.' },
      ]
    },
    'Arts, Crafts & Gifts': {
      title: 'Handicrafts & Gifts Suppliers India | Art Supplies, Souvenirs Wholesale',
      description: 'Find verified handicraft manufacturers, gift item suppliers, and art supplies dealers in India. Traditional crafts, corporate gifts, festive decorations at wholesale prices.',
      keywords: ['handicrafts suppliers India', 'gift items wholesale', 'art supplies dealers', 'souvenirs manufacturers', 'corporate gifts India'],
      benefits: ['Handmade quality', 'Customization available', 'Export certified', 'Traditional craftsmanship'],
      faqs: [
        { q: 'Can I get customized corporate gifts?', a: 'Yes, most suppliers offer branding and customization for corporate orders.' },
        { q: 'Are these products export-ready?', a: 'Yes, many handicraft suppliers are export-certified with international quality standards.' },
      ]
    },
    'Auto Vehicle & Accessories': {
      title: 'Auto Parts Suppliers India | Car Parts, Truck Components, OEM Accessories',
      description: 'Source automotive parts, vehicle accessories, and OEM components from 600+ verified suppliers. Car parts, truck components, motorcycle accessories at competitive prices.',
      keywords: ['auto parts suppliers India', 'car accessories wholesale', 'truck parts manufacturers', 'OEM automotive components', 'vehicle spare parts'],
      benefits: ['OEM quality parts', 'Genuine accessories', 'Warranty support', 'Pan-India distribution'],
      faqs: [
        { q: 'Do you have OEM quality auto parts?', a: 'Yes, we have verified OEM and aftermarket parts suppliers with quality certifications.' },
        { q: 'Is bulk pricing available?', a: 'Yes, significant discounts for bulk orders and regular buyers.' },
      ]
    },
    'Bags, Luggage & Cases': {
      title: 'Bags & Luggage Manufacturers India | Travel Bags, Backpacks Wholesale',
      description: 'Connect with bag manufacturers, luggage suppliers, and case makers in India. Travel bags, laptop bags, promotional bags at wholesale prices. Custom manufacturing available.',
      keywords: ['bag manufacturers India', 'luggage suppliers', 'backpack wholesale', 'travel bags manufacturers', 'promotional bags'],
      benefits: ['Custom branding', 'Private label', 'Export quality', 'Bulk discounts'],
      faqs: [
        { q: 'Can I get custom branded bags?', a: 'Yes, most manufacturers offer custom branding, logo printing, and private label options.' },
        { q: 'What materials are available?', a: 'We have suppliers for leather, canvas, nylon, polyester, and eco-friendly materials.' },
      ]
    },
    'Beauty & Personal Care': {
      title: 'Beauty & Cosmetics Suppliers India | Skincare, Haircare, Personal Care Products',
      description: 'Source cosmetics, skincare products, haircare items, and personal care supplies from 400+ verified manufacturers. Private label beauty products, organic cosmetics, salon equipment.',
      keywords: ['cosmetics manufacturers India', 'skincare suppliers', 'beauty products wholesale', 'personal care manufacturers', 'salon equipment dealers'],
      benefits: ['FDA approved products', 'Private label options', 'Organic products', 'GMP certified'],
      faqs: [
        { q: 'Are products FDA/FSSAI approved?', a: 'Yes, all our beauty and cosmetic suppliers comply with regulatory requirements.' },
        { q: 'Is private label cosmetics available?', a: 'Yes, many manufacturers offer complete private label and contract manufacturing services.' },
      ]
    },
    'Building & Construction': {
      title: 'Construction Material Suppliers India | Cement, Steel, Tiles, Sanitary Ware',
      description: 'Source cement, tiles, flooring, sanitary ware, paints, TMT bars, and construction materials from 500+ verified suppliers. Project-based pricing, bulk discounts, site delivery.',
      keywords: ['construction materials India', 'cement suppliers', 'tiles manufacturers', 'sanitary ware dealers', 'building materials wholesale', 'TMT bars suppliers'],
      benefits: ['Project pricing', 'Site delivery', 'Bulk discounts', 'Quality certifications'],
      faqs: [
        { q: 'Do suppliers deliver to construction sites?', a: 'Yes, most suppliers offer direct site delivery for bulk orders.' },
        { q: 'Are project discounts available?', a: 'Yes, significant discounts for project-based bulk orders with flexible payment terms.' },
      ]
    },
    'Chemicals & Raw Materials': {
      title: 'Industrial Chemical Suppliers India | Lab Chemicals, Petrochemicals, Specialty Chemicals',
      description: 'Source industrial chemicals, lab reagents, dyes, solvents, water treatment chemicals, and specialty chemicals from 400+ verified suppliers. MSDS documentation, hazmat shipping.',
      keywords: ['industrial chemicals India', 'chemical suppliers', 'lab chemicals wholesale', 'petrochemicals dealers', 'dyes pigments manufacturers', 'water treatment chemicals'],
      benefits: ['MSDS documentation', 'Hazmat compliant shipping', 'Technical support', 'Sample availability'],
      faqs: [
        { q: 'Do suppliers provide MSDS sheets?', a: 'Yes, all chemical suppliers provide complete MSDS documentation and safety data.' },
        { q: 'Is hazardous material shipping available?', a: 'Yes, we have logistics partners specialized in hazmat transportation across India.' },
      ]
    },
    'Computer Hardware & Software': {
      title: 'Computer Hardware Suppliers India | IT Equipment, Networking, Software Solutions',
      description: 'Find verified IT hardware suppliers, computer component dealers, and software solution providers. Laptops, servers, networking equipment, enterprise software at competitive prices.',
      keywords: ['computer hardware suppliers India', 'IT equipment dealers', 'laptop wholesale', 'networking equipment', 'software solutions India'],
      benefits: ['Authorized dealers', 'Warranty support', 'Technical assistance', 'Enterprise pricing'],
      faqs: [
        { q: 'Are these authorized dealers?', a: 'Yes, we verify all IT hardware suppliers for authorized dealership and genuine products.' },
        { q: 'Is corporate pricing available?', a: 'Yes, special enterprise pricing for bulk IT procurement.' },
      ]
    },
    'Consumer Electronics': {
      title: 'Consumer Electronics Suppliers India | Mobile Phones, Home Appliances, Smart Devices',
      description: 'Source consumer electronics, mobile phones, tablets, home appliances, and smart devices from verified wholesalers. Genuine products, warranty support, bulk pricing.',
      keywords: ['electronics wholesalers India', 'mobile phone suppliers', 'home appliances dealers', 'smart devices wholesale', 'consumer electronics bulk'],
      benefits: ['Genuine products', 'Warranty support', 'Competitive pricing', 'Pan-India delivery'],
      faqs: [
        { q: 'Are these genuine branded products?', a: 'Yes, we only work with authorized distributors and wholesalers of genuine products.' },
        { q: 'Is warranty available?', a: 'Yes, all products come with manufacturer warranty and after-sales support.' },
      ]
    },
    'Electrical Equipment & Supplies': {
      title: 'Electrical Equipment Suppliers India | Wires, Cables, Switches, Transformers',
      description: 'Connect with 500+ verified electrical equipment suppliers. Source wires, cables, switchgear, transformers, motors, and industrial electrical supplies. ISI certified, project pricing.',
      keywords: ['electrical equipment India', 'wire cable suppliers', 'transformer manufacturers', 'switchgear dealers', 'electrical contractors supplies'],
      benefits: ['ISI certified products', 'Project pricing', 'Technical support', 'Bulk discounts'],
      faqs: [
        { q: 'Are products ISI/BIS certified?', a: 'Yes, all electrical products from our suppliers are BIS/ISI certified.' },
        { q: 'Do you supply for industrial projects?', a: 'Yes, we have experience supplying for major industrial and infrastructure projects.' },
      ]
    },
    'Electronic Components': {
      title: 'Electronic Components Suppliers India | Semiconductors, PCBs, LEDs, Sensors',
      description: 'Source electronic components, semiconductors, PCBs, capacitors, resistors, LEDs, and sensors from verified suppliers. OEM quality, competitive pricing, technical support.',
      keywords: ['electronic components India', 'semiconductor suppliers', 'PCB manufacturers', 'LED suppliers', 'electronic parts wholesale'],
      benefits: ['OEM quality', 'Technical specifications', 'Sample availability', 'Competitive pricing'],
      faqs: [
        { q: 'Do you have OEM electronic components?', a: 'Yes, we have suppliers for genuine OEM components with full specifications and datasheets.' },
        { q: 'Can I get samples before bulk order?', a: 'Yes, most suppliers provide samples for testing before bulk orders.' },
      ]
    },
    'Energy & Power': {
      title: 'Energy & Power Equipment Suppliers India | Solar, Generators, Batteries, UPS',
      description: 'Find solar equipment, generators, batteries, UPS systems, and power solutions from verified suppliers. Renewable energy systems, grid equipment, energy storage solutions.',
      keywords: ['solar equipment suppliers India', 'generator dealers', 'UPS manufacturers', 'battery suppliers', 'renewable energy India'],
      benefits: ['MNRE approved products', 'Installation support', 'Warranty coverage', 'Subsidy assistance'],
      faqs: [
        { q: 'Are solar products MNRE approved?', a: 'Yes, we have MNRE approved solar panel and equipment suppliers.' },
        { q: 'Is installation support available?', a: 'Yes, most suppliers provide complete installation and commissioning support.' },
      ]
    },
    'Environment & Recycling': {
      title: 'Environment & Recycling Equipment Suppliers India | Waste Management, Water Treatment',
      description: 'Source waste management equipment, recycling machinery, water treatment systems, and pollution control equipment from verified eco-friendly product suppliers.',
      keywords: ['recycling equipment India', 'waste management suppliers', 'water treatment systems', 'pollution control equipment', 'eco-friendly products'],
      benefits: ['CPCB certified', 'Technical support', 'Turnkey solutions', 'Compliance assistance'],
      faqs: [
        { q: 'Are products CPCB certified?', a: 'Yes, our environmental equipment suppliers are CPCB certified and compliant.' },
        { q: 'Do you offer turnkey solutions?', a: 'Yes, many suppliers offer complete turnkey waste management and water treatment solutions.' },
      ]
    },
    'Food & Beverages': {
      title: 'Food & Beverage Suppliers India | Grains, Spices, Processed Foods, Ingredients',
      description: 'Connect with 600+ verified food suppliers. Source grains, spices, oils, dairy products, processed foods, food additives, and ingredients. FSSAI certified, export quality.',
      keywords: ['food suppliers India', 'spices exporters', 'food ingredients wholesale', 'processed foods manufacturers', 'FSSAI certified suppliers'],
      benefits: ['FSSAI certified', 'Export quality', 'Cold chain logistics', 'Quality testing'],
      faqs: [
        { q: 'Are suppliers FSSAI certified?', a: 'Yes, all food suppliers on our platform are FSSAI licensed and certified.' },
        { q: 'Is export quality available?', a: 'Yes, many suppliers are export-oriented with international quality certifications.' },
      ]
    },
    'Flavors & Fragrances': {
      title: 'Flavors & Fragrances Suppliers India | Natural Flavors, Aroma Chemicals, Essential Oils',
      description: 'Source food flavors, fragrances, aroma chemicals, essential oils, and flavor ingredients from verified manufacturers. Natural and synthetic flavors, FSSAI approved.',
      keywords: ['flavors suppliers India', 'fragrances manufacturers', 'essential oils wholesale', 'aroma chemicals dealers', 'food flavoring agents'],
      benefits: ['FSSAI approved', 'Natural extracts', 'Custom formulations', 'Sample availability'],
      faqs: [
        { q: 'Are flavors FSSAI approved?', a: 'Yes, all food flavors comply with FSSAI regulations and safety standards.' },
        { q: 'Can you create custom flavors?', a: 'Yes, many suppliers offer custom flavor formulation services.' },
      ]
    },
    'Furniture & Home Decor': {
      title: 'Furniture Manufacturers India | Office Furniture, Home Decor, Wooden Furniture',
      description: 'Find verified furniture manufacturers and home decor suppliers. Source office furniture, home furniture, wooden furniture, and decorative items. Custom manufacturing, bulk orders.',
      keywords: ['furniture manufacturers India', 'office furniture suppliers', 'home decor wholesale', 'wooden furniture exporters', 'interior decoration suppliers'],
      benefits: ['Custom designs', 'Export quality', 'Bulk discounts', 'Installation service'],
      faqs: [
        { q: 'Is custom furniture manufacturing available?', a: 'Yes, many manufacturers offer custom design and manufacturing services.' },
        { q: 'Do you have export quality furniture?', a: 'Yes, we have furniture exporters catering to international quality standards.' },
      ]
    },
    'Hardware & Tools': {
      title: 'Hardware & Tools Suppliers India | Hand Tools, Power Tools, Fasteners, Industrial Hardware',
      description: 'Source hand tools, power tools, fasteners, construction tools, and industrial hardware from 400+ verified suppliers. Quality tools, competitive prices, pan-India delivery.',
      keywords: ['hardware suppliers India', 'tools wholesalers', 'fasteners manufacturers', 'power tools dealers', 'industrial hardware suppliers'],
      benefits: ['Quality tools', 'Brand authorized', 'Competitive pricing', 'Technical support'],
      faqs: [
        { q: 'Do you have branded tools?', a: 'Yes, we have authorized dealers for major tool brands along with quality Indian manufacturers.' },
        { q: 'Is bulk pricing available?', a: 'Yes, significant discounts for bulk orders and regular customers.' },
      ]
    },
    'Health Care Products': {
      title: 'Healthcare Products Suppliers India | Medical Supplies, Health Supplements, Wellness',
      description: 'Connect with verified healthcare product suppliers. Source medical supplies, health supplements, first aid products, and wellness items. FDA approved, quality certified.',
      keywords: ['healthcare products India', 'medical supplies wholesale', 'health supplements manufacturers', 'wellness products suppliers'],
      benefits: ['FDA approved', 'Quality certified', 'Competitive pricing', 'Regulatory compliance'],
      faqs: [
        { q: 'Are products FDA/CDSCO approved?', a: 'Yes, all healthcare products comply with regulatory requirements.' },
        { q: 'Is bulk pricing available?', a: 'Yes, special pricing for hospitals, clinics, and healthcare institutions.' },
      ]
    },
    'Industrial Supplies': {
      title: 'Industrial Supplies Dealers India | Safety Equipment, Material Handling, Pumps, Valves',
      description: 'Source industrial supplies including safety equipment, material handling systems, pumps, valves, bearings, and industrial consumables from verified suppliers.',
      keywords: ['industrial supplies India', 'safety equipment dealers', 'pumps valves suppliers', 'material handling equipment', 'industrial consumables'],
      benefits: ['Quality certified', 'Technical support', 'Project pricing', 'Pan-India delivery'],
      faqs: [
        { q: 'Do you supply for industrial projects?', a: 'Yes, we have experience in bulk supply for major industrial and manufacturing projects.' },
        { q: 'Is technical support available?', a: 'Yes, our suppliers provide technical specifications and installation support.' },
      ]
    },
    'Jewelry & Watches': {
      title: 'Jewelry Manufacturers India | Gold Jewelry, Fashion Jewelry, Watches Wholesale',
      description: 'Connect with jewelry manufacturers, gemstone suppliers, and watch dealers. Source gold jewelry, silver jewelry, fashion jewelry, and watches at wholesale prices.',
      keywords: ['jewelry manufacturers India', 'gold jewelry wholesale', 'fashion jewelry suppliers', 'watches dealers', 'gemstone exporters'],
      benefits: ['Hallmarked jewelry', 'Custom designs', 'Export quality', 'Competitive pricing'],
      faqs: [
        { q: 'Is hallmarked jewelry available?', a: 'Yes, all gold jewelry from our suppliers is BIS hallmarked.' },
        { q: 'Can I get custom jewelry designs?', a: 'Yes, many manufacturers offer custom jewelry design and manufacturing.' },
      ]
    },
    'Lights & Lighting': {
      title: 'Lighting Suppliers India | LED Lights, Industrial Lighting, Street Lights, Smart Lighting',
      description: 'Source LED lights, industrial lighting, decorative lights, street lights, and smart lighting solutions from verified manufacturers. Energy efficient, BIS certified.',
      keywords: ['LED lights suppliers India', 'lighting manufacturers', 'industrial lighting dealers', 'street lights suppliers', 'smart lighting solutions'],
      benefits: ['BIS certified', 'Energy efficient', 'Warranty support', 'Project pricing'],
      faqs: [
        { q: 'Are LED products BIS certified?', a: 'Yes, all LED lighting products from our suppliers are BIS certified.' },
        { q: 'Is project pricing available?', a: 'Yes, special pricing for government projects and bulk infrastructure orders.' },
      ]
    },
    'Machinery & Equipment': {
      title: 'Industrial Machinery Suppliers India | CNC Machines, Packaging, Textile, Food Processing',
      description: 'Find CNC machines, packaging equipment, textile machinery, food processing equipment, and industrial machinery from verified manufacturers. Installation, warranty, after-sales service.',
      keywords: ['CNC machine suppliers India', 'packaging machinery', 'textile machinery manufacturers', 'food processing equipment', 'industrial machinery dealers'],
      benefits: ['Installation support', 'Warranty coverage', 'Spare parts availability', 'Technical training'],
      faqs: [
        { q: 'Do suppliers provide installation?', a: 'Yes, most machinery suppliers include installation, commissioning, and training.' },
        { q: 'What warranty is typically offered?', a: 'Standard warranty ranges from 1-3 years depending on equipment type.' },
      ]
    },
    'Medical & Healthcare': {
      title: 'Medical Equipment Suppliers India | Hospital Equipment, Surgical Instruments, Lab Equipment',
      description: 'Source medical equipment, hospital furniture, surgical instruments, lab equipment, and diagnostic devices from verified healthcare equipment suppliers. FDA/CE certified.',
      keywords: ['medical equipment India', 'hospital equipment suppliers', 'surgical instruments manufacturers', 'lab equipment dealers', 'diagnostic equipment'],
      benefits: ['FDA/CE certified', 'Installation support', 'AMC available', 'Regulatory compliance'],
      faqs: [
        { q: 'Are products FDA/CE certified?', a: 'Yes, all medical equipment suppliers provide FDA/CE certified products.' },
        { q: 'Is AMC available?', a: 'Yes, most suppliers offer Annual Maintenance Contracts for medical equipment.' },
      ]
    },
    'Metals - Ferrous (Steel, Iron)': {
      title: 'Steel & Iron Suppliers India | TMT Bars, HR Coils, MS Plates, Structural Steel Exporters',
      description: 'India\'s premier B2B marketplace for ferrous metals with 700+ verified steel manufacturers & iron suppliers. Source TMT bars (Fe500D, Fe550D), HR coils, CR sheets, MS plates, stainless steel, alloy steel, railway tracks & structural steel. BIS/ISI certified, mill direct pricing, export quality.',
      keywords: ['TMT bar suppliers India', 'steel manufacturers', 'HR coil dealers', 'iron suppliers', 'steel pipes wholesale', 'structural steel India', 'stainless steel suppliers', 'MS plate manufacturers', 'CR sheet dealers', 'alloy steel suppliers', 'tool steel India', 'rail steel suppliers', 'steel billets manufacturers', 'steel ingots wholesale', 'galvanized steel dealers', 'steel angles channels', 'I beam suppliers', 'H beam manufacturers', 'steel fabricators', 'steel scrap dealers', 'pig iron suppliers', 'sponge iron manufacturers', 'steel wire rod', 'reinforcement steel', 'boiler quality plates', 'shipbuilding steel', 'weathering steel India', 'high tensile steel', 'SAIL steel dealers', 'TATA steel distributors', 'JSW steel suppliers', 'Jindal steel dealers'],
      benefits: ['Direct mill/factory prices', 'BIS/ISI certified products', 'Pan-India logistics network', 'Credit facility 30-90 days', 'Mill test certificates', 'Customized cutting & processing', 'Export quality with certifications', 'Real-time price updates'],
      faqs: [
        { q: 'What is the minimum order quantity for TMT bars?', a: 'MOQ varies by supplier: 5-10 MT for dealers, 50+ MT for direct mill orders. We also facilitate smaller orders through stockists.' },
        { q: 'Do suppliers provide ISI certification?', a: 'Yes, all ferrous metal suppliers provide BIS/ISI certified products with mill test certificates (MTC) and third-party inspection reports.' },
        { q: 'What steel grades are available?', a: 'We supply TMT (Fe415, Fe500, Fe500D, Fe550D, CRS), HR (IS2062 E250/E350), CR (SPCC, SPCD), stainless (SS304, SS316, SS202), and alloy steels (EN series, SAE grades).' },
        { q: 'Can I get current steel prices?', a: 'Yes, we provide real-time ex-factory and ex-godown prices updated daily for major steel products across India.' },
        { q: 'Do you facilitate steel exports?', a: 'Yes, we have export-oriented steel suppliers with IS, ASTM, EN, JIS certifications catering to Middle East, Africa, Southeast Asia, and global markets.' },
        { q: 'What are the payment terms?', a: 'Most suppliers offer advance payment or LC for new buyers. Credit terms of 30-90 days available for verified regular buyers with established track record.' },
      ]
    },
    'Metals - Non-Ferrous (Copper, Aluminium)': {
      title: 'Non-Ferrous Metals Suppliers India | Copper, Aluminium, Brass, Zinc, Lead Exporters',
      description: 'India\'s trusted B2B platform for non-ferrous metals with 500+ verified suppliers. Source copper cathodes, aluminium ingots/sheets/extrusions, brass rods, zinc ingots, lead products, nickel, tin & precious metals. LME linked pricing, quality certified, export ready.',
      keywords: ['copper suppliers India', 'aluminium dealers', 'brass manufacturers', 'non-ferrous metals wholesale', 'metal ingots suppliers', 'copper cathode dealers', 'copper wire rod', 'copper pipes manufacturers', 'aluminium extrusion suppliers', 'aluminium coil dealers', 'aluminium ingot manufacturers', 'brass rod suppliers', 'brass sheet dealers', 'zinc ingot suppliers', 'lead ingot manufacturers', 'nickel suppliers India', 'tin ingot dealers', 'bronze suppliers', 'phosphor bronze manufacturers', 'gunmetal suppliers', 'metal scrap dealers', 'copper scrap buyers', 'aluminium scrap India', 'Hindalco dealers', 'Nalco suppliers', 'Vedanta aluminium', 'Hindustan Copper', 'die casting alloys', 'aluminium billets'],
      benefits: ['LME linked competitive pricing', 'Quality certified (IS/ASTM/BS)', 'Mill test certificates provided', 'Pan-India delivery network', 'Credit terms for verified buyers', 'Custom sizes & specifications', 'Scrap trading facilitated', 'Real-time market updates'],
      faqs: [
        { q: 'Do you have LME linked pricing?', a: 'Yes, all major non-ferrous metals (copper, aluminium, zinc, lead, nickel) are priced based on LME with Indian market premiums updated daily.' },
        { q: 'What copper products are available?', a: 'We supply copper cathodes, wire rods, pipes, tubes, strips, sheets, busbars, and copper alloys from major producers including HCL, Sterlite, and private manufacturers.' },
        { q: 'Which aluminium grades can I source?', a: 'We offer primary aluminium ingots (EC, P1020), billets, wire rods, sheets (1050, 1100, 3003, 5052), extrusions (6061, 6063), and die casting alloys from Hindalco, Nalco, and Vedanta.' },
        { q: 'Is metal scrap trading available?', a: 'Yes, we facilitate scrap trading for copper (Birch Cliff, Berry, Candy), aluminium (Taint Tabor, Tense, Troma), and brass scrap with verified buyers and sellers.' },
        { q: 'Can I get small quantities?', a: 'Yes, while mill orders require higher MOQ, we have stockists and dealers offering smaller quantities from 100 kg onwards.' },
        { q: 'Do you support non-ferrous metal exports?', a: 'Yes, we have export-oriented suppliers with quality certifications meeting international standards for exports to Middle East, Africa, Europe, and Asian markets.' },
      ]
    },
    'Mining & Minerals': {
      title: 'Mining & Minerals Suppliers India | Coal, Iron Ore, Limestone, Industrial Minerals',
      description: 'Connect with mining companies and mineral suppliers. Source coal, iron ore, limestone, marble, granite, and industrial minerals at competitive prices. Bulk supply, logistics support.',
      keywords: ['mining suppliers India', 'coal dealers', 'iron ore suppliers', 'limestone manufacturers', 'industrial minerals wholesale'],
      benefits: ['Direct from mines', 'Bulk supply', 'Logistics support', 'Quality testing'],
      faqs: [
        { q: 'Can I get direct mine supply?', a: 'Yes, we have partnerships with mining companies for direct supply.' },
        { q: 'Is logistics support available?', a: 'Yes, we provide complete logistics support for mineral transportation.' },
      ]
    },
    'Mother, Kids & Toys': {
      title: 'Baby Products & Toys Suppliers India | Kids Clothing, Educational Toys, Baby Care',
      description: 'Source baby products, kids clothing, toys, educational items, and maternity products from verified manufacturers. Safe, certified, and quality products for children.',
      keywords: ['baby products suppliers India', 'toys manufacturers', 'kids clothing wholesale', 'educational toys dealers', 'maternity products'],
      benefits: ['Safety certified', 'Non-toxic materials', 'Quality tested', 'Bulk discounts'],
      faqs: [
        { q: 'Are toys safety certified?', a: 'Yes, all toy suppliers comply with BIS toy safety standards.' },
        { q: 'Is private labeling available?', a: 'Yes, many manufacturers offer private label baby and toy products.' },
      ]
    },
    'Office & School Supplies': {
      title: 'Office & School Supplies Wholesale India | Stationery, Office Equipment, Educational Materials',
      description: 'Connect with stationery manufacturers, office supply dealers, and educational material suppliers. Bulk pricing for schools, colleges, and corporate offices.',
      keywords: ['stationery suppliers India', 'office supplies wholesale', 'school supplies manufacturers', 'educational materials dealers'],
      benefits: ['Bulk pricing', 'Custom branding', 'Pan-India delivery', 'Corporate discounts'],
      faqs: [
        { q: 'Do you offer corporate discounts?', a: 'Yes, special pricing for corporate offices and educational institutions.' },
        { q: 'Is custom branding available?', a: 'Yes, many suppliers offer custom printed stationery and supplies.' },
      ]
    },
    'Packaging & Printing': {
      title: 'Packaging & Printing Suppliers India | Corrugated Boxes, Labels, Printing Services',
      description: 'Source corrugated boxes, plastic packaging, labels, flexible packaging, and printing services from verified suppliers. Custom packaging, bulk orders, pan-India delivery.',
      keywords: ['packaging suppliers India', 'corrugated box manufacturers', 'printing services wholesale', 'flexible packaging dealers', 'labels manufacturers'],
      benefits: ['Custom designs', 'Bulk pricing', 'Fast turnaround', 'Pan-India delivery'],
      faqs: [
        { q: 'Is custom packaging design available?', a: 'Yes, most suppliers offer custom packaging design and printing services.' },
        { q: 'What is the turnaround time?', a: 'Standard turnaround is 7-14 days for custom packaging orders.' },
      ]
    },
    'Paper & Paper Products': {
      title: 'Paper & Paper Products Suppliers India | Printing Paper, Packaging Paper, Specialty Paper',
      description: 'Connect with paper mills and paper product manufacturers. Source printing paper, packaging paper, tissue paper, notebooks, and specialty paper products.',
      keywords: ['paper suppliers India', 'paper mills dealers', 'packaging paper manufacturers', 'tissue paper suppliers', 'specialty paper wholesale'],
      benefits: ['Mill direct pricing', 'Bulk discounts', 'Variety of grades', 'Pan-India delivery'],
      faqs: [
        { q: 'Can I get mill direct supply?', a: 'Yes, we have direct partnerships with major paper mills across India.' },
        { q: 'Is recycled paper available?', a: 'Yes, we have suppliers for eco-friendly and recycled paper products.' },
      ]
    },
    'Pharmaceuticals & Drugs': {
      title: 'Pharmaceutical Suppliers India | Generic Medicines, APIs, Formulations, Medical Devices',
      description: 'Connect with pharmaceutical manufacturers, API suppliers, and drug formulators. Source generic medicines, pharmaceutical intermediates, and medical devices. WHO-GMP certified.',
      keywords: ['pharmaceutical suppliers India', 'API manufacturers', 'generic medicine dealers', 'drug formulations wholesale', 'pharmaceutical exporters'],
      benefits: ['WHO-GMP certified', 'USFDA approved', 'Export quality', 'Regulatory compliance'],
      faqs: [
        { q: 'Are suppliers WHO-GMP certified?', a: 'Yes, all pharmaceutical suppliers on our platform are WHO-GMP certified.' },
        { q: 'Is export registration available?', a: 'Yes, many manufacturers have FDA, EU, and other international registrations.' },
      ]
    },
    'Plastic & Rubber': {
      title: 'Plastic & Rubber Suppliers India | Plastic Products, Rubber Items, Raw Materials',
      description: 'Source plastic products, rubber items, plastic raw materials, and polymer products from verified manufacturers. Custom molding, bulk supply, competitive pricing.',
      keywords: ['plastic suppliers India', 'rubber manufacturers', 'polymer dealers', 'plastic raw materials wholesale', 'rubber products exporters'],
      benefits: ['Custom molding', 'Quality tested', 'Competitive pricing', 'Bulk supply'],
      faqs: [
        { q: 'Is custom molding available?', a: 'Yes, many manufacturers offer custom plastic and rubber molding services.' },
        { q: 'Do you have recycled plastic suppliers?', a: 'Yes, we have suppliers for recycled and eco-friendly plastic materials.' },
      ]
    },
    'GFRP & Composites': {
      title: 'GFRP & Composites Manufacturers India | FRP Products, GFRP Pipes, Carbon Fiber',
      description: 'Connect with GFRP manufacturers and composite suppliers. Source FRP sheets, pipes, gratings, tanks, and carbon fiber products. Industrial grade, custom fabrication.',
      keywords: ['GFRP manufacturers India', 'FRP suppliers', 'composite materials dealers', 'carbon fiber products', 'fiberglass wholesale'],
      benefits: ['Corrosion resistant', 'Custom fabrication', 'Industrial grade', 'Long lifespan'],
      faqs: [
        { q: 'What are the benefits of GFRP?', a: 'GFRP is corrosion resistant, lightweight, durable, and requires low maintenance.' },
        { q: 'Is custom fabrication available?', a: 'Yes, most GFRP manufacturers offer custom design and fabrication services.' },
      ]
    },
    'Polymers & Resins': {
      title: 'Polymers & Resins Suppliers India | PE, PP, PVC, Epoxy Resins, Engineering Plastics',
      description: 'Source polymers, plastic resins, masterbatches, and engineering plastics from verified suppliers. HDPE, LDPE, PP, PVC, and specialty resins at competitive prices.',
      keywords: ['polymer suppliers India', 'plastic resins dealers', 'HDPE suppliers', 'PVC manufacturers', 'epoxy resin wholesale'],
      benefits: ['Factory prices', 'Quality certified', 'Technical support', 'Bulk discounts'],
      faqs: [
        { q: 'Do you have import substitute polymers?', a: 'Yes, we have Indian manufacturers offering import substitute quality polymers.' },
        { q: 'Is technical support available?', a: 'Yes, suppliers provide technical specifications and application support.' },
      ]
    },
    'Pipes & Tubes': {
      title: 'Pipes & Tubes Suppliers India | Steel Pipes, HDPE Pipes, PVC Pipes, Seamless Tubes',
      description: 'Connect with 500+ verified pipe manufacturers. Source steel pipes, HDPE pipes, PVC pipes, DI pipes, and precision tubes. Project pricing, bulk supply, pan-India delivery.',
      keywords: ['pipe suppliers India', 'steel pipes manufacturers', 'HDPE pipe dealers', 'PVC pipes wholesale', 'seamless tubes exporters'],
      benefits: ['ISI certified', 'Project pricing', 'Technical support', 'Pan-India delivery'],
      faqs: [
        { q: 'Are pipes ISI certified?', a: 'Yes, all pipe suppliers provide ISI/BIS certified products.' },
        { q: 'Is project supply available?', a: 'Yes, we have experience in bulk supply for infrastructure projects.' },
      ]
    },
    'Solar & Renewable Energy': {
      title: 'Solar Equipment Suppliers India | Solar Panels, Inverters, Batteries, Mounting Systems',
      description: 'Source solar panels, inverters, batteries, and complete solar systems from MNRE approved suppliers. Rooftop solar, commercial solar, utility scale projects. Subsidy assistance.',
      keywords: ['solar panel suppliers India', 'solar inverter dealers', 'renewable energy equipment', 'solar battery manufacturers', 'solar mounting systems'],
      benefits: ['MNRE approved', 'Subsidy assistance', 'Installation support', 'Warranty coverage'],
      faqs: [
        { q: 'Are products MNRE approved?', a: 'Yes, all solar equipment suppliers are MNRE empaneled and approved.' },
        { q: 'Is subsidy available?', a: 'Yes, we assist with government subsidy documentation and processing.' },
      ]
    },
    'Petroleum & Bitumen': {
      title: 'Petroleum & Bitumen Suppliers India | Bitumen, Diesel, Lubricants, Industrial Fuels',
      description: 'Connect with petroleum product suppliers and bitumen dealers. Source bitumen grades, diesel, furnace oil, lubricants, and industrial fuels. Bulk supply, competitive pricing.',
      keywords: ['bitumen suppliers India', 'petroleum dealers', 'diesel suppliers', 'lubricants wholesale', 'industrial fuel suppliers'],
      benefits: ['Bulk pricing', 'Quality tested', 'Timely delivery', 'Technical support'],
      faqs: [
        { q: 'What bitumen grades are available?', a: 'We have suppliers for VG10, VG30, VG40, PMB, and emulsion bitumen.' },
        { q: 'Is bulk supply available?', a: 'Yes, bulk supply with tanker delivery across India.' },
      ]
    },
    'Safety & Security': {
      title: 'Safety & Security Equipment Suppliers India | PPE, CCTV, Fire Safety, Access Control',
      description: 'Source safety equipment, security systems, PPE, CCTV cameras, fire safety equipment, and access control systems from verified suppliers. Industrial safety, corporate security.',
      keywords: ['safety equipment India', 'security systems dealers', 'PPE suppliers', 'CCTV manufacturers', 'fire safety equipment wholesale'],
      benefits: ['IS certified', 'Bulk pricing', 'Installation support', 'AMC available'],
      faqs: [
        { q: 'Are products IS certified?', a: 'Yes, all safety equipment meets Indian Standards (IS) certification.' },
        { q: 'Is installation available?', a: 'Yes, suppliers provide complete installation and maintenance support.' },
      ]
    },
    'Sports & Outdoor': {
      title: 'Sports Equipment Suppliers India | Fitness Equipment, Outdoor Gear, Sports Accessories',
      description: 'Connect with sports equipment manufacturers and outdoor gear suppliers. Source fitness equipment, camping gear, sports accessories, and athletic wear at wholesale prices.',
      keywords: ['sports equipment India', 'fitness equipment suppliers', 'outdoor gear manufacturers', 'sports accessories wholesale', 'athletic wear dealers'],
      benefits: ['Quality products', 'Bulk pricing', 'Custom branding', 'Pan-India delivery'],
      faqs: [
        { q: 'Is custom branding available?', a: 'Yes, many manufacturers offer custom branding for sports equipment and accessories.' },
        { q: 'Do you supply to sports institutions?', a: 'Yes, special pricing for schools, colleges, and sports academies.' },
      ]
    },
    'Telecommunication': {
      title: 'Telecom Equipment Suppliers India | Network Infrastructure, Fiber Optics, Communication Devices',
      description: 'Source telecom equipment, network infrastructure, fiber optic cables, antennas, and communication devices from verified suppliers. Enterprise solutions, bulk pricing.',
      keywords: ['telecom equipment India', 'network infrastructure suppliers', 'fiber optic cables dealers', 'antenna manufacturers', 'communication devices wholesale'],
      benefits: ['Enterprise solutions', 'Technical support', 'Warranty coverage', 'Project pricing'],
      faqs: [
        { q: 'Do you have enterprise telecom solutions?', a: 'Yes, we have suppliers for complete enterprise telecom infrastructure.' },
        { q: 'Is technical support available?', a: 'Yes, suppliers provide technical consultation and installation support.' },
      ]
    },
    'Textiles & Leather': {
      title: 'Textiles & Leather Suppliers India | Fabrics, Yarns, Leather Products, Technical Textiles',
      description: 'Connect with textile mills, yarn manufacturers, and leather suppliers. Source fabrics, yarns, home textiles, technical textiles, and leather products. Export quality, bulk orders.',
      keywords: ['textile suppliers India', 'fabric manufacturers', 'yarn dealers', 'leather products wholesale', 'technical textiles exporters'],
      benefits: ['Mill direct prices', 'Export quality', 'Custom weaving', 'Bulk discounts'],
      faqs: [
        { q: 'Is custom fabric weaving available?', a: 'Yes, many mills offer custom weaving and dyeing services.' },
        { q: 'Do you have export quality textiles?', a: 'Yes, we have export-oriented textile manufacturers with international certifications.' },
      ]
    },
    'Toys & Games': {
      title: 'Toys & Games Manufacturers India | Educational Toys, Electronic Toys, Board Games',
      description: 'Source toys, games, educational toys, and play equipment from verified manufacturers. Safe, certified products for retail and export. Private label available.',
      keywords: ['toy manufacturers India', 'games suppliers', 'educational toys dealers', 'electronic toys wholesale', 'board games exporters'],
      benefits: ['BIS certified', 'Non-toxic materials', 'Private label', 'Export quality'],
      faqs: [
        { q: 'Are toys BIS certified?', a: 'Yes, all toys comply with BIS safety standards for children.' },
        { q: 'Is private labeling available?', a: 'Yes, many manufacturers offer complete private label services.' },
      ]
    },
    'Industrial Storage & Tanks': {
      title: 'Industrial Storage Tanks Suppliers India | Storage Tanks, Silos, Conveyors, GFS Tanks',
      description: 'Connect with industrial storage tank manufacturers. Source storage tanks, silos, conveyors, GFS tanks, and material handling systems. Custom fabrication, turnkey projects.',
      keywords: ['storage tanks India', 'silos manufacturers', 'industrial storage suppliers', 'GFS tanks dealers', 'conveyor systems wholesale'],
      benefits: ['Custom fabrication', 'Turnkey solutions', 'Quality certified', 'Installation support'],
      faqs: [
        { q: 'Is custom fabrication available?', a: 'Yes, all suppliers offer custom design and fabrication for storage systems.' },
        { q: 'Do you provide turnkey solutions?', a: 'Yes, complete turnkey storage and material handling solutions available.' },
      ]
    },
    'Steel Fabrication & Structures': {
      title: 'Steel Fabrication & Structures Suppliers India | MS Structures, Steel Ducting, Platforms',
      description: 'Source fabricated steel structures, MS structures, steel ducting, platforms, and industrial structures from verified fabricators. Custom fabrication, project supply.',
      keywords: ['steel fabrication India', 'MS structures manufacturers', 'steel ducting suppliers', 'structural steel fabricators', 'industrial platforms dealers'],
      benefits: ['Custom fabrication', 'Project pricing', 'Quality welding', 'Installation support'],
      faqs: [
        { q: 'Is custom steel fabrication available?', a: 'Yes, all fabricators offer custom design and manufacturing services.' },
        { q: 'Do you supply for EPC projects?', a: 'Yes, we have experience in bulk fabrication supply for major EPC projects.' },
      ]
    },
    'Logistics & Transportation': {
      title: 'Logistics & Transportation Services India | Freight Forwarding, Warehousing, Cold Chain',
      description: 'Connect with logistics providers, freight forwarders, and warehousing services. Road transport, sea freight, air cargo, cold chain, and supply chain solutions.',
      keywords: ['logistics providers India', 'freight forwarding services', 'warehousing suppliers', 'cold chain logistics', 'transportation services'],
      benefits: ['Pan-India network', 'Real-time tracking', 'Competitive rates', 'Insurance coverage'],
      faqs: [
        { q: 'Do you have pan-India coverage?', a: 'Yes, our logistics partners provide coverage across India and international shipping.' },
        { q: 'Is cold chain available?', a: 'Yes, we have specialized cold chain logistics for temperature-sensitive cargo.' },
      ]
    },
    'Steel & Metal Products': {
      title: 'Steel & Metal Products Suppliers India | TMT Bars, MS Angles, Plates, Wire Products',
      description: 'Source steel and metal products including TMT bars, MS angles, channels, beams, plates, sheets, and wire products from verified suppliers. BIS certified, project pricing.',
      keywords: ['steel products India', 'TMT bars suppliers', 'MS angles dealers', 'steel plates manufacturers', 'wire products wholesale'],
      benefits: ['BIS certified', 'Factory prices', 'Project pricing', 'Pan-India delivery'],
      faqs: [
        { q: 'Are products BIS certified?', a: 'Yes, all steel products are BIS/ISI certified from verified manufacturers.' },
        { q: 'Is project pricing available?', a: 'Yes, special pricing for construction and infrastructure projects.' },
      ]
    },
    'Road Safety & Infrastructure': {
      title: 'Road Safety & Infrastructure Suppliers India | Crash Barriers, Signs, Road Marking',
      description: 'Connect with road safety equipment suppliers. Source crash barriers, guardrails, traffic signs, road studs, marking materials, and highway infrastructure products.',
      keywords: ['crash barriers India', 'road safety equipment suppliers', 'guardrails manufacturers', 'traffic signs dealers', 'road marking products'],
      benefits: ['MORTH approved', 'IRC compliant', 'Bulk pricing', 'Installation support'],
      faqs: [
        { q: 'Are products MORTH approved?', a: 'Yes, all road safety products comply with MORTH and IRC specifications.' },
        { q: 'Is installation available?', a: 'Yes, suppliers provide complete installation for highway projects.' },
      ]
    },
  };

  const defaultContent = {
    title: `${categoryName} Suppliers & Manufacturers India | ProcureSaathi B2B`,
    description: `Find verified ${categoryName.toLowerCase()} suppliers and manufacturers in India. Get competitive quotes, bulk pricing, and quality products from trusted B2B vendors. Export-import platform.`,
    keywords: [`${categoryName.toLowerCase()} suppliers India`, `${categoryName.toLowerCase()} manufacturers`, `wholesale ${categoryName.toLowerCase()}`, `${categoryName.toLowerCase()} exporters`, `B2B ${categoryName.toLowerCase()}`],
    benefits: ['Verified suppliers', 'Competitive pricing', 'Quality assured', 'Pan-India delivery', 'Export support'],
    faqs: [
      { q: `How to find ${categoryName.toLowerCase()} suppliers?`, a: 'Simply post your requirement on ProcureSaathi and receive competitive bids from verified suppliers within 24-48 hours.' },
      { q: 'Is there a minimum order quantity?', a: 'MOQ varies by supplier. Many accept smaller orders for first-time buyers to build trust.' },
      { q: 'Do you support export/import?', a: 'Yes, ProcureSaathi connects you with export-certified suppliers and facilitates international trade.' },
    ]
  };

  return content[categoryName] || defaultContent;
};

const CategoryLanding = () => {
  const { categorySlug, subcategorySlug } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<typeof categoriesData[0] | null>(null);

  useEffect(() => {
    if (categorySlug) {
      const found = categoriesData.find(c => nameToSlug(c.name) === categorySlug);
      setCategory(found || null);
    }
  }, [categorySlug]);

  const categoryName = category?.name || slugToName(categorySlug || '');
  const subcategoryName = subcategorySlug ? slugToName(subcategorySlug) : null;
  const content = getCategoryContent(categoryName);
  
  const pageTitle = subcategoryName 
    ? `${subcategoryName} Suppliers India | ${categoryName} | ProcureSaathi`
    : content.title;
  
  const pageDescription = subcategoryName
    ? `Find verified ${subcategoryName.toLowerCase()} suppliers and manufacturers in India. Get best prices, bulk orders, quality products. Part of ${categoryName}.`
    : content.description;

  useSEO({
    title: pageTitle,
    description: pageDescription,
    canonical: `https://procuresaathi.com/category/${categorySlug}${subcategorySlug ? `/${subcategorySlug}` : ''}`,
    keywords: content.keywords.join(', ')
  });

  // Inject structured data
  useEffect(() => {
    const faqSchemaId = `category-faq-schema-${categorySlug}${subcategorySlug ? `-${subcategorySlug}` : ''}`;
    
    // Cleanup any existing schemas first
    const existingFaqScript = document.getElementById(faqSchemaId);
    if (existingFaqScript) existingFaqScript.remove();
    
    // Breadcrumb schema
    const breadcrumbs = [
      { name: "Home", url: "https://procuresaathi.com/" },
      { name: "Categories", url: "https://procuresaathi.com/categories" },
      { name: categoryName, url: `https://procuresaathi.com/category/${categorySlug}` },
    ];
    if (subcategoryName) {
      breadcrumbs.push({ 
        name: subcategoryName, 
        url: `https://procuresaathi.com/category/${categorySlug}/${subcategorySlug}` 
      });
    }
    injectStructuredData(getBreadcrumbSchema(breadcrumbs), 'breadcrumb-schema');

    // Product schema
    injectStructuredData(getProductSchema({
      name: subcategoryName || categoryName,
      description: pageDescription,
      category: categoryName,
    }), 'product-schema');

    // FAQ schema with unique ID per category
    if (content.faqs.length > 0) {
      injectStructuredData({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": content.faqs.map(faq => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a
          }
        }))
      }, faqSchemaId);
    }
    
    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById(faqSchemaId);
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [categorySlug, subcategorySlug, categoryName, subcategoryName, content.faqs, pageDescription]);

  if (!category && categorySlug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <Button onClick={() => navigate('/categories')}>Browse Categories</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi - B2B Marketplace" 
              className="h-16 w-auto object-contain"
              width={64}
              height={64}
            />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" onClick={() => navigate('/categories')}>Categories</Button>
            <Button variant="ghost" onClick={() => navigate('/book-truck')}>Logistics</Button>
            <Button variant="ghost" onClick={() => navigate('/blogs')}>Blog</Button>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
            <Button onClick={() => navigate('/signup')}>Get Started Free</Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav className="bg-muted/50 py-3 border-b" aria-label="Breadcrumb">
        <div className="container mx-auto px-4">
          <ol className="flex items-center gap-2 text-sm flex-wrap" itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <a href="/" className="text-muted-foreground hover:text-primary" itemProp="item">
                <span itemProp="name">Home</span>
              </a>
              <meta itemProp="position" content="1" />
            </li>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <a href="/categories" className="text-muted-foreground hover:text-primary" itemProp="item">
                <span itemProp="name">Categories</span>
              </a>
              <meta itemProp="position" content="2" />
            </li>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              {subcategoryName ? (
                <a href={`/category/${categorySlug}`} className="text-muted-foreground hover:text-primary" itemProp="item">
                  <span itemProp="name">{categoryName}</span>
                </a>
              ) : (
                <span className="font-medium" itemProp="name">{categoryName}</span>
              )}
              <meta itemProp="position" content="3" />
            </li>
            {subcategoryName && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <span className="font-medium" itemProp="name">{subcategoryName}</span>
                  <meta itemProp="position" content="4" />
                </li>
              </>
            )}
          </ol>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/95 to-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge className="bg-white/20 text-white mb-4">Verified Suppliers</Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {subcategoryName || categoryName} Suppliers & Manufacturers in India
            </h1>
            <p className="text-lg text-primary-foreground/90 mb-6">
              {pageDescription}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/signup?role=buyer')}
              >
                Post Your Requirement <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white/10"
                onClick={() => navigate('/signup?role=supplier')}
              >
                Register as Supplier
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-card border-b py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Verified Suppliers</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">10,000+</div>
              <div className="text-sm text-muted-foreground">Products Listed</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">₹100 Cr+</div>
              <div className="text-sm text-muted-foreground">Trade Value</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">4.8/5</div>
              <div className="text-sm text-muted-foreground">Buyer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Subcategories Grid */}
      {category && !subcategorySlug && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Browse {categoryName} Subcategories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {category.subcategories.map((sub) => (
                <Card 
                  key={sub} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/category/${categorySlug}/${nameToSlug(sub)}`)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="font-medium">{sub}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            Why Source {subcategoryName || categoryName} from ProcureSaathi?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {content.benefits.map((benefit, idx) => (
              <Card key={idx}>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold">{benefit}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            How to Source {subcategoryName || categoryName}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2">Post Your Requirement</h3>
              <p className="text-sm text-muted-foreground">
                Describe what you need with quantity, specifications, and delivery location
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold mb-2">Receive Competitive Bids</h3>
              <p className="text-sm text-muted-foreground">
                Get quotes from multiple verified suppliers within 24-48 hours
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold mb-2">Compare & Order</h3>
              <p className="text-sm text-muted-foreground">
                Compare prices, choose the best offer, and complete your purchase securely
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {content.faqs.map((faq, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Find {subcategoryName || categoryName} Suppliers?
          </h2>
          <p className="text-primary-foreground/90 mb-8 max-w-xl mx-auto">
            Join 5,000+ businesses sourcing from verified Indian suppliers. Free to post requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => navigate('/signup')}>
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-transparent border-white text-white hover:bg-white/10"
              onClick={() => navigate(`/browse?category=${encodeURIComponent(categoryName)}`)}
            >
              View Suppliers
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-8 bg-card border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-center items-center gap-6">
            <a href="tel:+918368127357" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
              <Phone className="h-5 w-5" />
              +91 8368127357
            </a>
            <a href="mailto:sales@procuresaathi.com" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
              <Mail className="h-5 w-5" />
              sales@procuresaathi.com
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={procureSaathiLogo} alt="ProcureSaathi" className="h-12 w-auto object-contain" />
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ProcureSaathi. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/categories')}>Categories</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/blogs')}>Blog</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/signup')}>Sign Up</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CategoryLanding;
