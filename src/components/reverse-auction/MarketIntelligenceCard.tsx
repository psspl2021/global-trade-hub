/**
 * Market Intelligence Card
 * Shows market range, delta insight, drop potential, and confidence
 */
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, BarChart3, Activity, Gauge } from 'lucide-react';
import { MarketInsight } from '@/hooks/useMarketIntelligence';

interface MarketIntelligenceCardProps {
  insight: MarketInsight;
  currentBest: number;
  currency?: string;
  daysAgo?: number | null;
}

function formatCurrency(value: number, currency: string = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

const DROP_CONFIG = {
  high: { label: 'HIGH', className: 'text-emerald-600 dark:text-emerald-400' },
  medium: { label: 'MEDIUM', className: 'text-amber-600 dark:text-amber-400' },
  low: { label: 'LOW', className: 'text-muted-foreground' },
};

const CONFIDENCE_CONFIG = {
  high: { barClass: 'bg-emerald-500 w-full', label: 'HIGH' },
  medium: { barClass: 'bg-amber-500 w-2/3', label: 'MEDIUM' },
  low: { barClass: 'bg-red-400 w-1/3', label: 'LOW' },
};

export function MarketIntelligenceCard({ insight, currentBest, currency = 'INR', daysAgo }: MarketIntelligenceCardProps) {
  const delta = insight.avgPrice - currentBest;
  const isWithinRange = currentBest >= insight.marketLow && currentBest <= insight.marketHigh;
  const dropCfg = DROP_CONFIG[insight.dropPotential];
  const confCfg = CONFIDENCE_CONFIG[insight.confidence];
  const freshnessColor = daysAgo == null ? 'text-muted-foreground'
    : daysAgo <= 7 ? 'text-emerald-600 dark:text-emerald-400'
    : daysAgo <= 30 ? 'text-amber-600 dark:text-amber-400'
    : 'text-destructive';

  return (
    <Card className="border">
      <div className="p-3 space-y-2.5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Market Intelligence</p>
            <p className={`text-[10px] ${freshnessColor}`}>
              Based on {insight.sampleSize} past auctions{daysAgo !== null && daysAgo !== undefined && ` • last ${daysAgo} days`}
            </p>
          </div>
        </div>

        {/* Market Range */}
        <div className="px-2.5 py-2 rounded-md bg-muted/40 space-y-1">
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
            Market Range (P20–P80)
          </div>
          <div className="text-base font-bold text-foreground">
            {formatCurrency(insight.marketLow, currency)} – {formatCurrency(insight.marketHigh, currency)}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Current Best:</span>
            <span className="font-semibold text-foreground">{formatCurrency(currentBest, currency)}</span>
            <Badge
              variant="outline"
              className={`text-[9px] border-0 px-1.5 ${
                isWithinRange
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
              }`}
            >
              {isWithinRange ? '🟢 In range' : '🟡 Outside range'}
            </Badge>
          </div>
        </div>

        {/* Delta Insight */}
        <div className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${
          delta >= 0
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
        }`}>
          {delta >= 0
            ? `✅ ${formatCurrency(Math.abs(delta), currency)} better than market average — strong deal`
            : `⏳ Could drop ~${formatCurrency(Math.abs(delta), currency)} more based on market data`}
        </div>

        {/* Delta micro bar */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              delta >= 0 ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{
              width: `${Math.min(100, (Math.abs(delta) / Math.max(1, currentBest)) * 100)}%`,
            }}
          />
        </div>

        {/* Drop Potential + Confidence row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Activity className="w-3 h-3" />
              Drop Potential
            </div>
            <p className={`text-xs font-bold ${dropCfg.className}`}>{dropCfg.label}</p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Gauge className="w-3 h-3" />
              Confidence
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${confCfg.barClass}`} />
              </div>
              <span className="text-[10px] font-semibold text-foreground">{confCfg.label}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
