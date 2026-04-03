/**
 * Reverse Auction List — Shows auctions for buyer or supplier
 * Suppliers see only auctions they're invited to, with bid-oriented UI
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Gavel, Clock, TrendingDown, Trophy, XCircle, Play, ArrowRight, Timer, RefreshCw, Pencil } from 'lucide-react';
import { useReverseAuction, ReverseAuction } from '@/hooks/useReverseAuction';
import { formatDistanceToNow, isPast, format, isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AuctionInviteAnalytics } from './AuctionInviteAnalytics';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <Clock className="w-3 h-3" /> },
  live: { label: 'LIVE', color: 'bg-emerald-100 text-emerald-800 border-emerald-200 animate-pulse', icon: <Play className="w-3 h-3" /> },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: <Trophy className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-3 h-3" /> },
};

function AuctionStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
  return (
    <Badge variant="outline" className={`gap-1 ${config.color}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

function formatCurrency(value: number | null, currency: string = 'INR') {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

const DURATION_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '24 hours', value: 1440 },
];

interface ReverseAuctionListProps {
  onSelectAuction?: (auction: ReverseAuction) => void;
  isBuyer?: boolean;
  isSupplier?: boolean;
}

export function ReverseAuctionList({ onSelectAuction, isBuyer = true, isSupplier = false }: ReverseAuctionListProps) {
  const { auctions, isLoading, startAuction, cancelAuction, completeAuction, republishAuction, refetch } = useReverseAuction(isSupplier);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Loading auctions...</CardContent>
      </Card>
    );
  }

  // Compute effective status based on time
  const getEffectiveStatus = (a: ReverseAuction) => {
    if (a.status === 'cancelled' || a.status === 'completed') return a.status;
    const now = new Date();
    if (a.auction_end && new Date(a.auction_end) <= now) return 'completed';
    if (a.auction_start && new Date(a.auction_start) <= now) return 'live';
    return 'scheduled';
  };

  // Separate auctions by effective status
  const liveAuctions = auctions.filter(a => getEffectiveStatus(a) === 'live');
  const scheduledAuctions = auctions.filter(a => getEffectiveStatus(a) === 'scheduled');
  const completedAuctions = auctions.filter(a => {
    const s = getEffectiveStatus(a);
    return s === 'completed' || s === 'cancelled';
  });

  return (
    <div className="space-y-4">
      {/* No auctions */}
      {auctions.length === 0 ? (
        <Card className="rounded-[0.625rem]">
          <CardContent className="py-12 text-center">
            <Gavel className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">
              {isSupplier ? 'No auction invitations yet' : 'No reverse auctions yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isSupplier
                ? 'When buyers invite you to reverse auctions, they will appear here'
                : 'Create your first reverse auction to discover the best prices'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 🔴 LIVE Auctions */}
          {liveAuctions.length > 0 && (
            <div className="space-y-3">
              {isSupplier && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700">Live — Bid Now</h3>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {liveAuctions.map(auction => (
                  <AuctionCard
                    key={auction.id}
                    auction={auction}
                    isSupplier={isSupplier}
                    isBuyer={isBuyer}
                    onSelect={onSelectAuction}
                    startAuction={startAuction}
                    cancelAuction={cancelAuction}
                    completeAuction={completeAuction}
                    republishAuction={republishAuction}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ⏰ Scheduled Auctions */}
          {scheduledAuctions.length > 0 && (
            <div className="space-y-3">
              {isSupplier && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700">Upcoming</h3>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {scheduledAuctions.map(auction => (
                  <AuctionCard
                    key={auction.id}
                    auction={auction}
                    isSupplier={isSupplier}
                    isBuyer={isBuyer}
                    onSelect={onSelectAuction}
                    startAuction={startAuction}
                    cancelAuction={cancelAuction}
                    completeAuction={completeAuction}
                    republishAuction={republishAuction}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ✅ Completed/Cancelled */}
          {completedAuctions.length > 0 && (
            <div className="space-y-3">
              {isSupplier && (
                <div className="flex items-center gap-2">
                  <Trophy className="w-3 h-3 text-muted-foreground" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Past Auctions</h3>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {completedAuctions.map(auction => (
                  <AuctionCard
                    key={auction.id}
                    auction={auction}
                    isSupplier={isSupplier}
                    isBuyer={isBuyer}
                    onSelect={onSelectAuction}
                    startAuction={startAuction}
                    cancelAuction={cancelAuction}
                    completeAuction={completeAuction}
                    republishAuction={republishAuction}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Individual Auction Card ─── */
function AuctionCard({
  auction,
  isSupplier,
  isBuyer,
  onSelect,
  startAuction,
  cancelAuction,
  completeAuction,
  republishAuction,
}: {
  auction: ReverseAuction;
  isSupplier: boolean;
  isBuyer: boolean;
  onSelect?: (auction: ReverseAuction) => void;
  startAuction: (id: string) => void;
  cancelAuction: (id: string) => void;
  completeAuction: (id: string) => void;
  republishAuction: (id: string, newSchedule?: any) => void;
}) {
  const [showRepublishDialog, setShowRepublishDialog] = useState(false);
  const [repStartDate, setRepStartDate] = useState('');
  const [repStartTime, setRepStartTime] = useState('');
  const [repDuration, setRepDuration] = useState(30);
  const [repStartingPrice, setRepStartingPrice] = useState(String(auction.starting_price || ''));
  const [repQuantity, setRepQuantity] = useState(String(auction.quantity || ''));
  const [repUnit, setRepUnit] = useState(auction.unit || 'MT');

  // Compute effective status based on time
  const effectiveStatus = (() => {
    if (auction.status === 'cancelled' || auction.status === 'completed') return auction.status;
    const now = new Date();
    if (auction.auction_end && new Date(auction.auction_end) <= now) return 'completed';
    if (auction.auction_start && new Date(auction.auction_start) <= now) return 'live';
    return 'scheduled';
  })();
  const isLive = effectiveStatus === 'live';
  const isScheduled = effectiveStatus === 'scheduled';
  const isCompleted = effectiveStatus === 'completed';
  const isCancelled = effectiveStatus === 'cancelled';
  const canRepublish = isBuyer && (isCompleted || isCancelled);
  const savings = auction.current_price && auction.starting_price
    ? ((auction.starting_price - auction.current_price) / auction.starting_price * 100)
    : 0;

  const handleRepublish = () => {
    if (!repStartDate || !repStartTime) {
      return;
    }
    const start = new Date(`${repStartDate}T${repStartTime}`);
    if (start < new Date()) {
      return;
    }
    const end = new Date(start.getTime() + repDuration * 60 * 1000);
    republishAuction(auction.id, {
      auction_start: start.toISOString(),
      auction_end: end.toISOString(),
      starting_price: parseFloat(repStartingPrice) || undefined,
      quantity: parseFloat(repQuantity) || undefined,
      unit: repUnit,
    });
    setShowRepublishDialog(false);
  };

  return (
    <>
      <Card
        className={`cursor-pointer transition-all hover:shadow-md rounded-[0.625rem] ${
          isLive ? 'border-emerald-400 ring-2 ring-emerald-100 shadow-md' : ''
        }`}
        onClick={() => onSelect?.(auction)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-bold truncate">{auction.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {auction.category} • {auction.quantity} {auction.unit}
              </p>
            </div>
            <AuctionStatusBadge status={effectiveStatus} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Price metrics */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-muted/50 rounded-[0.625rem] p-2">
              <p className="text-muted-foreground text-xs">Start Price</p>
              <p className="font-bold">{formatCurrency(auction.starting_price, auction.currency)}</p>
            </div>
            <div className={`rounded-[0.625rem] p-2 ${isLive ? 'bg-emerald-50 border border-emerald-200' : 'bg-muted/50'}`}>
              <p className="text-muted-foreground text-xs">Current</p>
              <p className="font-bold text-emerald-700">
                {formatCurrency(auction.current_price, auction.currency)}
              </p>
            </div>
            <div className="bg-muted/50 rounded-[0.625rem] p-2">
              <p className="text-muted-foreground text-xs">Savings</p>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-emerald-600" />
                <p className="font-bold text-emerald-700">{savings.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Timing */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Timer className="w-3 h-3" />
            {isLive ? (
              auction.auction_end && !isPast(new Date(auction.auction_end))
                ? <span className="font-medium text-emerald-700">Ends {formatDistanceToNow(new Date(auction.auction_end), { addSuffix: true })}</span>
                : <span className="text-destructive font-medium">Auction ended</span>
            ) : isCompleted ? (
              <span>Completed {auction.auction_end ? format(new Date(auction.auction_end), 'dd MMM yyyy') : ''}</span>
            ) : (
              <span>Starts {auction.auction_start ? format(new Date(auction.auction_start), 'dd MMM yyyy HH:mm') : '—'}</span>
            )}
          </div>

          {/* Supplier CTA */}
          {isSupplier && isLive && (
            <Button
              className="w-full gap-2 font-semibold"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onSelect?.(auction); }}
            >
              <Gavel className="w-4 h-4" />
              Place Your Bid
              <ArrowRight className="w-3 h-3" />
            </Button>
          )}

          {isSupplier && isScheduled && (
            <div className="bg-blue-50 border border-blue-200 rounded-[0.625rem] p-2.5 text-sm">
              <p className="font-medium text-blue-800 text-xs">You're invited to bid</p>
              <p className="text-blue-600 text-xs mt-0.5">
                Auction starts {auction.auction_start ? format(new Date(auction.auction_start), 'dd MMM yyyy, hh:mm a') : 'soon'}. 
                Prepare your best price.
              </p>
            </div>
          )}

          {/* Invite Analytics (Buyer only) */}
          {isBuyer && <AuctionInviteAnalytics auctionId={auction.id} />}

          {/* Buyer Actions */}
          {isBuyer && (
            <div className="flex gap-2 pt-1 flex-wrap" onClick={e => e.stopPropagation()}>
              {isScheduled && (
                <>
                  <Button size="sm" variant="default" onClick={() => startAuction(auction.id)}>
                    <Play className="w-3 h-3 mr-1" /> Go Live
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => cancelAuction(auction.id)}>Cancel</Button>
                </>
              )}
              {isLive && (
                <Button size="sm" variant="destructive" onClick={() => completeAuction(auction.id)}>
                  End & Award
                </Button>
              )}
              {canRepublish && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRepublishDialog(true)}
                  className="gap-1"
                >
                  <Pencil className="w-3 h-3" /> Edit & Republish
                </Button>
              )}
            </div>
          )}

          {/* Winner */}
          {isCompleted && auction.winning_price && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-[0.625rem] p-2 text-sm">
              <div className="flex items-center gap-1 text-emerald-800 font-medium">
                <Trophy className="w-3 h-3" />
                Won at {formatCurrency(auction.winning_price, auction.currency)}/{auction.unit}
                {isSupplier && auction.winner_supplier_id && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    {auction.winner_supplier_id ? 'Result' : ''}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit & Republish Dialog */}
      <Dialog open={showRepublishDialog} onOpenChange={setShowRepublishDialog}>
        <DialogContent className="max-w-md" onClick={e => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" />
              Edit & Republish Auction
            </DialogTitle>
            <DialogDescription>
              Update schedule and details. All previous bids will be cleared.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Auction Title (read-only) */}
            <div>
              <Label className="text-xs text-muted-foreground">Auction</Label>
              <p className="text-sm font-medium">{auction.title}</p>
              <p className="text-xs text-muted-foreground">{auction.category} • {auction.product_slug?.replace(/_/g, ', ').replace(/-/g, ' ')}</p>
            </div>

            {/* Starting Price */}
            <div>
              <Label htmlFor="rep-price">Starting Price (₹ per {repUnit})</Label>
              <Input
                id="rep-price"
                type="number"
                value={repStartingPrice}
                onChange={e => setRepStartingPrice(e.target.value)}
                placeholder="e.g. 63000"
              />
            </div>

            {/* Quantity & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rep-qty">Quantity</Label>
                <Input
                  id="rep-qty"
                  type="number"
                  value={repQuantity}
                  onChange={e => setRepQuantity(e.target.value)}
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={repUnit} onValueChange={setRepUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MT">MT</SelectItem>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="Pcs">Pieces</SelectItem>
                    <SelectItem value="Ltrs">Litres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rep-date">Start Date</Label>
                <Input
                  id="rep-date"
                  type="date"
                  value={repStartDate}
                  onChange={e => setRepStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="rep-time">Start Time</Label>
                <Input
                  id="rep-time"
                  type="time"
                  value={repStartTime}
                  onChange={e => setRepStartTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Duration</Label>
              <Select value={String(repDuration)} onValueChange={v => setRepDuration(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(d => (
                    <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRepublishDialog(false)}>Cancel</Button>
            <Button
              onClick={handleRepublish}
              disabled={!repStartDate || !repStartTime}
              className="gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Republish Auction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
