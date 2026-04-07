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
      if (!error && data) {
        setItems(data as unknown as AuctionItem[]);
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

  // Calculate total from line items
  const bidTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(bidPrices[item.id] || 0);
      return sum + (Math.round(price * 100) / 100) * (Math.round(item.quantity * 100) / 100);
    }, 0);
  }, [items, bidPrices]);

  // Validate bid
  const validationError = useMemo(() => {
    if (items.length === 0) return null;
    const emptyItems = items.filter(i => !bidPrices[i.id] || Number(bidPrices[i.id]) <= 0);
    if (emptyItems.length > 0) return `Enter price for all ${items.length} items`;
    if (bidTotal <= 0) return 'Total bid must be greater than 0';
    if (bidTotal >= currentLowest) return `Total must be below ${formatCurrency(currentLowest)} (current L1)`;
    if (bidTotal > maxAllowedBid) return `Must reduce by at least ${auction.minimum_bid_step_pct}% (max: ${formatCurrency(Math.floor(maxAllowedBid))})`;
    return null;
  }, [items, bidPrices, bidTotal, currentLowest, maxAllowedBid, auction.minimum_bid_step_pct]);

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

  const handleSubmitBid = useCallback(async () => {
    if (!user || !isValidBid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Backend guard: verify supplier is invited before inserting
      const { data: invited } = await supabase
        .from('reverse_auction_suppliers')
        .select('id')
        .eq('auction_id', auction.id)
        .or(`supplier_id.eq.${user.id},supplier_email.eq.${user.email}`)
        .limit(1);
      if (!invited || invited.length === 0) {
        toast.error('You are not authorized to bid on this auction.');
        return;
      }
      // Build bid items for the DB function
      const bidItemsPayload = items.map(item => ({
        auction_item_id: item.id,
        unit_price: Number(bidPrices[item.id] || 0),
        quantity: item.quantity,
        line_total: Math.round(Number(bidPrices[item.id] || 0) * item.quantity * 100) / 100,
      }));

      // Insert bid directly into reverse_auction_bids
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
        throw error;
      }

      // Update current price on auction
      await supabase
        .from('reverse_auctions')
        .update({ current_price: Math.round(bidTotal * 100) / 100, updated_at: new Date().toISOString() } as any)
        .eq('id', auction.id);

      logAuctionEvent({
        auction_id: auction.id,
        event_type: 'BID_PLACED',
        actor_id: user.id,
        actor_role: 'supplier',
        bid_id: (newBid as any)?.id,
        bid_amount: bidTotal,
        metadata: { item_count: items.length, server_validated: true },
      });

      toast.success(`Bid of ${formatCurrency(bidTotal)} placed successfully!`);
      onBidPlaced();
    } catch (err: any) {
      toast.error('Failed to place bid: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  }, [user, isValidBid, isSubmitting, bidTotal, items, bidPrices, auction.id, onBidPlaced]);

  if (isLoadingItems || isAuthorized === null) {
    return <div className="text-sm text-muted-foreground p-4">Loading auction items...</div>;
  }

  if (!isAuthorized) {
    return (
      <div className="text-sm text-destructive p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        You are not authorized to bid on this auction.
      </div>
    );
  }

  if (items.length === 0) return null;

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
          {showRankOnly && !showExactPrices
            ? `Your rank: ${myRank ? `L${myRank}` : 'Not ranked'} — bid lower to improve`
            : `Must beat ${formatCurrency(maxAllowedBid)} (min ${auction.minimum_bid_step_pct}% step)`
          }
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Multi-item bid table */}
        <div className="rounded-lg border overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_80px_100px] gap-0 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
            <span>Item</span>
            <span>Qty</span>
            <span>Unit</span>
            <span>Your Price (₹)</span>
          </div>
          {items.map(item => (
            <div key={item.id} className="grid grid-cols-[1fr_80px_80px_100px] gap-0 px-3 py-2 border-b last:border-b-0 items-center">
              <div>
                <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
              </div>
              <span className="text-sm">{item.quantity}</span>
              <span className="text-sm text-muted-foreground">{item.unit}</span>
              <div className="relative">
                <Input
                  type="number"
                  inputSize="sm"
                  placeholder={item.unit_price ? String(item.unit_price) : '0'}
                  value={bidPrices[item.id] || ''}
                  onChange={e => setBidPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
                  className="text-sm"
                  min="0"
                  step="0.01"
                  disabled={!isLive}
                />
              </div>
            </div>
          ))}
          {/* Line totals */}
          {items.some(i => bidPrices[i.id]) && (
            <div className="px-3 py-2 bg-muted/30 border-t">
              {items.filter(i => bidPrices[i.id]).map(item => (
                <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                  <span>{item.product_name}</span>
                  <span>₹{(Number(bidPrices[item.id] || 0) * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div className={`rounded-lg p-3 flex items-center justify-between ${
          isValidBid ? 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-muted/50 border'
        }`}>
          <div>
            <p className="text-sm font-semibold text-foreground">Your Total Bid</p>
            {isValidBid && (
              <p className="text-xs text-emerald-600">
                {((currentLowest - bidTotal) / currentLowest * 100).toFixed(1)}% below current L1
              </p>
            )}
          </div>
          <p className={`text-xl font-bold ${isValidBid ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}>
            {formatCurrency(bidTotal)}
          </p>
        </div>

        {/* Quick bid suggestions */}
        {isLive && (
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3].map(step => {
              const targetTotal = currentLowest * (1 - minBidStep * step);
              const ratio = targetTotal / (auction.starting_price || 1);
              return (
                <button
                  key={step}
                  onClick={() => {
                    const newPrices: Record<string, string> = {};
                    items.forEach(item => {
                      const basePrice = item.unit_price || (auction.starting_price / items.reduce((s, i) => s + i.quantity, 0));
                      newPrices[item.id] = String(Math.floor(basePrice * ratio));
                    });
                    setBidPrices(newPrices);
                  }}
                  className="text-xs border border-border px-2 py-1 rounded-md hover:bg-muted transition-colors"
                >
                  -{step * auction.minimum_bid_step_pct}% ({formatCurrency(Math.floor(targetTotal))})
                </button>
              );
            })}
          </div>
        )}

        {/* Validation error */}
        {validationError && bidTotal > 0 && (
          <p className="text-xs text-destructive font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {validationError}
          </p>
        )}

        {/* Submit button */}
        <Button
          onClick={handleSubmitBid}
          disabled={!isValidBid || isSubmitting || !isLive}
          className="w-full gap-2"
          size="lg"
        >
          {isSubmitting ? (
            'Placing Bid...'
          ) : (
            <>
              <Gavel className="w-4 h-4" />
              Submit Bid — {formatCurrency(bidTotal)}
            </>
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
