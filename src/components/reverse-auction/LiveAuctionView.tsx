/**
 * Live Reverse Auction View — Real-time bidding interface
 * Enterprise: L1/L2/L3 Leaderboard, Anti-sniping, Audit logging, Mobile sticky bid
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { AuctionResultExport } from './AuctionResultExport';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Gavel, TrendingDown, Clock, ArrowLeft, IndianRupee, AlertTriangle, Shield, Trophy, ChevronDown, ChevronUp, Pencil, XCircle, Medal, Timer, Users, Zap, Target, TrendingUp, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import { useReverseAuctionBids, useReverseAuction, ReverseAuction, ReverseAuctionBid, getRankedBids } from '@/hooks/useReverseAuction';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, isPast, differenceInSeconds } from 'date-fns';

interface LiveAuctionViewProps {
  auction: ReverseAuction;
  onBack: () => void;
  isSupplier?: boolean;
}

function formatCurrency(value: number | null, currency: string = 'INR') {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

const RANK_CONFIG: Record<number, { label: string; color: string; bg: string; icon: string }> = {
  1: { label: 'L1', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300', icon: '🥇' },
  2: { label: 'L2', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300', icon: '🥈' },
  3: { label: 'L3', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300', icon: '🥉' },
};

export function LiveAuctionView({ auction: initialAuction, onBack, isSupplier = false }: LiveAuctionViewProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [auction, setAuction] = useState<ReverseAuction>(initialAuction);

  // Real-time subscription on the auction record itself
  useEffect(() => {
    const channel = supabase
      .channel(`auction-detail-${initialAuction.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reverse_auctions', filter: `id=eq.${initialAuction.id}` },
        (payload) => {
          setAuction(prev => ({ ...prev, ...(payload.new as any) }));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [initialAuction.id]);

  const effectiveStatus = useMemo(() => {
    if (auction.status === 'cancelled' || auction.status === 'completed') return auction.status;
    const now = new Date();
    if (auction.auction_end && new Date(auction.auction_end) <= now) return 'completed';
    if (auction.auction_start && new Date(auction.auction_start) <= now) return 'live';
    return 'scheduled';
  }, [auction.status, auction.auction_start, auction.auction_end]);

  const { updateAuctionStatus } = useReverseAuction();

  useEffect(() => {
    if (effectiveStatus !== auction.status && (effectiveStatus === 'live' || effectiveStatus === 'completed')) {
      if (effectiveStatus === 'live' && auction.status === 'scheduled') {
        updateAuctionStatus(auction.id, 'live');
      } else if (effectiveStatus === 'completed' && auction.status === 'live') {
        updateAuctionStatus(auction.id, 'completed');
      }
    }
  }, [effectiveStatus, auction.status, auction.id]);

  const { bids, placeBid, editBid } = useReverseAuctionBids(auction.id);
  const { updateAuction, cancelAuction } = useReverseAuction();
  const [bidPrice, setBidPrice] = useState('');
  const [bidError, setBidError] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [showBidPanel, setShowBidPanel] = useState(true);
  const prevRankRef = useRef<number | null>(null);
  const lastOutbidRef = useRef(0);

  const isBuyer = user?.id === auction.buyer_id;
  const canEdit = isBuyer && (effectiveStatus === 'scheduled' || effectiveStatus === 'live');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const buyerEditCount = (auction as any).buyer_edit_count || 0;
  const canEditAuction = canEdit && buyerEditCount < 2;
  const [editForm, setEditForm] = useState({
    title: auction.title,
    starting_price: auction.starting_price,
    reserve_price: auction.reserve_price || '',
    quantity: auction.quantity,
    unit: auction.unit,
    product_slug: auction.product_slug,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editingBidId, setEditingBidId] = useState<string | null>(null);
  const [editBidPrice, setEditBidPrice] = useState('');

  const isLive = effectiveStatus === 'live';

  const currentLowest = useMemo(() => {
    if (bids.length === 0) return auction.starting_price;
    return Math.min(...bids.map(b => b.bid_price));
  }, [bids, auction.starting_price]);

  const minBidStep = auction.minimum_bid_step_pct / 100;
  const maxAllowedBid = currentLowest * (1 - minBidStep);
  const totalSavings = ((auction.starting_price - currentLowest) / auction.starting_price * 100);
  const buyerPrice = currentLowest;

  // Smart bid suggestion (step-based, not random)
  const smartSuggestion = useMemo(() => {
    return Math.floor(currentLowest * (1 - auction.minimum_bid_step_pct / 100));
  }, [currentLowest, auction.minimum_bid_step_pct]);

  // Ranked leaderboard
  const rankedBids = useMemo(() => getRankedBids(bids), [bids]);

  // Competition pressure metrics
  const activeBidders = useMemo(() => {
    return new Set(bids.map(b => b.supplier_id)).size;
  }, [bids]);

  const recentBidCount = useMemo(() => {
    const thirtySecsAgo = Date.now() - 30000;
    return bids.filter(b => new Date(b.created_at).getTime() > thirtySecsAgo).length;
  }, [bids, timeLeft]); // timeLeft as dep to recompute every second

  const myRank = useMemo(() => {
    if (!user || !isSupplier || bids.length === 0) return null;
    const ranked = rankedBids.find(b => b.supplier_id === user.id);
    return ranked?.rank ?? null;
  }, [rankedBids, user, isSupplier, bids.length]);

  const myBestBid = useMemo(() => {
    if (!user || bids.length === 0) return null;
    const myBids = bids.filter(b => b.supplier_id === user.id);
    if (myBids.length === 0) return null;
    return Math.min(...myBids.map(b => b.bid_price));
  }, [bids, user]);

  const isWinning = myRank === 1;

  // Win probability indicator
  const winProbability = useMemo(() => {
    if (!myRank || !isSupplier) return null;
    if (myRank === 1) return { label: 'High chance of winning', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: '🏆' };
    if (myRank === 2) {
      const gap = myBestBid && currentLowest ? myBestBid - currentLowest : 0;
      return { label: `Close — reduce by ${formatCurrency(gap)} to win`, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: '🎯' };
    }
    return { label: 'Low — aggressive bid needed', color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: '⚡' };
  }, [myRank, isSupplier, myBestBid, currentLowest]);

  // Anti-snipe indicator
  const isAntiSnipeZone = useMemo(() => {
    if (!auction.auction_end || !isLive) return false;
    const secs = differenceInSeconds(new Date(auction.auction_end), new Date());
    const threshold = auction.anti_snipe_threshold_seconds || 60;
    return secs > 0 && secs < threshold;
  }, [auction.auction_end, isLive, auction.anti_snipe_threshold_seconds, timeLeft]);

  // Outbid alert
  useEffect(() => {
    if (myRank === null || !isSupplier) return;
    const now = Date.now();
    if (
      prevRankRef.current !== null &&
      prevRankRef.current === 1 &&
      myRank > 1 &&
      now - lastOutbidRef.current > 3000
    ) {
      toast({
        title: "You were outbid ⚠️",
        description: "Place a lower bid to win",
        variant: "destructive",
      });
      lastOutbidRef.current = now;
    }
    prevRankRef.current = myRank;
  }, [myRank, isSupplier, toast]);

  // Timer
  useEffect(() => {
    if (!auction.auction_end || !isLive) return;
    const interval = setInterval(() => {
      const end = new Date(auction.auction_end!);
      if (isPast(end)) {
        setTimeLeft('Ended');
      } else {
        const secs = differenceInSeconds(end, new Date());
        const hrs = Math.floor(secs / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        const remainSecs = secs % 60;
        setTimeLeft(
          hrs > 0
            ? `${hrs}:${String(mins).padStart(2, '0')}:${String(remainSecs).padStart(2, '0')}`
            : `${mins}:${String(remainSecs).padStart(2, '0')}`
        );
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [auction.auction_end, isLive]);

  const handlePlaceBid = async () => {
    if (isPlacing) return;
    if (!isLive) { setBidError('Auction has ended'); return; }
    setBidError('');
    if (!user) return;
    if (!bidPrice) { setBidError('Enter a bid amount'); return; }
    const price = parseFloat(bidPrice);
    if (isNaN(price) || price <= 0) { setBidError('Enter a valid amount'); return; }
    if (price >= currentLowest) { setBidError('Bid must be LOWER than current L1'); return; }
    if (price > maxAllowedBid) {
      setBidError(`Max allowed: ${formatCurrency(maxAllowedBid)} (min ${auction.minimum_bid_step_pct}% step)`);
      return;
    }
    setIsPlacing(true);
    try {
      await placeBid(user.id, price, auction);
      setBidPrice(Math.floor(maxAllowedBid).toString());
      toast({
        title: "Bid placed 🚀",
        description: `Your bid of ${formatCurrency(price)} is now competing for L1`,
      });
      document.getElementById("live-strip")?.scrollIntoView({ behavior: "smooth" });
    } finally {
      setIsPlacing(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const updates: any = {
        title: editForm.title,
        starting_price: Number(editForm.starting_price),
        quantity: Number(editForm.quantity),
        unit: editForm.unit,
        product_slug: editForm.product_slug,
        reserve_price: editForm.reserve_price ? Number(editForm.reserve_price) : null,
      };
      const success = await updateAuction(auction.id, updates, buyerEditCount);
      if (success) { setShowEditDialog(false); onBack(); }
    } finally { setIsSaving(false); }
  };

  const handleCancelAuction = async () => {
    setIsSaving(true);
    try {
      await cancelAuction(auction.id);
      setShowCancelDialog(false);
      onBack();
    } finally { setIsSaving(false); }
  };

  const urgencyColor = useMemo(() => {
    if (!auction.auction_end || !isLive) return '';
    const secs = differenceInSeconds(new Date(auction.auction_end), new Date());
    if (secs <= 60) return 'text-destructive animate-pulse';
    if (secs <= 300) return 'text-destructive';
    return 'text-foreground';
  }, [auction.auction_end, isLive, timeLeft]);

  const isValidBid = bidPrice && !isNaN(parseFloat(bidPrice)) && parseFloat(bidPrice) < currentLowest && parseFloat(bidPrice) <= maxAllowedBid;

  // Reusable bid panel content
  const bidPanelContent = isSupplier ? (
    isLive ? (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gavel className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Place Your Bid</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Must be below {formatCurrency(maxAllowedBid)} (min {auction.minimum_bid_step_pct}% step)
        </div>
        {/* Quick Bid Buttons */}
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3].map((step) => {
            const quick = currentLowest * (1 - (minBidStep * step));
            return (
              <button
                key={step}
                onClick={() => { setBidPrice(Math.floor(quick).toString()); setBidError(''); }}
                className="text-xs border border-border px-2 py-1 rounded-md hover:bg-muted transition-colors"
              >
                -{step * auction.minimum_bid_step_pct}% ({formatCurrency(Math.floor(quick))})
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <IndianRupee className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              type="number"
              inputMode="numeric"
              className="pl-8"
              placeholder={`Max ${Math.floor(maxAllowedBid)}`}
              value={bidPrice}
              onChange={e => { setBidPrice(e.target.value); setBidError(''); }}
              onKeyDown={e => e.key === 'Enter' && handlePlaceBid()}
            />
          </div>
          <Button onClick={handlePlaceBid} disabled={!isValidBid || isPlacing}>
            {isPlacing ? 'Placing...' : '🚀 Bid'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Smart suggestion: <button onClick={() => { setBidPrice(smartSuggestion.toString()); setBidError(''); }} className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80">{formatCurrency(smartSuggestion)}</button>
        </p>
        {bidError && <p className="text-xs text-destructive font-medium">{bidError}</p>}
        <p className="text-xs text-muted-foreground border-t border-border pt-2">
          💡 You can place multiple bids. Each bid can be edited up to 2 times.
        </p>
      </div>
    ) : effectiveStatus === 'scheduled' ? (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Auction Not Started</h3>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-[0.625rem] p-3 text-sm space-y-2">
          <p className="text-blue-800 font-medium">Prepare your best quote</p>
          <div className="space-y-1 text-blue-700 text-xs">
            <p>📦 Product: {auction.product_slug?.replace(/_/g, ', ').replace(/-/g, ' ')}</p>
            <p>📏 Quantity: {auction.quantity} {auction.unit}</p>
            <p>💰 Starting Price: {formatCurrency(auction.starting_price)}/{auction.unit}</p>
            {auction.auction_start && (
              <p>🕐 Starts: {new Date(auction.auction_start).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Bidding opens when the auction starts. You'll be able to place competitive bids in real time.
        </p>
      </div>
    ) : (effectiveStatus === 'completed' || effectiveStatus === 'cancelled') ? (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">
            {effectiveStatus === 'cancelled' ? 'Auction Withdrawn' : 'Auction Ended'}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {effectiveStatus === 'cancelled'
            ? 'This auction has been withdrawn by the buyer.'
            : 'This auction has ended. No more bids can be placed.'}
        </p>
      </div>
    ) : null
  ) : null;

  // Savings chart data (cumulative best price over time)
  const savingsChartData = useMemo(() => {
    if (bids.length === 0) return [];
    const sorted = [...bids].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    let runningBest = auction.starting_price;
    const points = [{ name: 'Start', savings: 0, price: auction.starting_price }];
    sorted.forEach((bid, idx) => {
      if (bid.bid_price < runningBest) runningBest = bid.bid_price;
      points.push({
        name: `Bid ${idx + 1}`,
        savings: auction.starting_price - runningBest,
        price: runningBest,
      });
    });
    return points;
  }, [bids, auction.starting_price]);

  const totalSavedAmount = (auction.starting_price - currentLowest) * auction.quantity;
  const uniqueSuppliers = useMemo(() => new Set(bids.map(b => b.supplier_id)).size, [bids]);

  return (
    <div className="min-h-screen pb-20">
      {/* Back button + Export */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Auctions
        </Button>
        <div className="flex items-center gap-2">
          {isBuyer && <AuctionResultExport auction={auction} bids={bids} />}
          {canEdit && (
            <>
              {canEditAuction ? (
                <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)} className="gap-1">
                  <Pencil className="w-3 h-3" /> Edit ({2 - buyerEditCount} left)
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground italic">Max edits used</span>
              )}
              <Button variant="destructive" size="sm" onClick={() => setShowCancelDialog(true)} className="gap-1">
                <XCircle className="w-3 h-3" /> Withdraw
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Title + Status Bar */}
      <div className="bg-card rounded-[0.625rem] border shadow-md p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">{auction.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {auction.category} • {auction.quantity} {auction.unit} • {auction.product_slug}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge className="bg-emerald-600 text-white animate-pulse text-sm px-3 py-1">
                🔴 LIVE
              </Badge>
            )}
            {effectiveStatus === 'completed' && (
              <Badge className="bg-primary text-primary-foreground px-3 py-1">Completed</Badge>
            )}
            {effectiveStatus === 'cancelled' && (
              <Badge variant="destructive" className="px-3 py-1">⊘ Cancelled</Badge>
            )}
            {isLive && (
              <div className="text-right ml-3">
                <p className="text-xs text-muted-foreground">Time Left</p>
                <p className={`text-lg font-mono font-bold ${urgencyColor}`}>{timeLeft}</p>
              </div>
            )}
          </div>
        </div>

        {/* Anti-snipe indicator */}
        {isAntiSnipeZone && (
          <div className="rounded-md px-3 py-1.5 text-xs font-medium flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 animate-pulse mb-3">
            <Timer className="w-3.5 h-3.5" />
            Anti-snipe zone — bids will extend the auction by {Math.floor((auction.anti_snipe_seconds || 120) / 60)} min
          </div>
        )}

        {/* Competition Pressure Strip */}
        {isLive && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border text-xs font-medium">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>{activeBidders} supplier{activeBidders !== 1 ? 's' : ''} active</span>
            </div>
            {recentBidCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800 animate-pulse">
                <Zap className="w-3.5 h-3.5" />
                {recentBidCount} bid{recentBidCount !== 1 ? 's' : ''} in last 30s
              </div>
            )}
          </div>
        )}

        {/* Supplier status strips */}
        {isSupplier && myRank !== null && isLive && (
          <div className={`mt-2 rounded-md px-3 py-1.5 text-sm font-medium flex items-center gap-2 ${
            isWinning
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {isWinning ? (
              <><Trophy className="w-4 h-4" /> You are L1 — Currently winning!</>
            ) : (
              <><AlertTriangle className="w-4 h-4" /> Outbid — reduce your price to win</>
            )}
          </div>
        )}
        {isSupplier && winProbability && isLive && (
          <div className={`mt-2 rounded-md px-3 py-1.5 text-xs font-medium flex items-center gap-2 border ${winProbability.bg}`}>
            <Target className="w-3.5 h-3.5" />
            <span>{winProbability.icon}</span>
            <span className={winProbability.color}>{winProbability.label}</span>
          </div>
        )}
      </div>

      {/* 🟩 SAVINGS CARDS — Top Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="rounded-[0.625rem] border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Savings on Budget</p>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-emerald-700">
              {formatCurrency(totalSavedAmount)}
            </h2>
            <span className="text-emerald-600 text-sm font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              {totalSavings.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="rounded-[0.625rem] border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Per Unit Saved</p>
          <h2 className="text-2xl font-bold text-primary">
            {formatCurrency(auction.starting_price - currentLowest)}
          </h2>
          <span className="text-xs text-muted-foreground">per {auction.unit}</span>
        </div>

        <div className="rounded-[0.625rem] border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Current L1 Price</p>
          <h2 className="text-2xl font-bold text-foreground">
            {formatCurrency(currentLowest)}
          </h2>
          <span className="text-xs text-muted-foreground">vs {formatCurrency(auction.starting_price)} start</span>
        </div>

        <div className="rounded-[0.625rem] border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Competition</p>
          <h2 className="text-2xl font-bold text-foreground">{uniqueSuppliers}</h2>
          <span className="text-xs text-muted-foreground">{bids.length} total bids</span>
        </div>
      </div>

      {/* 📈 MAIN GRID: Chart + Leaderboard side-by-side */}
      <div className="flex gap-4 items-start mb-4">
        {/* LEFT: Savings Trend Chart */}
        <div className="flex-1 rounded-[0.625rem] border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
            <TrendingDown className="w-4 h-4 text-emerald-600" />
            Savings Trend
          </h3>
          {savingsChartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={savingsChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="savingsGradLive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
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
                  formatter={(value: number) => [formatCurrency(value), 'Savings']}
                />
                <Area
                  type="monotone"
                  dataKey="savings"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2.5}
                  fill="url(#savingsGradLive)"
                  dot={{ r: 3, fill: 'hsl(142, 76%, 36%)', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              Waiting for bids to render chart...
            </div>
          )}
        </div>

        {/* RIGHT: Leaderboard */}
        <div className="w-80 shrink-0 rounded-[0.625rem] border bg-card p-4 shadow-sm">
          <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
            <Medal className="w-4 h-4 text-amber-500" />
            Leaderboard
            {isLive && <Badge variant="outline" className="text-xs ml-auto animate-pulse border-emerald-300 text-emerald-700">Live</Badge>}
          </h3>
          <div className="space-y-2">
            {rankedBids.slice(0, 8).map((bid) => {
              const rankConfig = RANK_CONFIG[bid.rank];
              const isMine = user && bid.supplier_id === user.id;
              const isWinner = bid.rank === 1;
              return (
                <div
                  key={bid.supplier_id}
                  className={`flex items-center justify-between p-2.5 rounded-[0.625rem] transition-all ${
                    isWinner
                      ? 'bg-amber-50 ring-1 ring-amber-300 shadow-sm'
                      : rankConfig
                        ? `${rankConfig.bg} border`
                        : 'bg-muted/30 border border-border'
                  } ${isMine ? 'ring-2 ring-primary/30' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    {rankConfig ? (
                      <span className="text-lg w-7 text-center">{rankConfig.icon}</span>
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground bg-muted rounded-md w-7 h-7 flex items-center justify-center">
                        #{bid.rank}
                      </span>
                    )}
                    <div>
                      <p className={`text-sm font-semibold ${rankConfig ? rankConfig.color : 'text-foreground'}`}>
                        {formatCurrency(bid.bid_price)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PS-{bid.supplier_id.slice(0, 4).toUpperCase()}
                        {isMine && <span className="text-primary ml-1 font-medium">(You)</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {isWinner && (
                      <Badge className="bg-emerald-600 text-white text-xs">
                        {effectiveStatus === 'completed' ? 'Winner' : 'L1'}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {((auction.starting_price - bid.bid_price) / auction.starting_price * 100).toFixed(1)}% off
                    </p>
                  </div>
                </div>
              );
            })}
            {rankedBids.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No bids yet</p>
            )}
          </div>
        </div>
      </div>

      {/* 🔥 VALUE LINE */}
      {totalSavedAmount > 0 && (
        <div className="rounded-[0.625rem] bg-emerald-50 border border-emerald-200 p-4 text-center mb-4">
          <p className="text-lg font-bold text-emerald-800">
            💰 You saved {formatCurrency(totalSavedAmount)} ({totalSavings.toFixed(1)}%) in this auction
          </p>
        </div>
      )}

      {/* SUPPLIER BID PANEL — Desktop right, Mobile bottom */}
      <div className={`${!isMobile && bidPanelContent ? 'flex gap-4 items-start' : ''}`}>
        <div className="flex-1 space-y-4">
          {/* Bid History */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Bid History ({bids.length} bids)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bids.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">No bids yet. Waiting for suppliers to bid...</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {bids.map((bid) => {
                    const isMine = user && bid.supplier_id === user.id;
                    const canEditBid = isMine && isLive && (bid.edit_count || 0) < 2;
                    const isEditingThis = editingBidId === bid.id;
                    const bidRank = rankedBids.find(r => r.supplier_id === bid.supplier_id && r.bid_price === bid.bid_price)?.rank;
                    return (
                      <div key={bid.id} className={`p-2 rounded-md text-sm ${
                        bidRank === 1
                          ? 'bg-emerald-50 border border-emerald-200'
                          : isMine
                            ? 'bg-primary/5 border border-primary/20'
                            : 'bg-muted/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {bidRank && bidRank <= 3 && (
                              <Badge className={`text-xs font-bold ${RANK_CONFIG[bidRank]?.bg} ${RANK_CONFIG[bidRank]?.color} border`}>
                                {RANK_CONFIG[bidRank]?.label}
                              </Badge>
                            )}
                            {isMine && <Badge variant="outline" className="text-xs border-primary text-primary">You</Badge>}
                            <span className="text-muted-foreground font-mono text-xs">
                              PS-{bid.supplier_id.slice(0, 4).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${
                              bidRank === 1 ? 'text-emerald-700' : isMine ? 'text-primary' : ''
                            }`}>
                              {formatCurrency(bid.bid_price)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                            </span>
                            {canEditBid && !isEditingThis && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs gap-1"
                                onClick={() => { setEditingBidId(bid.id); setEditBidPrice(bid.bid_price.toString()); }}
                              >
                                <Pencil className="w-3 h-3" /> Edit ({2 - (bid.edit_count || 0)} left)
                              </Button>
                            )}
                            {isMine && (bid.edit_count || 0) >= 2 && (
                              <span className="text-xs text-muted-foreground italic">Max edits used</span>
                            )}
                          </div>
                        </div>
                        {isEditingThis && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="relative flex-1">
                              <IndianRupee className="w-3 h-3 absolute left-2 top-2.5 text-muted-foreground" />
                              <Input
                                type="number"
                                className="h-8 pl-6 text-sm"
                                value={editBidPrice}
                                onChange={e => setEditBidPrice(e.target.value)}
                                autoFocus
                              />
                            </div>
                            <Button
                              size="sm"
                              className="h-8 text-xs"
                              disabled={!editBidPrice || Number(editBidPrice) <= 0}
                              onClick={async () => {
                                const success = await editBid(bid.id, Number(editBidPrice), bid.edit_count || 0, user?.id);
                                if (success) setEditingBidId(null);
                              }}
                            >
                              Save
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setEditingBidId(null)}>
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 💻 DESKTOP → Right sticky bid panel */}
        {!isMobile && bidPanelContent && (
          <div className="sticky top-24 w-[320px] shrink-0 bg-card border rounded-[0.625rem] shadow-lg p-4">
            {bidPanelContent}
          </div>
        )}
      </div>

      {/* 📱 MOBILE → Fixed bottom sticky bid panel */}
      {isMobile && bidPanelContent && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-2xl safe-area-inset-bottom">
          <div
            className="flex items-center justify-between p-3 cursor-pointer border-b"
            onClick={() => setShowBidPanel(p => !p)}
          >
            <div className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">Place Your Bid</h3>
              {isAntiSnipeZone && (
                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 animate-pulse">⏰ Anti-snipe</Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {showBidPanel ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>
          {showBidPanel && (
            <div className="p-4 pt-2 pb-6">
              {bidPanelContent}
            </div>
          )}
        </div>
      )}

      {/* Edit Auction Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Auction</DialogTitle>
            <DialogDescription>Update auction details. Changes apply immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title</Label>
              <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>Product SKU</Label>
              <Input value={editForm.product_slug} onChange={e => setEditForm(f => ({ ...f, product_slug: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Starting Price (₹)</Label>
                <Input type="number" value={editForm.starting_price} onChange={e => setEditForm(f => ({ ...f, starting_price: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Reserve Price (₹)</Label>
                <Input type="number" value={editForm.reserve_price} onChange={e => setEditForm(f => ({ ...f, reserve_price: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={editForm.quantity} onChange={e => setEditForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={editForm.unit} onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel/Withdraw Auction Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Auction</DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw this auction? This action cannot be undone.
              {bids.length > 0 && ` There are ${bids.length} existing bids that will be void.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Keep Auction</Button>
            <Button variant="destructive" onClick={handleCancelAuction} disabled={isSaving}>
              {isSaving ? 'Withdrawing...' : 'Yes, Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
