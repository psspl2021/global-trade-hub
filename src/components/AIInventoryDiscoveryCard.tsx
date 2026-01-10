import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  Shield, 
  TrendingUp, 
  Minus, 
  TrendingDown,
  Sparkles,
  ArrowRight,
  Zap
} from 'lucide-react';
import { AIInventoryRFQModal } from '@/components/AIInventoryRFQModal';

interface DiscoveryItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  availableQuantity: number;
  unit: string;
  matchStrength: 'high' | 'medium' | 'low';
  isVerified: boolean;
  supplierCity: string | null;
}

interface AIInventoryDiscoveryCardProps {
  userId: string;
}

const getMatchStrengthConfig = (strength: 'high' | 'medium' | 'low') => {
  const configs = {
    high: {
      label: 'High Demand',
      color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
      icon: TrendingUp,
    },
    medium: {
      label: 'Medium Demand',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800',
      icon: Minus,
    },
    low: {
      label: 'Available',
      color: 'bg-muted text-muted-foreground border-border',
      icon: TrendingDown,
    },
  };
  return configs[strength];
};

const determineMatchStrength = (relevanceScore: number): 'high' | 'medium' | 'low' => {
  if (relevanceScore >= 0.7) return 'high';
  if (relevanceScore >= 0.4) return 'medium';
  return 'low';
};

export function AIInventoryDiscoveryCard({ userId }: AIInventoryDiscoveryCardProps) {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyerCity, setBuyerCity] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<DiscoveryItem | null>(null);
  const [showRFQModal, setShowRFQModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // First, fetch buyer's city for location-aware sorting
        const { data: buyerProfile } = await supabase
          .from('profiles')
          .select('city')
          .eq('id', userId)
          .single();
        
        const userCity = buyerProfile?.city || null;
        setBuyerCity(userCity);

        // Fetch AI-matched inventory with verified supplier filter at DB level
        // JOIN: stock_inventory → products → profiles (verified only)
        const { data, error } = await supabase
          .from('stock_inventory')
          .select(`
            id,
            product_id,
            quantity,
            unit,
            products!inner (
              id,
              name,
              category,
              supplier_id,
              is_active,
              profiles!inner (
                id,
                city,
                is_verified_supplier
              )
            )
          `)
          .gt('quantity', 0)
          .eq('products.is_active', true)
          .eq('products.profiles.is_verified_supplier', true)
          .limit(20);

        if (error) {
          console.error('Error fetching AI inventory:', error);
          setItems([]);
          return;
        }

        if (!data || data.length === 0) {
          setItems([]);
          return;
        }

        // Fetch match scores for products
        const productIds = data.map((item: any) => item.product_id);
        const { data: matchesData } = await supabase
          .from('supplier_inventory_matches')
          .select('product_id, match_score')
          .in('product_id', productIds);

        const matchScoresMap = new Map<string, number>();
        (matchesData || []).forEach((m: any) => {
          const existing = matchScoresMap.get(m.product_id) || 0;
          matchScoresMap.set(m.product_id, Math.max(existing, m.match_score || 0));
        });

        // Process items - verification already enforced at DB level
        const processedItems: DiscoveryItem[] = data
          .map((item: any) => {
            const product = item.products;
            const supplierProfile = product.profiles;
            const supplierCity = supplierProfile?.city || null;
            
            // Get relevance score (not buyer-specific "match")
            const relevanceScore = matchScoresMap.get(item.product_id) || 0.5;

            return {
              id: item.id,
              productId: product.id,
              productName: product.name,
              category: product.category,
              availableQuantity: item.quantity,
              unit: item.unit,
              matchStrength: determineMatchStrength(relevanceScore),
              isVerified: true, // Guaranteed by DB filter: is_verified_supplier = true
              supplierCity,
            };
          })
          // Sort by: 1) Same city as buyer, 2) Match strength, 3) Quantity
          .sort((a, b) => {
            // Location-aware sorting - same city first
            if (userCity) {
              const aInCity = a.supplierCity?.toLowerCase() === userCity.toLowerCase();
              const bInCity = b.supplierCity?.toLowerCase() === userCity.toLowerCase();
              if (aInCity && !bInCity) return -1;
              if (!aInCity && bInCity) return 1;
            }
            
            // Then by match strength
            const strengthOrder = { high: 0, medium: 1, low: 2 };
            if (strengthOrder[a.matchStrength] !== strengthOrder[b.matchStrength]) {
              return strengthOrder[a.matchStrength] - strengthOrder[b.matchStrength];
            }
            
            // Finally by quantity
            return b.availableQuantity - a.availableQuantity;
          })
          .slice(0, 5); // Top 5 items

        setItems(processedItems);

        // Fire impression tracking event (fire-and-forget)
        if (processedItems.length > 0) {
          processedItems.forEach((item) => {
            supabase.from('page_visits').insert({
              visitor_id: userId,
              session_id: `ai_inv_${Date.now()}`,
              page_path: '/dashboard/ai-inventory-impression',
              source: 'ai_inventory_discovery',
              utm_content: item.productId,
            }).then(() => {});
          });
        }
      } catch (err) {
        console.error('Failed to fetch AI inventory:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  const handleRequestQuote = (item: DiscoveryItem) => {
    setSelectedStock(item);
    setShowRFQModal(true);
  };

  // Don't render if no verified items available
  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Available Now (AI-Verified Stock)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Request quotes instantly from verified suppliers with stock ready to ship
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-9 w-28" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const matchConfig = getMatchStrengthConfig(item.matchStrength);
                const MatchIcon = matchConfig.icon;

                return (
                  <div 
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-card rounded-lg border hover:border-primary/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium truncate">{item.productName}</h4>
                        <Badge 
                          variant="outline" 
                          className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800 shrink-0"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                        {/* Fast Response badge for high demand items */}
                        {item.matchStrength === 'high' && (
                          <Badge 
                            variant="outline" 
                            className="text-xs bg-primary/10 text-primary border-primary/30 shrink-0"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Fast Response
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                        <span>{item.category}</span>
                        <span className="text-primary font-medium">
                          {item.availableQuantity.toLocaleString()} {item.unit}
                        </span>
                        <Badge variant="outline" className={`text-xs ${matchConfig.color}`}>
                          <MatchIcon className="h-3 w-3 mr-1" />
                          {matchConfig.label}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleRequestQuote(item)}
                      className="shrink-0 gap-1"
                    >
                      Request Quote
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Trust messaging */}
          <div className="pt-3 border-t border-dashed">
            <p className="text-xs text-muted-foreground text-center">
              Final price will be shared by verified suppliers • No hidden commissions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* RFQ Modal */}
      {selectedStock && (
        <AIInventoryRFQModal
          open={showRFQModal}
          onOpenChange={setShowRFQModal}
          stock={{
            id: selectedStock.productId,
            productName: selectedStock.productName,
            category: selectedStock.category,
            availableQuantity: selectedStock.availableQuantity,
            unit: selectedStock.unit,
            matchStrength: selectedStock.matchStrength,
          }}
          userId={userId}
        />
      )}
    </>
  );
}
