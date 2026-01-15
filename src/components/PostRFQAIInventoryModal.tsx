/**
 * PostRFQAIInventoryModal - Shows AI-matched inventory after RFQ submission
 * Critical for funneling manual RFQs back into AI inventory flow
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  Zap,
  MapPin,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { AIInventoryRFQModal } from '@/components/AIInventoryRFQModal';
import { trackAIInventoryImpression } from '@/lib/aiInventoryAnalytics';

interface MatchedItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  availableQuantity: number;
  unit: string;
  matchStrength: 'high' | 'medium' | 'low';
  supplierCity: string | null;
  isSameCity: boolean;
  isFastResponse: boolean;
}

interface PostRFQAIInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  rfqCategory: string;
  rfqQuantity: number;
  buyerCity: string | null;
}

const getMatchStrengthConfig = (strength: 'high' | 'medium' | 'low') => {
  const configs = {
    high: {
      label: 'Best Match',
      color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
      icon: TrendingUp,
    },
    medium: {
      label: 'Good Match',
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

export function PostRFQAIInventoryModal({ 
  open, 
  onOpenChange, 
  userId,
  rfqCategory,
  rfqQuantity,
  buyerCity
}: PostRFQAIInventoryModalProps) {
  const [items, setItems] = useState<MatchedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<MatchedItem | null>(null);
  const [showRFQModal, setShowRFQModal] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchMatchingInventory = async () => {
      setLoading(true);
      try {
        // Small delay to show "matching" animation
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Fetch inventory matching the RFQ category
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
          .eq('products.category', rfqCategory)
          .limit(10);

        if (error) {
          console.error('Error fetching matched inventory:', error);
          setItems([]);
          return;
        }

        if (!data || data.length === 0) {
          setItems([]);
          return;
        }

        // Process and score items
        const processedItems: MatchedItem[] = data
          .map((item: any) => {
            const product = item.products;
            const supplierProfile = product.profiles;
            const supplierCity = supplierProfile?.city || null;
            
            // Calculate match strength based on quantity match
            const qtyRatio = Math.min(item.quantity, rfqQuantity) / rfqQuantity;
            let matchStrength: 'high' | 'medium' | 'low' = 'low';
            if (qtyRatio >= 1) matchStrength = 'high';
            else if (qtyRatio >= 0.5) matchStrength = 'medium';

            const isSameCity = buyerCity && supplierCity 
              ? supplierCity.toLowerCase().trim() === buyerCity.toLowerCase().trim()
              : false;

            // Boost match strength for same city
            if (isSameCity && matchStrength === 'medium') matchStrength = 'high';

            return {
              id: item.id,
              productId: product.id,
              productName: product.name,
              category: product.category,
              availableQuantity: item.quantity,
              unit: item.unit,
              matchStrength,
              supplierCity,
              isSameCity,
              isFastResponse: matchStrength === 'high' || isSameCity,
            };
          })
          .sort((a, b) => {
            // Same city first
            if (a.isSameCity && !b.isSameCity) return -1;
            if (!a.isSameCity && b.isSameCity) return 1;
            // Then by match strength
            const order = { high: 0, medium: 1, low: 2 };
            return order[a.matchStrength] - order[b.matchStrength];
          })
          .slice(0, 5);

        setItems(processedItems);

        // Track impressions
        processedItems.forEach((item) => {
          trackAIInventoryImpression({
            buyer_id: userId,
            product_id: item.productId,
            city_match: item.isSameCity,
            match_strength: item.matchStrength,
            source: 'post_rfq',
          });
        });
      } catch (err) {
        console.error('Failed to fetch matching inventory:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchingInventory();
  }, [open, rfqCategory, rfqQuantity, buyerCity, userId]);

  const handleRequestQuote = (item: MatchedItem) => {
    setSelectedStock(item);
    setShowRFQModal(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              ProcureSaathi Verified Stock Available
            </DialogTitle>
            <DialogDescription>
              Matching verified inventory from our fulfilment pool for {rfqCategory}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Success message */}
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400 text-sm">Request Submitted Successfully!</p>
                <p className="text-xs text-green-600 dark:text-green-500">ProcureSaathi will source quotes from our fulfilment network.</p>
              </div>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="text-center py-8 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                <div>
                  <p className="font-medium">Checking ProcureSaathi verified fulfilment pool…</p>
                  <p className="text-sm text-muted-foreground mt-1">Finding the best options for you</p>
                </div>
              </div>
            )}

            {/* Results */}
            {!loading && items.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Available Now (Skip the Wait)</h3>
                  <Badge variant="secondary" className="text-xs">{items.length} found</Badge>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {items.map((item) => {
                    const matchConfig = getMatchStrengthConfig(item.matchStrength);
                    const MatchIcon = matchConfig.icon;

                    return (
                      <div 
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-card rounded-lg border hover:border-primary/40 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium truncate text-sm">{item.productName}</h4>
                            
                            <Badge variant="outline" className={`text-xs ${matchConfig.color}`}>
                              <MatchIcon className="h-3 w-3 mr-1" />
                              {matchConfig.label}
                            </Badge>

                            {item.isFastResponse && (
                              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                                <Zap className="h-3 w-3 mr-1" />
                                Fast
                              </Badge>
                            )}

                            {item.isSameCity && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400">
                                <MapPin className="h-3 w-3 mr-1" />
                                Same City
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="text-primary font-medium">
                              {item.availableQuantity.toLocaleString()} {item.unit}
                            </span>
                            {item.supplierCity && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {item.supplierCity}
                              </span>
                            )}
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          </div>
                        </div>
                        
                        <Button 
                          size="sm" 
                          onClick={() => handleRequestQuote(item)}
                          className="shrink-0 gap-1 h-8"
                        >
                          Get Quote
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Request pricing from ProcureSaathi's verified stock while your main request is processed
                </p>
              </>
            )}

            {/* No results */}
            {!loading && items.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No matching stock in our fulfilment pool right now</p>
                <p className="text-xs mt-1">ProcureSaathi will source quotes and respond shortly</p>
              </div>
            )}

            {/* Close button */}
            <div className="flex justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {items.length > 0 ? 'Maybe Later' : 'Close'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nested RFQ Modal */}
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
