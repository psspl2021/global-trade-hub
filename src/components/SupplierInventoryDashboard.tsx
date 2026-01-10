import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, IndianRupee, TrendingUp, CheckCircle2, 
  RefreshCw, Brain, Warehouse
} from 'lucide-react';

interface InventoryPerformance {
  product_id: string;
  product_name: string;
  category: string;
  current_stock: number;
  unit: string;
  ai_matches: number;
  deals_closed: number;
  units_sold: number;
  revenue_earned: number;
}

interface DealClosure {
  bid_id: string;
  requirement_title: string;
  product_category: string;
  supplier_receivable: number;
  quantity_sold: number;
  status: string;
  delivery_location: string;
  created_at: string;
}

interface SupplierInventoryDashboardProps {
  userId: string;
}

export function SupplierInventoryDashboard({ userId }: SupplierInventoryDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryPerformance[]>([]);
  const [deals, setDeals] = useState<DealClosure[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inventoryRes, dealsRes] = await Promise.all([
        supabase
          .from('supplier_inventory_performance')
          .select('*')
          .eq('supplier_id', userId),
        supabase
          .from('supplier_deal_closures')
          .select('*')
          .eq('supplier_id', userId)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (inventoryRes.data) setInventory(inventoryRes.data);
      if (dealsRes.data) setDeals(dealsRes.data);
    } catch (error) {
      console.error('Error fetching supplier dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount?.toFixed(0) || 0}`;
  };

  const totalRevenue = inventory.reduce((sum, i) => sum + (Number(i.revenue_earned) || 0), 0);
  const totalUnitsSold = inventory.reduce((sum, i) => sum + (Number(i.units_sold) || 0), 0);
  const totalAIMatches = inventory.reduce((sum, i) => sum + (Number(i.ai_matches) || 0), 0);
  const totalDeals = inventory.reduce((sum, i) => sum + (Number(i.deals_closed) || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Inventory Performance
          </h3>
          <p className="text-sm text-muted-foreground">Track your stock performance and deal closures</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-green-600" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              Deals Closed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalDeals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-600" />
              Units Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{totalUnitsSold.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              AI Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalAIMatches}</div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Performance Table */}
      {inventory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Product Performance
            </CardTitle>
            <CardDescription>Your products and their sales performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">AI Matches</TableHead>
                    <TableHead className="text-right">Deals</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(item.current_stock || 0).toLocaleString()} {item.unit || 'units'}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(item.ai_matches) > 0 && (
                          <Badge className="bg-purple-100 text-purple-800">
                            {item.ai_matches}
                          </Badge>
                        )}
                        {Number(item.ai_matches) === 0 && <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right">{item.deals_closed}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(Number(item.revenue_earned) || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Recent Deals */}
      {deals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Recent Closed Deals
            </CardTitle>
            <CardDescription>Your accepted bids and order closures</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => (
                    <TableRow key={deal.bid_id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {deal.requirement_title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{deal.product_category}</Badge>
                      </TableCell>
                      <TableCell>{deal.delivery_location}</TableCell>
                      <TableCell className="text-right">{deal.quantity_sold || '-'}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(Number(deal.supplier_receivable) || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {deal.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {inventory.length === 0 && deals.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Performance Data Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Start by uploading your product catalog and stock inventory. 
              Our AI will match your products with buyer requirements automatically.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
