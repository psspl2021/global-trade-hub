import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Cpu, Shirt, Pill, Wheat, Droplets, Zap, Factory, Gem, 
  Building2, Leaf, ArrowRight 
} from 'lucide-react';

const featuredCategories = [
  { name: 'Electronics & Electricals', icon: Cpu, subcategories: 15, color: 'bg-blue-500/10 text-blue-600' },
  { name: 'Textiles & Apparel', icon: Shirt, subcategories: 12, color: 'bg-pink-500/10 text-pink-600' },
  { name: 'Pharmaceuticals', icon: Pill, subcategories: 8, color: 'bg-green-500/10 text-green-600' },
  { name: 'Food & Beverages', icon: Wheat, subcategories: 14, color: 'bg-amber-500/10 text-amber-600' },
  { name: 'Chemicals', icon: Droplets, subcategories: 10, color: 'bg-purple-500/10 text-purple-600' },
  { name: 'Energy & Power', icon: Zap, subcategories: 6, color: 'bg-yellow-500/10 text-yellow-600' },
  { name: 'Industrial Machinery', icon: Factory, subcategories: 11, color: 'bg-slate-500/10 text-slate-600' },
  { name: 'Gems & Jewelry', icon: Gem, subcategories: 5, color: 'bg-rose-500/10 text-rose-600' },
  { name: 'Building Materials', icon: Building2, subcategories: 9, color: 'bg-orange-500/10 text-orange-600' },
  { name: 'Agriculture', icon: Leaf, subcategories: 7, color: 'bg-emerald-500/10 text-emerald-600' },
];

export const CategoriesShowcase = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore 23+ product categories with thousands of verified suppliers ready to fulfill your requirements
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {featuredCategories.map((category) => (
            <Card 
              key={category.name}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50"
              onClick={() => navigate('/categories')}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center mx-auto mb-3`}>
                  <category.icon className="h-6 w-6" />
                </div>
                <h3 className="font-medium text-sm mb-1 line-clamp-2">{category.name}</h3>
                <p className="text-xs text-muted-foreground">{category.subcategories} subcategories</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => navigate('/categories')}
            className="gap-2"
          >
            View All Categories
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
