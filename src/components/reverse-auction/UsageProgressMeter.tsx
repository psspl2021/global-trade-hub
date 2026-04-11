/**
 * Usage Progression Meter — psychological engagement bar.
 * Even with unlimited plan, shows perceived usage to drive habit formation.
 */
import { Activity, TrendingUp } from 'lucide-react';
import { USAGE_METER } from '@/lib/global-positioning';

interface UsageProgressMeterProps {
  auctionCount: number;
  /** soft cap for display only */
  softCap?: number;
}

export function UsageProgressMeter({ auctionCount, softCap = 100 }: UsageProgressMeterProps) {
  const pct = Math.min((auctionCount / softCap) * 100, 100);
  const tier = pct < 20 ? 'low' : pct < 60 ? 'mid' : 'high';

  const message = tier === 'low'
    ? USAGE_METER.messageLow
    : tier === 'mid'
    ? USAGE_METER.messageMid
    : USAGE_METER.messageHigh;

  const color = tier === 'low'
    ? 'bg-muted-foreground/30'
    : tier === 'mid'
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Activity className="w-4 h-4 text-primary" />
          {USAGE_METER.label}
        </div>
        <span className="text-xs text-muted-foreground font-medium">{auctionCount} auctions</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <TrendingUp className="w-3 h-3" />
        <span>{message}</span>
      </div>
    </div>
  );
}
