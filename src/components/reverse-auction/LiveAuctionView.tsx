/**
 * Live Reverse Auction View — Real-time bidding interface
 * Enterprise: L1/L2/L3 Leaderboard, Anti-sniping, Audit logging, Mobile sticky bid
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuctionTabLock } from '@/hooks/useAuctionTabLock';
import { AuctionResultExport } from './AuctionResultExport';
import { AuctionChat } from './AuctionChat';
import { AwardRecommendationPanel } from './AwardRecommendationPanel';
import { MarketIntelligenceCard } from './MarketIntelligenceCard';
import { AuctionPOGenerator } from './AuctionPOGenerator';
import { useMarketIntelligence } from '@/hooks/useMarketIntelligence';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getWinningBid } from '@/utils/auctionPricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Gavel, TrendingDown, Clock, ArrowLeft, IndianRupee, AlertTriangle, Shield, Trophy, ChevronDown, ChevronUp, Pencil, XCircle, Medal, Timer, Users, Zap, Target, TrendingUp, BarChart3, Send } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import { useReverseAuctionBids, useReverseAuction, ReverseAuction, ReverseAuctionBid, getRankedBids } from '@/hooks/useReverseAuction';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatCompact as sharedFmtCompact, getCurrencySymbol, getCurrencyLocale } from '@/lib/currency';
import { SupplierMultiItemBid } from './SupplierMultiItemBid';
import { LiveInviteSupplier } from './LiveInviteSupplier';
import { formatDistanceToNow, isPast, differenceInSeconds } from 'date-fns';
import { getPerUnitDisplay } from './utils/getPerUnitDisplay';

interface LiveAuctionViewProps {
  auction: ReverseAuction;
  onBack: () => void;
  isSupplier?: boolean;
}

function formatCurrency(value: number | null, currency: string = 'INR') {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Math.floor(value));
}

function formatCurrencyOneDecimal(value: number | null, currency: string = 'INR') {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
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

  // ── Tab-Level Lock: prevent same auction in multiple tabs ──
  useAuctionTabLock(initialAuction.id);

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

  const { bids, isLoading: bidsLoading, placeBid, editBid, refetch: refetchBids } = useReverseAuctionBids(auction.id);

  // Force bid refetch after auction load to avoid stale "0 bids" on completed auctions
  useEffect(() => {
    if (!auction?.id) return;
    refetchBids();
  }, [auction?.id]);

  // Refetch bids when auction becomes completed (e.g. after award)
  useEffect(() => {
    if (auction?.status === 'completed') {
      refetchBids();
    }
  }, [auction?.status]);
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
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [extendMinutes, setExtendMinutes] = useState(15);
  const [isExtending, setIsExtending] = useState(false);
  const buyerEditCount = (auction as any).buyer_edit_count || 0;
  const canEditAuction = canEdit && buyerEditCount < 2;
  const [editForm, setEditForm] = useState(() => {
    // Derive start date/time from auction_start
    const startDt = auction.auction_start ? new Date(auction.auction_start) : null;
    const startDateStr = startDt ? startDt.toISOString().slice(0, 10) : '';
    const startTimeStr = startDt ? startDt.toTimeString().slice(0, 5) : '';
    // Derive duration from start/end
    const endDt = auction.auction_end ? new Date(auction.auction_end) : null;
    const durationMin = startDt && endDt ? Math.round((endDt.getTime() - startDt.getTime()) / 60000) : 30;
    return {
      title: auction.title,
      starting_price: auction.starting_price,
      reserve_price: auction.reserve_price || '',
      quantity: auction.quantity,
      unit: auction.unit,
      product_slug: auction.product_slug,
      start_date: startDateStr,
      start_time: startTimeStr,
      duration_minutes: durationMin,
      minimum_bid_step_pct: auction.minimum_bid_step_pct || 0.25,
      transaction_type: auction.transaction_type || 'domestic',
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editingBidId, setEditingBidId] = useState<string | null>(null);
  const [editBidPrice, setEditBidPrice] = useState('');

  const isLive = effectiveStatus === 'live';

  // Market Intelligence Engine
  const { insight: marketInsight, latestAuctionDaysAgo } = useMarketIntelligence(bids, auction.starting_price, auction.product_slug);

  const currentLowest = useMemo(() => {
    if (bids.length === 0) {
      // For completed/awarded auctions, use winning_price or current_price as the effective lowest
      if (auction.winning_price) return auction.winning_price;
      if (auction.current_price) return auction.current_price;
      return auction.starting_price;
    }
    return Math.min(...bids.map(b => b.bid_price));
  }, [bids, auction.starting_price, auction.winning_price, auction.current_price]);

  const minBidStep = auction.minimum_bid_step_pct / 100;
  const savingsPctRaw = auction.starting_price > 0 ? ((auction.starting_price - currentLowest) / auction.starting_price * 100) : 0;
  const savingsPct = Math.max(0, savingsPctRaw);
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

  // Invited suppliers list & count
  const [invitedSuppliersCount, setInvitedSuppliersCount] = useState(0);
  const [invitedSuppliersList, setInvitedSuppliersList] = useState<Array<{ id: string; supplier_id: string | null; supplier_email: string | null; supplier_company_name: string | null; invite_status: string }>>([]);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [resentEmails, setResentEmails] = useState<Set<string>>(new Set());
  const resolvedCache = useRef(new Map<string, string>());

  const handleResendInvite = useCallback(async (supplierEmail: string) => {
    if (!supplierEmail) return;
    setResendingEmail(supplierEmail);
    try {
      const product = auction.product_slug?.replace(/_/g, ', ').replace(/-/g, ' ') || 'Multiple items';
      const quantity = auction.quantity ? `${auction.quantity} ${auction.unit || ''}`.trim() : 'See auction details';
      const auctionLink = `${window.location.origin}/supplier-auction/${auction.id}`;

      const { error } = await supabase.functions.invoke('send-auction-invite', {
        body: {
          email: supplierEmail,
          auctionTitle: auction.title,
          auctionId: auction.id,
          product,
          quantity,
          startTime: auction.auction_start,
          auctionLink,
        },
      });
      if (error) throw error;
      setResentEmails(prev => new Set(prev).add(supplierEmail));
      toast({ title: 'Invite resent', description: `Email sent to ${supplierEmail}` });
    } catch (err: any) {
      console.error('Resend invite error:', err);
      toast({ title: 'Failed to resend', description: err.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setResendingEmail(null);
    }
  }, [auction, toast]);

  const [isAwarding, setIsAwarding] = useState(false);

  const handleAwardBid = useCallback(async (supplierId: string) => {
    if (isAwarding) return;
    setIsAwarding(true);
    try {
      const winningBid = bids.find(b => b.supplier_id === supplierId);
      if (!winningBid) {
        toast({ title: 'Error', description: 'Bid not found', variant: 'destructive' });
        return;
      }
      const nowISO = new Date().toISOString();
      const { error } = await (supabase as any).rpc('award_reverse_auction', {
        p_auction_id: auction.id,
        p_winner_supplier_id: supplierId,
      });
      if (error) throw error;
      // Immediately update local state so UI reflects award without waiting for realtime
      setAuction(prev => ({
        ...prev,
        winner_supplier_id: supplierId,
        winning_price: winningBid.bid_price,
        status: 'completed',
        auction_end: nowISO,
      }));
      toast({ title: '🏆 Auction Awarded', description: `Awarded to supplier at ₹${winningBid.bid_price.toLocaleString('en-IN')}` });
    } catch (err: any) {
      console.error('Award error:', err);
      toast({ title: 'Award failed', description: err.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsAwarding(false);
    }
  }, [auction.id, bids, toast, isAwarding]);

  const fetchInvitedCount = useCallback(async () => {
    const { data, count } = await supabase
      .from('reverse_auction_suppliers')
      .select('id, supplier_id, supplier_email, supplier_company_name, invite_status', { count: 'exact' })
      .eq('auction_id', auction.id)
      .eq('is_active', true);
    setInvitedSuppliersCount(count || 0);

    // Enrich with company names from profiles (immutable, cached)
    const suppliers = data || [];

    // Step 1: Resolve supplier_id for email-only invites via profiles table
    const emailsToResolve = suppliers
      .filter(s => !s.supplier_id && s.supplier_email)
      .map(s => s.supplier_email!.toLowerCase());

    if (emailsToResolve.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, company_name')
        .in('email', emailsToResolve);
      if (profiles && profiles.length > 0) {
        const emailMap = new Map(profiles.map((p: any) => [p.email?.toLowerCase(), p]));
        suppliers.forEach(s => {
          if (!s.supplier_id && s.supplier_email && emailMap.has(s.supplier_email.toLowerCase())) {
            const p = emailMap.get(s.supplier_email.toLowerCase())!;
            s.supplier_id = p.id;
            s.supplier_company_name = s.supplier_company_name || p.company_name;
          }
        });
      }
    }

    // Step 2: Resolve remaining supplier_ids via RPC
    const idsToResolve = suppliers
      .filter(s => s.supplier_id && !s.supplier_company_name && !resolvedCache.current.has(s.supplier_id))
      .map(s => s.supplier_id!);

    if (idsToResolve.length > 0) {
      const { data: names } = await supabase.rpc('get_company_names', { user_ids: idsToResolve });
      if (names && Array.isArray(names)) {
        names.forEach((n: any) => resolvedCache.current.set(n.id || n.user_id, n.company_name));
      }
    }

    // Step 3: Deduplicate by supplier_id or email
    const unique = new Map<string, typeof suppliers[0]>();
    suppliers.forEach(s => {
      const key = s.supplier_id || s.supplier_email || s.id;
      if (!unique.has(key)) unique.set(key, s);
    });
    const dedupedSuppliers = Array.from(unique.values());

    setInvitedSuppliersCount(dedupedSuppliers.length);

    const enrichedSuppliers = dedupedSuppliers.map(s => ({
      ...s,
      supplier_company_name:
        s.supplier_company_name ||
        (s.supplier_id ? resolvedCache.current.get(s.supplier_id) : null) ||
        s.supplier_email ||
        'Unknown Supplier',
    }));

    setInvitedSuppliersList(enrichedSuppliers);
  }, [auction.id]);
  useEffect(() => {
    fetchInvitedCount();
  }, [fetchInvitedCount]);

  // Build supplier_id → { company_name, email } lookup for buyer leaderboard
  const supplierLookup = useMemo(() => {
    const map = new Map<string, { company: string | null; email: string | null }>();
    invitedSuppliersList.forEach(s => {
      if (s.supplier_id) {
        map.set(s.supplier_id, { company: s.supplier_company_name, email: s.supplier_email });
      }
    });
    return map;
  }, [invitedSuppliersList]);

  const recentBidCount = useMemo(() => {
    const thirtySecsAgo = Date.now() - 30000;
    return bids.filter(b => new Date(b.created_at).getTime() > thirtySecsAgo).length;
  }, [bids, timeLeft]);

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
    if (price >= currentLowest) { setBidError(`Must be less than ${formatCurrency(getWinningBid(currentLowest))} to become L1`); return; }
    setIsPlacing(true);
    try {
      await placeBid(user.id, price, auction);
      setBidPrice('');
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
        minimum_bid_step_pct: Number(editForm.minimum_bid_step_pct),
        transaction_type: editForm.transaction_type,
      };
      // Compute auction_start and auction_end from date/time/duration
      if (editForm.start_date && editForm.start_time) {
        const start = new Date(`${editForm.start_date}T${editForm.start_time}`);
        if (!isNaN(start.getTime())) {
          updates.auction_start = start.toISOString();
          updates.auction_end = new Date(start.getTime() + editForm.duration_minutes * 60000).toISOString();
        }
      }
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

  const handleExtendTime = async () => {
    if (!auction.auction_end || isExtending) return;
    setIsExtending(true);
    try {
      const currentEnd = new Date(auction.auction_end);
      const newEnd = new Date(currentEnd.getTime() + extendMinutes * 60000);
      const { error } = await (supabase as any).rpc('extend_auction_end', {
        p_auction_id: auction.id,
        p_new_end: newEnd.toISOString(),
      });
      if (error) throw error;
      setAuction(prev => ({ ...prev, auction_end: newEnd.toISOString() }));
      toast({ title: '⏱️ Time Extended', description: `Auction extended by ${extendMinutes} minutes` });
      setShowExtendDialog(false);
    } catch (err: any) {
      toast({ title: 'Failed to extend', description: err.message, variant: 'destructive' });
    } finally {
      setIsExtending(false);
    }
  };

  const urgencyColor = useMemo(() => {
    if (!auction.auction_end || !isLive) return '';
    const secs = differenceInSeconds(new Date(auction.auction_end), new Date());
    if (secs <= 60) return 'text-destructive animate-pulse';
    if (secs <= 300) return 'text-destructive';
    return 'text-foreground';
  }, [auction.auction_end, isLive, timeLeft]);

  const isValidBid = bidPrice && !isNaN(parseFloat(bidPrice)) && parseFloat(bidPrice) < currentLowest;
  const parsedBidPrice = bidPrice ? parseFloat(bidPrice) : 0;
  const bidReductionPct = currentLowest > 0 ? ((currentLowest - parsedBidPrice) / currentLowest) * 100 : 0;
  const isWeakSingleBid = parsedBidPrice > 0 && parsedBidPrice < currentLowest && bidReductionPct < auction.minimum_bid_step_pct;

  // Multi-item bid panel for supplier — DB status is single source of truth
  const isDbLive = auction.status === 'live';
  const multiItemBidPanel = isSupplier && isDbLive ? (
    <SupplierMultiItemBid
      auction={auction}
      bids={bids}
      onBidPlaced={() => {
        setBidPrice('');
        document.getElementById("live-strip")?.scrollIntoView({ behavior: "smooth" });
      }}
      isLive={isDbLive}
    />
  ) : null;

  // Reusable bid panel content (fallback for single-item or non-multi-item auctions)
  const bidPanelContent = isSupplier ? (
    isDbLive ? (
      multiItemBidPanel || (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gavel className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Place Your Bid</h3>
        </div>
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          <span>Bid below {formatCurrency(getWinningBid(currentLowest))} to become L1</span>
          {isWeakSingleBid && (
            <span className="text-amber-600">
              · Tip: reduce ~{auction.minimum_bid_step_pct}% for stronger competitiveness
            </span>
          )}
          {parsedBidPrice > 0 && parsedBidPrice < currentLowest && (
            <span className="text-xs text-emerald-600 font-medium">✅ Valid bid — you're in the race</span>
          )}
          {parsedBidPrice >= currentLowest && parsedBidPrice > 0 && parsedBidPrice <= currentLowest * 1.005 && (
            <span className="text-xs text-primary font-medium">⚡ You're very close — 1 click to win</span>
          )}
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
              placeholder={`Enter below ${Math.floor(currentLowest)}`}
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
      )
    ) : effectiveStatus === 'scheduled' ? (
      multiItemBidPanel || (
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
      )
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

  const totalSavedRaw = auction.starting_price - currentLowest;
  const totalSavedAmount = Math.max(0, totalSavedRaw);
  const auctionOutcome: 'excellent' | 'good' | 'neutral' | 'bad' =
    savingsPctRaw > 2 ? 'excellent' : savingsPctRaw > 0 ? 'good' : savingsPctRaw === 0 ? 'neutral' : 'bad';
  const formatPct = (n: number) => `${Math.abs(n).toFixed(2)}%`;
  const outcomeColor = auctionOutcome === 'excellent' || auctionOutcome === 'good'
    ? 'text-emerald-600' : auctionOutcome === 'bad' ? 'text-destructive' : 'text-muted-foreground';
  const uniqueSuppliers = useMemo(() => new Set(bids.map(b => b.supplier_id)).size, [bids]);

  return (
    <div className="min-h-screen pb-20">
      {/* 🏆 Live L1 Strip — sticky top bar for mobile + desktop */}
      {isLive && bids.length > 0 && (
        <div className="sticky top-0 z-40 bg-foreground text-background px-4 py-2 flex items-center justify-between text-sm rounded-b-lg mb-3 shadow-lg">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">L1: {formatCurrency(currentLowest)}</span>
            <span className="text-xs opacity-70">
              ({formatPct(savingsPct)} savings)
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isSupplier && myRank && (
              <span className={`font-medium ${myRank === 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
                Your Rank: L{myRank}
              </span>
            )}
            <span className={`font-mono ${urgencyColor}`}>{timeLeft}</span>
          </div>
        </div>
      )}

      {/* Back button + Export */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Auctions
        </Button>
        <div className="flex items-center gap-2">
          {isBuyer && <AuctionResultExport auction={auction} bids={bids} />}
              {isBuyer && isLive && (
                <Button variant="outline" size="sm" onClick={() => setShowExtendDialog(true)} className="gap-1">
                  <Timer className="w-3 h-3" /> Extend Time
                </Button>
              )}
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
            {isBuyer ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border text-xs font-medium hover:bg-muted transition-colors cursor-pointer">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span>{invitedSuppliersCount} supplier{invitedSuppliersCount !== 1 ? 's' : ''} invited{activeBidders > 0 ? ` · ${activeBidders} bidding` : ''}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-semibold">Invited Suppliers ({invitedSuppliersCount})</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-border">
                    {invitedSuppliersList.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-3">No suppliers invited yet.</p>
                    ) : (
                      invitedSuppliersList.map((s) => (
                        <div key={s.id} className="px-3 py-2 flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                            <span className="text-sm font-medium truncate">{s.supplier_company_name || 'Unknown Company'}</span>
                            <span className="text-xs text-muted-foreground truncate">{s.supplier_email || '—'}</span>
                            <Badge variant={s.invite_status === 'bid_submitted' ? 'default' : 'secondary'} className="w-fit text-[10px] mt-0.5">
                              {s.invite_status === 'bid_submitted' ? '✅ Bidding' : s.invite_status === 'clicked' ? '👁 Clicked' : s.invite_status === 'opened' ? '📬 Opened' : '📩 Sent'}
                            </Badge>
                          </div>
                          {s.supplier_email && s.invite_status !== 'bid_submitted' && (
                            resentEmails.has(s.supplier_email) ? (
                              <span className="text-[10px] text-muted-foreground shrink-0 mt-1">✓ Resent</span>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs gap-1 shrink-0 mt-0.5"
                                disabled={resendingEmail === s.supplier_email}
                                onClick={() => handleResendInvite(s.supplier_email!)}
                              >
                                <Send className="w-3 h-3" />
                                {resendingEmail === s.supplier_email ? 'Sending…' : 'Resend'}
                              </Button>
                            )
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border text-xs font-medium">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>{invitedSuppliersCount} supplier{invitedSuppliersCount !== 1 ? 's' : ''} invited{activeBidders > 0 ? ` · ${activeBidders} bidding` : ''}</span>
              </div>
            )}
            {recentBidCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800 animate-pulse">
                <Zap className="w-3.5 h-3.5" />
                {recentBidCount} bid{recentBidCount !== 1 ? 's' : ''} in last 30s
              </div>
            )}
            {isBuyer && (
              <LiveInviteSupplier auctionId={auction.id} auctionTitle={auction.title} onInvited={fetchInvitedCount} />
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
          {auctionOutcome === 'excellent' || auctionOutcome === 'good' ? (
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(totalSavedAmount)}
                </h2>
                <span className="text-emerald-600 text-sm font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {formatPct(savingsPct)}
                </span>
              </div>
              <span className={`text-xs font-medium ${outcomeColor}`}>
                {auctionOutcome === 'excellent' ? '🔥 Highly Optimized' : '✅ Cost Optimized'}
              </span>
              <div className="text-xs text-muted-foreground mt-0.5">
                You saved {formatCurrency(totalSavedAmount)} vs starting price
              </div>
            </div>
          ) : auctionOutcome === 'neutral' ? (
            <div>
              <h2 className="text-2xl font-bold text-foreground">{formatCurrency(currentLowest)}</h2>
              <span className="text-xs text-muted-foreground">➖ No change in price</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <h2 className="text-lg font-bold text-destructive">
                  Final price higher by {formatCurrency(Math.abs(totalSavedRaw))} ({formatPct(savingsPctRaw)})
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Starting: {formatCurrency(auction.starting_price)} → Final: {formatCurrency(currentLowest)}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[0.625rem] border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Per Unit Saved</p>
          {(() => {
            const perUnit = getPerUnitDisplay(totalSavedAmount, auction.quantity, auction.currency);
            return (
              <>
                <h2 className={`text-2xl font-bold ${perUnit.isLowImpact ? 'text-muted-foreground' : 'text-primary'}`} title={`Exact: ₹${perUnit.raw.toFixed(4)}`}>
                  {perUnit.display}
                </h2>
                <span className="text-xs text-muted-foreground">per {auction.unit} · {formatCurrency(totalSavedAmount)} over {auction.quantity} {auction.unit}</span>
              </>
            );
          })()}
        </div>

        <div className="rounded-[0.625rem] border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            {effectiveStatus === 'completed' ? 'Winning Price' : 'Current L1 Price'}
          </p>
          <h2 className="text-2xl font-bold text-foreground">
            {formatCurrency(currentLowest)}
          </h2>
          <span className="text-xs text-muted-foreground">vs {formatCurrency(auction.starting_price)} start</span>
        </div>

        <div className="rounded-[0.625rem] border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Competition</p>
          <h2 className="text-2xl font-bold text-foreground">{uniqueSuppliers || (effectiveStatus === 'completed' && auction.winner_supplier_id ? 1 : 0)}</h2>
          <span className="text-xs text-muted-foreground">
            {bids.length > 0 ? `${bids.length} total bids` : effectiveStatus === 'completed' && auction.winner_supplier_id ? 'Awarded' : '0 total bids'}
          </span>
        </div>
      </div>

      {/* 📈 MAIN GRID: Chart + Leaderboard side-by-side */}
      <div className="flex flex-col lg:flex-row gap-4 items-start mb-4">
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
              {effectiveStatus === 'completed' && auction.winning_price
                ? 'Auction completed — bid history unavailable'
                : 'Waiting for bids to render chart...'}
            </div>
          )}
        </div>

        {/* RIGHT: Leaderboard */}
        <div className="w-full lg:w-80 shrink-0 rounded-[0.625rem] border bg-card p-4 shadow-sm">
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
                        {isBuyer
                          ? (supplierLookup.get(bid.supplier_id)?.company ||
                             supplierLookup.get(bid.supplier_id)?.email ||
                             `PS-${bid.supplier_id.slice(0, 4).toUpperCase()}`)
                          : `PS-${bid.supplier_id.slice(0, 4).toUpperCase()}`}
                        {isMine && <span className="text-primary ml-1 font-medium">(You)</span>}
                      </p>
                      {isBuyer && supplierLookup.get(bid.supplier_id)?.email && (
                        <p className="text-[10px] text-muted-foreground/70 truncate max-w-[140px]">
                          {supplierLookup.get(bid.supplier_id)!.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {isWinner && (
                      <Badge className="bg-emerald-600 text-white text-xs">
                        {effectiveStatus === 'completed' ? 'Winner' : 'L1'}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {((auction.starting_price - bid.bid_price) / auction.starting_price * 100).toFixed(2)}% off
                    </p>
                  </div>
                </div>
              );
            })}
            {bidsLoading && rankedBids.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground animate-pulse">Loading bids...</p>
              </div>
            )}
            {!bidsLoading && rankedBids.length === 0 && (
              <div className="text-center py-6">
                {effectiveStatus === 'completed' && auction.winner_supplier_id ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-emerald-700">🏆 Auction awarded</p>
                    <p className="text-xs text-muted-foreground">Winner: {formatCurrency(auction.winning_price || currentLowest)}</p>
                  </div>
                ) : invitedSuppliersCount > 0 ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {invitedSuppliersCount} supplier{invitedSuppliersCount !== 1 ? 's' : ''} invited — waiting for bids...
                    </p>
                    {isLive && <p className="text-xs text-muted-foreground/60 animate-pulse">Bids will appear here in real-time</p>}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No bids yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🏆 Direct Award (single bid, not yet awarded) */}
      {isBuyer && bids.length === 1 && bids[0] && effectiveStatus === 'live' && !auction.winner_supplier_id && (
        <div className="mt-4 flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
          <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Only 1 supplier has bid — you can award directly
          </div>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            disabled={isAwarding || auction.status === 'completed'}
            onClick={() => {
              const bid = bids[0];
              if (!bid) return;
              const confirmAward = window.confirm(
                `Award this auction to the supplier at ₹${bid.bid_price.toLocaleString('en-IN')}?`
              );
              if (confirmAward) {
                handleAwardBid(bid.supplier_id);
              }
            }}
          >
            <Trophy className="w-3.5 h-3.5" />
            {isAwarding ? 'Awarding...' : 'Award Supplier'}
          </Button>
        </div>
      )}

      {/* 🔥 VALUE LINE */}
      {totalSavedAmount > 0 && (
        <div className="rounded-[0.625rem] bg-emerald-50 border border-emerald-200 p-4 text-center mb-4">
          <p className="text-lg font-bold text-emerald-800">
            💰 You saved {formatCurrency(totalSavedAmount)} ({formatPct(savingsPct)}) in this auction
          </p>
        </div>
      )}

      {/* 📊 Market Intelligence (buyer only, when bids exist) */}
      {isBuyer && bids.length >= 1 && marketInsight && (
        <div className="mb-4">
          <MarketIntelligenceCard
            insight={marketInsight}
            currentBest={currentLowest}
            currency={auction.currency}
            daysAgo={latestAuctionDaysAgo}
          />
        </div>
      )}

      {/* 🏆 Award Recommendation (buyer only, when bids exist, not yet awarded) */}
      {isBuyer && bids.length >= 1 && !auction.winner_supplier_id && (
        <div className="mb-4">
          <AwardRecommendationPanel
            bids={bids}
            startingPrice={auction.starting_price}
            currency={auction.currency}
            onAward={handleAwardBid}
            marketAvgPrice={marketInsight?.avgPrice ?? null}
          />
        </div>
      )}

      {/* 🏆 Winner Banner + Purchase Order Generator (buyer only, awarded auction) */}
      {isBuyer && auction.winner_supplier_id && (
        <>
          <div className="rounded-[0.625rem] bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 mb-4 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                🏆 Auction Awarded — Winner: {formatCurrency(auction.winning_price || currentLowest)}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                {showPOGenerator
                  ? 'Generate the Purchase Order below'
                  : 'Would you like to generate a Purchase Order for this award?'}
              </p>
            </div>
          </div>
          {!showPOGenerator ? (
            <div className="rounded-[0.625rem] border border-border bg-card p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Do you want to generate a Purchase Order?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You can generate it now or come back later from this auction.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPOGenerator(false)}>
                  Not now
                </Button>
                <Button size="sm" onClick={() => setShowPOGenerator(true)}>
                  Yes, generate PO
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <AuctionPOGenerator
                auction={auction}
                winnerSupplierId={auction.winner_supplier_id}
                winningPrice={auction.winning_price || currentLowest}
              />
            </div>
          )}
        </>
      )}

      {/* SUPPLIER BID PANEL — Full width above bid history for visibility */}
      {!isMobile && bidPanelContent && (
        <div className="mb-4">
          {bidPanelContent}
        </div>
      )}

      <div className="space-y-4">
          {/* Bid History */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Bid History ({bids.length} bids)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bidsLoading && bids.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm animate-pulse">Loading bids...</p>
              ) : bids.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  {effectiveStatus === 'completed' && auction.winner_supplier_id
                    ? 'Bid history not available — auction was awarded at ' + formatCurrency(auction.winning_price || currentLowest)
                    : 'No bids yet. Waiting for suppliers to bid...'}
                </p>
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
                              {isBuyer
                                ? (supplierLookup.get(bid.supplier_id)?.company || `PS-${bid.supplier_id.slice(0, 4).toUpperCase()}`)
                                : `PS-${bid.supplier_id.slice(0, 4).toUpperCase()}`}
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

          {/* 💬 Negotiation Chat */}
          <AuctionChat
            auctionId={auction.id}
            buyerId={auction.buyer_id}
            isBuyer={isBuyer}
            isLive={isLive}
            currentL1={currentLowest}
          />
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
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
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

            {/* Auction Start Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Auction Start Date</Label>
                <Input type="date" value={editForm.start_date} onChange={e => setEditForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <Label>Auction Start Time</Label>
                <Input type="time" value={editForm.start_time} onChange={e => setEditForm(f => ({ ...f, start_time: e.target.value }))} />
              </div>
            </div>

            {/* Duration, Min Bid Step, Trade Type */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Duration</Label>
                <select
                  value={editForm.duration_minutes}
                  onChange={e => setEditForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={360}>6 hours</option>
                  <option value={720}>12 hours</option>
                  <option value={1440}>24 hours</option>
                </select>
              </div>
              <div>
                <Label>Min Bid Step (%)</Label>
                <Input type="number" step="0.05" value={editForm.minimum_bid_step_pct} onChange={e => setEditForm(f => ({ ...f, minimum_bid_step_pct: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Trade Type</Label>
                <select
                  value={editForm.transaction_type}
                  onChange={e => setEditForm(f => ({ ...f, transaction_type: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="domestic">Domestic</option>
                  <option value="import">Import</option>
                  <option value="export">Export</option>
                </select>
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

      {/* Extend Time Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              Extend Auction Time
            </DialogTitle>
            <DialogDescription>
              Add more time to the live auction. All suppliers will see the updated end time in real-time.
              {auction.auction_end && (
                <span className="block mt-1 font-medium text-foreground">
                  Current end: {new Date(auction.auction_end).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">Extend by</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[5, 10, 15, 30].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setExtendMinutes(mins)}
                    className={`px-3 py-2.5 rounded-md border text-sm font-medium transition-colors ${
                      extendMinutes === mins
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 border-border hover:bg-muted text-foreground'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[60, 120, 1440].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setExtendMinutes(mins)}
                    className={`px-3 py-2.5 rounded-md border text-sm font-medium transition-colors ${
                      extendMinutes === mins
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 border-border hover:bg-muted text-foreground'
                    }`}
                  >
                    {mins >= 60 ? `${mins / 60} hr${mins > 60 ? 's' : ''}` : `${mins} min`}
                  </button>
                ))}
              </div>
            </div>
            {auction.auction_end && (
              <div className="rounded-lg bg-muted/50 border p-3 text-sm">
                <p className="text-muted-foreground">New end time:</p>
                <p className="font-semibold text-foreground">
                  {new Date(new Date(auction.auction_end).getTime() + extendMinutes * 60000).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDialog(false)}>Cancel</Button>
            <Button onClick={handleExtendTime} disabled={isExtending} className="gap-1.5">
              <Timer className="w-4 h-4" />
              {isExtending ? 'Extending...' : `Extend by ${extendMinutes >= 60 ? `${extendMinutes / 60} hr${extendMinutes > 60 ? 's' : ''}` : `${extendMinutes} min`}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
