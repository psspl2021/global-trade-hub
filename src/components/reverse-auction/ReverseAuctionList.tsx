/**
 * Reverse Auction List — Shows all auctions for the current user (buyer or supplier)
 */
import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gavel, Clock, TrendingDown, Trophy, XCircle, Play } from 'lucide-react';
import { useReverseAuction, ReverseAuction } from '@/hooks/useReverseAuction';
import { formatDistanceToNow, isPast, format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuctionCreditsPurchase } from './AuctionCreditsPurchase';

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
}

export function ReverseAuctionList({ onSelectAuction, isBuyer = true }: ReverseAuctionListProps) {
  const { auctions, isLoading, startAuction, cancelAuction, completeAuction, refetch } = useReverseAuction();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const creditsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to credits purchase when buy_credits=true
  useEffect(() => {
    if (searchParams.get('buy_credits') === 'true' && creditsRef.current) {
      creditsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Clean URL
      searchParams.delete('buy_credits');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Loading auctions...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-md">
            <Gavel className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Reverse Auctions</h2>
            <p className="text-xs text-muted-foreground">Price discovery through competitive reverse bidding</p>
          </div>
        </div>
        {isBuyer && (
          <Button
            className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
            onClick={() => navigate('/buyer/create-reverse-auction')}
          >
            <Gavel className="w-4 h-4" />
            Create Reverse Auction
          </Button>
        )}
      </div>

      {/* Auction Credits Purchase (Buyer only) */}
      {isBuyer && (
        <AuctionCreditsPurchase onCreditsUpdated={refetch} />
      )}

      {/* Auction Cards */}
      {auctions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Gavel className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No reverse auctions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isBuyer ? 'Create your first reverse auction to discover the best prices' : 'No auctions available at this time'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {auctions.map(auction => {
            const isLive = auction.status === 'live';
            const isScheduled = auction.status === 'scheduled';
            const isCompleted = auction.status === 'completed';
            const savings = auction.current_price && auction.starting_price
              ? ((auction.starting_price - auction.current_price) / auction.starting_price * 100)
              : 0;

            return (
              <Card
                key={auction.id}
                className={`cursor-pointer transition-all hover:shadow-md ${isLive ? 'border-emerald-300 ring-1 ring-emerald-200' : ''}`}
                onClick={() => onSelectAuction?.(auction)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{auction.title}</CardTitle>
                    <AuctionStatusBadge status={auction.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{auction.category} • {auction.quantity} {auction.unit}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Start Price</p>
                      <p className="font-semibold">{formatCurrency(auction.starting_price, auction.currency)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Current</p>
                      <p className="font-semibold text-emerald-700">
                        {formatCurrency(auction.current_price, auction.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Savings</p>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-emerald-600" />
                        <p className="font-semibold text-emerald-700">{savings.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Timing */}
                  {auction.auction_end && (
                    <p className="text-xs text-muted-foreground">
                      {isLive ? (
                        isPast(new Date(auction.auction_end))
                          ? 'Auction ended'
                          : `Ends ${formatDistanceToNow(new Date(auction.auction_end), { addSuffix: true })}`
                      ) : isCompleted ? (
                        `Completed ${format(new Date(auction.auction_end), 'dd MMM yyyy')}`
                      ) : (
                        `Starts ${format(new Date(auction.auction_start || ''), 'dd MMM yyyy HH:mm')}`
                      )}
                    </p>
                  )}

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
                    </div>
                  )}

                  {/* Winner */}
                  {isCompleted && auction.winning_price && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2 text-sm">
                      <div className="flex items-center gap-1 text-emerald-800 font-medium">
                        <Trophy className="w-3 h-3" />
                        Won at {formatCurrency(auction.winning_price, auction.currency)}/{auction.unit}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
