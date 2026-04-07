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
    return null;
  }, [items, bidPrices, bidTotal, currentLowest, hasItems]);

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

  // Smart insight: how much to reduce to become L1
  const gapToL1 = useMemo(() => {
    if (!user || myRank === 1) return null;
    const myBid = bids.find(b => b.supplier_id === user.id);
    if (!myBid) return null;
    const l1Price = Math.min(...bids.map(b => b.bid_price));
    const requiredBid = l1Price - 1; // just beat L1
    const gap = myBid.bid_price - requiredBid;
    return gap > 0 ? gap : null;
  }, [bids, user, myRank]);

  // Safe savings percentage
  const savingsPct = useMemo(() => {
    return currentLowest > 0 ? ((currentLowest - bidTotal) / currentLowest) * 100 : 0;
  }, [currentLowest, bidTotal]);

  // Best "Become L1" target
  const bestL1Target = useMemo(() => {
    const target = Math.floor(currentLowest - 1);
    return target > 0 ? target : null;
  }, [currentLowest]);

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
            Must be below {formatCurrency(currentLowest)} (current L1)
            {bidTotal > 0 && bidTotal < currentLowest && bidTotal > maxAllowedBid && (
              <span className="text-amber-600 ml-1">
                · Tip: reduce {auction.minimum_bid_step_pct}% for stronger competitiveness
              </span>
            )}
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
    <Card className="border-primary/20 shadow-md overflow-hidden">
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
            {myRank === 1 ? (
              <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ✅ You are leading (L1)</>
            ) : myRank ? (
              <><AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Your rank: L{myRank} — bid lower to improve</>
            ) : (
              <><Target className="w-3.5 h-3.5 text-muted-foreground" /> Place your first bid to enter ranking</>
            )}
          </div>
        </div>
        {/* L1 reference anchor */}
        <div className="text-xs text-muted-foreground mt-1">
          Current L1: <span className="font-semibold text-foreground">{formatCurrency(currentLowest)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Smart insight */}
        {gapToL1 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm">
            <Target className="w-4 h-4 text-primary shrink-0" />
            <span className="text-foreground">
              Reduce by <span className="font-bold text-primary">{formatCurrency(gapToL1)}</span> to become L1
            </span>
          </div>
        )}

        {/* Multi-item bid table — full width with horizontal scroll on mobile */}
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm min-w-[540px]">
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
                        className="text-sm text-right w-full max-w-[120px] ml-auto tabular-nums font-semibold border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        min="0"
                        step="0.01"
                        disabled={!isLive}
                      />
                    </td>
                    <td className={`px-4 py-3 text-right font-medium tabular-nums ${unitPrice > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {unitPrice > 0 ? `₹${lineTotal.toLocaleString('en-IN')}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* HERO TOTAL — the most important element */}
        <div className={`rounded-xl p-4 flex items-center justify-between ${
          isValidBid
            ? 'bg-emerald-50 border-2 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-700'
            : 'bg-muted/40 border-2 border-border'
        }`}>
          <div>
            <p className="text-xs text-muted-foreground">Your Total Bid</p>
            <p className={`text-2xl font-bold tracking-tight tabular-nums ${
              isValidBid ? 'text-emerald-700 dark:text-emerald-400' : bidTotal === 0 ? 'text-muted-foreground' : 'text-foreground'
            }`}>
              {formatCurrency(bidTotal)}
            </p>
            {bidTotal === 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">Enter price for all items to calculate total</p>
            )}
          </div>
          {isValidBid && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {savingsPct.toFixed(2)}% below L1
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Saving {formatCurrency(currentLowest - bidTotal)}
              </p>
            </div>
          )}
        </div>

        {/* Quick bid suggestions — improved clarity */}
        {isLive && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Bid</p>
            <div className="flex gap-2 flex-wrap">
              {/* Become L1 — killer button */}
              {bestL1Target && myRank !== 1 && (
                <button
                  onClick={() => setBidPrices(distributeTotal(bestL1Target))}
                  className="text-xs border-2 border-emerald-600 bg-emerald-600 text-white px-3 py-2 rounded-lg transition-colors font-semibold text-left hover:bg-emerald-700"
                >
                  <span>🏆 Become L1</span>
                  <span className="block text-[10px] text-emerald-100 mt-0.5">
                    Total → {formatCurrency(bestL1Target)}
                  </span>
                </button>
              )}
              {[500, 1000, 2000].map((reduction, idx) => {
                const target = currentLowest - reduction;
                if (target <= 0 || target >= currentLowest) return null;
                return (
                  <button
                    key={`fix-${reduction}`}
                    onClick={() => setBidPrices(distributeTotal(target))}
                    className={`text-xs border px-3 py-2 rounded-lg transition-colors font-medium text-left ${
                      idx === 0
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-700'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <span className="font-semibold">Save ₹{reduction.toLocaleString('en-IN')}</span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5">
                      Total → {formatCurrency(target)}
                    </span>
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
                    className={`text-xs border px-3 py-2 rounded-lg transition-colors font-medium text-left ${
                      idx === 0
                        ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                        : 'border-primary/30 text-primary hover:bg-primary/10'
                    }`}
                  >
                    <span className="font-semibold">-{step * auction.minimum_bid_step_pct}%</span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5">
                      Total → {formatCurrency(targetTotal)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sticky action bar */}
        <div className="sticky bottom-0 bg-background border-t -mx-6 -mb-6 px-6 py-3 flex items-center gap-3">
          {validationError && bidTotal > 0 && (
            <p className="text-xs text-destructive font-medium flex items-center gap-1 flex-1">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {validationError}
            </p>
          )}
          {!validationError && <div className="flex-1" />}
          <Button
            onClick={handleSubmitBid}
            disabled={!isValidBid || isSubmitting || !isLive}
            className="gap-2 h-12 text-base px-8 shrink-0"
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
        </div>
        {!isLive && (
          <p className="text-xs text-muted-foreground text-center">
            Bidding is not active. Wait for the auction to go live.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
