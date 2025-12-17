import { 
  Tractor, Car, Cpu, FlaskConical, Building, Shirt, Palette, 
  Briefcase, Gem, Lightbulb, Cog, Stethoscope, Factory, Smartphone,
  Baby, BookOpen, Package, FileText, Pill, Layers, Shield, 
  GraduationCap, Dumbbell, Radio, Scissors, Gamepad2, Utensils,
  Home, Heart, Leaf, Pickaxe, Truck, LucideIcon
} from 'lucide-react';

export interface CategoryData {
  name: string;
  icon: LucideIcon;
  subcategories: string[];
}

export const categoriesData: CategoryData[] = [
  {
    name: 'Agriculture Equipment & Supplies',
    icon: Tractor,
    subcategories: [
      'Agricultural Machinery',
      'Irrigation Equipment',
      'Seeds & Plants',
      'Fertilizers & Pesticides',
      'Farm Tools & Equipment',
      'Animal Feed',
      'Greenhouse Equipment',
      'Harvesting Equipment',
      'Storage & Silos',
      'Dairy Equipment',
      // Tata Agrico Agricultural Tools
      'Agricultural Spades',
      'Garden Spades',
      'Trenching Spades',
      'Agricultural Shovels',
      'Scoop Shovels',
      'Agricultural Forks',
      'Digging Forks',
      'Manure Forks',
      'Agricultural Hoes',
      'Garden Hoes',
      'Weeding Hoes',
      'Agricultural Rakes',
      'Crowbars',
      'Pickaxes',
      'Mattocks',
      'Cane Knives',
      'Sugarcane Tools',
      'Plantation Tools',
    ]
  },
  {
    name: 'Apparel & Clothing',
    icon: Shirt,
    subcategories: [
      'Men\'s Clothing',
      'Women\'s Clothing',
      'Children\'s Clothing',
      'Sportswear',
      'Work Uniforms',
      'Traditional Wear',
      'Winter Wear',
      'Innerwear',
    ]
  },
  {
    name: 'Arts, Crafts & Gifts',
    icon: Palette,
    subcategories: [
      'Handicrafts',
      'Art Supplies',
      'Gift Items',
      'Home Decor Crafts',
      'Festive Decorations',
      'Souvenirs',
      'Candles & Fragrances',
    ]
  },
  {
    name: 'Auto Vehicle & Accessories',
    icon: Car,
    subcategories: [
      'Car Parts',
      'Truck Parts',
      'Motorcycle Parts',
      'Auto Batteries',
      'Tires & Wheels',
      'Auto Electronics',
      'Body Parts',
      'Engine Components',
      'Lubricants & Oils',
      'Interior Accessories',
    ]
  },
  {
    name: 'Bags, Luggage & Cases',
    icon: Briefcase,
    subcategories: [
      'Travel Bags',
      'Backpacks',
      'Handbags',
      'Laptop Bags',
      'Luggage Sets',
      'Briefcases',
      'Wallets & Purses',
      'Promotional Bags',
    ]
  },
  {
    name: 'Beauty & Personal Care',
    icon: Heart,
    subcategories: [
      'Skincare Products',
      'Hair Care',
      'Cosmetics',
      'Fragrances',
      'Men\'s Grooming',
      'Organic Beauty',
      'Salon Equipment',
      'Personal Hygiene',
    ]
  },
  {
    name: 'Building & Construction',
    icon: Building,
    subcategories: [
      'Cement & Concrete',
      'Steel & Iron',
      'Tiles & Flooring',
      'Sanitary Ware',
      'Doors & Windows',
      'Roofing Materials',
      'Paints & Coatings',
      'Plumbing Supplies',
      'Electrical Fittings',
      'Glass & Glazing',
      // Tata Steel Construction Products
      'TMT Rebars',
      'Tata Tiscon TMT Bars',
      'Fe-500D TMT Bars',
      'Earthquake Resistant Rebars',
      'Corrosion Resistant Rebars',
      // Tata Shaktee Roofing
      'GC Roofing Sheets',
      'GP Roofing Sheets',
      'Color Coated Roofing Sheets',
      'Metal Roofing',
      'Galvanized Roofing',
      'Pre-Painted Roofing Sheets',
      // Tata Structura
      'Structural Steel Sections',
      'Steel Hollow Sections',
      'Steel Angles',
      'Steel Channels',
      'Steel Beams',
      'Steel Columns',
      // Wire Products
      'Tata Wiron Products',
      'Binding Wire',
      'GI Wire',
      'Barbed Wire',
      'Chain Link Fence',
      'Welded Wire Mesh',
    ]
  },
  {
    name: 'Chemicals & Raw Materials',
    icon: FlaskConical,
    subcategories: [
      'Industrial Chemicals',
      'Lab Chemicals',
      'Dyes & Pigments',
      'Solvents',
      'Adhesives & Sealants',
      'Petrochemicals',
      'Agrochemicals',
      'Specialty Chemicals',
    ]
  },
  {
    name: 'Computer Hardware & Software',
    icon: Cpu,
    subcategories: [
      'Desktop Computers',
      'Laptops',
      'Computer Components',
      'Printers & Scanners',
      'Networking Equipment',
      'Storage Devices',
      'Software Solutions',
      'Computer Peripherals',
    ]
  },
  {
    name: 'Consumer Electronics',
    icon: Smartphone,
    subcategories: [
      'Mobile Phones',
      'Tablets',
      'Audio Equipment',
      'Cameras',
      'Home Appliances',
      'Wearable Tech',
      'Gaming Consoles',
      'Smart Home Devices',
    ]
  },
  {
    name: 'Electrical Equipment & Supplies',
    icon: Lightbulb,
    subcategories: [
      'Wires & Cables',
      'Switches & Sockets',
      'Circuit Breakers',
      'Transformers',
      'Motors & Drives',
      'Control Panels',
      'Electrical Fittings',
      'Power Distribution',
    ]
  },
  {
    name: 'Electronic Components',
    icon: Cpu,
    subcategories: [
      'Semiconductors',
      'Capacitors',
      'Resistors',
      'PCBs',
      'Connectors',
      'LEDs',
      'Sensors',
      'Integrated Circuits',
    ]
  },
  {
    name: 'Energy & Power',
    icon: Lightbulb,
    subcategories: [
      'Solar Equipment',
      'Wind Energy',
      'Generators',
      'Batteries & UPS',
      'Power Cables',
      'Energy Storage',
      'Grid Equipment',
      'Energy Meters',
    ]
  },
  {
    name: 'Environment & Recycling',
    icon: Leaf,
    subcategories: [
      'Waste Management',
      'Recycling Equipment',
      'Water Treatment',
      'Air Purification',
      'Eco-friendly Products',
      'Pollution Control',
      'Composting Systems',
    ]
  },
  {
    name: 'Food & Beverages',
    icon: Utensils,
    subcategories: [
      'Grains & Cereals',
      'Spices & Herbs',
      'Oils & Fats',
      'Dairy Products',
      'Beverages',
      'Processed Foods',
      'Frozen Foods',
      'Organic Foods',
      'Snacks & Confectionery',
    ]
  },
  {
    name: 'Furniture & Home Decor',
    icon: Home,
    subcategories: [
      'Living Room Furniture',
      'Bedroom Furniture',
      'Office Furniture',
      'Outdoor Furniture',
      'Home Textiles',
      'Decorative Items',
      'Kitchenware',
      'Storage Solutions',
    ]
  },
  {
    name: 'Hardware & Tools',
    icon: Cog,
    subcategories: [
      'Hand Tools',
      'Power Tools',
      'Fasteners',
      'Locks & Security',
      'Garden Tools',
      'Measuring Tools',
      'Abrasives',
      'Tool Storage',
      // Tata Agrico Hand Tools
      'Spades & Shovels',
      'D-Handle Spades',
      'Square Mouth Shovels',
      'Round Mouth Shovels',
      'Post Hole Diggers',
      'Crowbars & Pinch Bars',
      'Pickaxes & Mattocks',
      'Hammers',
      'Axes & Hatchets',
      'Chisels',
      'Files & Rasps',
      'Pliers & Cutters',
      'Wrenches & Spanners',
      'Screwdrivers',
      // Tata Agrico Construction Tools
      'Masonry Tools',
      'Plastering Trowels',
      'Brick Trowels',
      'Pointing Trowels',
      'Floats',
      'Mason Hammers',
      'Tile Cutters',
      'Concrete Tools',
      'Leveling Tools',
      // Industrial Hardware
      'Bolts & Nuts',
      'Washers',
      'Screws',
      'Anchors',
      'Rivets',
      'Nails & Pins',
      'Hooks & Hangers',
      'Hinges',
      'Hasps & Staples',
      'Wire Rope & Chains',
    ]
  },
  {
    name: 'Health Care Products',
    icon: Heart,
    subcategories: [
      'Medical Supplies',
      'Health Supplements',
      'First Aid',
      'Wellness Products',
      'Therapeutic Equipment',
      'Diagnostic Devices',
      'Rehabilitation Aids',
    ]
  },
  {
    name: 'Industrial Supplies',
    icon: Factory,
    subcategories: [
      'Industrial Tools',
      'Safety Equipment',
      'Material Handling',
      'Pumps & Valves',
      'Bearings & Seals',
      'Industrial Hoses',
      'Cleaning Supplies',
      'Packaging Materials',
    ]
  },
  {
    name: 'Jewelry & Watches',
    icon: Gem,
    subcategories: [
      'Gold Jewelry',
      'Silver Jewelry',
      'Fashion Jewelry',
      'Gemstones',
      'Watches',
      'Jewelry Components',
      'Wedding Jewelry',
      'Men\'s Jewelry',
    ]
  },
  {
    name: 'Lights & Lighting',
    icon: Lightbulb,
    subcategories: [
      'LED Lights',
      'Decorative Lighting',
      'Industrial Lighting',
      'Street Lights',
      'Ceiling Lights',
      'Outdoor Lighting',
      'Emergency Lighting',
      'Smart Lighting',
    ]
  },
  {
    name: 'Machinery & Equipment',
    icon: Cog,
    subcategories: [
      'CNC Machines',
      'Pumps & Motors',
      'Compressors',
      'Packaging Machines',
      'Printing Machines',
      'Textile Machinery',
      'Food Processing',
      'Woodworking Machines',
    ]
  },
  {
    name: 'Medical & Healthcare',
    icon: Stethoscope,
    subcategories: [
      'Medical Equipment',
      'Surgical Instruments',
      'Hospital Furniture',
      'Lab Equipment',
      'Diagnostic Equipment',
      'Rehabilitation Equipment',
      'Dental Equipment',
      'Veterinary Equipment',
    ]
  },
  {
    name: 'Metals - Ferrous (Steel, Iron)',
    icon: Layers,
    subcategories: [
      // Pig Iron
      'Pig Iron',
      'Basic Pig Iron',
      'Foundry Grade Pig Iron',
      
      // Cold Rolled Products
      'CR Sheet',
      'CR Coil',
      'Cold Rolled GP Sheets',
      'Cold Rolled Annealed Coils',
      'Full Hard Cold Rolled Coils',
      
      // Hot Rolled Products
      'HR Coil',
      'HR Sheet',
      'HR Plates',
      'Hot Rolled Pickled & Oiled (HRPO)',
      'Chequered Plates',
      
      // Galvanised Products
      'Galvanised Plain (GP) Sheets',
      'Galvanised Corrugated (GC) Sheets',
      'Galvanised Coils',
      'Color Coated Sheets',
      
      // Pipes
      'Steel Pipes',
      'ERW Pipes',
      'Spiral Welded Pipes',
      'Seamless Pipes',
      'API Grade Pipes',
      
      // Semis
      'Billets',
      'Blooms',
      'Slabs',
      'Ingots',
      
      // Structurals
      'Structural Steel',
      'Angles',
      'Channels',
      'Beams (ISMB/ISJB/ISLB)',
      'Joists',
      'H-Beams',
      'I-Beams',
      
      // TMT Bars
      'TMT Bar',
      'TMT Bars Fe-500',
      'TMT Bars Fe-500D',
      'TMT Bars Fe-550',
      'TMT Bars Fe-550D',
      'TMT Bars Fe-600',
      'SeQR TMT Bars',
      'Earthquake Resistant TMT',
      
      // Wire Rods
      'Wire Rods',
      'High Carbon Wire Rods',
      'Low Carbon Wire Rods',
      'Electrode Quality Wire Rods',
      'Cold Heading Quality Wire Rods',
      
      // Plates
      'PM Plates',
      'Boiler Quality Plates',
      'Shipbuilding Plates',
      'Structural Plates',
      'Pressure Vessel Plates',
      'High Tensile Plates',
      'Wear Resistant Plates',
      
      // Railway Products
      'Rails',
      'Crane Rails',
      'Fish Plates',
      'Railway Track Components',
      '60 Kg Rails',
      '52 Kg Rails',
      'Head Hardened Rails',
      
      // Wheels and Axles
      'Railway Wheels',
      'Railway Axles',
      'Wheel Sets',
      'Forged Wheels',
      
      // Stainless Steel Products
      'Stainless Steel Sheets',
      'Stainless Steel Coils',
      'Stainless Steel Plates',
      'Stainless Steel Bars',
      'Austenitic Stainless Steel',
      'Ferritic Stainless Steel',
      'Duplex Stainless Steel',
      
      // Electrical Steels
      'Electrical Steel Sheets',
      'CRGO (Cold Rolled Grain Oriented)',
      'CRNGO (Cold Rolled Non-Grain Oriented)',
      'Silicon Steel',
      'Transformer Grade Steel',
      'Motor Grade Steel',
      
      // General Categories
      'Steel Sheets',
      'Steel Bars & Rods',
      'Iron Castings',
      'Alloy Steel',
      'Tool Steel',
      'Scrap',
      'Iron Ore',
    ]
  },
  {
    name: 'Metals - Non-Ferrous (Copper, Aluminium)',
    icon: Layers,
    subcategories: [
      'Copper Products',
      'Aluminum Products',
      'Brass Products',
      'Zinc Products',
      'Lead Products',
      'Nickel Alloys',
      'Titanium Products',
      'Bronze Products',
    ]
  },
  {
    name: 'Mining & Minerals',
    icon: Pickaxe,
    subcategories: [
      'Coal & Coke',
      'Iron Ore',
      'Limestone',
      'Marble & Granite',
      'Sand & Gravel',
      'Precious Metals',
      'Industrial Minerals',
      'Mining Equipment',
    ]
  },
  {
    name: 'Mother, Kids & Toys',
    icon: Baby,
    subcategories: [
      'Baby Products',
      'Kids Clothing',
      'Toys & Games',
      'Educational Toys',
      'Baby Furniture',
      'Feeding Supplies',
      'Maternity Products',
      'Outdoor Play',
    ]
  },
  {
    name: 'Office & School Supplies',
    icon: BookOpen,
    subcategories: [
      'Stationery',
      'Office Equipment',
      'Filing & Storage',
      'Writing Instruments',
      'Art Supplies',
      'Presentation Supplies',
      'Office Furniture',
      'Educational Materials',
    ]
  },
  {
    name: 'Packaging & Printing',
    icon: Package,
    subcategories: [
      'Corrugated Boxes',
      'Plastic Packaging',
      'Labels & Tags',
      'Printing Services',
      'Packaging Machines',
      'Flexible Packaging',
      'Glass Packaging',
      'Promotional Printing',
    ]
  },
  {
    name: 'Paper & Paper Products',
    icon: FileText,
    subcategories: [
      'Printing Paper',
      'Packaging Paper',
      'Tissue Paper',
      'Specialty Paper',
      'Paper Boards',
      'Notebooks & Diaries',
      'Paper Bags',
      'Recycled Paper',
    ]
  },
  {
    name: 'Pharmaceuticals & Drugs',
    icon: Pill,
    subcategories: [
      'Generic Medicines',
      'API (Active Pharmaceutical Ingredients)',
      'Formulations',
      'Herbal Medicines',
      'Veterinary Drugs',
      'OTC Products',
      'Pharmaceutical Packaging',
      'Medical Devices',
    ]
  },
  {
    name: 'Plastic & Rubber',
    icon: Layers,
    subcategories: [
      'Plastic Raw Materials',
      'Plastic Products',
      'Rubber Products',
      'Plastic Machinery',
      'Recycled Plastics',
      'Industrial Rubber',
      'Foam Products',
      'Polymer Products',
    ]
  },
  {
    name: 'GFRP & Composites',
    icon: Layers,
    subcategories: [
      'GFRP Sheets',
      'GFRP Pipes',
      'GFRP Gratings',
      'GFRP Profiles',
      'GFRP Tanks',
      'FRP Rebar',
      'GFRP Panels',
      'Composite Raw Materials',
      'GFRP Structural Components',
      'Carbon Fiber Products',
      'GFRP Manhole Covers',
      'GFRP Cable Trays',
      'GFRP Ladders',
    ]
  },
  {
    name: 'Polymers & Resins',
    icon: Layers,
    subcategories: [
      'Polyethylene (PE)',
      'Polypropylene (PP)',
      'PVC Resins',
      'ABS Resins',
      'Polyester Resins',
      'Epoxy Resins',
      'Polyurethane',
      'Nylon & Polyamide',
      'Polycarbonate',
      'Engineering Plastics',
    ]
  },
  {
    name: 'Pipes & Tubes',
    icon: Cog,
    subcategories: [
      'LSAW Pipes',
      'HSAW Pipes',
      'Poles',
      'DI Pipes',
      'HDPE Pipes',
      'PVC Pipes',
      'GI Pipes',
      'MS Pipes',
      'Seamless Pipes',
      'ERW Pipes',
      'Copper Tubes',
      'Stainless Steel Pipes',
      // Tata Pipes Products
      'Structural Steel Tubes',
      'Hollow Sections',
      'Square Hollow Sections (SHS)',
      'Rectangular Hollow Sections (RHS)',
      'Circular Hollow Sections (CHS)',
      'Precision Tubes',
      'Cold Drawn Tubes',
      'Boiler Tubes',
      'Heat Exchanger Tubes',
      'Hydraulic Tubes',
      'Automotive Tubes',
      'Furniture Tubes',
      'Scaffolding Tubes',
      'Conveyor Tubes',
      'Line Pipes',
      'Casing Pipes',
      'API Pipes',
      'Water Well Casing',
      'Galvanized Steel Pipes',
      'Pre-Galvanized Pipes',
      'Black Steel Pipes',
      // Tata Ductura DI Pipes
      'Ductile Iron Pipes',
      'DI Fittings',
      'Centrifugal Cast DI Pipes',
      'Push-on Joint Pipes',
      'Flanged DI Pipes',
      'Restrained Joint Pipes',
    ]
  },
  {
    name: 'Solar & Renewable Energy',
    icon: Lightbulb,
    subcategories: [
      'Solar Panels',
      'Solar Inverters',
      'Solar Batteries',
      'Solar Mounting Systems',
      'Solar Water Heaters',
      'Solar Street Lights',
      'Solar Pumps',
      'Solar Cables & Connectors',
      'Charge Controllers',
      'Off-Grid Systems',
    ]
  },
  {
    name: 'Petroleum & Bitumen',
    icon: Factory,
    subcategories: [
      'Diesel',
      'Bitumen',
      'Furnace Oil',
      'Light Diesel Oil (LDO)',
      'High Speed Diesel (HSD)',
      'Lubricants',
      'Base Oil',
      'Petroleum Coke',
      'Asphalt',
      'Crude Oil',
    ]
  },
  {
    name: 'Safety & Security',
    icon: Shield,
    subcategories: [
      'Personal Protective Equipment',
      'CCTV & Surveillance',
      'Access Control',
      'Fire Safety',
      'Alarms & Sensors',
      'Security Systems',
      'Safety Signs',
      'Traffic Safety',
    ]
  },
  {
    name: 'Sports & Outdoor',
    icon: Dumbbell,
    subcategories: [
      'Sports Equipment',
      'Fitness Equipment',
      'Outdoor Gear',
      'Camping Equipment',
      'Sports Apparel',
      'Water Sports',
      'Team Sports',
      'Adventure Sports',
    ]
  },
  {
    name: 'Telecommunication',
    icon: Radio,
    subcategories: [
      'Telecom Equipment',
      'Network Infrastructure',
      'Fiber Optics',
      'Antennas',
      'Communication Devices',
      'Broadcasting Equipment',
      'Satellite Equipment',
      'VoIP Solutions',
    ]
  },
  {
    name: 'Textiles & Leather',
    icon: Scissors,
    subcategories: [
      'Fabrics',
      'Yarns & Threads',
      'Home Textiles',
      'Technical Textiles',
      'Leather Products',
      'Leather Raw Materials',
      'Textile Machinery',
      'Garment Accessories',
    ]
  },
  {
    name: 'Toys & Games',
    icon: Gamepad2,
    subcategories: [
      'Educational Toys',
      'Electronic Toys',
      'Board Games',
      'Outdoor Toys',
      'Plush Toys',
      'Action Figures',
      'Building Toys',
      'Party Supplies',
    ]
  },
  {
    name: 'Industrial Storage & Tanks',
    icon: Factory,
    subcategories: [
      'Industrial Storage Tanks',
      'Effluent Treatment Storage Tanks',
      'Glass Lined Tanks',
      'Corrugated Steel Tanks',
      'GFS Storage Tanks',
      'Zinc Aluminium Tanks',
      'Zincalume Steel Tanks',
      'Industrial Silos',
      'Flat Bottom Silos',
      'Grain Storage Silos',
      'Hopper Bottom Silos',
      'Bucket Elevators',
      'Industrial Conveyors',
      'Belt Conveyors',
      'Chain Conveyors',
      'Roller Conveyors',
      'Water Storage Tanks',
      'SS Tanks',
      'Liquid Tanks',
      'Fire Water Tanks',
      'Sewage Treatment Tanks',
      'Bio Digester Tanks',
      'Bolted Steel Tanks',
    ]
  },
  {
    name: 'Steel Fabrication & Structures',
    icon: Cog,
    subcategories: [
      'MS Structures',
      'Steel Ducting',
      'Profiled Sheets',
      'Perforated Sheets',
      'Cable Trays',
      'Steel Gratings',
      'Handrails & Railings',
      'Overhead Walkways',
      'Nozzles & Flanges',
      'Steel Platforms',
      'Structural Steel Fabrication',
      'Industrial Ladders',
      'Steel Staircases',
      'Support Structures',
    ]
  },
  {
    name: 'Logistics & Transportation',
    icon: Truck,
    subcategories: [
      'Freight Forwarding',
      'Warehousing & Distribution',
      'Road Transportation',
      'Sea Freight',
      'Air Cargo',
      'Rail Freight',
      'Customs Brokerage',
      'Cold Chain Logistics',
      'Last-Mile Delivery',
      'Container Services',
      'Fleet Management',
      'Supply Chain Solutions',
    ]
  },
  {
    name: 'Steel & Metal Products',
    icon: Layers,
    subcategories: [
      // TMT Bars & Rebars
      'TMT Bars',
      'Fe-500D TMT Bars',
      'Fe-550D TMT Bars',
      'Earthquake Resistant TMT Bars',
      'Corrosion Resistant TMT Bars',
      // MS (Mild Steel) Products
      'MS Angles',
      'MS Channels',
      'MS Beams',
      'MS Flats',
      'MS Rounds',
      'MS Squares',
      'MS Pipes',
      'MS Tubes',
      // Plates & Sheets
      'Chequered Plates',
      'HR Sheets',
      'HR Plates',
      'CR Sheets',
      'CR Coils',
      'GP Sheets',
      'GC Sheets',
      'Color Coated Sheets',
      'Stainless Steel Sheets',
      // Wire Products
      'Wire Rods',
      'Binding Wire',
      'GI Wire',
      'MS Wire',
      'Barbed Wire',
      'Welded Wire Mesh',
      'Chain Link Fence',
      // Structural Steel
      'I-Beams',
      'H-Beams',
      'ISMC Channels',
      'ISMB Beams',
      'Joist Beams',
      'Steel Joists',
      // Pipes & Tubes
      'ERW Pipes',
      'Seamless Pipes',
      'Galvanized Pipes',
      'Square Tubes',
      'Rectangular Tubes',
      'Hollow Sections',
    ]
  },
  {
    name: 'Road Safety & Infrastructure',
    icon: Shield,
    subcategories: [
      // Crash Barriers
      'Crash Barriers',
      'Metal Crash Barriers',
      'W-Beam Crash Barriers',
      'Thrie Beam Crash Barriers',
      'Box Beam Crash Barriers',
      'Cable Barriers',
      'Concrete Barriers',
      'Bridge Barriers',
      'Median Barriers',
      'Guardrails',
      'End Terminals',
      'Crash Cushions',
      // Road Safety Equipment
      'Road Studs',
      'Cat Eyes',
      'Reflective Road Markers',
      'Delineators',
      'Traffic Cones',
      'Speed Breakers',
      'Rumble Strips',
      'Bollards',
      'Parking Barriers',
      // Signage
      'Traffic Signs',
      'Highway Signs',
      'Reflective Signs',
      'LED Traffic Signs',
      'Warning Signs',
      'Directional Signs',
      // Road Marking
      'Thermoplastic Road Marking',
      'Road Paint',
      'Lane Marking',
      'Zebra Crossing Materials',
      // Infrastructure
      'Street Light Poles',
      'Highway Lighting',
      'Toll Plaza Equipment',
      'Road Dividers',
      'Kerb Stones',
      'Drainage Systems',
    ]
  },
];

export const getAllCategoryNames = (): string[] => {
  return categoriesData.map(cat => cat.name);
};

export const getCategoryByName = (name: string): CategoryData | undefined => {
  return categoriesData.find(cat => cat.name.toLowerCase() === name.toLowerCase());
};

export const searchCategories = (query: string): CategoryData[] => {
  const lowerQuery = query.toLowerCase();
  return categoriesData.filter(
    cat => 
      cat.name.toLowerCase().includes(lowerQuery) ||
      cat.subcategories.some(sub => sub.toLowerCase().includes(lowerQuery))
  );
};
