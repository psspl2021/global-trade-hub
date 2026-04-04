/**
 * Monthly Savings Analytics — Enterprise procurement analytics dashboard
 * Inspired by SAP Ariba Cost Savings layout
 * Shows: KPI summary, monthly savings bar chart, sourcing spend trend
 */
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, Legend, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, IndianRupee, BarChart3, Calendar, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';

interface MonthlyData {
  month: string;
  monthLabel: string;
  savings: number;
  spend: number;
  auctionCount: number;
}

function formatCompact(value: number) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${Math.round(value)}`;
}

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
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
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchAuctions = async () => {
      const sixMonthsAgo = subMonths(new Date(), 6).toISOString();
      const { data } = await supabase
        .from('reverse_auctions')
        .select('id, status, starting_price, current_price, winning_bid, quantity, auction_end, created_at, currency')
        .eq('buyer_id', user.id)
        .gte('created_at', sixMonthsAgo)
        .order('created_at', { ascending: true });

      setAuctions(data || []);
      setLoading(false);
    };

    fetchAuctions();
  }, [user?.id]);

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

  if (auctions.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Savings Narrative — scannable chips */}
      {totalSavings > 0 && (
        <div className="rounded-lg border bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              {formatCompact(totalSavings)} saved
            </span>
            <span className="text-muted-foreground">over 6 months</span>
            <span className="text-muted-foreground">• {completedCount} auctions</span>
            {bestMonth && bestMonth.savings > 0 && (
              <span className="text-primary font-medium">
                • Best: {formatCompact(bestMonth.savings)} ({bestMonth.monthLabel})
              </span>
            )}
            {savingsEfficiency > 0 && (
              <span className="text-violet-600 dark:text-violet-400 font-medium">
                • {savingsEfficiency.toFixed(1)}% efficiency
              </span>
            )}
            {avgPerAuction > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                • Avg {formatCompact(avgPerAuction)}/auction
              </span>
            )}
            <span className={trend === 'up' ? 'text-emerald-600 font-medium' : 'text-destructive font-medium'}>
              {trend === 'up' ? '↑ improving' : '↓ declining'}
            </span>
          </div>
        </div>
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Cost Savings
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Procurement savings from Reverse Auctions — last 6 months
          </p>
        </div>
        <Badge variant="outline" className="text-xs gap-1">
          <Calendar className="w-3 h-3" />
          6-Month View
        </Badge>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3.5 border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 rounded-[0.625rem]">
          <div className="flex items-center gap-1.5 mb-1">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Savings</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formatCompact(totalSavings)}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span className="text-xs text-emerald-600 font-medium">realized</span>
          </div>
        </Card>

        <Card className="p-3.5 border bg-primary/5 border-primary/20 rounded-[0.625rem]">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Sourcing Spend</span>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCompact(totalSpend)}</p>
          <span className="text-xs text-muted-foreground">{auctions.length} auctions</span>
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
          <span className="text-xs text-muted-foreground">of {auctions.length} total</span>
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
              <span className="text-[10px] text-muted-foreground font-normal ml-auto">in ₹</span>
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
              <span className="text-[10px] text-muted-foreground font-normal ml-auto">in ₹</span>
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
  );
}
