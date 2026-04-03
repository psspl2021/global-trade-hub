/**
 * Reverse Auction List — Shows auctions for buyer or supplier
 * Suppliers see only auctions they're invited to, with bid-oriented UI
 */
import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gavel, Clock, TrendingDown, Trophy, XCircle, Play, ArrowRight, IndianRupee, Users, Timer, RefreshCw } from 'lucide-react';
import { useReverseAuction, ReverseAuction } from '@/hooks/useReverseAuction';
import { formatDistanceToNow, isPast, format, differenceInSeconds, isToday } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuctionCreditsPurchase } from './AuctionCreditsPurchase';
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

interface ReverseAuctionListProps {
  onSelectAuction?: (auction: ReverseAuction) => void;
  isBuyer?: boolean;
  isSupplier?: boolean;
}

export function ReverseAuctionList({ onSelectAuction, isBuyer = true, isSupplier = false }: ReverseAuctionListProps) {
  const { auctions, isLoading, startAuction, cancelAuction, completeAuction, republishAuction, refetch } = useReverseAuction(isSupplier);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const creditsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to credits purchase when buy_credits=true
  useEffect(() => {
    if (searchParams.get('buy_credits') === 'true' && creditsRef.current) {
      creditsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const el = creditsRef.current;
      el.classList.add('ring-2', 'ring-primary', 'transition-all', 'duration-300');
      setTimeout(() => el?.classList.remove('ring-2', 'ring-primary'), 2000);
      const params = new URLSearchParams(searchParams);
      params.delete('buy_credits');
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
          {/* 🔴 LIVE Auctions — Priority for Suppliers */}
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
  republishAuction: (id: string) => void;
}) {
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
  const canRepublish = isBuyer && isCancelled && isToday(new Date(auction.updated_at));
  const savings = auction.current_price && auction.starting_price
    ? ((auction.starting_price - auction.current_price) / auction.starting_price * 100)
    : 0;

  return (
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
          <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
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
              <Button size="sm" variant="outline" onClick={() => republishAuction(auction.id)} className="gap-1">
                <RefreshCw className="w-3 h-3" /> Republish
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
  );
}
