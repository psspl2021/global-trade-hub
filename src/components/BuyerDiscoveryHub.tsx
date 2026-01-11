/**
 * BuyerDiscoveryHub - Unified AI Inventory + Manual RFQ Card
 * AI Inventory on LEFT (primary), Manual RFQ on RIGHT (secondary)
 * Eye-tracking psychology: left = default choice
 */

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
  Zap,
  MapPin,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react';
import { AIInventoryRFQModal } from '@/components/AIInventoryRFQModal';
import { trackAIInventoryImpression } from '@/lib/aiInventoryAnalytics';

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
  supplierId: string;
  isSameCity: boolean;
  isFastResponse: boolean;
}

interface BuyerDiscoveryHubProps {
  userId: string;
  onOpenManualRFQ: () => void;
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

export function BuyerDiscoveryHub({ userId, onOpenManualRFQ }: BuyerDiscoveryHubProps) {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyerCity, setBuyerCity] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<DiscoveryItem | null>(null);
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [manualExpanded, setManualExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch buyer's city
        const { data: buyerProfile } = await supabase
          .from('profiles')
          .select('city')
          .eq('id', userId)
          .single();
        
        const userCity = buyerProfile?.city || null;
        setBuyerCity(userCity);

        // Fetch AI-matched inventory with verified supplier filter
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

        // Fetch match scores
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

        // Process items with badges
        const processedItems: DiscoveryItem[] = data
          .map((item: any) => {
            const product = item.products;
            const supplierProfile = product.profiles;
            const supplierCity = supplierProfile?.city || null;
            const relevanceScore = matchScoresMap.get(item.product_id) || 0.5;
            const matchStrength = determineMatchStrength(relevanceScore);
            
            // Same City check (case-insensitive)
            const isSameCity = userCity && supplierCity 
              ? supplierCity.toLowerCase().trim() === userCity.toLowerCase().trim()
              : false;

            // Fast Response: high match strength OR same city
            const isFastResponse = matchStrength === 'high' || isSameCity;

            return {
              id: item.id,
              productId: product.id,
              productName: product.name,
              category: product.category,
              availableQuantity: item.quantity,
              unit: item.unit,
              matchStrength,
              isVerified: true,
              supplierCity,
              supplierId: product.supplier_id,
              isSameCity,
              isFastResponse,
            };
          })
          // Sort: Same city first, then high match, then quantity
          .sort((a, b) => {
            if (a.isSameCity && !b.isSameCity) return -1;
            if (!a.isSameCity && b.isSameCity) return 1;
            
            const strengthOrder = { high: 0, medium: 1, low: 2 };
            if (strengthOrder[a.matchStrength] !== strengthOrder[b.matchStrength]) {
              return strengthOrder[a.matchStrength] - strengthOrder[b.matchStrength];
            }
            
            return b.availableQuantity - a.availableQuantity;
          })
          .slice(0, 5);

        setItems(processedItems);

        // Track impressions with enhanced data
        if (processedItems.length > 0) {
          processedItems.forEach((item) => {
            trackAIInventoryImpression({
              buyer_id: userId,
              product_id: item.productId,
              supplier_id: item.supplierId,
              city_match: item.isSameCity,
              match_strength: item.matchStrength,
              source: 'discovery_card',
            });
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

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            Get Instant Quotes
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-matched live inventory or create a custom requirement
          </p>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-border">
            {/* LEFT COLUMN: AI Inventory (Primary - 3/5 width) */}
            <div className="lg:col-span-3 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Available Now (Verified Stock)
                </h3>
                {items.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {items.length} matches
                  </Badge>
                )}
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No matching inventory available right now</p>
                  <p className="text-xs mt-1">Try creating a custom RFQ →</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
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
                            
                            {/* Verified Badge */}
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800 shrink-0"
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>

                            {/* Fast Response Badge */}
                            {item.isFastResponse && (
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-primary/10 text-primary border-primary/30 shrink-0"
                              >
                                <Zap className="h-3 w-3 mr-1" />
                                Fast Response
                              </Badge>
                            )}

                            {/* Same City Badge */}
                            {item.isSameCity && (
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800 shrink-0"
                              >
                                <MapPin className="h-3 w-3 mr-1" />
                                Same City
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span>{item.category}</span>
                            <span className="text-primary font-medium">
                              {item.availableQuantity.toLocaleString()} {item.unit}
                            </span>
                            {item.supplierCity && !item.isSameCity && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {item.supplierCity}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Button 
                          size="sm" 
                          onClick={() => handleRequestQuote(item)}
                          className="shrink-0 gap-1 h-8"
                        >
                          Quote
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Trust footer */}
              {items.length > 0 && (
                <p className="text-xs text-muted-foreground text-center pt-2 border-t border-dashed">
                  Final price shared by verified suppliers • No hidden commissions
                </p>
              )}
            </div>

            {/* RIGHT COLUMN: Manual RFQ (Secondary - 2/5 width) */}
            <div className="lg:col-span-2 p-4 bg-muted/30">
              <button 
                className="w-full flex items-center justify-between lg:cursor-default"
                onClick={() => setManualExpanded(!manualExpanded)}
              >
                <h3 className="font-medium flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Custom Requirement
                </h3>
                <span className="lg:hidden">
                  {manualExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>

              <div className={`mt-3 space-y-3 ${manualExpanded ? 'block' : 'hidden lg:block'}`}>
                <p className="text-xs text-muted-foreground">
                  Need something specific? Create a detailed RFQ and get quotes from multiple suppliers.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <Clock className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Response within 24-48 hours</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Package className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Multi-item requirements supported</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Verified supplier bids only</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-4 gap-2"
                  onClick={onOpenManualRFQ}
                >
                  <FileText className="h-4 w-4" />
                  Create Manual RFQ
                </Button>
              </div>
            </div>
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
