import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Users, Package } from 'lucide-react';

// Category data with images and details like GlobalLinker
const showcaseCategories = [
  {
    name: 'Industrial Supplies',
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=300&fit=crop',
    description: 'Machinery, tools, safety equipment & manufacturing essentials',
    suppliers: '500+',
    moq: '50 units',
    badges: ['Verified', 'Quality Assured'],
  },
  {
    name: 'Metals - Ferrous (Steel, Iron)',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    description: 'Steel, iron, TMT bars, sheets, and structural metals',
    suppliers: '300+',
    moq: '1 MT',
    badges: ['GST Verified', 'Bulk Ready'],
  },
  {
    name: 'Food & Beverages',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop',
    description: 'Packaged foods, beverages, ingredients & bulk supplies',
    suppliers: '400+',
    moq: '100 units',
    badges: ['FSSAI', 'Quality Assured'],
  },
  {
    name: 'Fashion Apparel & Fabrics',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=300&fit=crop',
    description: 'Textiles, garments, fabrics & fashion accessories',
    suppliers: '600+',
    moq: '100 pcs',
    badges: ['Private Label', 'Custom Made'],
  },
  {
    name: 'Health Care Products',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop',
    description: 'Medical devices, pharmaceuticals, nutraceuticals & wellness',
    suppliers: '200+',
    moq: '500 pcs',
    badges: ['FDA Approved', 'ISO Certified'],
  },
  {
    name: 'Beauty & Personal Care',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
    description: 'Cosmetics, skincare, haircare & personal care products',
    suppliers: '350+',
    moq: '200 pcs',
    badges: ['Private Label', 'Natural'],
  },
  {
    name: 'Consumer Electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop',
    description: 'Electronic gadgets, accessories & smart devices',
    suppliers: '250+',
    moq: '50 pcs',
    badges: ['Certified', 'Warranty'],
  },
  {
    name: 'Hardware & Tools',
    image: 'https://images.unsplash.com/photo-1581147036324-c17ac41f3940?w=400&h=300&fit=crop',
    description: 'Hand tools, power tools, fasteners & construction supplies',
    suppliers: '400+',
    moq: '100 pcs',
    badges: ['Heavy-Duty', 'OEM Quality'],
  },
];

export const CategoryShowcase = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/browse?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <section className="py-12 sm:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Explore Product Categories
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Browse our AI-powered catalogue of verified suppliers across major product categories
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
          {showcaseCategories.map((category) => (
            <Card 
              key={category.name}
              className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              onClick={() => handleCategoryClick(category.name)}
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {category.badges.map((badge) => (
                    <Badge 
                      key={badge} 
                      variant="secondary" 
                      className="bg-background/90 text-foreground text-[10px] px-1.5 py-0.5"
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-1">
                  {category.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {category.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{category.suppliers} suppliers</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Package className="h-3 w-3" />
                    <span>MOQ {category.moq}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8 space-y-3">
          <Button 
            size="lg" 
            onClick={() => navigate('/categories')}
            className="h-12 px-8"
          >
            Browse Full Catalogue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <p className="text-sm text-muted-foreground">
            Can't find your category?{' '}
            <a 
              href="mailto:sales@procuresaathi.com" 
              className="text-primary hover:underline"
            >
              Let our team help →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};
