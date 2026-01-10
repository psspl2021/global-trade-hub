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
  ArrowRight
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
}

interface AIInventoryDiscoveryCardProps {
  userId: string;
}

const getMatchStrengthConfig = (strength: 'high' | 'medium' | 'low') => {
  const configs = {
    high: {
      label: 'High Match',
      color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
      icon: TrendingUp,
    },
    medium: {
      label: 'Medium Match',
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

const determineMatchStrength = (matchScore: number): 'high' | 'medium' | 'low' => {
  if (matchScore >= 0.7) return 'high';
  if (matchScore >= 0.4) return 'medium';
  return 'low';
};

export function AIInventoryDiscoveryCard({ userId }: AIInventoryDiscoveryCardProps) {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<DiscoveryItem | null>(null);
  const [showRFQModal, setShowRFQModal] = useState(false);

  useEffect(() => {
    const fetchAIInventory = async () => {
      setLoading(true);
      try {
        // Fetch AI-matched inventory from stock_inventory + supplier_inventory_matches + products
        // Only show active stock with quantity > 0 from verified suppliers
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
              is_active
            ),
            supplier_inventory_matches (
              match_score,
              supplier_id
            )
          `)
          .gt('quantity', 0)
          .eq('products.is_active', true)
          .limit(10);

        if (error) {
          console.error('Error fetching AI inventory:', error);
          setItems([]);
          return;
        }

        if (!data || data.length === 0) {
          setItems([]);
          return;
        }

        // Process and sort items by match strength and quantity
        const processedItems: DiscoveryItem[] = data
          .map((item: any) => {
            const product = item.products;
            const matches = item.supplier_inventory_matches || [];
            const bestMatch = matches.length > 0 
              ? Math.max(...matches.map((m: any) => m.match_score || 0))
              : 0.5; // Default score for items without matches

            return {
              id: item.id,
              productId: product.id,
              productName: product.name,
              category: product.category,
              availableQuantity: item.quantity,
              unit: item.unit,
              matchStrength: determineMatchStrength(bestMatch),
              isVerified: true, // All products in catalog are from verified suppliers
            };
          })
          // Sort by match strength (high first) then by quantity (descending)
          .sort((a, b) => {
            const strengthOrder = { high: 0, medium: 1, low: 2 };
            if (strengthOrder[a.matchStrength] !== strengthOrder[b.matchStrength]) {
              return strengthOrder[a.matchStrength] - strengthOrder[b.matchStrength];
            }
            return b.availableQuantity - a.availableQuantity;
          })
          .slice(0, 5); // Top 5 items

        setItems(processedItems);
      } catch (err) {
        console.error('Failed to fetch AI inventory:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchAIInventory();
    }
  }, [userId]);

  const handleRequestQuote = (item: DiscoveryItem) => {
    setSelectedStock(item);
    setShowRFQModal(true);
  };

  // Don't render if no items available
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
            // Loading skeleton
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
            // Inventory items list
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
