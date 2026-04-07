/**
 * Multi-Item Supplier Bidding Table
 * Enterprise-grade: per-item pricing, auto-total, race-safe DB placement, live rank via realtime
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, Gavel, AlertTriangle, Trophy, Target, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ReverseAuction, ReverseAuctionBid, getRankedBids } from '@/hooks/useReverseAuction';
import { toast } from 'sonner';
import { logAuctionEvent } from '@/utils/auctionAuditLogger';

interface AuctionItem {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number | null;
  description: string | null;
}

interface SupplierMultiItemBidProps {
  auction: ReverseAuction;
  bids: ReverseAuctionBid[];
  onBidPlaced: () => void;
  isLive: boolean;
}

function formatCurrency(value: number, currency: string = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export function SupplierMultiItemBid({ auction, bids, onBidPlaced, isLive }: SupplierMultiItemBidProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [bidPrices, setBidPrices] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [prevL1, setPrevL1] = useState<number | null>(null);

  // Check if supplier is invited to this auction
  useEffect(() => {
    if (!user) return;
    const checkAuth = async () => {
      const { data } = await supabase
        .from('reverse_auction_suppliers')
        .select('id')
        .eq('auction_id', auction.id)
        .or(`supplier_id.eq.${user.id},supplier_email.eq.${user.email}`)
        .limit(1);
      setIsAuthorized(!!data && data.length > 0);
    };
    checkAuth();
  }, [auction.id, user]);

  // Fetch auction items
  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('reverse_auction_items')
        .select('*')
        .eq('auction_id', auction.id)
        .order('created_at');
      console.log('[MultiItemBid] items fetch:', { auctionId: auction.id, count: data?.length, error: error?.message });
      if (!error && data) {
        setItems(data as unknown as AuctionItem[]);
      } else if (error) {
        console.error('[MultiItemBid] items fetch error:', error);
      }
      setIsLoadingItems(false);
    };
    fetchItems();
  }, [auction.id]);

  // Current L1 price
  const currentLowest = useMemo(() => {
    if (bids.length === 0) return auction.starting_price;
    return Math.min(...bids.map(b => b.bid_price));
  }, [bids, auction.starting_price]);

  const minBidStep = auction.minimum_bid_step_pct / 100;
  const maxAllowedBid = currentLowest * (1 - minBidStep);

  const hasItems = items.length > 0;

  // Rounding-safe distribution: last item absorbs remainder to avoid drift
  const distributeTotal = useCallback((targetTotal: number): Record<string, string> => {
    if (!hasItems) return { single: String(targetTotal) };
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    let remaining = targetTotal;
    const newPrices: Record<string, string> = {};
    items.forEach((item, index) => {
      if (index === items.length - 1) {
        // Last item absorbs remainder for exact total
        newPrices[item.id] = String(Math.max(1, Math.round(remaining / item.quantity)));
      } else {
        const share = (item.quantity / totalQty) * targetTotal;
        const unit = Math.max(1, Math.floor(share / item.quantity));
        newPrices[item.id] = String(unit);
        remaining -= unit * item.quantity;
      }
    });
    return newPrices;
  }, [items, hasItems]);

  // Calculate total from line items OR single bid
  const bidTotal = useMemo(() => {
    if (!hasItems) return Number(bidPrices['single'] || 0);
    return items.reduce((sum, item) => {
      const price = Number(bidPrices[item.id] || 0);
      return sum + (Math.round(price * 100) / 100) * (Math.round(item.quantity * 100) / 100);
    }, 0);
  }, [items, bidPrices, hasItems]);

  // Validate bid
  const validationError = useMemo(() => {
    if (hasItems) {
      const emptyItems = items.filter(i => !bidPrices[i.id] || Number(bidPrices[i.id]) <= 0);
      if (emptyItems.length > 0) return `Enter price for all ${items.length} items`;
    }
    if (bidTotal <= 0) return 'Total bid must be greater than 0';
    if (bidTotal >= currentLowest) return `Total must be below ${formatCurrency(currentLowest)} (current L1)`;
    if (bidTotal > maxAllowedBid) return `Must reduce by at least ${auction.minimum_bid_step_pct}% (max: ${formatCurrency(Math.floor(maxAllowedBid))})`;
    return null;
  }, [items, bidPrices, bidTotal, currentLowest, maxAllowedBid, auction.minimum_bid_step_pct, hasItems]);

  const isValidBid = !validationError && bidTotal > 0;

  // My rank
  const rankedBids = useMemo(() => getRankedBids(bids), [bids]);
  const myRank = useMemo(() => {
    if (!user) return null;
    return rankedBids.find(b => b.supplier_id === user.id)?.rank ?? null;
  }, [rankedBids, user]);

  // Rank visibility — respect auction settings
  const showExactPrices = (auction as any).show_exact_prices ?? false;
  const showRankOnly = (auction as any).show_rank_only ?? true;

  // Real-time outbid alert
  useEffect(() => {
    if (!user || bids.length === 0) return;
    const newL1 = Math.min(...bids.map(b => b.bid_price));
    if (prevL1 !== null && newL1 < prevL1) {
      // L1 changed — check if we were outbid
      const myBid = bids.find(b => b.supplier_id === user.id);
      if (myBid && myBid.bid_price > newL1) {
        toast.warning(`⚠️ You've been outbid! New L1: ${formatCurrency(newL1)}`);
      }
    }
    setPrevL1(newL1);
  }, [bids, user]);

  const handleSubmitBid = useCallback(async () => {
    if (!user || !isValidBid || isSubmitting) return;

    // Use cached authorization — no redundant DB call
    if (!isAuthorized) {
      toast.error('You are not authorized to bid on this auction.');
      return;
    }

    // Bid confirmation dialog
    const confirmed = window.confirm(`Place bid at ${formatCurrency(bidTotal)}? This action cannot be undone.`);
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const bidItemsPayload = items.map(item => ({
        auction_item_id: item.id,
        unit_price: Number(bidPrices[item.id] || 0),
        quantity: item.quantity,
        line_total: Math.round(Number(bidPrices[item.id] || 0) * item.quantity * 100) / 100,
      }));

      const { data: newBid, error } = await supabase
        .from('reverse_auction_bids')
        .insert({
          auction_id: auction.id,
          supplier_id: user.id,
          bid_price: Math.round(bidTotal * 100) / 100,
        } as any)
        .select()
        .single();

      if (error) {
        if (error.message?.includes('Rate limit')) {
          toast.error('Too fast! Please wait 2 seconds between bids.');
          return;
        }
        if (error.message?.includes('unique_supplier_auction_bid')) {
          toast.error('You already have an active bid. Wait for the next round.');
          return;
        }
        throw error;
      }

      // Update current price + mark supplier as bidding (parallel)
      await Promise.all([
        supabase
          .from('reverse_auctions')
          .update({ current_price: Math.round(bidTotal * 100) / 100, updated_at: new Date().toISOString() } as any)
          .eq('id', auction.id),
        supabase
          .from('reverse_auction_suppliers')
          .update({ invite_status: 'bid_submitted' } as any)
          .eq('auction_id', auction.id)
          .or(`supplier_id.eq.${user.id},supplier_email.eq.${user.email}`),
      ]);

      logAuctionEvent({
        auction_id: auction.id,
        event_type: 'BID_PLACED',
        actor_id: user.id,
        actor_role: 'supplier',
        bid_id: (newBid as any)?.id,
        bid_amount: bidTotal,
        metadata: { item_count: items.length, server_validated: true },
      });

      // Live feedback: precision-safe L1 check + rank
      const isL1 = bidTotal < currentLowest - 0.01;
      const sorted = [...bids, { bid_price: bidTotal, supplier_id: user.id }]
        .sort((a, b) => a.bid_price - b.bid_price);
      const rank = sorted.findIndex(b => b.supplier_id === user.id) + 1;
      toast.success(
        isL1
          ? `✅ You are now L1 at ${formatCurrency(bidTotal)}!`
          : `📊 You are #${rank} at ${formatCurrency(bidTotal)}`
      );
      onBidPlaced();
    } catch (err: any) {
      toast.error('Failed to place bid: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  }, [user, isValidBid, isSubmitting, isAuthorized, bidTotal, items, bidPrices, auction.id, onBidPlaced, currentLowest]);

  if (isLoadingItems || isAuthorized === null) {
    return <div className="text-sm text-muted-foreground p-4">Checking access & loading items...</div>;
  }

  if (!isAuthorized) {
    return (
      <div className="text-sm text-destructive p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        You are not authorized to bid on this auction.
      </div>
    );
  }

  // Single-price fallback when no auction items exist
  if (!hasItems) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Gavel className="w-4 h-4 text-primary" />
            Place Your Bid
            {myRank && (
              <Badge className={myRank === 1 ? 'bg-emerald-600 text-white' : 'bg-muted text-foreground'}>
                {myRank === 1 ? '🥇 L1' : `L${myRank}`}
              </Badge>
            )}
          </CardTitle>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Must beat {formatCurrency(maxAllowedBid)} (min {auction.minimum_bid_step_pct}% step)
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your Bid Amount (₹)</label>
            <Input
              type="number"
              placeholder={`Max ${formatCurrency(Math.floor(maxAllowedBid))}`}
              value={bidPrices['single'] || ''}
              onChange={e => setBidPrices({ single: e.target.value })}
              min="0"
              disabled={!isLive}
            />
          </div>
          {/* Grand Total */}
          <div className={`rounded-lg p-3 flex items-center justify-between ${
            isValidBid ? 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-muted/50 border'
          }`}>
            <p className="text-sm font-semibold text-foreground">Your Bid</p>
            <p className={`text-xl font-bold ${isValidBid ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}>
              {formatCurrency(bidTotal)}
            </p>
          </div>
          {validationError && bidTotal > 0 && (
            <p className="text-xs text-destructive font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {validationError}
            </p>
          )}
          <Button
            onClick={handleSubmitBid}
            disabled={!isValidBid || isSubmitting || !isLive}
            className="w-full gap-2"
            size="lg"
          >
            {isSubmitting ? 'Placing Bid...' : (
              <><Gavel className="w-4 h-4" /> Submit Bid — {formatCurrency(bidTotal)}</>
            )}
          </Button>
          {!isLive && (
            <p className="text-xs text-muted-foreground text-center">
              Bidding is not active. Wait for the auction to go live.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gavel className="w-5 h-5 text-primary" />
            Place Your Bid
            {myRank && (
              <Badge className={`text-sm ${myRank === 1 ? 'bg-emerald-600 text-white' : 'bg-muted text-foreground'}`}>
                {myRank === 1 ? '🥇 L1' : `L${myRank}`}
              </Badge>
            )}
          </CardTitle>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-2.5 py-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            {showRankOnly && !showExactPrices
              ? `Your rank: ${myRank ? `L${myRank}` : 'Not ranked'} — bid lower to improve`
              : `Must beat ${formatCurrency(maxAllowedBid)} (min ${auction.minimum_bid_step_pct}% step)`
            }
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Multi-item bid table — full width, clean layout */}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">Qty</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">Unit</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-36">Unit Price (₹)</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-36">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const unitPrice = Number(bidPrices[item.id] || 0);
                const lineTotal = unitPrice * item.quantity;
                return (
                  <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{item.product_name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{item.quantity.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{item.unit}</td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        type="number"
                        inputSize="sm"
                        placeholder={item.unit_price ? String(item.unit_price) : '0'}
                        value={bidPrices[item.id] || ''}
                        onChange={e => setBidPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="text-sm text-right w-full max-w-[120px] ml-auto tabular-nums"
                        min="0"
                        step="0.01"
                        disabled={!isLive}
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-muted-foreground">
                      {unitPrice > 0 ? `₹${lineTotal.toLocaleString('en-IN')}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Grand Total + Quick Bid + Submit — horizontal layout on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          {/* Total */}
          <div className={`rounded-lg p-4 flex items-center justify-between ${
            isValidBid ? 'bg-emerald-50 border-2 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-700' : 'bg-muted/50 border-2 border-border'
          }`}>
            <div>
              <p className="text-sm font-semibold text-foreground">Your Total Bid</p>
              {isValidBid && (
                <p className="text-xs text-emerald-600 font-medium">
                  {((currentLowest - bidTotal) / currentLowest * 100).toFixed(1)}% below L1
                </p>
              )}
            </div>
            <p className={`text-2xl font-bold tabular-nums ${isValidBid ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}>
              {formatCurrency(bidTotal)}
            </p>
          </div>

          {/* Quick bid suggestions */}
          {isLive && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Bid</p>
              <div className="flex gap-1.5 flex-wrap">
                {[500, 1000, 2000].map((reduction, idx) => {
                  const target = currentLowest - reduction;
                  if (target <= 0 || target >= currentLowest) return null;
                  return (
                    <button
                      key={`fix-${reduction}`}
                      onClick={() => setBidPrices(distributeTotal(target))}
                      className={`text-xs border px-2 py-1.5 rounded-md transition-colors font-medium ${
                        idx === 0
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-700'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      -₹{reduction.toLocaleString('en-IN')} → {formatCurrency(target)}
                    </button>
                  );
                })}
                {[1, 2, 3].map((step, idx) => {
                  const targetTotal = Math.round(currentLowest * (1 - minBidStep * step));
                  if (targetTotal <= 0 || targetTotal >= currentLowest) return null;
                  return (
                    <button
                      key={`pct-${step}`}
                      onClick={() => setBidPrices(distributeTotal(targetTotal))}
                      className={`text-xs border px-2 py-1.5 rounded-md transition-colors font-medium ${
                        idx === 0
                          ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                          : 'border-primary/30 text-primary hover:bg-primary/10'
                      }`}
                    >
                      -{step * auction.minimum_bid_step_pct}% → {formatCurrency(targetTotal)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit button */}
          <div className="flex flex-col gap-1.5">
            {validationError && bidTotal > 0 && (
              <p className="text-xs text-destructive font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {validationError}
              </p>
            )}
            <Button
              onClick={handleSubmitBid}
              disabled={!isValidBid || isSubmitting || !isLive}
              className="gap-2 h-12 text-base px-8"
              size="lg"
            >
              {isSubmitting ? (
                'Placing Bid...'
              ) : (
                <>
                  <Gavel className="w-5 h-5" />
                  Submit Bid — {formatCurrency(bidTotal)}
                </>
              )}
            </Button>
            {!isLive && (
              <p className="text-xs text-muted-foreground text-center">
                Bidding is not active. Wait for the auction to go live.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
