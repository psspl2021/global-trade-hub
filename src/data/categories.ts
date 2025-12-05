import { 
  Tractor, Car, Cpu, FlaskConical, Building, Shirt, Palette, 
  Briefcase, Gem, Lightbulb, Cog, Stethoscope, Factory, Smartphone,
  Baby, BookOpen, Package, FileText, Pill, Layers, Shield, 
  GraduationCap, Dumbbell, Radio, Scissors, Gamepad2, Utensils,
  Home, Heart, Leaf, Pickaxe, LucideIcon
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
      'Steel Sheets',
      'Steel Bars & Rods',
      'Steel Pipes',
      'Iron Castings',
      'Stainless Steel',
      'Alloy Steel',
      'Structural Steel',
      'Tool Steel',
      'Scrap',
      'TMT Bar',
      'HR Plates',
      'HR Coil',
      'CR Sheet',
      'CR Coil',
      'HRPO',
      'Crane Rails',
      'Iron Ore',
      'Billets',
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
