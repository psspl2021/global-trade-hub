/**
 * Auction Savings Dashboard — Enterprise procurement analytics
 * Shows savings cards, bid trend chart, and ranked leaderboard for completed auctions
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingDown, TrendingUp, Trophy, IndianRupee, BarChart3, Users } from 'lucide-react';
import { ReverseAuction, ReverseAuctionBid, getRankedBids, RankedBid } from '@/hooks/useReverseAuction';
import { format } from 'date-fns';
import { getPerUnitDisplay } from './utils/getPerUnitDisplay';
import { formatCompact as sharedFormatCompact, getCurrencySymbol, getCurrencyLocale } from '@/lib/currency';

interface AuctionSavingsDashboardProps {
  auction: ReverseAuction;
  bids: ReverseAuctionBid[];
}

function formatINR(value: number | null, currency = 'INR') {
  if (value === null || value === undefined) return '—';
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(Math.floor(value));
  } catch {
    return `${currency} ${Math.floor(value).toLocaleString()}`;
  }
}

function formatINROneDecimal(value: number | null, currency = 'INR') {
  if (value === null || value === undefined) return '—';
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
  } catch {
    return `${currency} ${value.toFixed(1)}`;
  }
}

function formatCompact(value: number, currency: string = 'INR') {
  return sharedFormatCompact(value, currency);
}

const RANK_CONFIG: Record<number, { icon: string; bg: string; text: string; ring: string }> = {
  1: { icon: '🏆', bg: 'bg-amber-50', text: 'text-amber-800', ring: 'ring-amber-300' },
  2: { icon: '🥈', bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-300' },
  3: { icon: '🥉', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-300' },
};

export function AuctionSavingsDashboard({ auction, bids }: AuctionSavingsDashboardProps) {
  const ranked = useMemo(() => getRankedBids(bids), [bids]);
  
  const winningPrice = auction.winning_price || (ranked.length > 0 ? ranked[0].bid_price : null);
  const startingPrice = auction.starting_price;

  const totalSavedRaw = startingPrice && winningPrice ? startingPrice - winningPrice : 0;
  const totalSaved = Math.max(0, totalSavedRaw);
  const savingsPct = startingPrice && totalSaved > 0
    ? ((totalSaved / startingPrice) * 100) : 0;
  // Multi-SKU safety: only show per-unit when all items share the same unit
  const isUniformUnit = true; // Single-unit auctions for now; future: check items
  const savingsPerUnit = isUniformUnit && auction.quantity > 0 ? Math.round((totalSaved / auction.quantity) * 10) / 10 : null;

  // Build savings trend from bid history (cumulative best price over time)
  const savingsChartData = useMemo(() => {
    if (bids.length === 0) return [];
    
    const sorted = [...bids].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    let runningBest = startingPrice;
    
    const points = [{ 
      time: 'Start', 
      price: startingPrice, 
      savings: 0,
      fullTime: auction.auction_start ? format(new Date(auction.auction_start), 'HH:mm:ss') : ''
    }];
    
    sorted.forEach((bid, idx) => {
      if (bid.bid_price < runningBest) {
        runningBest = bid.bid_price;
      }
      const saving = startingPrice - runningBest;
      points.push({
        time: `Bid ${idx + 1}`,
        price: runningBest,
        savings: saving,
        fullTime: format(new Date(bid.created_at), 'HH:mm:ss'),
      });
    });
    
    return points;
  }, [bids, startingPrice, auction.auction_start]);

  const uniqueSuppliers = useMemo(() => new Set(bids.map(b => b.supplier_id)).size, [bids]);

  if (auction.status !== 'completed' && !(auction.auction_end && new Date(auction.auction_end) <= new Date())) {
    return null;
  }

  return (
    <Card className="border-primary/20 overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-emerald-500/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Procurement Savings Report
          </CardTitle>
          <Badge className="bg-emerald-600 text-white font-bold">
            {savingsPct.toFixed(1)}% Saved
          </Badge>
        </div>
        {totalSaved > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            You saved <span className="font-bold text-emerald-700">{formatINR(totalSaved, auction.currency)}</span> on this auction
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {/* Savings Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="rounded-[0.625rem] border bg-card p-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Budget Savings</span>
            </div>
            <p className="text-xl font-bold text-emerald-700">{formatCompact(totalSaved)}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-600">{savingsPct.toFixed(2)}%</span>
            </div>
          </div>

          <div className="rounded-[0.625rem] border bg-card p-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Per Unit Saved</span>
            </div>
            {savingsPerUnit !== null ? (
              (() => {
                const perUnit = getPerUnitDisplay(totalSaved, auction.quantity, auction.currency);
                return (
                  <>
                    <p className={`text-xl font-bold ${perUnit.isLowImpact ? 'text-muted-foreground' : 'text-primary'}`} title={`Exact: ₹${perUnit.raw.toFixed(4)}`}>
                      {perUnit.display}
                    </p>
                    <span className="text-xs text-muted-foreground">per {auction.unit} · {formatINR(totalSaved, auction.currency)} over {auction.quantity} {auction.unit}</span>
                  </>
                );
              })()
            ) : (
              <>
                <p className="text-xl font-bold text-primary">{formatINR(totalSaved, auction.currency)}</p>
                <span className="text-xs text-muted-foreground">total savings (mixed units)</span>
              </>
            )}
          </div>

          <div className="rounded-[0.625rem] border bg-card p-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Winning Price</span>
            </div>
            <p className="text-xl font-bold">{formatINR(winningPrice, auction.currency)}</p>
            <span className="text-xs text-muted-foreground">vs {formatINR(startingPrice, auction.currency)} start</span>
          </div>

          <div className="rounded-[0.625rem] border bg-card p-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Competition</span>
            </div>
            <p className="text-xl font-bold">{uniqueSuppliers}</p>
            <span className="text-xs text-muted-foreground">{bids.length} total bids</span>
          </div>
        </div>

        {/* Two-column: Chart + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Savings Trend Chart */}
          <div className="lg:col-span-3 rounded-[0.625rem] border bg-card p-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-600" />
              Savings Trend
            </h4>
            {savingsChartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={savingsChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.625rem',
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [formatINR(value), 'Savings']}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.fullTime ? `${label} (${item.fullTime})` : label;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth={2.5}
                    fill="url(#savingsGrad)"
                    dot={{ r: 3, fill: 'hsl(142, 76%, 36%)', strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Not enough data to render chart
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center mt-2 uppercase tracking-widest">
              S A V I N G S
            </p>
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-2 rounded-[0.625rem] border bg-card p-4">
            <h4 className="text-sm font-bold mb-3">Leaderboard</h4>
            {/* Authoritative winner banner — never trust local rank when DB has a winner */}
            {auction.winner_supplier_id && !ranked.some(b => b.supplier_id === auction.winner_supplier_id) && (
              <div className="mb-3 p-2.5 rounded-[0.625rem] bg-amber-50 ring-1 ring-amber-300 text-xs">
                <p className="font-semibold text-amber-800">🏆 Awarded to another supplier</p>
                <p className="text-amber-700 mt-0.5">
                  Winning price {formatINR(auction.winning_price, auction.currency)} — your bid was not selected.
                </p>
              </div>
            )}
            <div className="space-y-2.5">
              {ranked.slice(0, 7).map((bid) => {
                const config = RANK_CONFIG[bid.rank];
                // Authoritative winner = DB column. Fall back to rank-1 only if no DB winner recorded.
                const isWinner = auction.winner_supplier_id
                  ? bid.supplier_id === auction.winner_supplier_id
                  : bid.rank === 1;
                return (
                  <div
                    key={bid.supplier_id}
                    className={`flex items-center justify-between p-2.5 rounded-[0.625rem] transition-all ${
                      config
                        ? `${config.bg} ring-1 ${config.ring}`
                        : 'bg-muted/30'
                    } ${isWinner ? 'shadow-sm' : ''}`}
                  >
                    <div className="flex items-center gap-2.5">
                      {config ? (
                        <span className="text-xl w-8 text-center">{config.icon}</span>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground bg-muted rounded-md w-8 h-8 flex items-center justify-center">
                          <span className="text-[10px] text-muted-foreground">Rank</span>
                          <br />
                          {bid.rank}
                        </span>
                      )}
                      <div>
                        <p className={`text-sm font-semibold ${config?.text || 'text-foreground'}`}>
                          {formatINR(bid.bid_price, auction.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PS-{bid.supplier_id.slice(0, 6).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    {isWinner && (
                      <Badge className="bg-emerald-600 text-white text-xs">Winner</Badge>
                    )}
                  </div>
                );
              })}
              {ranked.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No bids recorded</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
