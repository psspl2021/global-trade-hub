import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  TrendingUp, 
  Package, 
  IndianRupee,
  Upload,
  ChevronRight
} from 'lucide-react';

interface PerformanceData {
  totalDeals: number;
  totalUnitsSold: number;
  totalRevenue: number;
  productCount: number;
}

interface SupplierAIPerformanceCardProps {
  userId: string;
  onOpenCatalog?: () => void;
}

export function SupplierAIPerformanceCard({ userId, onOpenCatalog }: SupplierAIPerformanceCardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PerformanceData | null>(null);

  useEffect(() => {
    fetchPerformanceData();
  }, [userId]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // Fetch from the supplier_inventory_performance view
      const { data: perfData, error } = await supabase
        .from('supplier_inventory_performance')
        .select('deals_closed, units_sold, revenue_earned')
        .eq('supplier_id', userId);

      if (error) throw error;

      // Aggregate the data
      const aggregated = (perfData || []).reduce(
        (acc, item) => ({
          totalDeals: acc.totalDeals + (Number(item.deals_closed) || 0),
          totalUnitsSold: acc.totalUnitsSold + (Number(item.units_sold) || 0),
          totalRevenue: acc.totalRevenue + (Number(item.revenue_earned) || 0),
          productCount: acc.productCount + 1,
        }),
        { totalDeals: 0, totalUnitsSold: 0, totalRevenue: 0, productCount: 0 }
      );

      setData(aggregated);
    } catch (error) {
      console.error('Error fetching AI performance:', error);
      setData({ totalDeals: 0, totalUnitsSold: 0, totalRevenue: 0, productCount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toFixed(0)}`;
  };

  if (loading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasActivity = data && (data.totalDeals > 0 || data.productCount > 0);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Inventory Performance</CardTitle>
              <CardDescription className="text-xs">
                Sales driven by AI-matched buyer demand
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {hasActivity ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-background rounded-lg p-3 border text-center">
                <div className="text-2xl font-bold text-primary">
                  {data.totalDeals}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Deals Closed
                </div>
              </div>
              
              <div className="bg-background rounded-lg p-3 border text-center">
                <div className="text-2xl font-bold text-primary">
                  {data.totalUnitsSold.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Units Sold
                </div>
              </div>
              
              <div className="bg-background rounded-lg p-3 border text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.totalRevenue)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Revenue Earned
                </div>
              </div>
            </div>

            {/* Products tracked */}
            <div className="flex items-center justify-between text-sm bg-muted/30 rounded-lg px-3 py-2">
              <span className="text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Products tracked by AI
              </span>
              <span className="font-medium">{data.productCount}</span>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No AI-driven sales yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload inventory to get AI-matched buyer orders
              </p>
            </div>
          </div>
        )}

        {/* CTA */}
        {onOpenCatalog && (
          <Button 
            variant={hasActivity ? "outline" : "default"}
            className="w-full gap-2"
            onClick={onOpenCatalog}
          >
            <Upload className="h-4 w-4" />
            {hasActivity ? 'Upload more inventory for AI orders' : 'Upload inventory to start'}
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}