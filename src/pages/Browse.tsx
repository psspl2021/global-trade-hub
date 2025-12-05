import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Package, Building2, Radio, ArrowLeft, Lock } from 'lucide-react';
import procureSaathiLogo from '@/assets/procuresaathi-logo.jpg';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price_range_min: number | null;
  price_range_max: number | null;
  supplier_name: string;
  stock_quantity: number | null;
  stock_unit: string | null;
  moq: number | null;
  lead_time_days: number | null;
}

const Browse = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

        // Get supplier profiles
        const supplierIds = [...new Set(productsData.map(p => p.supplier_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, company_name')
          .in('id', supplierIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p.company_name]) || []);

        // Get stock inventory
        const productIds = productsData.map(p => p.id);
        const { data: stockData } = await supabase
          .from('stock_inventory')
          .select('product_id, quantity, unit')
          .in('product_id', productIds);

        const stockMap = new Map(stockData?.map(s => [s.product_id, s]) || []);

        // Combine data
        const combinedProducts: Product[] = productsData.map(product => {
          const stock = stockMap.get(product.id);
          return {
            id: product.id,
            name: product.name,
            category: product.category,
            description: product.description,
            price_range_min: product.price_range_min,
            price_range_max: product.price_range_max,
            supplier_name: maskCompanyName(profilesMap.get(product.supplier_id) || 'Unknown'),
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

  const filteredProducts = products.filter(product => 
    searchQuery === '' || 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" onClick={() => navigate('/')}>Home</Button>
            <Button variant="ghost" onClick={() => navigate('/categories')}>Categories</Button>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
            <Button onClick={() => navigate('/signup')}>Join Now</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Back Button & Title */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => navigate('/categories')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Categories
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {categoryParam || 'All Products'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {loading ? 'Loading...' : `${filteredProducts.length} products found`}
              </p>
            </div>
            
            {/* Search within category */}
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
        </div>

        {/* Sign Up Prompt Banner */}
        <Card className="mb-8 bg-primary/5 border-primary/20">
          <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">Want to see full supplier details?</p>
                <p className="text-sm text-muted-foreground">
                  Sign up for free to view complete product information and contact suppliers
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/signup')}>
              Create Free Account
            </Button>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                {categoryParam 
                  ? `No products available in "${categoryParam}" category yet.`
                  : 'No products available yet.'}
              </p>
              <Button variant="outline" onClick={() => navigate('/categories')}>
                Browse Other Categories
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
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
                    
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{product.supplier_name}</span>
                      <Lock className="h-3 w-3 text-muted-foreground ml-auto" />
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
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => navigate('/login')}
                >
                  Already have an account? Login
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Browse;
