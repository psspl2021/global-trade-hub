import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, Brain, TrendingUp, IndianRupee, Package, 
  Users, FileText, RefreshCw, ArrowUpRight, ArrowDownRight,
  Globe, Warehouse, CheckCircle2, Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

interface OverviewMetrics {
  ai_inventory_requirements: number;
  manual_requirements: number;
  total_requirements: number;
  active_buyers: number;
  active_rfqs: number;
  deals_closed: number;
  deals_completed: number;
}

interface ProfitSummary {
  date: string;
  total_profit: number;
  deals_closed: number;
  total_gmv: number;
  avg_margin_per_deal: number;
}

interface DealAnalytics {
  bid_id: string;
  requirement_title: string;
  product_category: string;
  trade_type: string;
  rfq_source: string;
  supplier_name: string;
  deal_value: number;
  platform_margin: number;
  markup_percentage: number;
  bid_status: string;
  dispatched_qty: number;
  quantity: number;
  delivery_location: string;
  bid_created_at: string;
}

interface AIInventorySupplier {
  supplier_id: string;
  supplier_name: string;
  city: string;
  products_uploaded: number;
  total_stock_units: number;
  ai_matched_products: number;
  match_rate_percent: number;
}

interface RevenueByTradeType {
  trade_type: string;
  deals_count: number;
  total_gmv: number;
  total_margin: number;
  avg_margin: number;
  avg_markup_percent: number;
}

interface DailyKPI {
  date: string;
  rfqs_created: number;
  ai_rfqs: number;
  bids_received: number;
  deals_closed: number;
  daily_margin: number;
  unique_buyers: number;
  unique_suppliers: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(142 76% 36%)', 'hsl(38 92% 50%)', 'hsl(280 65% 60%)'];

export function AdminControlTower() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [profitSummary, setProfitSummary] = useState<ProfitSummary[]>([]);
  const [dealAnalytics, setDealAnalytics] = useState<DealAnalytics[]>([]);
  const [aiSuppliers, setAISuppliers] = useState<AIInventorySupplier[]>([]);
  const [revenueByType, setRevenueByType] = useState<RevenueByTradeType[]>([]);
  const [dailyKPIs, setDailyKPIs] = useState<DailyKPI[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all admin views through the secure edge function
      const fetchView = async (view: string, limit = 50) => {
        const { data, error } = await supabase.functions.invoke('admin-analytics', {
          body: { view, limit }
        });
        if (error) throw error;
        return data?.data;
      };

      const [
        overviewData,
        profitData,
        dealsData,
        aiSuppliersData,
        revenueData,
        kpisData
      ] = await Promise.all([
        fetchView('admin_overview_metrics'),
        fetchView('admin_profit_summary', 30),
        fetchView('admin_deal_analytics', 50),
        fetchView('admin_ai_inventory_suppliers', 20),
        fetchView('admin_revenue_by_trade_type'),
        fetchView('admin_daily_kpis', 30),
      ]);

      if (overviewData) setOverview(overviewData);
      if (profitData) setProfitSummary(profitData);
      if (dealsData) setDealAnalytics(dealsData);
      if (aiSuppliersData) setAISuppliers(aiSuppliersData);
      if (revenueData) setRevenueByType(revenueData);
      if (kpisData) setDailyKPIs(kpisData);
    } catch (error) {
      console.error('Error fetching control tower data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount?.toFixed(0) || 0}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short' 
    });
  };

  const totalProfit = profitSummary.reduce((sum, d) => sum + (d.total_profit || 0), 0);
  const totalGMV = profitSummary.reduce((sum, d) => sum + (d.total_gmv || 0), 0);
  const totalDeals = profitSummary.reduce((sum, d) => sum + (d.deals_closed || 0), 0);

  const chartData = dailyKPIs.slice(0, 14).reverse().map(d => ({
    date: formatDate(d.date),
    rfqs: d.rfqs_created,
    aiRfqs: d.ai_rfqs,
    deals: d.deals_closed,
    margin: d.daily_margin || 0
  }));

  const tradeTypePieData = revenueByType.map(r => ({
    name: r.trade_type === 'domestic' ? 'Domestic' : r.trade_type === 'export' ? 'Export' : r.trade_type,
    value: r.total_margin || 0,
    gmv: r.total_gmv || 0,
    deals: r.deals_count
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Admin Control Tower
          </h2>
          <p className="text-muted-foreground">Real-time platform metrics & AI inventory analytics</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total RFQs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview?.total_requirements || 0}</div>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Brain className="h-3 w-3" />
                AI: {overview?.ai_inventory_requirements || 0}
              </span>
              <span className="text-muted-foreground">
                Manual: {overview?.manual_requirements || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Deals Closed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{overview?.deals_closed || 0}</div>
            <div className="text-xs text-muted-foreground mt-2">
              Active RFQs: {overview?.active_rfqs || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-amber-600" />
              Platform Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{formatCurrency(totalProfit)}</div>
            <div className="text-xs text-muted-foreground mt-2">
              GMV: {formatCurrency(totalGMV)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Active Buyers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{overview?.active_buyers || 0}</div>
            <div className="text-xs text-muted-foreground mt-2">
              Completed: {overview?.deals_completed || 0} deals
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-inventory">AI Inventory</TabsTrigger>
          <TabsTrigger value="deals">Deal Analytics</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Leaderboard</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Daily Trend Chart */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Daily Performance (Last 14 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis yAxisId="left" className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="rfqs" name="RFQs" stroke="hsl(var(--primary))" strokeWidth={2} />
                      <Line yAxisId="left" type="monotone" dataKey="aiRfqs" name="AI RFQs" stroke="hsl(280 65% 60%)" strokeWidth={2} />
                      <Line yAxisId="left" type="monotone" dataKey="deals" name="Deals" stroke="hsl(142 76% 36%)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Trade Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Margin by Trade Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tradeTypePieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {tradeTypePieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {revenueByType.map((r, i) => (
                    <div key={r.trade_type} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="capitalize">{r.trade_type}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(r.total_margin || 0)}</div>
                        <div className="text-xs text-muted-foreground">{r.deals_count} deals</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Profit Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Recent Profit (Daily)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead className="text-right">GMV</TableHead>
                        <TableHead className="text-right">Deals</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profitSummary.slice(0, 10).map((row) => (
                        <TableRow key={row.date}>
                          <TableCell>{formatDate(row.date)}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(row.total_profit || 0)}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(row.total_gmv || 0)}</TableCell>
                          <TableCell className="text-right">{row.deals_closed}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Inventory Tab */}
        <TabsContent value="ai-inventory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-purple-500/20 bg-purple-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  AI RFQs Generated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {overview?.ai_inventory_requirements || 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {overview?.total_requirements ? 
                    ((overview.ai_inventory_requirements / overview.total_requirements) * 100).toFixed(1) : 0}% of total
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Warehouse className="h-4 w-4" />
                  Suppliers Using AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{aiSuppliers.length}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  With inventory uploads
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Products Matched
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {aiSuppliers.reduce((sum, s) => sum + (s.ai_matched_products || 0), 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  AI inventory matches
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI Inventory Adoption by Supplier</CardTitle>
              <CardDescription>Suppliers with active inventory and AI match rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">Products</TableHead>
                      <TableHead className="text-right">Stock Units</TableHead>
                      <TableHead className="text-right">AI Matches</TableHead>
                      <TableHead className="text-right">Match Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aiSuppliers.map((supplier) => (
                      <TableRow key={supplier.supplier_id}>
                        <TableCell className="font-medium">{supplier.supplier_name || 'Unknown'}</TableCell>
                        <TableCell>{supplier.city || '-'}</TableCell>
                        <TableCell className="text-right">{supplier.products_uploaded}</TableCell>
                        <TableCell className="text-right">{Number(supplier.total_stock_units).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={supplier.ai_matched_products > 0 ? 'default' : 'secondary'}>
                            {supplier.ai_matched_products}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={supplier.match_rate_percent > 50 ? 'text-green-600 font-medium' : ''}>
                            {supplier.match_rate_percent}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Closed Deals</CardTitle>
              <CardDescription>Deal-level analytics with margin visibility</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requirement</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Trade</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Deal Value</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead className="text-right">Markup %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dealAnalytics.map((deal) => (
                      <TableRow key={deal.bid_id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {deal.requirement_title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{deal.product_category}</Badge>
                        </TableCell>
                        <TableCell>{deal.supplier_name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant={deal.trade_type === 'export' ? 'default' : 'secondary'}>
                            {deal.trade_type || 'domestic'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {deal.rfq_source === 'ai_inventory' ? (
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                              <Brain className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          ) : (
                            <Badge variant="outline">Manual</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(deal.deal_value || 0)}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {formatCurrency(deal.platform_margin || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {deal.markup_percentage ? `${deal.markup_percentage.toFixed(1)}%` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplier Leaderboard Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                  Top Suppliers by AI Match Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiSuppliers
                    .filter(s => s.match_rate_percent > 0)
                    .sort((a, b) => b.match_rate_percent - a.match_rate_percent)
                    .slice(0, 5)
                    .map((supplier, index) => (
                      <div key={supplier.supplier_id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{supplier.supplier_name || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground">{supplier.city}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{supplier.match_rate_percent}%</div>
                          <div className="text-xs text-muted-foreground">{supplier.ai_matched_products} matches</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-blue-600" />
                  Top Suppliers by Stock Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiSuppliers
                    .sort((a, b) => Number(b.total_stock_units) - Number(a.total_stock_units))
                    .slice(0, 5)
                    .map((supplier, index) => (
                      <div key={supplier.supplier_id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-sm font-bold text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{supplier.supplier_name || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground">{supplier.products_uploaded} products</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">
                            {Number(supplier.total_stock_units).toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">units</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
