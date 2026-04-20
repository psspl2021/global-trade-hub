/**
 * Monthly Savings Analytics — Enterprise procurement analytics dashboard
 * Inspired by SAP Ariba Cost Savings layout
 * Shows: KPI summary, monthly savings bar chart, sourcing spend trend
 */
import { useEffect, useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, Legend, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, IndianRupee, BarChart3, Calendar, Target, Trophy, Gauge, Zap, ChevronDown, Flame, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBuyerCompanyContext } from '@/hooks/useBuyerCompanyContext';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { formatCompact as sharedFormatCompact, formatCurrency as sharedFormatCurrency, useCurrencyFormatter } from '@/lib/currency';

interface MonthlyData {
  month: string;
  monthLabel: string;
  savings: number;
  spend: number;
  auctionCount: number;
}

function formatCompact(value: number, currency: string = 'INR') {
  return sharedFormatCompact(value, currency);
}

function formatINR(value: number, currency: string = 'INR') {
  return sharedFormatCurrency(value, currency);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
          {entry.name}: {formatINR(entry.value)}
        </p>
      ))}
    </div>
  );
};

export function MonthlySavingsAnalytics() {
  const { currency: orgCurrency, symbol: orgSymbol } = useCurrencyFormatter();
  const { user } = useAuth();
  const { selectedPurchaserId } = useBuyerCompanyContext();
  const [auctions, setAuctions] = useState<any[]>([]);
  const [allAuctions, setAllAuctions] = useState<any[]>([]);
  const [supplierCount, setSupplierCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showExpanded, setShowExpanded] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      const requestId = ++requestIdRef.current;
      const shouldApply = () => requestIdRef.current === requestId;

      setAuctions([]);
      setAllAuctions([]);
      setLoading(true);

      const sixMonthsAgoIso = subMonths(new Date(), 6).toISOString();
      // Fetch full scoped set once via shared deduped fetcher; derive the
      // 6-month window client-side instead of issuing a second RPC call.
      const { fetchScopedAuctions } = await import('@/hooks/useScopedAuctions');
      const all = await fetchScopedAuctions({
        p_user_id: user.id,
        p_selected_purchaser: selectedPurchaserId,
      });
      if (!shouldApply()) return;

      const cutoff = new Date(sixMonthsAgoIso).getTime();
      const recent = all
        .filter((a: any) => new Date(a.created_at).getTime() >= cutoff)
        .slice()
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      setAuctions(recent);
      setAllAuctions(all);
      setLoading(false);

      const { data: supplierData } = await supabase
        .from('buyer_suppliers')
        .select('id')
        .eq('buyer_id', user.id);

      if (!shouldApply()) return;
      setSupplierCount((supplierData || []).length);
    };

    fetchData();
  }, [user?.id, selectedPurchaserId]);

  // All-time stats from allAuctions
  const { activeCount, allTimeSavings, allTimeSpend } = useMemo(() => {
    let active = 0, savings = 0, spend = 0;
    allAuctions.forEach((a) => {
      const qty = a.quantity || 1;
      const final = a.status === 'completed' ? (a.winning_bid ?? a.current_price) : a.current_price;
      if (final) spend += final * qty;
      if (a.status === 'live') active++;
      if (final && a.starting_price && final < a.starting_price) savings += (a.starting_price - final) * qty;
    });
    return { activeCount: active, allTimeSavings: savings, allTimeSpend: spend };
  }, [allAuctions]);

  const { monthlyData, totalSavings, totalSpend, avgSavingsPct, completedCount, bestMonth, savingsEfficiency, avgPerAuction, trend } = useMemo(() => {
    const monthMap = new Map<string, MonthlyData>();

    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, 'yyyy-MM');
      monthMap.set(key, {
        month: key,
        monthLabel: format(d, 'MMM yyyy'),
        savings: 0,
        spend: 0,
        auctionCount: 0,
      });
    }

    let totalSav = 0;
    let totalSpd = 0;
    let completed = 0;
    let savingsPctSum = 0;

    auctions.forEach((a) => {
      const monthKey = format(parseISO(a.created_at), 'yyyy-MM');
      const entry = monthMap.get(monthKey);
      if (!entry) return;

      entry.auctionCount += 1;

      const finalPrice =
        a.status === 'completed'
          ? (a.winning_bid ?? a.current_price)
          : a.current_price;

      const qty = a.quantity || 1;
      const spend = (finalPrice || 0) * qty;
      entry.spend += spend;
      totalSpd += spend;

      if (finalPrice && a.starting_price && finalPrice < a.starting_price) {
        const saving = (a.starting_price - finalPrice) * qty;
        entry.savings += saving;
        totalSav += saving;
        if (a.status === 'completed') {
          completed++;
          savingsPctSum += ((a.starting_price - finalPrice) / a.starting_price) * 100;
        }
      }
    });

    const data = Array.from(monthMap.values());
    const best = data.reduce((max, m) => (m.savings > max.savings ? m : max), data[0]);

    const lastM = data[data.length - 1];
    const prevM = data[data.length - 2];
    const trendDir = lastM && prevM ? (lastM.savings >= prevM.savings ? 'up' : 'down') : 'up';

    return {
      monthlyData: data,
      totalSavings: totalSav,
      totalSpend: totalSpd,
      avgSavingsPct: completed > 0 ? savingsPctSum / completed : 0,
      completedCount: completed,
      bestMonth: best,
      savingsEfficiency: totalSpd > 0 ? (totalSav / totalSpd) * 100 : 0,
      avgPerAuction: completed > 0 ? totalSav / completed : 0,
      trend: trendDir as 'up' | 'down',
    };
  }, [auctions]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm animate-pulse">
          Loading savings analytics…
        </div>
      </Card>
    );
  }

  const hasData = auctions.length > 0;

  if (!hasData) {
    return (
      <Card className="p-4 border-l-4 border-l-emerald-500/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/70 to-teal-600/70 shadow-sm">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Cost Savings</p>
            <p className="text-[11px] text-muted-foreground">
              {selectedPurchaserId
                ? 'No reverse auction savings recorded for this purchaser in the last 6 months.'
                : 'Procurement savings from Reverse Auctions — last 6 months'}
            </p>
          </div>
          <Badge variant="outline" className="text-xs text-muted-foreground">No data yet</Badge>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Clickable Cost Savings Card */}
      <Card
        variant="interactive"
        className={`p-4 group hover:shadow-md transition-all cursor-pointer border-l-4 border-l-emerald-500 ${showExpanded ? 'ring-1 ring-emerald-500/20' : ''}`}
        onClick={() => setShowExpanded(!showExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Cost Savings</p>
            <p className="text-[11px] text-muted-foreground">Procurement savings from Reverse Auctions — last 6 months</p>
          </div>
          {totalSavings > 0 && (
            <Badge variant="outline" className="text-xs font-bold text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400 mr-2">
              {formatCompact(totalSavings)} saved
            </Badge>
          )}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showExpanded ? 'rotate-180' : ''}`} />
        </div>
      </Card>

      {/* Expanded Content */}
      {showExpanded && (
        <div className="space-y-4">
          {/* Savings Narrative — scannable chips */}
          {totalSavings > 0 && (
            <div className="rounded-lg border bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 px-4 py-3">
               <div className="flex flex-wrap items-center gap-2 text-sm">
                 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold">
                   <IndianRupee className="w-4 h-4" />
                   {formatCompact(totalSavings)} saved
                 </span>
                 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
                   <Calendar className="w-4 h-4" />
                   6 months
                 </span>
                 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
                   <BarChart3 className="w-4 h-4" />
                   {completedCount} auctions
                 </span>
                 {bestMonth && bestMonth.savings > 0 && (
                   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary font-medium">
                     <Trophy className="w-4 h-4" />
                     Best: {formatCompact(bestMonth.savings)} ({bestMonth.monthLabel})
                   </span>
                 )}
                 {savingsEfficiency > 0 && (
                   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-medium">
                     <Gauge className="w-4 h-4" />
                     {savingsEfficiency.toFixed(1)}% efficiency
                   </span>
                 )}
                 {avgPerAuction > 0 && (
                   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
                     <Zap className="w-4 h-4" />
                     Avg {formatCompact(avgPerAuction)}/auction
                   </span>
                 )}
                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                   {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                   {trend === 'up' ? 'improving' : 'declining'}
                </span>
              </div>
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3.5 border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 rounded-[0.625rem]">
          <div className="flex items-center gap-1.5 mb-1">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Savings</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formatCompact(allTimeSavings)}</p>
          <span className="text-xs text-muted-foreground">All time</span>
        </Card>

        <Card className="p-3.5 border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 rounded-[0.625rem]">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Active Auctions</span>
          </div>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{activeCount}</p>
          <span className="text-xs text-muted-foreground">Live now</span>
        </Card>

        <Card className="p-3.5 border bg-primary/5 border-primary/20 rounded-[0.625rem]">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Spend</span>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCompact(allTimeSpend)}</p>
          <span className="text-xs text-muted-foreground">{allAuctions.length} auctions</span>
        </Card>

        <Card className="p-3.5 border bg-violet-50/50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800 rounded-[0.625rem]">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Suppliers</span>
          </div>
          <p className="text-2xl font-bold text-violet-700 dark:text-violet-400">{supplierCount}</p>
          <span className="text-xs text-muted-foreground">Total added</span>
        </Card>

        <Card className="p-3.5 border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 rounded-[0.625rem]">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Avg Reduction</span>
          </div>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{avgSavingsPct.toFixed(1)}%</p>
          <span className="text-xs text-muted-foreground">per auction</span>
        </Card>

        <Card className="p-3.5 border bg-violet-50/50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800 rounded-[0.625rem]">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Completed</span>
          </div>
          <p className="text-2xl font-bold text-violet-700 dark:text-violet-400">{completedCount}</p>
          <span className="text-xs text-muted-foreground">of {allAuctions.length} total</span>
        </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Savings Bar Chart */}
        <Card className="rounded-[0.625rem]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Sourcing Savings from Auctions
               <span className="text-[10px] text-muted-foreground font-normal ml-auto">in {orgSymbol}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCompact(v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="savings"
                  name="Savings"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                >
                  {monthlyData.map((entry, index) => {
                    const isLatest = index === monthlyData.length - 1;
                    const isBest = bestMonth && entry.month === bestMonth.month && entry.savings > 0;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.savings > 0 ? 'hsl(142, 76%, 36%)' : 'hsl(var(--muted))'}
                        fillOpacity={isLatest || isBest ? 1 : entry.savings > 0 ? 0.55 : 0.3}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sourcing Spend Trend */}
        <Card className="rounded-[0.625rem]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-primary" />
              Addressable Spend Under Management
              <span className="text-[10px] text-muted-foreground font-normal ml-auto">in {orgSymbol}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCompact(v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="spend"
                  name="Spend"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#spendGrad)"
                  dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
          </Card>
          </div>
        </div>
      )}
    </div>
  );
}
