import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, ChevronRight } from 'lucide-react';
import procureSaathiLogo from '@/assets/procuresaathi-logo.jpg';
import { categoriesData, searchCategories } from '@/data/categories';
import { useSEO, injectStructuredData, getBreadcrumbSchema, getCategorySchema } from '@/hooks/useSEO';
import { nameToSlug } from './CategoryLanding';
import { CategoryShowcase } from '@/components/landing/CategoryShowcase';

const Categories = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // SEO setup with optimized meta tags for ranking
  useSEO({
    title: "B2B Product Categories | Verified Suppliers India",
    description: "Browse 40+ B2B categories: Steel, Machinery, Textiles, Chemicals & more. Connect with 5000+ verified Indian suppliers and manufacturers. Get competitive quotes free!",
    canonical: "https://procuresaathi.com/categories",
    keywords: "B2B suppliers India, industrial suppliers, steel manufacturers, machinery suppliers, textile exporters, chemical suppliers, wholesale products India, manufacturing categories, verified suppliers, Indian exporters"
  });

  // Inject Breadcrumb and Category schemas
  useEffect(() => {
    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com/" },
      { name: "Product Categories", url: "https://procuresaathi.com/categories" }
    ]), 'breadcrumb-schema');

    // Inject category collection schema
    injectStructuredData(getCategorySchema({
      name: "B2B Product Categories",
      description: "Browse 40+ product categories with verified suppliers across India. Find manufacturers, wholesalers, and exporters for all industrial and consumer goods.",
      subcategories: categoriesData.map(c => c.name),
      url: "https://procuresaathi.com/categories"
    }), 'category-schema');
  }, []);

  const filteredCategories = searchQuery 
    ? searchCategories(searchQuery)
    : categoriesData;

  const handleSubcategoryClick = (category: string, subcategory: string) => {
    navigate(`/category/${nameToSlug(category)}/${nameToSlug(subcategory)}`);
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/category/${nameToSlug(category)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi Logo" 
              className="h-20 w-auto object-contain"
              width={80}
              height={80}
              loading="eager"
            />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" onClick={() => navigate('/#about')}>About Us</Button>
            <Button variant="ghost" onClick={() => navigate('/#how-it-works')}>How It Works</Button>
            <Button variant="ghost" className="text-primary font-medium border-b-2 border-primary rounded-none">Categories</Button>
            <Button variant="ghost" onClick={() => navigate('/#contact')}>Contact</Button>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button onClick={() => navigate('/signup')}>Join Now</Button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-primary/90 to-primary py-16 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&q=80"
          alt="B2B industrial suppliers and manufacturers warehouse"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
          width={1920}
          height={600}
          loading="eager"
        />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
            B2B Product Categories
          </h1>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Find verified <strong>B2B suppliers</strong>, <strong>manufacturers</strong>, and <strong>exporters</strong> across 40+ industrial categories. Source steel, machinery, textiles, chemicals, and more from India.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8"
            onClick={() => navigate('/signup')}
          >
            Join Now - It's Free
          </Button>
        </div>
      </section>

      {/* Category Showcase with Images */}
      <CategoryShowcase />

      {/* Search Bar */}
      <section className="py-8 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search categories or products..."
              className="pl-12 py-6 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {searchQuery && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Found {filteredCategories.length} categories matching "{searchQuery}"
            </p>
          )}
        </div>
      </section>

      {/* Categories Accordion */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Browse All Categories
          </h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore <a href="/category/building-construction" className="text-primary hover:underline">Building & Construction</a>, <a href="/category/machinery-equipment" className="text-primary hover:underline">Machinery</a>, <a href="/category/textiles-fabrics" className="text-primary hover:underline">Textiles</a>, and more categories with verified suppliers.
          </p>
          
          <div className="max-w-4xl mx-auto">
            <Accordion type="multiple" className="space-y-2">
              {filteredCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <AccordionItem 
                    key={category.name} 
                    value={category.name}
                    className="border rounded-lg px-4 bg-card"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium text-left">{category.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({category.subcategories.length})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
                        {/* View All Link */}
                        <button
                          onClick={() => handleCategoryClick(category.name)}
                          className="text-left text-sm text-primary font-medium hover:underline flex items-center gap-1 p-2 rounded hover:bg-primary/5 transition-colors"
                        >
                          View All
                          <ChevronRight className="h-3 w-3" />
                        </button>
                        {/* Subcategory Links */}
                        {category.subcategories.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => handleSubcategoryClick(category.name, sub)}
                            className="text-left text-sm text-muted-foreground hover:text-primary hover:underline p-2 rounded hover:bg-muted/50 transition-colors truncate"
                            title={sub}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No categories found matching "{searchQuery}"
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Source Products?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of buyers and suppliers on ProcureSaathi. Post your requirements and get competitive bids from verified suppliers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/signup')}>
              Create Free Account
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/browse')}>
              Browse Requirements
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img 
                src={procureSaathiLogo} 
                alt="ProcureSaathi B2B sourcing platform logo" 
                className="h-12 w-auto object-contain"
                width={48}
                height={48}
                loading="lazy"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ProcureSaathi. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/signup')}>Sign Up</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Categories;
