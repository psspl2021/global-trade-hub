/**
 * Enterprise-grade Buyer Action Cards
 * Live metrics from DB, status badges, micro-CTAs
 */
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Gavel, Truck, Package, BarChart3, MapPin, ArrowRight, TrendingUp } from 'lucide-react';

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
  auctionSavings: number;
  pendingLogistics: number;
  activeShipments: number;
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
  const [metrics, setMetrics] = useState<LiveMetrics>({
    openRFQs: 0,
    totalQuotes: 0,
    liveAuctions: 0,
    auctionSavings: 0,
    pendingLogistics: 0,
    activeShipments: 0,
  });

  useEffect(() => {
    if (!userId) return;

    const fetchMetrics = async () => {
      const [rfqRes, bidsRes, auctionRes, logisticsRes] = await Promise.all([
        supabase
          .from('requirements')
          .select('id', { count: 'exact', head: true })
          .eq('buyer_id', userId)
          .in('status', ['open', 'submitted', 'in_review']),
        supabase
          .from('bids')
          .select('id', { count: 'exact', head: true })
          .in('status', ['submitted', 'under_review'])
          .eq('requirement_id', userId), // will be joined properly
        supabase
          .from('reverse_auctions')
          .select('id, status, start_price, current_lowest_bid')
          .eq('buyer_id', userId),
        supabase
          .from('logistics_requirements')
          .select('id, status', { count: 'exact', head: true })
          .eq('buyer_id', userId)
          .in('status', ['open', 'submitted']),
      ]);

      // Count quotes received across all buyer's requirements
      const { count: quotesCount } = await supabase
        .from('bids')
        .select('id, requirements!inner(buyer_id)', { count: 'exact', head: true })
        .eq('requirements.buyer_id', userId);

      const auctions = auctionRes.data || [];
      const liveCount = auctions.filter(a => a.status === 'live').length;
      const totalSavings = auctions
        .filter(a => a.current_lowest_bid && a.start_price)
        .reduce((sum, a) => sum + (a.start_price - (a.current_lowest_bid || a.start_price)), 0);

      setMetrics({
        openRFQs: rfqRes.count || 0,
        totalQuotes: quotesCount || 0,
        liveAuctions: liveCount,
        auctionSavings: totalSavings,
        pendingLogistics: logisticsRes.count || 0,
        activeShipments: 0,
      });
    };

    fetchMetrics();
  }, [userId]);

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${Math.round(val)}`;
  };

  const cards = [
    {
      title: 'Forward RFQ',
      description: 'Post requirements & receive competitive supplier quotes',
      icon: FileText,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      badge: metrics.openRFQs > 0 ? { label: `${metrics.openRFQs} OPEN`, variant: 'default' as const } : null,
      metrics: metrics.totalQuotes > 0 ? `${metrics.totalQuotes} quotes received` : null,
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
      badge: metrics.liveAuctions > 0 ? { label: 'LIVE', variant: 'destructive' as const } : null,
      metrics: metrics.liveAuctions > 0
        ? `${metrics.liveAuctions} active • Savings: ${formatCurrency(metrics.auctionSavings)}`
        : metrics.auctionSavings > 0
          ? `Savings: ${formatCurrency(metrics.auctionSavings)}`
          : null,
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
      badge: metrics.pendingLogistics > 0 ? { label: `${metrics.pendingLogistics} PENDING`, variant: 'secondary' as const } : null,
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
                      ? 'bg-red-100 text-red-700 border-red-200 animate-pulse'
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
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span>{card.metrics}</span>
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
