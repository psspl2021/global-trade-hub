/**
 * Live Reverse Auction View — Real-time bidding interface
 * Used by both buyers (monitor) and suppliers (place bids)
 */
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Gavel, TrendingDown, Clock, ArrowLeft, IndianRupee, AlertTriangle, Shield } from 'lucide-react';
import { useReverseAuctionBids, ReverseAuction, ReverseAuctionBid } from '@/hooks/useReverseAuction';
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
  const { bids, placeBid } = useReverseAuctionBids(auction.id);
  const [bidPrice, setBidPrice] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const isLive = auction.status === 'live';
  const currentLowest = useMemo(() => {
    if (bids.length === 0) return auction.starting_price;
    return Math.min(...bids.map(b => b.bid_price));
  }, [bids, auction.starting_price]);

  const minBidStep = auction.minimum_bid_step_pct / 100;
  const maxAllowedBid = currentLowest * (1 - minBidStep);
  const totalSavings = ((auction.starting_price - currentLowest) / auction.starting_price * 100);

  // Platform fee calculation
  const platformFeePct = auction.transaction_type === 'domestic' ? 0.005 : 0.01;
  const buyerPrice = currentLowest * (1 + platformFeePct);

  // Timer
  useEffect(() => {
    if (!auction.auction_end || !isLive) return;
    const interval = setInterval(() => {
      const end = new Date(auction.auction_end!);
      if (isPast(end)) {
        setTimeLeft('Ended');
      } else {
        const secs = differenceInSeconds(end, new Date());
        const mins = Math.floor(secs / 60);
        const remainSecs = secs % 60;
        setTimeLeft(`${mins}:${String(remainSecs).padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [auction.auction_end, isLive]);

  const handlePlaceBid = async () => {
    if (!user || !bidPrice) return;
    const price = parseFloat(bidPrice);
    if (price >= currentLowest) {
      return;
    }
    if (price > maxAllowedBid) {
      return;
    }
    setIsPlacing(true);
    await placeBid(user.id, price);
    setBidPrice('');
    setIsPlacing(false);
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to Auctions
      </Button>

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
              {isLive && (
                <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono text-lg font-bold">{timeLeft}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Price Stats */}
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
              <p className="text-xs text-blue-700">Buyer Price (incl. fee)</p>
              <p className="text-lg font-bold text-blue-800">{formatCurrency(buyerPrice)}<span className="text-xs text-muted-foreground">/{auction.unit}</span></p>
            </div>
          </div>

          {/* Savings Progress */}
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

      {/* Supplier Bid Form */}
      {isSupplier && isLive && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <Gavel className="w-5 h-5 text-amber-700" />
              <h3 className="font-semibold text-amber-900">Place Your Bid</h3>
            </div>
            <div className="flex items-center gap-2 mb-2 text-xs text-amber-700">
              <AlertTriangle className="w-3 h-3" />
              Must be below {formatCurrency(maxAllowedBid)} (min {auction.minimum_bid_step_pct}% step)
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <IndianRupee className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  type="number"
                  className="pl-8"
                  placeholder={`Max ${Math.floor(maxAllowedBid)}`}
                  value={bidPrice}
                  onChange={e => setBidPrice(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePlaceBid()}
                />
              </div>
              <Button
                onClick={handlePlaceBid}
                disabled={isPlacing || !bidPrice || parseFloat(bidPrice) >= currentLowest}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {isPlacing ? 'Placing...' : 'Place Bid'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              {bids.map((bid, idx) => (
                <div
                  key={bid.id}
                  className={`flex items-center justify-between p-2 rounded-md text-sm ${
                    idx === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {idx === 0 && <Badge className="bg-emerald-600 text-white text-xs">Lowest</Badge>}
                    <span className="text-muted-foreground font-mono text-xs">
                      PS-{bid.supplier_id.slice(0, 4).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(bid.bid_price)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
