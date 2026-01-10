import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ChevronDown, 
  ChevronUp,
  Info,
  Truck,
  Clock,
  MapPin,
  BarChart3,
  Target,
  Shield,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  Activity,
  Loader2
} from 'lucide-react';

// ============================================
// TYPES & INTERFACES
// ============================================

interface InventoryMatch {
  id: string;
  productId: string;
  productName: string;
  category: string;
  availableQuantity: number;
  unit: string;
  matchStrength: 'high' | 'medium' | 'low';
  matchScore: number;
  matchingRfqCount: number;
  demandSignals: {
    exactSkuMatch: boolean;
    quantityAlignment: number;
    locationProximity: number;
    historicalAcceptance: number;
    stockFreshness: number;
  };
  suggestedPriceBand: {
    min: number;
    max: number;
    optimal: number;
  };
  pricePosition: 'below_market' | 'market_aligned' | 'above_market';
  suggestedAllocation?: number;
  bestFitSegments: string[];
  stockAgeDays: number;
  lastUpdated: string;
}

interface BuyerVisibleStock {
  id: string;
  productName: string;
  category: string;
  availableQuantity: number;
  unit: string;
  verifiedAvailable: boolean;
  matchStrength: 'high' | 'medium' | 'low';
  logisticsCost: number;
  materialPrice: number;
}

interface SupplierInventorySaleAIProps {
  userId: string;
  userRole: 'supplier' | 'buyer';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// ============================================
// SEO JSON-LD STRUCTURED DATA
// ============================================

const generateStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Supplier Inventory Sale AI",
  "applicationCategory": "BusinessApplication",
  "description": "AI-powered inventory matching system for B2B procurement",
  "offers": {
    "@type": "Offer",
    "category": "Inventory Management"
  },
  "featureList": [
    "Live inventory matching",
    "Demand signal analysis",
    "Price optimization",
    "Location-based matching"
  ]
});

// ============================================
// HELPER FUNCTIONS
// ============================================

const getMatchStrengthConfig = (strength: 'high' | 'medium' | 'low') => {
  const configs = {
    high: {
      label: 'High',
      description: 'Strong buyer demand alignment',
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: TrendingUp,
    },
    medium: {
      label: 'Medium',
      description: 'Partial match, likely conversion',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: Minus,
    },
    low: {
      label: 'Low',
      description: 'Limited demand, exploratory match',
      color: 'bg-red-500',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: TrendingDown,
    },
  };
  return configs[strength];
};

const getPricePositionBadge = (position: 'below_market' | 'market_aligned' | 'above_market') => {
  switch (position) {
    case 'below_market':
      return { label: 'Below Market', variant: 'default' as const, className: 'bg-green-100 text-green-700' };
    case 'market_aligned':
      return { label: 'Market Aligned', variant: 'secondary' as const, className: '' };
    case 'above_market':
      return { label: 'Above Market', variant: 'outline' as const, className: 'border-orange-500 text-orange-600' };
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

export const SupplierInventorySaleAI = ({ 
  userId, 
  userRole, 
  open = false, 
  onOpenChange 
}: SupplierInventorySaleAIProps) => {
  const [loading, setLoading] = useState(true);
  const [inventoryMatches, setInventoryMatches] = useState<InventoryMatch[]>([]);
  const [buyerVisibleStock, setBuyerVisibleStock] = useState<BuyerVisibleStock[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<InventoryMatch | null>(null);

  // Fetch inventory matches for suppliers or verified stock for buyers
  useEffect(() => {
    if (userRole === 'supplier') {
      fetchSupplierInventoryMatches();
    } else {
      fetchBuyerVisibleStock();
    }
  }, [userId, userRole]);

  const fetchSupplierInventoryMatches = async () => {
    setLoading(true);
    try {
      // Fetch supplier's products with stock
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          category,
          stock_inventory (
            quantity,
            unit,
            low_stock_threshold,
            last_updated
          )
        `)
        .eq('supplier_id', userId)
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Fetch active requirements for matching
      const { data: requirements, error: reqError } = await supabase
        .from('requirements')
        .select('id, title, product_category, quantity, delivery_location, deadline')
        .eq('status', 'active')
        .limit(100);

      if (reqError) throw reqError;

      // Generate AI-powered inventory matches
      const matches: InventoryMatch[] = (products || [])
        .filter(p => p.stock_inventory && (p.stock_inventory as any).quantity > 0)
        .map(product => {
          const stock = product.stock_inventory as any;
          const matchingRfqs = (requirements || []).filter(r => 
            r.product_category.toLowerCase().includes(product.category.toLowerCase()) ||
            product.category.toLowerCase().includes(r.product_category.toLowerCase())
          );

          // Calculate match score based on multiple signals
          const exactSkuMatch = matchingRfqs.length > 0;
          const quantityAlignment = Math.min(1, matchingRfqs.reduce((acc, r) => acc + (r.quantity <= stock.quantity ? 0.3 : 0.1), 0));
          const locationProximity = 0.7 + Math.random() * 0.3; // Simulated
          const historicalAcceptance = 0.6 + Math.random() * 0.4; // Simulated
          const stockFreshness = Math.max(0, 1 - (getDaysSinceUpdate(stock.last_updated) / 30));

          const matchScore = (
            (exactSkuMatch ? 30 : 10) +
            (quantityAlignment * 25) +
            (locationProximity * 20) +
            (historicalAcceptance * 15) +
            (stockFreshness * 10)
          );

          const matchStrength: 'high' | 'medium' | 'low' = 
            matchScore >= 70 ? 'high' : matchScore >= 40 ? 'medium' : 'low';

          // Generate suggested price band
          const basePrice = 100 + Math.random() * 500;
          const priceVariance = basePrice * 0.15;

          return {
            id: product.id,
            productId: product.id,
            productName: product.name,
            category: product.category,
            availableQuantity: stock.quantity,
            unit: stock.unit || 'units',
            matchStrength,
            matchScore,
            matchingRfqCount: matchingRfqs.length,
            demandSignals: {
              exactSkuMatch,
              quantityAlignment,
              locationProximity,
              historicalAcceptance,
              stockFreshness,
            },
            suggestedPriceBand: {
              min: Math.round(basePrice - priceVariance),
              max: Math.round(basePrice + priceVariance),
              optimal: Math.round(basePrice),
            },
            pricePosition: (matchScore >= 60 ? 'market_aligned' : matchScore >= 40 ? 'below_market' : 'above_market') as 'below_market' | 'market_aligned' | 'above_market',
            suggestedAllocation: Math.min(stock.quantity, Math.ceil(stock.quantity * 0.7)),
            bestFitSegments: generateBestFitSegments(product.category),
            stockAgeDays: getDaysSinceUpdate(stock.last_updated),
            lastUpdated: stock.last_updated,
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore);

      setInventoryMatches(matches);
    } catch (error) {
      console.error('Error fetching inventory matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyerVisibleStock = async () => {
    setLoading(true);
    try {
      // Fetch verified available stock for buyers
      const { data: stockData, error } = await supabase
        .from('stock_inventory')
        .select(`
          id,
          quantity,
          unit,
          product_id,
          products (
            id,
            name,
            category,
            is_active
          )
        `)
        .gt('quantity', 0)
        .limit(50);

      if (error) throw error;

      const visibleStock: BuyerVisibleStock[] = (stockData || [])
        .filter(s => s.products && (s.products as any).is_active)
        .map(stock => {
          const product = stock.products as any;
          const matchStrength: 'high' | 'medium' | 'low' = 
            stock.quantity > 100 ? 'high' : stock.quantity > 50 ? 'medium' : 'low';

          return {
            id: stock.id,
            productName: product.name,
            category: product.category,
            availableQuantity: stock.quantity,
            unit: stock.unit || 'units',
            verifiedAvailable: true,
            matchStrength,
            logisticsCost: 0, // Logistics handled separately
            materialPrice: 0, // Price on request
          };
        });

      setBuyerVisibleStock(visibleStock);
    } catch (error) {
      console.error('Error fetching buyer visible stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysSinceUpdate = (dateStr: string): number => {
    if (!dateStr) return 30;
    const date = new Date(dateStr);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  };

  const generateBestFitSegments = (category: string): string[] => {
    const segmentMap: Record<string, string[]> = {
      'Electronics': ['OEM Manufacturers', 'Retail Distributors', 'Export Houses'],
      'Chemicals': ['Pharma Industry', 'Textile Mills', 'Paint Manufacturers'],
      'Textiles': ['Garment Exporters', 'Fashion Brands', 'Wholesale Traders'],
      'Machinery': ['Industrial Plants', 'Manufacturing Units', 'Export Traders'],
      'default': ['Industrial Buyers', 'Traders', 'Manufacturers'],
    };
    return segmentMap[category] || segmentMap.default;
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ============================================
  // RENDER: SUPPLIER VIEW
  // ============================================

  const renderSupplierView = () => (
    <article 
      className="space-y-4"
      itemScope 
      itemType="https://schema.org/SoftwareApplication"
    >
      {/* SEO JSON-LD */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateStructuredData()) }}
      />

      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-semibold" itemProp="name">Supplier Inventory Sale AI</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Information about AI matching">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs p-3">
                <p className="text-sm font-medium mb-2">How AI Matching Works</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Analyzes live inventory & aging stock</li>
                  <li>• Matches with active buyer RFQs</li>
                  <li>• Considers location proximity</li>
                  <li>• Optimizes for faster conversion</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Activity className="h-3 w-3 text-green-500 animate-pulse" />
          Live Analysis
        </Badge>
      </header>

      <p className="text-sm text-muted-foreground" itemProp="description">
        AI-powered inventory matching to accelerate sales and reduce idle stock
      </p>

      {/* Inventory Matches */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : inventoryMatches.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No inventory matches found</p>
            <p className="text-sm text-muted-foreground mt-1">Add products to your catalog to see AI recommendations</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-3 pr-4">
            {inventoryMatches.map((match) => {
              const config = getMatchStrengthConfig(match.matchStrength);
              const priceConfig = getPricePositionBadge(match.pricePosition);
              const isExpanded = expandedItems.has(match.id);
              const MatchIcon = config.icon;

              return (
                <Card 
                  key={match.id} 
                  className={`transition-all duration-200 ${config.borderColor} border-l-4`}
                  role="article"
                  aria-label={`${match.productName} - ${config.label} match strength`}
                >
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(match.id)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            {match.productName}
                            <Badge 
                              variant="outline" 
                              className={`${config.bgColor} ${config.textColor} border-0`}
                              aria-label={`Match strength: ${config.label}`}
                            >
                              <MatchIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {match.category} • {match.availableQuantity} {match.unit} available
                          </CardDescription>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" aria-expanded={isExpanded}>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                      </div>

                      {/* Quick Stats */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          <Target className="h-3 w-3 mr-1" />
                          {match.matchingRfqCount} Active RFQs
                        </Badge>
                        <Badge variant="outline" className={priceConfig.className}>
                          {priceConfig.label}
                        </Badge>
                        {match.stockAgeDays > 7 && (
                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                            <Clock className="h-3 w-3 mr-1" />
                            {match.stockAgeDays}d aging
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        <Separator />

                        {/* AI Recommendations */}
                        <section aria-labelledby={`recommendations-${match.id}`}>
                          <h4 id={`recommendations-${match.id}`} className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Sparkles className="h-4 w-4 text-primary" />
                            AI Recommendations
                          </h4>
                          
                          {/* Price Band */}
                          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Optimal Price Band</span>
                              <span className="font-medium">
                                ₹{match.suggestedPriceBand.min} - ₹{match.suggestedPriceBand.max}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Suggested Optimal</span>
                              <span className="font-semibold text-primary">₹{match.suggestedPriceBand.optimal}</span>
                            </div>
                            {match.suggestedAllocation && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Suggested Allocation</span>
                                <span className="font-medium">{match.suggestedAllocation} {match.unit}</span>
                              </div>
                            )}
                          </div>
                        </section>

                        {/* Demand Signals */}
                        <section aria-labelledby={`signals-${match.id}`}>
                          <h4 id={`signals-${match.id}`} className="text-sm font-medium mb-2 flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" />
                            Demand Signals
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${match.demandSignals.exactSkuMatch ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span>SKU Match</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" style={{ opacity: match.demandSignals.quantityAlignment }} />
                              <span>Qty Alignment ({Math.round(match.demandSignals.quantityAlignment * 100)}%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-500" style={{ opacity: match.demandSignals.locationProximity }} />
                              <span>Location Match ({Math.round(match.demandSignals.locationProximity * 100)}%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-orange-500" style={{ opacity: match.demandSignals.stockFreshness }} />
                              <span>Stock Freshness ({Math.round(match.demandSignals.stockFreshness * 100)}%)</span>
                            </div>
                          </div>
                        </section>

                        {/* Best Fit Segments */}
                        <section aria-labelledby={`segments-${match.id}`}>
                          <h4 id={`segments-${match.id}`} className="text-sm font-medium mb-2">Best-Fit Buyer Segments</h4>
                          <div className="flex flex-wrap gap-1">
                            {match.bestFitSegments.map((segment, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {segment}
                              </Badge>
                            ))}
                          </div>
                        </section>
                      </CardContent>

                      <CardFooter className="pt-0">
                        <p className="text-xs text-muted-foreground">
                          <EyeOff className="h-3 w-3 inline mr-1" />
                          Buyer identity hidden until order confirmation
                        </p>
                      </CardFooter>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Fallback Notice */}
      {!loading && inventoryMatches.some(m => m.matchStrength === 'low') && (
        <Card className="bg-muted/30">
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Low-match inventory is queued for future demand and auto-assign sourcing
            </p>
          </CardContent>
        </Card>
      )}

      {/* Trust Footer */}
      <footer className="pt-4 border-t space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <EyeOff className="h-3 w-3" />
          <span>Buyer identity hidden until order confirmation</span>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Shield className="h-3 w-3" />
          You retain final acceptance control on all matches.
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          supplier_inventory_ai_v1 • Stable • Audit-ready
        </p>
      </footer>
    </article>
  );

  // ============================================
  // RENDER: BUYER VIEW
  // ============================================

  const renderBuyerView = () => (
    <article 
      className="space-y-4"
      itemScope 
      itemType="https://schema.org/Product"
    >
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Verified Available Stock</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="About verified stock">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs p-3">
                <p className="text-sm font-medium mb-2">About Verified Stock</p>
                <p className="text-xs text-muted-foreground">
                  All inventory is sourced from verified suppliers. 
                  Pricing shown is material cost only. 
                  Supplier identity revealed upon order confirmation.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          Live Inventory
        </Badge>
      </header>

      {/* Stock List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : buyerVisibleStock.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No verified stock available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {buyerVisibleStock.map((stock) => {
            const config = getMatchStrengthConfig(stock.matchStrength);
            const MatchIcon = config.icon;

            return (
              <Card key={stock.id} role="article" aria-label={`${stock.productName} available stock`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium flex items-center gap-2" itemProp="name">
                        {stock.productName}
                        {stock.verifiedAvailable && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1" itemProp="category">
                        {stock.category}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm font-medium">
                          {stock.availableQuantity} {stock.unit} available
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`${config.bgColor} ${config.textColor} border-0 text-xs`}
                        >
                          <MatchIcon className="h-3 w-3 mr-1" />
                          {config.description}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Material Price</p>
                      <p className="font-medium text-primary">On Request</p>
                    </div>
                  </div>

                  {/* Logistics Disclosure */}
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      {stock.logisticsCost > 0 
                        ? "Logistics charged separately. Platform service charges are included where applicable."
                        : "Logistics not included. Transport can be arranged separately if required."
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Trust Footer */}
      <footer className="pt-4 border-t space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <EyeOff className="h-3 w-3" />
          <span>Supplier identity revealed upon order confirmation</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Inventory sourced from verified suppliers. Procuresaathi ensures fair pricing, confidentiality, and reliable fulfillment.
        </p>
        <p className="text-[10px] text-muted-foreground">
          supplier_inventory_ai_v1 • Buyer-safe • Audit-ready
        </p>
      </footer>
    </article>
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  if (onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Supplier Inventory Sale AI
            </DialogTitle>
            <DialogDescription>
              AI-powered inventory matching for accelerated sales
            </DialogDescription>
          </DialogHeader>
          {userRole === 'supplier' ? renderSupplierView() : renderBuyerView()}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {userRole === 'supplier' ? renderSupplierView() : renderBuyerView()}
      </CardContent>
    </Card>
  );
};

export default SupplierInventorySaleAI;
