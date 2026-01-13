import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, TrendingUp, Package, DollarSign, ShoppingCart, Upload } from 'lucide-react';

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
  const [showStatsDialog, setShowStatsDialog] = useState(false);

  useEffect(() => {
    fetchPerformanceData();
  }, [userId]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const { data: perfData, error } = await supabase
        .from('supplier_inventory_performance')
        .select('deals_closed, units_sold, revenue_earned')
        .eq('supplier_id', userId);

      if (error) throw error;

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
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-40 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasActivity = data && (data.totalDeals > 0 || data.productCount > 0);

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold">AI Performance</CardTitle>
          </div>
          <CardDescription className="text-sm">
            {data && data.totalDeals > 0
              ? `${data.totalDeals} deals · ${formatCurrency(data.totalRevenue)}`
              : '0 deals · ₹0'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="default"
            className="w-full"
            onClick={() => {
              if (hasActivity) {
                setShowStatsDialog(true);
              } else {
                onOpenCatalog?.();
              }
            }}
          >
            {hasActivity ? (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                View Stats
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Stock
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Performance Stats
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="text-sm">Total Deals</span>
                </div>
                <p className="text-2xl font-bold">{data?.totalDeals || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Revenue</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(data?.totalRevenue || 0)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Package className="h-4 w-4" />
                  <span className="text-sm">Units Sold</span>
                </div>
                <p className="text-2xl font-bold">{data?.totalUnitsSold || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Package className="h-4 w-4" />
                  <span className="text-sm">Products</span>
                </div>
                <p className="text-2xl font-bold">{data?.productCount || 0}</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setShowStatsDialog(false);
                onOpenCatalog?.();
              }}
            >
              <Package className="h-4 w-4 mr-2" />
              Open Product Catalog
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
