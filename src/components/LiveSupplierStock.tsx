import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Package, Building2, RefreshCw, Radio } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price_range_min: number | null;
  price_range_max: number | null;
  moq: number | null;
  lead_time_days: number | null;
  supplier_id: string;
  supplier_name?: string;
}

interface StockInventory {
  product_id: string;
  quantity: number;
  unit: string;
  low_stock_threshold: number;
  last_updated: string;
}

interface ProductWithStock extends Product {
  stock?: StockInventory;
}

interface LiveSupplierStockProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKeyword?: string;
  userId?: string;
}

export const LiveSupplierStock = ({ open, onOpenChange, initialKeyword = '', userId }: LiveSupplierStockProps) => {
  const isGuest = !userId;
  const [searchKeyword, setSearchKeyword] = useState(initialKeyword);
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState<Set<string>>(new Set());

  // Search products with stock info
  const searchProducts = async (keyword: string) => {
    if (!keyword.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      // Search products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          category,
          description,
          price_range_min,
          price_range_max,
          moq,
          lead_time_days,
          supplier_id
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${keyword}%,category.ilike.%${keyword}%,description.ilike.%${keyword}%`)
        .limit(50);

      if (productsError) throw productsError;

      if (!productsData || productsData.length === 0) {
        setProducts([]);
        toast.info('No products found for this keyword');
        return;
      }

      // Get supplier profiles for these products
      const supplierIds = [...new Set(productsData.map(p => p.supplier_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, company_name')
        .in('id', supplierIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.company_name]) || []);

      // Get stock inventory for these products
      const productIds = productsData.map(p => p.id);
      const { data: stockData } = await supabase
        .from('stock_inventory')
        .select('*')
        .in('product_id', productIds);

      const stockMap = new Map(stockData?.map(s => [s.product_id, s]) || []);

      // Combine data
      const productsWithStock: ProductWithStock[] = productsData.map(product => ({
        ...product,
        supplier_name: maskCompanyName(profilesMap.get(product.supplier_id) || 'Unknown'),
        stock: stockMap.get(product.id),
      }));

      setProducts(productsWithStock);
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error searching products:', error);
      toast.error('Failed to search products');
    } finally {
      setLoading(false);
    }
  };

  // Mask company name for privacy
  const maskCompanyName = (name: string): string => {
    if (name.length <= 3) return name + '***';
    return name.substring(0, 3) + '***';
  };

  // Setup realtime subscription for stock updates
  useEffect(() => {
    if (!open) return;

    const channel = supabase
      .channel('stock-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_inventory',
        },
        (payload) => {
          if (import.meta.env.DEV) console.log('Stock update received:', payload);
          
          // Update the product in our list
          setProducts(prev => {
            const productId = (payload.new as any)?.product_id || (payload.old as any)?.product_id;
            if (!productId) return prev;

            // Add to live updates set for visual feedback
            setLiveUpdates(prevUpdates => new Set(prevUpdates).add(productId));
            
            // Remove from live updates after 3 seconds
            setTimeout(() => {
              setLiveUpdates(prevUpdates => {
                const newSet = new Set(prevUpdates);
                newSet.delete(productId);
                return newSet;
              });
            }, 3000);

            return prev.map(product => {
              if (product.id === productId && payload.new) {
                return {
                  ...product,
                  stock: payload.new as StockInventory,
                };
              }
              return product;
            });
          });

          toast.success('Stock updated in real-time!', { duration: 2000 });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open]);

  // Initial search when dialog opens with keyword
  useEffect(() => {
    if (open && initialKeyword) {
      setSearchKeyword(initialKeyword);
      searchProducts(initialKeyword);
    }
  }, [open, initialKeyword]);

  const handleSearch = () => {
    searchProducts(searchKeyword);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStockStatus = (stock?: StockInventory) => {
    if (!stock) return { label: 'No Stock Info', variant: 'secondary' as const };
    if (stock.quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (stock.quantity <= stock.low_stock_threshold) return { label: 'Low Stock', variant: 'outline' as const, className: 'border-orange-500 text-orange-600' };
    return { label: 'In Stock', variant: 'default' as const };
  };

  const formatPrice = (min: number | null, max: number | null) => {
    if (min === null && max === null) return 'Price on request';
    if (min === null) return `Up to ₹${max?.toLocaleString()}`;
    if (max === null) return `From ₹${min.toLocaleString()}`;
    return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Browse Supplier Products
            <Badge variant="outline" className="ml-2 flex items-center gap-1">
              <Radio className="h-3 w-3 text-green-500 animate-pulse" />
              Live
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search by product name, category, or description..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Search for products to see available supplier stock</p>
            {isGuest && (
              <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                <p className="text-foreground font-medium mb-2">Sign up to view full stock details</p>
                <Button onClick={() => { onOpenChange(false); window.location.href = '/signup'; }}>
                  Sign Up as Buyer
                </Button>
              </div>
            )}
            <p className="text-sm mt-2">Stock updates in real-time when suppliers make changes</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Found {products.length} products • Updates appear instantly
            </p>
            
            {products.map((product) => {
              const stockStatus = getStockStatus(product.stock);
              const isLiveUpdated = liveUpdates.has(product.id);
              const isPriceOnRequest = product.price_range_min === null && product.price_range_max === null;
              
              return (
                <Card 
                  key={product.id} 
                  className={`transition-all duration-300 ${isLiveUpdated ? 'ring-2 ring-green-500 bg-green-50/10' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{product.name}</h4>
                          {isLiveUpdated && (
                            <Badge variant="outline" className="text-green-600 border-green-600 animate-pulse">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Just Updated
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="secondary">{product.category}</Badge>
                          <Badge variant={stockStatus.variant} className={(stockStatus as any).className || ''}>
                            {stockStatus.label}
                          </Badge>
                        </div>
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {product.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {product.supplier_name}
                          </span>
                          {product.stock && (
                            <span className="font-medium text-primary">
                              Stock: {product.stock.quantity} {product.stock.unit}
                            </span>
                          )}
                          {product.moq && (
                            <span className="text-muted-foreground">
                              MOQ: {product.moq}
                            </span>
                          )}
                          {product.lead_time_days && (
                            <span className="text-muted-foreground">
                              Lead time: {product.lead_time_days} days
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-medium text-primary">
                          {formatPrice(product.price_range_min, product.price_range_max)}
                        </p>
                        {isPriceOnRequest && isGuest && (
                          <button 
                            onClick={() => { onOpenChange(false); window.location.href = '/signup'; }}
                            className="text-xs text-primary hover:underline mt-1 cursor-pointer"
                          >
                            Sign up to request quote
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {/* Guest signup CTA at bottom */}
            {isGuest && (
              <div className="p-4 bg-primary/10 rounded-lg text-center mt-4">
                <p className="text-sm font-medium mb-1">Want to contact suppliers and request quotes?</p>
                <p className="text-xs text-muted-foreground mb-3">Sign up as a buyer to view full details and connect with suppliers</p>
                <Button size="sm" onClick={() => { onOpenChange(false); window.location.href = '/signup'; }}>
                  Sign Up as Buyer
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
