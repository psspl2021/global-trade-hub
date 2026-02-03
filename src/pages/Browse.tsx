import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Search, Package, Building2, Radio, Lock, Eye, EyeOff, Sparkles, Filter, ChevronDown, X } from 'lucide-react';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { getCategoryByName, categoriesData } from '@/data/categories';
import { AIVerifiedStockSection } from '@/components/AIVerifiedStockSection';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price_range_min: number | null;
  price_range_max: number | null;
  supplier_name: string;
  full_supplier_name: string;
  stock_quantity: number | null;
  stock_unit: string | null;
  moq: number | null;
  lead_time_days: number | null;
}

const Browse = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const subcategoryParam = searchParams.get('subcategory') || '';
  
  // Auth for showing AI Verified Stock to logged-in buyers
  const { user } = useAuth();
  const { role } = useUserRole(user?.id);
  const isBuyer = user && role === 'buyer';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categoryParam ? [categoryParam] : []);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);

  // SEO - Global Reach Optimized
  const pageTitle = subcategoryParam 
    ? `${subcategoryParam} Suppliers & Manufacturers | Export from India - ProcureSaathi`
    : categoryParam 
      ? `${categoryParam} Wholesale Suppliers India | Global Export - ProcureSaathi`
      : 'B2B Product Catalog | Verified Indian Suppliers for Global Buyers - ProcureSaathi';
  
  const canonicalUrl = subcategoryParam
    ? `https://www.procuresaathi.com/browseproducts?category=${encodeURIComponent(categoryParam)}&subcategory=${encodeURIComponent(subcategoryParam)}`
    : categoryParam
      ? `https://www.procuresaathi.com/browseproducts?category=${encodeURIComponent(categoryParam)}`
      : 'https://www.procuresaathi.com/browseproducts';

  const seoDescription = subcategoryParam
    ? `Source ${subcategoryParam} from verified Indian manufacturers. Export-ready products with competitive FOB pricing, quality certifications & worldwide shipping. Get quotes from 500+ suppliers.`
    : categoryParam
      ? `Find ${categoryParam} suppliers in India for global export. Verified manufacturers, competitive bulk pricing, ISO certified. Request quotes from multiple suppliers instantly.`
      : 'Browse 10,000+ B2B products from verified Indian suppliers. Export-ready inventory in steel, chemicals, textiles, machinery & more. Connect with manufacturers for global trade.';

  const seoKeywords = subcategoryParam
    ? `${subcategoryParam} suppliers India, ${subcategoryParam} manufacturers, ${subcategoryParam} exporters, ${subcategoryParam} wholesale, buy ${subcategoryParam} bulk, ${categoryParam} India export`
    : categoryParam
      ? `${categoryParam} suppliers India, ${categoryParam} manufacturers, ${categoryParam} exporters, Indian ${categoryParam}, wholesale ${categoryParam}, ${categoryParam} bulk pricing, ${categoryParam} export`
      : 'Indian suppliers, B2B marketplace India, wholesale products India, bulk buying, industrial suppliers India, export from India, Indian manufacturers, verified suppliers, global sourcing India';

  useSEO({
    title: pageTitle,
    description: seoDescription,
    canonical: canonicalUrl,
    keywords: seoKeywords
  });

  // Get category data for sidebar
  const categoryData = categoryParam ? getCategoryByName(categoryParam) : null;

  // Mask company name for privacy
  const maskCompanyName = (name: string): string => {
    if (name.length <= 3) return name + '***';
    return name.substring(0, 3) + '***';
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('products')
          .select('id, name, category, description, price_range_min, price_range_max, supplier_id, moq, lead_time_days')
          .eq('is_active', true)
          .limit(50);

        if (categoryParam) {
          query = query.ilike('category', `%${categoryParam}%`);
        }

        const { data: productsData, error } = await query;

        if (error) throw error;
        if (!productsData || productsData.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // SECURITY: Only fetch safe profile data (city) - NO contact info exposed
        // Supplier identity is always masked for marketplace visitors
        const supplierIds = [...new Set(productsData.map(p => p.supplier_id))];
        const { data: profilesData } = await supabase
          .from('safe_supplier_profiles')
          .select('id, city')
          .in('id', supplierIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p.city || 'India']) || []);

        // Get stock inventory
        const productIds = productsData.map(p => p.id);
        const { data: stockData } = await supabase
          .from('stock_inventory')
          .select('product_id, quantity, unit')
          .in('product_id', productIds);

        const stockMap = new Map(stockData?.map(s => [s.product_id, s]) || []);

        // Combine data - supplier name is ALWAYS masked (platform identity)
        const combinedProducts: Product[] = productsData.map(product => {
          const stock = stockMap.get(product.id);
          const city = profilesMap.get(product.supplier_id) || 'India';
          return {
            id: product.id,
            name: product.name,
            category: product.category,
            description: product.description,
            price_range_min: product.price_range_min,
            price_range_max: product.price_range_max,
            supplier_name: `ProcureSaathi Verified (${city})`,
            full_supplier_name: 'ProcureSaathi Verified Supplier', // NEVER expose real name
            stock_quantity: stock?.quantity ?? null,
            stock_unit: stock?.unit ?? null,
            moq: product.moq,
            lead_time_days: product.lead_time_days,
          };
        });

        setProducts(combinedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryParam]);

  // Filter by search, subcategory, and selected categories
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubcategory = subcategoryParam === '' ||
      product.name.toLowerCase().includes(subcategoryParam.toLowerCase()) ||
      product.description?.toLowerCase().includes(subcategoryParam.toLowerCase()) ||
      product.category.toLowerCase().includes(subcategoryParam.toLowerCase());

    const matchesCategory = selectedCategories.length === 0 ||
      selectedCategories.some(cat => 
        product.category.toLowerCase().includes(cat.toLowerCase())
      );
    
    return matchesSearch && matchesSubcategory && matchesCategory;
  });

  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
  };

  const displayTitle = subcategoryParam || categoryParam || 'All Products';
  const mainCategories = categoriesData.slice(0, 15); // Show first 15 categories

  // JSON-LD Structured Data for Global SEO - ItemList only (no Product schema on category pages)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": displayTitle,
    "description": seoDescription,
    "url": canonicalUrl,
    "itemListOrder": "https://schema.org/ItemListOrderAscending",
    "numberOfItems": filteredProducts.length,
    "itemListElement": filteredProducts.slice(0, 10).map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": product.name,
      "url": `https://www.procuresaathi.com/browseproducts?product=${encodeURIComponent(product.id)}`
    }))
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ProcureSaathi",
    "url": "https://www.procuresaathi.com",
    "logo": "https://www.procuresaathi.com/procuresaathi-logo.png",
    "description": "India's leading B2B sourcing platform connecting global buyers with verified Indian suppliers",
    "areaServed": {
      "@type": "Place",
      "name": "Worldwide"
    },
    "sameAs": [
      "https://twitter.com/ProcureSaathi",
      "https://www.linkedin.com/company/procuresaathi"
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      {/* SEO JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
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
              className="h-24 md:h-28 w-auto object-contain"
            />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" onClick={() => navigate('/')}>Home</Button>
            <Button variant="ghost" onClick={() => navigate('/categories')}>Categories</Button>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
            <Button onClick={() => navigate('/signup')}>Partner with Us</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="cursor-pointer">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/categories" onClick={(e) => { e.preventDefault(); navigate('/categories'); }} className="cursor-pointer">
                Categories
              </BreadcrumbLink>
            </BreadcrumbItem>
            {categoryParam && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {subcategoryParam ? (
                    <BreadcrumbLink 
                      href={`/browseproducts?category=${encodeURIComponent(categoryParam)}`}
                      onClick={(e) => { e.preventDefault(); navigate(`/browseproducts?category=${encodeURIComponent(categoryParam)}`); }}
                      className="cursor-pointer"
                    >
                      {categoryParam}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{categoryParam}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </>
            )}
            {subcategoryParam && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{subcategoryParam}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <Button
            variant="outline"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {selectedCategories.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedCategories.length}
              </Badge>
            )}
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar */}
          <aside className={`lg:w-64 shrink-0 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="sticky top-24">
              <CardContent className="p-4">
                {/* Filter Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    Filters
                  </h3>
                  {(selectedCategories.length > 0 || searchQuery) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-xs h-7 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Category Filter */}
                <Collapsible open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium border-t pt-4">
                    Category
                    <ChevronDown className={`h-4 w-4 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-2">
                    {mainCategories.map((category) => (
                      <div key={category.name} className="flex items-center space-x-2">
                        <Checkbox
                          id={category.name}
                          checked={selectedCategories.includes(category.name)}
                          onCheckedChange={() => handleCategoryToggle(category.name)}
                        />
                        <label
                          htmlFor={category.name}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 truncate"
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => navigate('/categories')}
                      className="text-xs p-0 h-auto text-primary"
                    >
                      View All Categories →
                    </Button>
                  </CollapsibleContent>
                </Collapsible>

                {/* Subcategory Filter (if category selected) */}
                {categoryData && (
                  <div className="border-t mt-4 pt-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      {(() => {
                        const IconComponent = categoryData.icon;
                        return <IconComponent className="h-4 w-4 text-primary" />;
                      })()}
                      Subcategories
                    </h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      <Button
                        variant={!subcategoryParam ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => navigate(`/browseproducts?category=${encodeURIComponent(categoryParam)}`)}
                      >
                        All in {categoryParam.split(' ')[0]}...
                      </Button>
                      {categoryData.subcategories.slice(0, 10).map((sub) => (
                        <Button
                          key={sub}
                          variant={subcategoryParam === sub ? "secondary" : "ghost"}
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => navigate(`/browseproducts?category=${encodeURIComponent(categoryParam)}&subcategory=${encodeURIComponent(sub)}`)}
                        >
                          {sub}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Filters Summary */}
                {selectedCategories.length > 0 && (
                  <div className="border-t mt-4 pt-4">
                    <h4 className="text-sm font-medium mb-2">Active Filters</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedCategories.map(cat => (
                        <Badge 
                          key={cat} 
                          variant="secondary"
                          className="text-xs cursor-pointer hover:bg-destructive/20"
                          onClick={() => handleCategoryToggle(cat)}
                        >
                          {cat.split(' ')[0]}...
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Title & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{displayTitle}</h1>
                <p className="text-muted-foreground mt-1">
                  {loading ? 'Loading...' : `${filteredProducts.length} products found`}
                </p>
              </div>
              
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search in this category..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* AI Verified Stock - Available Now Section */}
            {typeof window !== 'undefined' && (
              <div className="mb-10 p-4 sm:p-6 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Available Now (AI Verified)
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                      Products verified in stock with trusted suppliers. Supplier identities remain anonymous until order confirmation.
                    </p>
                  </div>
                </div>
                <AIVerifiedStockSection 
                  userId={user?.id} 
                  isLoggedIn={!!user}
                  categoryFilter={categoryParam}
                />
              </div>
            )}

            {/* Category-Specific Sign Up Prompt - Only for non-authenticated users */}
            {!user && (
              <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">
                          Looking for {displayTitle}?
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Sign up to access 500+ verified suppliers and get competitive quotes
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => navigate('/signup')} className="shrink-0">
                      Create Free Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-3" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-4">
                    {subcategoryParam 
                      ? `No products available in "${subcategoryParam}" yet.`
                      : categoryParam 
                        ? `No products available in "${categoryParam}" category yet.`
                        : 'No products available yet.'}
                  </p>
                  <Button variant="outline" onClick={() => navigate('/categories')}>
                    Browse Other Categories
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow group">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="secondary">{product.category}</Badge>
                        {product.stock_quantity !== null && (
                          <Badge 
                            variant={product.stock_quantity > 0 ? 'default' : 'destructive'}
                            className="flex items-center gap-1"
                          >
                            <Radio className="h-3 w-3" />
                            {product.stock_quantity > 0 
                              ? `${product.stock_quantity} ${product.stock_unit || 'units'}` 
                              : 'Out of stock'}
                          </Badge>
                        )}
                      </div>
                      
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 text-sm">
                        {(product.price_range_min || product.price_range_max) && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Price Range:</span>
                            <span className="font-medium">
                              {product.price_range_min && product.price_range_max
                                ? `₹${product.price_range_min.toLocaleString()} - ₹${product.price_range_max.toLocaleString()}`
                                : product.price_range_min
                                  ? `From ₹${product.price_range_min.toLocaleString()}`
                                  : `Up to ₹${product.price_range_max?.toLocaleString()}`
                              }
                            </span>
                          </div>
                        )}
                        
                        {product.moq && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">MOQ:</span>
                            <span>{product.moq} units</span>
                          </div>
                        )}
                        
                        {product.lead_time_days && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Lead Time:</span>
                            <span>{product.lead_time_days} days</span>
                          </div>
                        )}
                        
                        {/* Blurred Supplier Name with Reveal Prompt */}
                        <div className="pt-3 border-t mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground text-xs">Supplier</span>
                          </div>
                          <div className="relative">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{product.supplier_name}</span>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <EyeOff className="h-3 w-3" />
                                <span>Hidden</span>
                              </div>
                            </div>
                            {/* Blurred full name overlay */}
                            <div 
                              className="mt-1 relative overflow-hidden rounded bg-muted/50 px-2 py-1 cursor-pointer group/blur"
                              onClick={() => navigate('/signup')}
                            >
                              <span className="text-sm blur-sm select-none">
                                {product.full_supplier_name}
                              </span>
                              <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 group-hover/blur:opacity-100 transition-opacity">
                                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                                  <Eye className="h-3 w-3" />
                                  Sign up to reveal
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Bottom CTA */}
            {!loading && filteredProducts.length > 0 && (
              <Card className="mt-8 bg-gradient-to-r from-primary to-primary/80">
                <CardContent className="p-8 text-center text-primary-foreground">
                  <h2 className="text-2xl font-bold mb-2">Found what you're looking for?</h2>
                  <p className="mb-6 opacity-90">
                    Create a free account to contact suppliers, view full details, and post your requirements
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg" 
                      variant="secondary"
                      onClick={() => navigate('/signup')}
                    >
                      Sign Up Free
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="border-white/50 bg-white/10 text-white hover:bg-white/20"
                      onClick={() => navigate('/login')}
                    >
                      Already have an account? Login
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Sticky Sign Up CTA for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t lg:hidden">
        <Button className="w-full" size="lg" onClick={() => navigate('/signup')}>
          <Lock className="h-4 w-4 mr-2" />
          Sign Up to View Full Details
        </Button>
      </div>
    </div>
  );
};

export default Browse;
