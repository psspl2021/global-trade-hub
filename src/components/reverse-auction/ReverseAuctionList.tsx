/**
 * Reverse Auction List — Shows auctions for buyer or supplier
 * Suppliers see only auctions they're invited to, with bid-oriented UI
 */
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gavel, Clock, TrendingDown, Trophy, XCircle, Play, ArrowRight, Timer, Pencil, Search, SlidersHorizontal, ArrowUpDown, X, ChevronDown, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useReverseAuction, ReverseAuction } from '@/hooks/useReverseAuction';
import { formatDistanceToNow, isPast, format, isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AuctionInviteAnalytics } from './AuctionInviteAnalytics';
import { EditAuctionForm } from './EditAuctionForm';

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

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_low', label: 'Price: Low → High' },
  { value: 'price_high', label: 'Price: High → Low' },
];

const CATEGORIES = [
  'Metals - Ferrous', 'Metals - Non Ferrous', 'Polymers & Plastics',
  'Chemicals', 'Building Materials', 'Industrial Supplies',
  'Packaging Materials', 'Energy & Power', 'Textiles & Fabrics'
];

export function ReverseAuctionList({ onSelectAuction, isBuyer = true, isSupplier = false }: ReverseAuctionListProps) {
  const { auctions, isLoading, startAuction, cancelAuction, completeAuction, republishAuction, refetch } = useReverseAuction(isSupplier);
  const navigate = useNavigate();

  // Filter & sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  // Debounce ALL filters together (400ms)
  const [debouncedFilters, setDebouncedFilters] = useState({ search: '', status: 'all', category: 'all', sortBy: 'latest' });
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters({ search: searchQuery, status: statusFilter, category: categoryFilter, sortBy });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, categoryFilter, sortBy]);

  useEffect(() => {
    refetch({ 
      status: debouncedFilters.status, 
      category: debouncedFilters.category, 
      search: debouncedFilters.search || undefined, 
      sortBy: debouncedFilters.sortBy 
    });
  }, [debouncedFilters, refetch]);

  // Compute effective status based on time (client-side for grouping)
  const getEffectiveStatus = (a: ReverseAuction) => {
    if (a.status === 'cancelled' || a.status === 'completed') return a.status;
    const now = new Date();
    if (a.auction_end && new Date(a.auction_end) <= now) return 'completed';
    if (a.auction_start && new Date(a.auction_start) <= now) return 'live';
    return 'scheduled';
  };

  // Client-side: add effective status + filter by time-derived statuses
  const filteredAuctions = useMemo(() => {
    const withStatus = auctions.map(a => ({ ...a, _effectiveStatus: getEffectiveStatus(a) }));
    if (statusFilter === 'live') return withStatus.filter(a => a._effectiveStatus === 'live');
    if (statusFilter === 'scheduled') return withStatus.filter(a => a._effectiveStatus === 'scheduled');
    if (statusFilter === 'completed') return withStatus.filter(a => a._effectiveStatus === 'completed');
    return withStatus;
  }, [auctions, statusFilter]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || sortBy !== 'latest';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSortBy('latest');
  };

  // Separate by effective status for grouped display
  const liveAuctions = filteredAuctions.filter(a => a._effectiveStatus === 'live');
  const scheduledAuctions = filteredAuctions.filter(a => a._effectiveStatus === 'scheduled');
  const completedAuctions = filteredAuctions.filter(a => a._effectiveStatus === 'completed' || a._effectiveStatus === 'cancelled');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Loading auctions...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Compact Filters ── */}
      <div className="flex flex-col gap-2">
        {/* Search + Sort row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search auctions..."
              className="pl-8 h-8 text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] h-8 text-xs gap-1">
              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status chips + Category */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(sf => (
            <button
              key={sf.value}
              onClick={() => setStatusFilter(sf.value)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                statusFilter === sf.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              {sf.label}
              {sf.value !== 'all' && (
                <span className="ml-1 opacity-70">
                  {sf.value === 'cancelled'
                    ? auctions.filter(a => a.status === 'cancelled').length
                    : auctions.filter(a => getEffectiveStatus(a) === sf.value).length}
                </span>
              )}
            </button>
          ))}

          <div className="h-4 w-px bg-border mx-0.5" />

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-6 text-[11px] w-auto min-w-[110px] gap-1 border-dashed px-2">
              <SlidersHorizontal className="w-3 h-3" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] text-destructive hover:underline"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      {filteredAuctions.length === 0 ? (
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
              {isSupplier ? (
                <div className="space-y-2">
                  {liveAuctions.map(auction => (
                    <SupplierAuctionRow key={auction.id} auction={auction} onSelect={onSelectAuction} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {liveAuctions.map(auction => (
                    <BuyerAuctionRow key={auction.id} auction={auction} onSelect={onSelectAuction} startAuction={startAuction} cancelAuction={cancelAuction} completeAuction={completeAuction} republishAuction={republishAuction} />
                  ))}
                </div>
              )}
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
              {isSupplier ? (
                <div className="space-y-2">
                  {scheduledAuctions.map(auction => (
                    <SupplierAuctionRow key={auction.id} auction={auction} onSelect={onSelectAuction} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {scheduledAuctions.map(auction => (
                    <BuyerAuctionRow key={auction.id} auction={auction} onSelect={onSelectAuction} startAuction={startAuction} cancelAuction={cancelAuction} completeAuction={completeAuction} republishAuction={republishAuction} />
                  ))}
                </div>
              )}
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
              {isSupplier ? (
                <div className="space-y-2">
                  {completedAuctions.map(auction => (
                    <SupplierAuctionRow key={auction.id} auction={auction} onSelect={onSelectAuction} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {completedAuctions.map(auction => (
                    <BuyerAuctionRow key={auction.id} auction={auction} onSelect={onSelectAuction} startAuction={startAuction} cancelAuction={cancelAuction} completeAuction={completeAuction} republishAuction={republishAuction} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Supplier Compact Expandable Row ─── */
function SupplierAuctionRow({
  auction,
  onSelect,
}: {
  auction: ReverseAuction;
  onSelect?: (auction: ReverseAuction) => void;
}) {
  const [expanded, setExpanded] = useState(false);

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
  const savings = auction.current_price && auction.starting_price
    ? ((auction.starting_price - auction.current_price) / auction.starting_price * 100)
    : 0;

  return (
    <Card className={`rounded-[0.625rem] overflow-hidden ${isLive ? 'border-emerald-400 ring-1 ring-emerald-100' : ''}`}>
      {/* Compact clickable header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(prev => !prev)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{auction.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {auction.category} • {auction.quantity} {auction.unit}
          </p>
        </div>
        <AuctionStatusBadge status={effectiveStatus} />
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-3 bg-muted/10">
          {/* Auction Summary */}
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Auction Summary</h4>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Starting Price</p>
              <p className="font-semibold text-foreground">{formatCurrency(auction.starting_price, auction.currency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current L1</p>
              <p className="font-semibold text-emerald-700">{formatCurrency(auction.current_price, auction.currency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Quantity</p>
              <p className="font-semibold text-foreground">{auction.quantity} {auction.unit}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Savings</p>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-emerald-600" />
                <p className="font-semibold text-emerald-700">{savings.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Timer className="w-3 h-3" />
            {isLive ? (
              auction.auction_end && !isPast(new Date(auction.auction_end))
                ? <span className="font-medium text-emerald-700">Ends {formatDistanceToNow(new Date(auction.auction_end), { addSuffix: true })}</span>
                : <span className="text-destructive font-medium">Auction ended</span>
            ) : isCompleted ? (
              <span>Completed {auction.auction_end ? format(new Date(auction.auction_end), 'dd MMM yyyy') : ''}</span>
            ) : (
              <span>Starts {auction.auction_start ? format(new Date(auction.auction_start), 'dd MMM yyyy, hh:mm a') : 'soon'}</span>
            )}
          </div>

          {/* Winner info — clickable to open results dashboard */}
          {isCompleted && auction.winning_price && (
            <div
              className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-sm cursor-pointer hover:bg-emerald-100 transition-colors group"
              onClick={() => onSelect?.(auction)}
            >
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <Trophy className="w-3.5 h-3.5" />
                Won at {formatCurrency(auction.winning_price, auction.currency)}
                <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-emerald-600 text-xs mt-1">Tap to view savings & generate PO</p>
            </div>
          )}

          {/* Scheduled info */}
          {isScheduled && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
              <p className="font-medium text-blue-800 text-xs">You're invited to bid</p>
              <p className="text-blue-600 text-xs mt-0.5">
                Prepare your best price for when the auction goes live.
              </p>
            </div>
          )}

          {/* CTA */}
          {isLive && (
            <Button
              className="w-full gap-2 font-semibold"
              size="sm"
              onClick={() => onSelect?.(auction)}
            >
              <Gavel className="w-4 h-4" />
              Place Your Bid
              <ArrowRight className="w-3 h-3" />
            </Button>
          )}

          {(isCompleted || isScheduled) && (
            <Button
              variant="outline"
              className="w-full gap-2"
              size="sm"
              onClick={() => onSelect?.(auction)}
            >
              View Details
              <ArrowRight className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

/* ─── Buyer Compact Expandable Row ─── */
function BuyerAuctionRow({
  auction,
  onSelect,
  startAuction,
  cancelAuction,
  completeAuction,
  republishAuction,
}: {
  auction: ReverseAuction;
  onSelect?: (auction: ReverseAuction) => void;
  startAuction: (id: string) => void;
  cancelAuction: (id: string) => void;
  completeAuction: (id: string) => void;
  republishAuction: (id: string, newSchedule?: any) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

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
  const canRepublish = isCompleted || isCancelled;
  const savings = auction.current_price && auction.starting_price
    ? ((auction.starting_price - auction.current_price) / auction.starting_price * 100)
    : 0;

  return (
    <>
      <Card className={`rounded-[0.625rem] overflow-hidden ${isLive ? 'border-emerald-400 ring-1 ring-emerald-100' : ''}`}>
        {/* Compact clickable header */}
        <button
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
          onClick={() => setExpanded(prev => !prev)}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{auction.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {auction.category} • {auction.quantity} {auction.unit}
            </p>
          </div>

          {/* Inline price summary */}
          <div className="hidden sm:flex items-center gap-3 text-xs shrink-0">
            <span className="text-muted-foreground">{formatCurrency(auction.starting_price, auction.currency)}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
            <span className="font-semibold text-emerald-700">{formatCurrency(auction.current_price, auction.currency)}</span>
            {savings > 0 && (
              <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-[10px] px-1.5 py-0">
                -{savings.toFixed(1)}%
              </Badge>
            )}
          </div>

          <AuctionStatusBadge status={effectiveStatus} />
          <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="border-t border-border px-4 py-3 space-y-3 bg-muted/10">
            {/* Price Grid */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Start Price</p>
                <p className="font-semibold text-foreground">{formatCurrency(auction.starting_price, auction.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="font-semibold text-emerald-700">{formatCurrency(auction.current_price, auction.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Savings</p>
                <div className="flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-emerald-600" />
                  <p className="font-semibold text-emerald-700">{savings.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
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

            {/* Invite Analytics */}
            <AuctionInviteAnalytics auctionId={auction.id} />

            {/* Winner — clickable to open results dashboard */}
            {isCompleted && auction.winning_price && (
              <div
                className="bg-emerald-50 border border-emerald-200 rounded-[0.625rem] p-2.5 text-sm cursor-pointer hover:bg-emerald-100 transition-colors group"
                onClick={(e) => { e.stopPropagation(); onSelect?.(auction); }}
              >
                <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                  <Trophy className="w-3.5 h-3.5" />
                  Won at {formatCurrency(auction.winning_price, auction.currency)}
                  <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-emerald-600 text-xs mt-1">View savings & generate PO →</p>
              </div>
            )}

            {/* Buyer Actions */}
            <div className="flex gap-2 flex-wrap">
              {isScheduled && (
                <>
                  <Button size="sm" variant="default" onClick={() => startAuction(auction.id)}>
                    <Play className="w-3 h-3 mr-1" /> Go Live
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowEditDialog(true)} className="gap-1">
                    <Pencil className="w-3 h-3" />
                    Edit ({(auction as any).buyer_edit_count || 0}/2)
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => cancelAuction(auction.id)}>Cancel</Button>
                </>
              )}
              {isLive && (
                <>
                  <Button size="sm" onClick={() => onSelect?.(auction)} className="gap-1">
                    <Gavel className="w-3 h-3" /> View Live
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => completeAuction(auction.id)}>
                    End & Award
                  </Button>
                </>
              )}
              {canRepublish && (
                <Button size="sm" variant="outline" onClick={() => setShowEditDialog(true)} className="gap-1">
                  <Pencil className="w-3 h-3" /> Edit & Republish
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      <EditAuctionForm
        auction={auction}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUpdated={() => republishAuction(auction.id)}
      />
    </>
  );
}

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
  const [showEditDialog, setShowEditDialog] = useState(false);

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

  const handleUpdated = () => {
    // Trigger parent refetch after edit
    republishAuction(auction.id);
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
                  <Button size="sm" variant="outline" onClick={() => setShowEditDialog(true)} className="gap-1">
                    <Pencil className="w-3 h-3" />
                    Edit ({(auction as any).buyer_edit_count || 0}/2)
                  </Button>
                  {((auction as any).buyer_edit_count || 0) >= 1 && (
                    <span className="text-xs text-amber-600 font-medium flex items-center">⚠ {((auction as any).buyer_edit_count || 0) >= 2 ? 'No edits left' : 'Last edit remaining'}</span>
                  )}
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
                  onClick={() => setShowEditDialog(true)}
                  className="gap-1"
                >
                  <Pencil className="w-3 h-3" /> Edit & Republish
                </Button>
              )}
            </div>
          )}

          {/* Winner — clickable to open results dashboard */}
          {isCompleted && auction.winning_price && (
            <div
              className="bg-emerald-50 border border-emerald-200 rounded-[0.625rem] p-2.5 text-sm cursor-pointer hover:bg-emerald-100 transition-colors group"
              onClick={(e) => { e.stopPropagation(); onSelect?.(auction); }}
            >
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <Trophy className="w-3.5 h-3.5" />
                Won at {formatCurrency(auction.winning_price, auction.currency)}
                <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-emerald-600 text-xs mt-1">
                {isBuyer ? 'View savings & generate PO →' : 'View auction results →'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Edit Dialog */}
      <EditAuctionForm
        auction={auction}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUpdated={handleUpdated}
      />
    </>
  );
}
