/**
 * Auction Analytics Summary Cards — Enterprise dashboard metrics
 */
import { Card } from '@/components/ui/card';
import { TrendingDown, Activity, Trophy, IndianRupee } from 'lucide-react';

interface AuctionAnalyticsProps {
  totalAuctions: number;
  liveCount: number;
  completedCount: number;
  totalSavings: number;
  avgBidReduction: number;
}

function formatCurrency(value: number) {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${Math.round(value)}`;
}

export function AuctionAnalyticsCards({ totalAuctions, liveCount, completedCount, totalSavings, avgBidReduction }: AuctionAnalyticsProps) {
  const cards = [
    {
      label: 'Active Auctions',
      value: liveCount,
      suffix: 'live',
      icon: Activity,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200',
      iconBg: 'bg-emerald-100',
    },
    {
      label: 'Total Savings',
      value: formatCurrency(totalSavings),
      suffix: '',
      icon: IndianRupee,
      color: 'text-primary',
      bg: 'bg-primary/5 border-primary/20',
      iconBg: 'bg-primary/10',
    },
    {
      label: 'Avg Bid Reduction',
      value: `${avgBidReduction.toFixed(1)}%`,
      suffix: '',
      icon: TrendingDown,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
      iconBg: 'bg-amber-100',
    },
    {
      label: 'Completed',
      value: completedCount,
      suffix: `of ${totalAuctions}`,
      icon: Trophy,
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-200',
      iconBg: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className={`p-3 border ${card.bg} rounded-[0.625rem]`}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`p-1.5 rounded-lg ${card.iconBg}`}>
              <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-bold ${card.color}`}>{card.value}</span>
            {card.suffix && <span className="text-xs text-muted-foreground">{card.suffix}</span>}
          </div>
        </Card>
      ))}
    </div>
  );
}
