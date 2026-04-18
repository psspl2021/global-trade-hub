/**
 * Enterprise-grade Buyer Action Cards
 * Live metrics from DB, status badges, micro-CTAs
 */
import { useEffect, useState, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useCurrencyFormatter } from '@/lib/currency';
import { FileText, Gavel, Truck, Package, BarChart3, MapPin, ArrowRight, TrendingUp } from 'lucide-react';
import { useBuyerCompanyContext } from '@/hooks/useBuyerCompanyContext';

interface BuyerActionCardsProps {
  userId: string;
  onForwardRFQ: () => void;
  onReverseAuction: () => void;
  onBookTransport: () => void;
  onBrowseProducts: () => void;
  onOpenCRM: () => void;
  onTrackShipments: () => void;
}

interface LiveMetrics {
  openRFQs: number;
  totalQuotes: number;
  liveAuctions: number;
  liveSavings: number;
  realizedSavings: number;
  pendingLogistics: number;
}

export function BuyerActionCards({
  userId,
  onForwardRFQ,
  onReverseAuction,
  onBookTransport,
  onBrowseProducts,
  onOpenCRM,
  onTrackShipments,
}: BuyerActionCardsProps) {
  const { fmtCompact } = useCurrencyFormatter();
  const { selectedPurchaserId } = useBuyerCompanyContext();
  const [metrics, setMetrics] = useState<LiveMetrics>({
    openRFQs: 0,
    totalQuotes: 0,
    liveAuctions: 0,
    liveSavings: 0,
    realizedSavings: 0,
    pendingLogistics: 0,
  });

  useEffect(() => {
    if (!userId) return;

    const fetchMetrics = async () => {
      // Scoped via DB RPC: hard-enforces purchaser self-only;
      // honors selectedPurchaserId only for management roles.
      const [scopedRfqsRes, scopedAuctionsRes] = await Promise.all([
        (supabase as any).rpc('get_scoped_rfqs_by_purchaser', {
          p_user_id: userId,
          p_selected_purchaser: selectedPurchaserId,
        }),
        (supabase as any).rpc('get_scoped_auctions_by_purchaser', {
          p_user_id: userId,
          p_selected_purchaser: selectedPurchaserId,
        }),
      ]);

      const allRfqs = (scopedRfqsRes.data || []) as any[];
      const activeRfqsCount = allRfqs.filter(r => r.status === 'active').length;
      const reqIds = allRfqs.map(r => ({ id: r.id }));

      const auctionRes = { data: scopedAuctionsRes.data || [] };
      const rfqRes = { count: activeRfqsCount };

      // Scoped via DB RPC: same purchaser-aware enforcement as RFQs/auctions.
      // Purchaser role is hard-overridden in the DB to self-only.
      const { data: logisticsRows } = await (supabase as any).rpc(
        'get_scoped_logistics_by_purchaser',
        { p_user_id: userId, p_selected_purchaser: selectedPurchaserId }
      );
      const activeLogisticsCount = ((logisticsRows || []) as any[])
        .filter(l => l.status === 'active').length;
      const logisticsRes: { count: number | null } = { count: activeLogisticsCount };

      let quotesCount = 0;
      if (reqIds && reqIds.length > 0) {
        const ids = reqIds.map(r => r.id);
        const { count } = await supabase
          .from('bids')
          .select('id', { count: 'exact', head: true })
          .in('requirement_id', ids)
          .eq('status', 'pending');
        quotesCount = count || 0;
      }

      const auctions = auctionRes.data || [];
      const liveCount = auctions.filter((a: any) => a.status === 'live').length;

      const liveSavings = auctions
        .filter((a: any) => a.status === 'live' && a.current_price && a.starting_price && a.current_price < a.starting_price)
        .reduce((sum: number, a: any) => sum + (a.starting_price - a.current_price) * (a.quantity || 1), 0);

      const realizedSavings = auctions
        .filter((a: any) => a.status === 'completed')
        .reduce((sum: number, a: any) => {
          const finalPrice = a.winning_bid ?? a.current_price;
          if (finalPrice && a.starting_price && finalPrice < a.starting_price) {
            return sum + (a.starting_price - finalPrice) * (a.quantity || 1);
          }
          return sum;
        }, 0);

      setMetrics({
        openRFQs: rfqRes.count || 0,
        totalQuotes: quotesCount || 0,
        liveAuctions: liveCount,
        liveSavings,
        realizedSavings,
        pendingLogistics: logisticsRes.count || 0,
      });
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, [userId, selectedPurchaserId]);

  const formatVal = (val: number) => fmtCompact(val);

  const cards: {
    title: string;
    description: string;
    icon: typeof FileText;
    iconBg: string;
    iconColor: string;
    badge: { label: string; variant: 'default' | 'destructive' | 'secondary' } | null;
    metrics: ReactNode;
    primaryCTA: { label: string; onClick: () => void };
    secondaryCTA: { label: string; onClick: () => void } | null;
    onClick: () => void;
  }[] = [
    {
      title: 'Forward RFQ',
      description: 'Post requirements & receive competitive supplier quotes',
      icon: FileText,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      badge: metrics.openRFQs > 0 ? { label: `${metrics.openRFQs} ACTIVE`, variant: 'default' } : null,
      metrics: metrics.totalQuotes > 0 ? <span>{metrics.totalQuotes} quotes received</span> : null,
      primaryCTA: { label: 'Post RFQ', onClick: onForwardRFQ },
      secondaryCTA: { label: 'View RFQs', onClick: onForwardRFQ },
      onClick: onForwardRFQ,
    },
    {
      title: 'Reverse Auction',
      description: 'Run live reverse auctions and maximize savings',
      icon: Gavel,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
      badge: metrics.liveAuctions > 0 ? { label: 'LIVE', variant: 'destructive' } : null,
      metrics: (metrics.liveSavings > 0 || metrics.realizedSavings > 0 || metrics.liveAuctions > 0) ? (
        <div className="flex items-center gap-3 flex-wrap">
          {metrics.liveAuctions > 0 && (
            <span className="text-xs font-medium text-foreground">{metrics.liveAuctions} active</span>
          )}
          {metrics.liveSavings > 0 && (
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Live</span>
              <span className="text-sm font-semibold text-emerald-600">{formatVal(metrics.liveSavings)} ↑</span>
            </div>
          )}
          {metrics.realizedSavings > 0 && (
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Realized</span>
              <span className="text-sm font-semibold text-primary">{formatVal(metrics.realizedSavings)} ✓</span>
            </div>
          )}
        </div>
      ) : null,
      primaryCTA: { label: 'Create Auction', onClick: onReverseAuction },
      secondaryCTA: { label: 'View Auctions', onClick: onReverseAuction },
      onClick: onReverseAuction,
    },
    {
      title: 'Book Transport',
      description: 'Post logistics needs and get competitive freight quotes',
      icon: Truck,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
      badge: metrics.pendingLogistics > 0 ? { label: `${metrics.pendingLogistics} ACTIVE`, variant: 'secondary' as const } : null,
      metrics: null,
      primaryCTA: { label: 'Post Logistics Need', onClick: onBookTransport },
      secondaryCTA: null,
      onClick: onBookTransport,
    },
    {
      title: 'Browse Products',
      description: 'Search supplier products with live stock updates',
      icon: Package,
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-600',
      badge: null,
      metrics: null,
      primaryCTA: { label: 'Browse Stock', onClick: onBrowseProducts },
      secondaryCTA: null,
      onClick: onBrowseProducts,
    },
    {
      title: 'CRM & Inventory',
      description: 'Manage inventory, invoices & purchase orders',
      icon: BarChart3,
      iconBg: 'bg-sky-500/10',
      iconColor: 'text-sky-600',
      badge: null,
      metrics: null,
      primaryCTA: { label: 'Open CRM', onClick: onOpenCRM },
      secondaryCTA: null,
      onClick: onOpenCRM,
    },
    {
      title: 'Track Shipments',
      description: 'Track your logistics shipments in real-time',
      icon: MapPin,
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-600',
      badge: null,
      metrics: null,
      primaryCTA: { label: 'Track Now', onClick: onTrackShipments },
      secondaryCTA: null,
      onClick: onTrackShipments,
    },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card
          key={card.title}
          variant="interactive"
          className="p-5 flex flex-col justify-between group"
          onClick={card.onClick}
        >
          {/* Top Row: Icon + Title + Badge */}
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <h3 className="font-semibold text-foreground">{card.title}</h3>
              </div>
              {card.badge && (
                <Badge
                  variant={card.badge.variant}
                  className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider ${
                    card.badge.label === 'LIVE'
                      ? 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse'
                      : ''
                  }`}
                >
                  {card.badge.label}
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              {card.description}
            </p>

            {/* Live Metrics */}
            {card.metrics && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 bg-muted/50 rounded-md px-2.5 py-1.5">
                <TrendingUp className="w-3 h-3 text-primary shrink-0" />
                {card.metrics}
              </div>
            )}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2 mt-auto pt-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                card.primaryCTA.onClick();
              }}
            >
              {card.primaryCTA.label}
            </Button>
            {card.secondaryCTA && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1 text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  card.secondaryCTA!.onClick();
                }}
              >
                {card.secondaryCTA.label}
                <ArrowRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
