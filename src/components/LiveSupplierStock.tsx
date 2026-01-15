import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Package, Building2, RefreshCw, Radio, Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleShare = (e: React.MouseEvent, product: ProductWithStock, platform: 'whatsapp' | 'linkedin' | 'copy') => {
    e.stopPropagation();
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/browse?product=${product.id}`;
    const shareText = `Check out: ${product.name} - ${product.category} | MOQ: ${product.moq || 'N/A'} | Lead time: ${product.lead_time_days || 'N/A'} days`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        setCopiedId(product.id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success('Link copied to clipboard');
        break;
    }
  };

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

      // SECURITY: Only fetch safe profile data (city) - NO contact info
      // Supplier identity is always masked for buyers
      const supplierIds = [...new Set(productsData.map(p => p.supplier_id))];
      const { data: profilesData } = await supabase
        .from('safe_supplier_profiles')
        .select('id, city')
        .in('id', supplierIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.city || 'India']) || []);

      // Get stock inventory for these products
      const productIds = productsData.map(p => p.id);
      const { data: stockData } = await supabase
        .from('stock_inventory')
        .select('*')
        .in('product_id', productIds);

      const stockMap = new Map(stockData?.map(s => [s.product_id, s]) || []);

      // Combine data - supplier name is ALWAYS masked (platform identity)
      const productsWithStock: ProductWithStock[] = productsData.map(product => ({
        ...product,
        supplier_name: `ProcureSaathi Verified (${profilesMap.get(product.supplier_id) || 'India'})`,
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

  const formatPrice = () => {
    return 'Price on request';
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
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <p className="font-medium text-primary cursor-pointer hover:underline" onClick={() => window.location.assign('/signup')}>
                          {formatPrice()}
                        </p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleShare(e, product, 'whatsapp')}>
                              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleShare(e, product, 'linkedin')}>
                              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                              LinkedIn
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleShare(e, product, 'copy')}>
                              {copiedId === product.id ? (
                                <Check className="h-4 w-4 mr-2 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4 mr-2" />
                              )}
                              {copiedId === product.id ? 'Copied!' : 'Copy Link'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
