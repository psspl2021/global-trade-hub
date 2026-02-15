/**
 * Spend Analytics Dashboard — Phase 2
 * Buyer, Supplier, and Admin metrics from SQL RPCs.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Users, Building2, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBuyerSpend, useSupplierPerformance, useAdminPlatformMetrics } from '@/hooks/useSpendAnalytics';

function formatCurrency(val: number) {
  if (!val) return '₹0';
  return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function NoData() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-50" />
      Insufficient Data
    </div>
  );
}

function BuyerSpendView() {
  const { user } = useAuth();
  const [days, setDays] = useState(90);
  const { data, loading } = useBuyerSpend(user?.id, days);

  if (loading) return <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;
  if (!data || data.total_spend === 0) return <NoData />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 Days</SelectItem>
            <SelectItem value="90">90 Days</SelectItem>
            <SelectItem value="365">YTD</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Spend" value={formatCurrency(data.total_spend)} sub={`${data.period_days}d period`} />
        <MetricCard label="Avg Credit Days" value={`${Math.round(data.avg_credit_days)} days`} />
        <MetricCard label="Active Lanes" value={String(data.active_lanes)} />
        <MetricCard label="Closed Lanes" value={String(data.closed_lanes)} />
      </div>
      {data.spend_by_category.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Spend by Category</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.spend_by_category.map((c, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{c.category || 'Unknown'}</span>
                  <span className="font-semibold">{formatCurrency(c.spend)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {data.spend_by_country.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Spend by Country</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.spend_by_country.map((c, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{c.country || 'Unknown'}</span>
                  <span className="font-semibold">{formatCurrency(c.spend)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SupplierPerformanceView() {
  const { user } = useAuth();
  const { data, loading } = useSupplierPerformance(user?.id);

  if (loading) return <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;
  if (!data || data.total_bids === 0) return <NoData />;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard label="Total Volume Supplied" value={formatCurrency(data.total_volume_supplied)} />
      <MetricCard label="Win Rate" value={`${data.win_rate}%`} sub={`${data.won_bids}/${data.total_bids} bids`} />
      <MetricCard label="Avg Deal Size" value={formatCurrency(data.avg_deal_size)} />
      <MetricCard label="Total Bids" value={String(data.total_bids)} />
    </div>
  );
}

function AdminMetricsView() {
  const [days, setDays] = useState(90);
  const { data, loading } = useAdminPlatformMetrics(days);

  if (loading) return <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;
  if (!data) return <NoData />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 Days</SelectItem>
            <SelectItem value="90">90 Days</SelectItem>
            <SelectItem value="365">YTD</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard label="Total Platform Margin" value={formatCurrency(data.total_platform_margin)} />
        <MetricCard label="Categories Tracked" value={String(data.margin_by_category.length)} />
        <MetricCard label="Countries Active" value={String(data.margin_by_country.length)} />
      </div>
      {data.margin_by_category.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Margin by Category</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.margin_by_category.map((c, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{c.category || 'Unknown'}</span>
                  <span className="font-semibold">{formatCurrency(c.margin)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {data.risk_concentration_top3.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Risk Concentration (Top 3 Buyers)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.risk_concentration_top3.map((r, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="font-mono text-xs">{r.buyer_id?.slice(0, 8)}</span>
                  <span>{formatCurrency(r.revenue)} <Badge variant="outline" className="ml-1">{r.pct}%</Badge></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function SpendAnalyticsDashboard() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Spend Analytics</h2>
          <p className="text-xs text-muted-foreground">SQL-derived intelligence — no static values</p>
        </div>
      </div>
      
      <Tabs defaultValue="admin" className="space-y-4">
        <TabsList>
          <TabsTrigger value="admin" className="gap-1">
            <Building2 className="h-3 w-3" /> Admin
          </TabsTrigger>
          <TabsTrigger value="buyer" className="gap-1">
            <Users className="h-3 w-3" /> Buyer
          </TabsTrigger>
          <TabsTrigger value="supplier" className="gap-1">
            <TrendingUp className="h-3 w-3" /> Supplier
          </TabsTrigger>
        </TabsList>
        <TabsContent value="admin"><AdminMetricsView /></TabsContent>
        <TabsContent value="buyer"><BuyerSpendView /></TabsContent>
        <TabsContent value="supplier"><SupplierPerformanceView /></TabsContent>
      </Tabs>
    </div>
  );
}
