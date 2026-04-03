/**
 * Live Reverse Auction View — Real-time bidding interface
 * Used by both buyers (monitor + edit/cancel) and suppliers (place bids)
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Gavel, TrendingDown, Clock, ArrowLeft, IndianRupee, AlertTriangle, Shield, Trophy, ChevronDown, ChevronUp, Pencil, XCircle } from 'lucide-react';
import { useReverseAuctionBids, useReverseAuction, ReverseAuction, ReverseAuctionBid } from '@/hooks/useReverseAuction';
import { useAuth } from '@/hooks/useAuth';
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

export function LiveAuctionView({ auction, onBack, isSupplier = false }: LiveAuctionViewProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { bids, placeBid } = useReverseAuctionBids(auction.id);
  const { updateAuction, cancelAuction } = useReverseAuction();
  const [bidPrice, setBidPrice] = useState('');
  const [bidError, setBidError] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [showBidPanel, setShowBidPanel] = useState(true);
  const prevRankRef = useRef<number | null>(null);
  const lastOutbidRef = useRef(0);

  // Buyer edit/cancel state
  const isBuyer = user?.id === auction.buyer_id;
  const canEdit = isBuyer && (auction.status === 'scheduled' || auction.status === 'live');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    title: auction.title,
    starting_price: auction.starting_price,
    reserve_price: auction.reserve_price || '',
    quantity: auction.quantity,
    unit: auction.unit,
  });
  const [isSaving, setIsSaving] = useState(false);

  const isLive = auction.status === 'live';

  const currentLowest = useMemo(() => {
    if (bids.length === 0) return auction.starting_price;
    return Math.min(...bids.map(b => b.bid_price));
  }, [bids, auction.starting_price]);

  const minBidStep = auction.minimum_bid_step_pct / 100;
  const maxAllowedBid = currentLowest * (1 - minBidStep);
  const totalSavings = ((auction.starting_price - currentLowest) / auction.starting_price * 100);

  // Reverse auctions use prepaid credits — no percentage markup on bid price
  const buyerPrice = currentLowest;

  // Supplier rank calculation
  const myRank = useMemo(() => {
    if (!user || !isSupplier || bids.length === 0) return null;
    const sortedPrices = [...new Set(bids.map(b => b.bid_price))].sort((a, b) => a - b);
    const myBids = bids.filter(b => b.supplier_id === user.id);
    if (myBids.length === 0) return null;
    const myBestPrice = Math.min(...myBids.map(b => b.bid_price));
    return sortedPrices.indexOf(myBestPrice) + 1;
  }, [bids, user, isSupplier]);

  const myBestBid = useMemo(() => {
    if (!user || bids.length === 0) return null;
    const myBids = bids.filter(b => b.supplier_id === user.id);
    if (myBids.length === 0) return null;
    return Math.min(...myBids.map(b => b.bid_price));
  }, [bids, user]);

  const isWinning = myRank === 1;

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
    if (!isLive) {
      setBidError('Auction has ended');
      return;
    }
    setBidError('');
    if (!user) return;
    if (!bidPrice) {
      setBidError('Enter a bid amount');
      return;
    }
    const price = parseFloat(bidPrice);
    if (isNaN(price) || price <= 0) {
      setBidError('Enter a valid amount');
      return;
    }
    if (price >= currentLowest) {
      setBidError('Bid must be LOWER than current L1');
      return;
    }
    if (price > maxAllowedBid) {
      setBidError(`Max allowed: ${formatCurrency(maxAllowedBid)} (min ${auction.minimum_bid_step_pct}% step)`);
      return;
    }
    setIsPlacing(true);
    try {
      await placeBid(user.id, price);
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

  const urgencyColor = useMemo(() => {
    if (!auction.auction_end || !isLive) return '';
    const secs = differenceInSeconds(new Date(auction.auction_end), new Date());
    if (secs <= 60) return 'text-destructive animate-pulse';
    if (secs <= 300) return 'text-destructive';
    return 'text-foreground';
  }, [auction.auction_end, isLive, timeLeft]);

  const isValidBid = bidPrice && !isNaN(parseFloat(bidPrice)) && parseFloat(bidPrice) < currentLowest && parseFloat(bidPrice) <= maxAllowedBid;

  // Reusable bid panel content
  const bidPanelContent = isSupplier && isLive ? (
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
        <Button
          onClick={handlePlaceBid}
          disabled={!isValidBid || isPlacing}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
        >
          {isPlacing ? 'Placing...' : '🚀 Bid'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Suggested: {formatCurrency(Math.floor(maxAllowedBid))}
      </p>
      {/* Error feedback */}
      {bidError && (
        <p className="text-xs text-destructive font-medium">{bidError}</p>
      )}
    </div>
  ) : null;

  return (
    <div className="space-y-4 pb-20">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to Auctions
      </Button>

      {/* 🔥 STICKY LIVE STRIP */}
      {isLive && (
        <div id="live-strip" className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm rounded-lg p-3 scroll-mt-24">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Current L1</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(currentLowest)}
              </p>
            </div>

            {isSupplier && myRank !== null && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Your Rank</p>
                <p className={`text-lg font-bold ${isWinning ? 'text-emerald-600' : 'text-destructive'}`}>
                  #{myRank}
                </p>
              </div>
            )}

            {isSupplier && myBestBid !== null && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Your Best</p>
                <p className={`text-lg font-semibold ${isWinning ? 'text-emerald-600' : 'text-destructive'}`}>
                  {formatCurrency(myBestBid)}
                </p>
              </div>
            )}

            <div className="text-right">
              <p className="text-xs text-muted-foreground">Time Left</p>
              <p className={`text-lg font-mono font-bold ${urgencyColor}`}>
                {timeLeft}
              </p>
            </div>
          </div>

          {/* Winning / Losing feedback strip */}
          {isSupplier && myRank !== null && (
            <div className={`mt-2 rounded-md px-3 py-1.5 text-sm font-medium flex items-center gap-2 ${
              isWinning
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}>
              {isWinning ? (
                <>
                  <Trophy className="w-4 h-4" />
                  You are L1 — Currently winning!
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Outbid — reduce your price to win
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Desktop: side-by-side layout with sticky bid panel */}
      <div className={`${!isMobile && bidPanelContent ? 'flex gap-4 items-start' : ''}`}>
        <div className="flex-1 space-y-4">
          {/* Auction Header */}
          <Card className={isLive ? 'border-emerald-300 ring-2 ring-emerald-100' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{auction.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {auction.category} • {auction.quantity} {auction.unit} • {auction.product_slug}
                  </p>
                </div>
                <div className="text-right">
                  {isLive && (
                    <Badge className="bg-emerald-600 text-white animate-pulse text-lg px-3 py-1">
                      🔴 LIVE
                    </Badge>
                  )}
                  {!isLive && auction.status === 'completed' && (
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Starting Price</p>
                  <p className="text-lg font-bold">{formatCurrency(auction.starting_price)}<span className="text-xs text-muted-foreground">/{auction.unit}</span></p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                  <p className="text-xs text-emerald-700">Current Lowest</p>
                  <p className="text-lg font-bold text-emerald-800">{formatCurrency(currentLowest)}<span className="text-xs text-muted-foreground">/{auction.unit}</span></p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <p className="text-xs text-amber-700">Total Savings</p>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 text-amber-700" />
                    <p className="text-lg font-bold text-amber-800">{totalSavings.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-blue-700">Buyer Price</p>
                  <p className="text-lg font-bold text-blue-800">{formatCurrency(buyerPrice)}<span className="text-xs text-muted-foreground">/{auction.unit}</span></p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Starting: {formatCurrency(auction.starting_price)}</span>
                  <span>{totalSavings.toFixed(1)}% saved</span>
                  {auction.reserve_price && <span>Reserve: {formatCurrency(auction.reserve_price)}</span>}
                </div>
                <Progress value={Math.min(totalSavings, 100)} className="h-2" />
              </div>
            </CardContent>
          </Card>

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
                  {bids.map((bid, idx) => {
                    const isMine = user && bid.supplier_id === user.id;
                    return (
                      <div
                        key={bid.id}
                        className={`flex items-center justify-between p-2 rounded-md text-sm ${
                          idx === 0
                            ? 'bg-emerald-50 border border-emerald-200'
                            : isMine
                              ? 'bg-primary/5 border border-primary/20'
                              : 'bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {idx === 0 && <Badge className="bg-emerald-600 text-white text-xs">L1</Badge>}
                          {isMine && <Badge variant="outline" className="text-xs border-primary text-primary">You</Badge>}
                          <span className="text-muted-foreground font-mono text-xs">
                            PS-{bid.supplier_id.slice(0, 4).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-semibold ${
                            idx === 0 ? 'text-emerald-700' : isMine ? 'text-primary' : ''
                          }`}>
                            {formatCurrency(bid.bid_price)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                          </span>
                        </div>
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
          <div className="sticky top-24 w-[320px] shrink-0 bg-background border rounded-xl shadow-lg p-4">
            {bidPanelContent}
          </div>
        )}
      </div>

      {/* 📱 MOBILE → Fixed bottom bid panel */}
      {isMobile && bidPanelContent && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-2xl">
          <div
            className="flex items-center justify-between p-3 cursor-pointer border-b"
            onClick={() => setShowBidPanel(p => !p)}
          >
            <div className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">Place Your Bid</h3>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {showBidPanel ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>
          {showBidPanel && (
            <div className="p-4 pt-2">
              {bidPanelContent}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
