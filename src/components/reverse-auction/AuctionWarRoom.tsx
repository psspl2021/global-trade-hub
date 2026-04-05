/**
 * Auction War Room Dashboard
 * Real-time command center for live auction monitoring & control
 */
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingDown, Clock, Users, Target, Trophy,
  Activity, ArrowLeft, Zap, AlertTriangle, Eye, IndianRupee,
  BarChart3, Timer, ShieldCheck, ShieldAlert, ShieldX,
  BellRing, Medal, Lightbulb
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ReverseAuction, getRankedBids, ReverseAuctionBid } from '@/hooks/useReverseAuction';
import { differenceInSeconds, formatDistanceToNow } from 'date-fns';

interface AuctionWarRoomProps {
  onBack: () => void;
  onSelectAuction: (auction: ReverseAuction) => void;
}

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return '—';
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${Math.round(value)}`;
}

function getTimeRemaining(endDate: string | null) {
  if (!endDate) return { label: 'Not started', urgency: 'idle' as const };
  const secs = differenceInSeconds(new Date(endDate), new Date());
  if (secs <= 0) return { label: 'Ended', urgency: 'ended' as const };
  if (secs < 300) return { label: `${Math.floor(secs / 60)}m ${secs % 60}s`, urgency: 'critical' as const };
  if (secs < 1800) return { label: `${Math.floor(secs / 60)}m`, urgency: 'warning' as const };
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  return { label: hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`, urgency: 'normal' as const };
}

const URGENCY_STYLES = {
  critical: 'text-destructive animate-pulse',
  warning: 'text-amber-600',
  normal: 'text-muted-foreground',
  ended: 'text-muted-foreground',
  idle: 'text-muted-foreground',
};

/* ── Health indicator logic ── */
type HealthStatus = 'healthy' | 'attention' | 'at_risk';

function getAuctionHealth(uniqueBidders: number, reductionPct: number, bidsCount: number): { status: HealthStatus; label: string } {
  if (uniqueBidders >= 3 && reductionPct >= 5) return { status: 'healthy', label: 'Healthy' };
  if (uniqueBidders >= 2 || reductionPct >= 2) return { status: 'attention', label: 'Needs attention' };
  return { status: 'at_risk', label: 'At risk' };
}

const HEALTH_CONFIG: Record<HealthStatus, { icon: typeof ShieldCheck; color: string; bg: string }> = {
  healthy: { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
  attention: { icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20' },
  at_risk: { icon: ShieldX, color: 'text-destructive', bg: 'bg-destructive/5' },
};

/* ── Smart alerts logic ── */
interface SmartAlert {
  type: 'no_bids' | 'aggressive_drop' | 'reserve_reached' | 'low_competition' | 'stale';
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

function getSmartAlerts(auction: ReverseAuction, bids: ReverseAuctionBid[], uniqueBidders: number, reductionPct: number): SmartAlert[] {
  const alerts: SmartAlert[] = [];

  // No bids yet
  if (bids.length === 0) {
    alerts.push({ type: 'no_bids', message: 'No bids received yet', severity: 'warning' });
  }

  // Stale — no bids in last 3 minutes
  if (bids.length > 0) {
    const lastBidTime = new Date(bids[bids.length - 1]?.created_at || bids[0]?.created_at);
    const secsSinceLastBid = differenceInSeconds(new Date(), lastBidTime);
    if (secsSinceLastBid > 180) {
      alerts.push({ type: 'stale', message: `No new bids in ${Math.floor(secsSinceLastBid / 60)} min`, severity: 'info' });
    }
  }

  // Aggressive price drop (>15% reduction)
  if (reductionPct > 15) {
    alerts.push({ type: 'aggressive_drop', message: `Aggressive pricing — ${reductionPct.toFixed(1)}% below start`, severity: 'info' });
  }

  // Reserve price reached
  if (auction.reserve_price && (auction.current_price ?? auction.starting_price) <= auction.reserve_price) {
    alerts.push({ type: 'reserve_reached', message: 'Reserve price reached ✓', severity: 'info' });
  }

  // Low competition
  if (uniqueBidders < 2 && bids.length > 0) {
    alerts.push({ type: 'low_competition', message: 'Low competition — consider inviting more suppliers', severity: 'warning' });
  }

  // Sort by severity priority and limit to 2
  const priorityOrder: Record<SmartAlert['severity'], number> = { critical: 3, warning: 2, info: 1 };
  alerts.sort((a, b) => priorityOrder[b.severity] - priorityOrder[a.severity]);
  return alerts.slice(0, 2);
}

/* ── AI Suggestion engine ── */
type SuggestionPriority = 'high' | 'medium' | 'low';

interface AISuggestion {
  message: string;
  action?: string;
  auctionId?: string;
  priority: SuggestionPriority;
}

const SUGGESTION_PRIORITY_STYLES: Record<SuggestionPriority, string> = {
  high: 'text-destructive font-semibold',
  medium: 'text-amber-700 dark:text-amber-400',
  low: 'text-foreground/70',
};

const SUGGESTION_PRIORITY_ICON: Record<SuggestionPriority, string> = {
  high: '🔴',
  medium: '🟡',
  low: '🔵',
};

function getAISuggestions(auctions: ReverseAuction[], bidsMap: Record<string, ReverseAuctionBid[]>): AISuggestion[] {
  const suggestions: AISuggestion[] = [];

  for (const auction of auctions) {
    if (auction.status !== 'live') continue;
    const bids = bidsMap[auction.id] || [];
    const uniqueBidders = new Set(bids.map(b => b.supplier_id)).size;
    const currentPrice = auction.current_price ?? auction.starting_price;
    const reductionPct = ((auction.starting_price - currentPrice) / auction.starting_price) * 100;

    if (bids.length === 0) {
      suggestions.push({
        message: `"${auction.title}" has no bids yet — check if suppliers have been notified`,
        action: 'check',
        auctionId: auction.id,
        priority: 'high',
      });
    } else if (uniqueBidders < 3) {
      suggestions.push({
        message: `"${auction.title}" has only ${uniqueBidders} bidder${uniqueBidders !== 1 ? 's' : ''} — invite ${3 - uniqueBidders} more to boost competition`,
        action: 'invite',
        auctionId: auction.id,
        priority: uniqueBidders < 2 ? 'high' : 'medium',
      });
    }

    if (auction.reserve_price && currentPrice <= auction.reserve_price * 1.05 && currentPrice > auction.reserve_price) {
      suggestions.push({
        message: `"${auction.title}" is close to reserve — prices may reach your target soon`,
        auctionId: auction.id,
        priority: 'medium',
      });
    }

    if (reductionPct > 20) {
      suggestions.push({
        message: `"${auction.title}" has strong price discovery (${reductionPct.toFixed(0)}% drop) — consider awarding soon after auction ends`,
        auctionId: auction.id,
        priority: 'low',
      });
    }
  }

  // Deduplicate by message
  const seen = new Set<string>();
  const unique = suggestions.filter(s => {
    if (seen.has(s.message)) return false;
    seen.add(s.message);
    return true;
  });

  // Sort by priority
  const priorityOrder: Record<SuggestionPriority, number> = { high: 3, medium: 2, low: 1 };
  unique.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  return unique.slice(0, 3);
}

const ALERT_STYLES: Record<SmartAlert['severity'], string> = {
  info: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800',
  warning: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800',
  critical: 'text-destructive bg-destructive/5 border-destructive/20',
};

/* ── Predicted Final Price Engine ── */
interface PricePrediction {
  predictedPrice: number;
  range: [number, number];
  confidence: number;
}

function getBidVelocity(bids: ReverseAuctionBid[]): number {
  if (bids.length < 2) return 0;
  const sorted = [...bids].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const first = new Date(sorted[0].created_at).getTime();
  const last = new Date(sorted[sorted.length - 1].created_at).getTime();
  const minutes = (last - first) / (1000 * 60);
  return minutes > 0 ? bids.length / minutes : 0;
}

function getPriceDropRate(auction: ReverseAuction, bids: ReverseAuctionBid[]): number {
  if (bids.length === 0) return 0;
  const current = auction.current_price ?? auction.starting_price;
  const drop = auction.starting_price - current;
  const durationMins = (Date.now() - new Date(auction.auction_start!).getTime()) / (1000 * 60);
  return durationMins > 0 ? drop / durationMins : 0;
}

function getTimeFactor(auction: ReverseAuction): number {
  if (!auction.auction_start || !auction.auction_end) return 0;
  const total = new Date(auction.auction_end).getTime() - new Date(auction.auction_start).getTime();
  const elapsed = Date.now() - new Date(auction.auction_start).getTime();
  return Math.min(1, Math.max(0, elapsed / total));
}

function predictFinalPrice(auction: ReverseAuction, bids: ReverseAuctionBid[]): PricePrediction | null {
  if (bids.length < 2) return null;
  const current = auction.current_price ?? auction.starting_price;
  const velocity = getBidVelocity(bids);
  const dropRate = getPriceDropRate(auction, bids);
  const timeFactor = getTimeFactor(auction);
  const competition = new Set(bids.map(b => b.supplier_id)).size;

  let expectedDrop = dropRate * (1 + velocity * 0.2);
  if (competition >= 3) expectedDrop *= 1.3;
  if (competition >= 5) expectedDrop *= 1.6;
  if (timeFactor > 0.8) expectedDrop *= 0.7;

  const remainingMins = Math.max(0, (new Date(auction.auction_end!).getTime() - Date.now()) / (1000 * 60));
  const projectedDrop = expectedDrop * Math.min(remainingMins, 10);

  const predicted = Math.max(
    auction.reserve_price || 0,
    current - projectedDrop
  );

  const confidence = Math.round(
    (Math.min(1, bids.length / 10) * 0.4 +
     Math.min(1, competition / 5) * 0.3 +
     timeFactor * 0.3) * 100
  );

  const spread = predicted * 0.03;
  return {
    predictedPrice: Math.round(predicted),
    range: [Math.round(predicted - spread), Math.round(predicted + spread)],
    confidence,
  };
}

const MEDAL_ICONS = ['🥇', '🥈', '🥉'];

export function AuctionWarRoom({ onBack, onSelectAuction }: AuctionWarRoomProps) {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<ReverseAuction[]>([]);
  const [bidsMap, setBidsMap] = useState<Record<string, ReverseAuctionBid[]>>({});
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: auctionData } = await supabase
        .from('reverse_auctions')
        .select('*')
        .eq('buyer_id', user.id)
        .in('status', ['live', 'scheduled', 'ended'])
        .order('auction_start', { ascending: false })
        .limit(20);

      if (auctionData) {
        setAuctions(auctionData as unknown as ReverseAuction[]);
        const liveIds = auctionData.filter(a => a.status === 'live').map(a => a.id);
        if (liveIds.length > 0) {
          const { data: bidData } = await supabase
            .from('reverse_auction_bids')
            .select('*')
            .in('auction_id', liveIds)
            .order('bid_price', { ascending: true });

          if (bidData) {
            const grouped: Record<string, ReverseAuctionBid[]> = {};
            for (const bid of bidData as unknown as ReverseAuctionBid[]) {
              if (!grouped[bid.auction_id]) grouped[bid.auction_id] = [];
              grouped[bid.auction_id].push(bid);
            }
            setBidsMap(grouped);
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('war-room-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reverse_auctions' }, (payload) => {
        const updated = payload.new as unknown as ReverseAuction;
        if (updated.buyer_id === user.id) {
          setAuctions(prev => {
            const idx = prev.findIndex(a => a.id === updated.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = updated;
              return next;
            }
            return [updated, ...prev];
          });
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reverse_auction_bids' }, (payload) => {
        const newBid = payload.new as unknown as ReverseAuctionBid;
        setBidsMap(prev => ({
          ...prev,
          [newBid.auction_id]: [...(prev[newBid.auction_id] || []), newBid].sort((a, b) => a.bid_price - b.bid_price),
        }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const liveAuctions = useMemo(() => auctions.filter(a => a.status === 'live'), [auctions]);
  const scheduledAuctions = useMemo(() => auctions.filter(a => a.status === 'scheduled'), [auctions]);
  const recentEnded = useMemo(() => auctions.filter(a => a.status === 'ended').slice(0, 5), [auctions]);

  const stats = useMemo(() => {
    const totalSavings = liveAuctions.reduce((sum, a) => {
      const current = a.current_price ?? a.starting_price;
      return sum + Math.max(0, a.starting_price - current) * a.quantity;
    }, 0);
    const totalBids = Object.values(bidsMap).reduce((sum, bids) => sum + bids.length, 0);
    const uniqueSuppliers = new Set(Object.values(bidsMap).flatMap(bids => bids.map(b => b.supplier_id))).size;
    const avgReduction = liveAuctions.length > 0
      ? liveAuctions.reduce((sum, a) => {
          const current = a.current_price ?? a.starting_price;
          return sum + ((a.starting_price - current) / a.starting_price) * 100;
        }, 0) / liveAuctions.length
      : 0;
    return { totalSavings, totalBids, uniqueSuppliers, avgReduction };
  }, [liveAuctions, bidsMap]);

  const aiSuggestions = useMemo(() => getAISuggestions(liveAuctions, bidsMap), [liveAuctions, bidsMap]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Card><CardContent className="py-12 text-center text-muted-foreground">Loading war room...</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                War Room
                {liveAuctions.length > 0 && (
                  <Badge variant="destructive" className="text-[10px] animate-pulse">
                    {liveAuctions.length} LIVE
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">Real-time auction command center</p>
            </div>
          </div>
        </div>
      </div>

      {/* Command Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Activity} label="Live Auctions" value={liveAuctions.length} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-950/20" />
        <StatCard icon={IndianRupee} label="Live Savings" value={formatCurrency(stats.totalSavings)} color="text-primary" bg="bg-primary/5" />
        <StatCard icon={TrendingDown} label="Avg Reduction" value={`${stats.avgReduction.toFixed(1)}%`} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-950/20" />
        <StatCard icon={Users} label="Active Suppliers" value={stats.uniqueSuppliers} color="text-violet-600" bg="bg-violet-50 dark:bg-violet-950/20" />
      </div>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <Card className="border border-primary/20 bg-primary/5">
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Lightbulb className="w-4 h-4" />
              AI Suggestions
            </div>
            {aiSuggestions.map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-2 pl-6">
                <div className={`flex items-start gap-2 text-xs ${SUGGESTION_PRIORITY_STYLES[s.priority]}`}>
                  <span>{SUGGESTION_PRIORITY_ICON[s.priority]}</span>
                  <span>{s.message}</span>
                </div>
                {s.action === 'invite' && (
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 shrink-0" onClick={() => s.auctionId && onSelectAuction(liveAuctions.find(a => a.id === s.auctionId)!)}>
                    Invite Now
                  </Button>
                )}
                {s.action === 'check' && (
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 shrink-0" onClick={() => s.auctionId && onSelectAuction(liveAuctions.find(a => a.id === s.auctionId)!)}>
                    View
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Live Auctions */}
      {liveAuctions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500" /> Live Now
          </h3>
          <div className="grid gap-3">
            {liveAuctions.map(auction => (
              <LiveAuctionCard
                key={auction.id}
                auction={auction}
                bids={bidsMap[auction.id] || []}
                tick={tick}
                onView={() => onSelectAuction(auction)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Scheduled */}
      {scheduledAuctions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" /> Scheduled
          </h3>
          <div className="grid gap-2">
            {scheduledAuctions.map(auction => (
              <Card key={auction.id} className="p-3 border cursor-pointer hover:shadow-sm transition-shadow" onClick={() => onSelectAuction(auction)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{auction.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Starts {auction.auction_start ? formatDistanceToNow(new Date(auction.auction_start), { addSuffix: true }) : 'TBD'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">Scheduled</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recently Ended */}
      {recentEnded.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Recently Completed
          </h3>
          <div className="grid gap-2">
            {recentEnded.map(auction => {
              const savings = auction.winning_price
                ? (auction.starting_price - auction.winning_price) * auction.quantity
                : 0;
              return (
                <Card key={auction.id} className="p-3 border cursor-pointer hover:shadow-sm transition-shadow" onClick={() => onSelectAuction(auction)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{auction.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Final: {formatCurrency(auction.winning_price)}
                        {savings > 0 && <span className="text-emerald-600 ml-2">Saved {formatCurrency(savings)}</span>}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700">Completed</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {auctions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No auctions yet. Create your first reverse auction to activate the war room.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function StatCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: string | number; color: string; bg: string }) {
  return (
    <Card className={`p-3 border rounded-[0.625rem] ${bg}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <span className={`text-xl font-bold ${color}`}>{value}</span>
    </Card>
  );
}

function LiveAuctionCard({ auction, bids, tick, onView }: { auction: ReverseAuction; bids: ReverseAuctionBid[]; tick: number; onView: () => void }) {
  const time = getTimeRemaining(auction.auction_end);
  const currentPrice = auction.current_price ?? auction.starting_price;
  const prediction = useMemo(() => predictFinalPrice(auction, bids), [auction, bids]);
  const reductionPct = ((auction.starting_price - currentPrice) / auction.starting_price) * 100;
  const savings = (auction.starting_price - currentPrice) * auction.quantity;
  const ranked = getRankedBids(bids);
  const uniqueBidders = new Set(bids.map(b => b.supplier_id)).size;

  // Health indicator
  const health = getAuctionHealth(uniqueBidders, reductionPct, bids.length);
  const healthCfg = HEALTH_CONFIG[health.status];
  const HealthIcon = healthCfg.icon;

  // Smart alerts
  const alerts = getSmartAlerts(auction, bids, uniqueBidders, reductionPct);

  // Reserve progress
  const progressToReserve = auction.reserve_price
    ? Math.min(100, ((auction.starting_price - currentPrice) / (auction.starting_price - auction.reserve_price)) * 100)
    : null;

  // Leaderboard — top 3 unique suppliers by best bid
  const leaderboard = (() => {
    const seen = new Set<string>();
    const top: { supplierId: string; price: number; rank: number }[] = [];
    for (const bid of ranked) {
      if (seen.has(bid.supplier_id)) continue;
      seen.add(bid.supplier_id);
      top.push({ supplierId: bid.supplier_id, price: bid.bid_price, rank: top.length + 1 });
      if (top.length >= 3) break;
    }
    return top;
  })();

  return (
    <Card className="border overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 space-y-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground truncate">{auction.title}</p>
              {/* Health badge */}
              <Badge variant="outline" className={`text-[10px] gap-1 shrink-0 border-0 ${healthCfg.bg} ${healthCfg.color}`}>
                <HealthIcon className="w-3 h-3" />
                {health.label}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{auction.quantity} {auction.unit}</span>
              <span>·</span>
              <span>Start: {formatCurrency(auction.starting_price)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className={`flex items-center gap-1 text-xs font-mono font-bold ${URGENCY_STYLES[time.urgency]}`}>
              <Timer className="w-3.5 h-3.5" />
              {time.label}
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onView}>
              <Eye className="w-3 h-3" /> View
            </Button>
          </div>
        </div>

        {/* Price & Savings Row */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Current Price</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(currentPrice)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Reduction</p>
            <p className="text-lg font-bold text-emerald-600">↓ {reductionPct.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Savings</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(savings)}</p>
          </div>
        </div>

        {/* Reserve progress */}
        {progressToReserve !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Progress to reserve</span>
              <span>{progressToReserve.toFixed(0)}%</span>
            </div>
            <Progress value={progressToReserve} className="h-1.5" />
          </div>
        )}

        {/* Predicted Final Price */}
        {prediction && (
          <div className="p-3 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> Predicted Final Price
                </p>
                <p className="text-lg font-bold text-violet-700 dark:text-violet-400">
                  {formatCurrency(prediction.predictedPrice)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Range: {formatCurrency(prediction.range[0])} – {formatCurrency(prediction.range[1])}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold ${prediction.confidence >= 70 ? 'text-emerald-600' : prediction.confidence >= 40 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                  {prediction.confidence}%
                </div>
                <p className="text-[10px] text-muted-foreground">confidence</p>
              </div>
            </div>
            <Progress
              value={prediction.confidence}
              className="h-1 mt-2"
            />
          </div>
        )}

        {/* Leaderboard strip */}
        {leaderboard.length > 0 && (
          <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50 border border-border/50">
            <Medal className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {leaderboard.map((entry, i) => (
                <span key={entry.supplierId} className="flex items-center gap-1">
                  <span>{MEDAL_ICONS[i]}</span>
                  <span className="text-muted-foreground">Supplier {entry.rank}</span>
                  <span className="font-semibold text-foreground">–</span>
                  <span className={`font-bold ${i === 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                    {formatCurrency(entry.price)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom: Bidders & L1 */}
        <div className="flex items-center justify-between text-xs border-t pt-2">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {uniqueBidders} bidders
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" /> {bids.length} bids
            </span>
          </div>
          {ranked.length > 0 && (
            <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 gap-1">
              <Trophy className="w-3 h-3" /> L1: {formatCurrency(ranked[0].bid_price)}
            </Badge>
          )}
        </div>

        {/* Smart alerts */}
        {alerts.length > 0 && (
          <div className="space-y-1.5">
            {alerts.map((alert, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs rounded-md p-2 border ${ALERT_STYLES[alert.severity]}`}>
                {alert.severity === 'critical' ? (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <BellRing className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="font-medium">{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Urgency alert */}
        {time.urgency === 'critical' && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 rounded-md p-2 border border-destructive/20">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium">Ending soon — monitor for last-minute bids</span>
          </div>
        )}
      </div>
    </Card>
  );
}
