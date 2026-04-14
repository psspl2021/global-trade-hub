/**
 * Award Recommendation Panel
 * AI-scored supplier ranking displayed in the LiveAuctionView for buyers
 */
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Award, ChevronDown, ChevronUp, Trophy, TrendingDown,
  Shield, Users, Star, BarChart3, CheckCircle2
} from 'lucide-react';
import { ReverseAuctionBid } from '@/hooks/useReverseAuction';
import { computeAwardScores, SupplierScore } from '@/hooks/useAwardRecommendation';
import { Button } from '@/components/ui/button';

interface AwardRecommendationPanelProps {
  bids: ReverseAuctionBid[];
  startingPrice: number;
  currency?: string;
  onAward?: (supplierId: string) => void;
  marketAvgPrice?: number | null;
}

const RECOMMENDATION_CONFIG = {
  strong: { label: 'Recommended', color: 'text-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: '🏆' },
  good: { label: 'Good Option', color: 'text-blue-700', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: '👍' },
  consider: { label: 'Consider', color: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-border', icon: '🤔' },
};

function formatCurrency(value: number, currency: string = 'INR') {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

export function AwardRecommendationPanel({ bids, startingPrice, currency = 'INR', onAward, marketAvgPrice }: AwardRecommendationPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const scores = useMemo(() => computeAwardScores(bids, startingPrice), [bids, startingPrice]);

  if (scores.length === 0) return null;

  const topScore = scores[0];
  const topConfig = RECOMMENDATION_CONFIG[topScore.recommendation];

  return (
    <Card className={`border ${expanded ? topConfig.border : ''}`}>
      <div className="p-3 space-y-2">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Award Recommendation</p>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>AI-scored • {scores.length} supplier{scores.length > 1 ? 's' : ''}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${
                      scores.length >= 5 ? 'bg-emerald-500 w-full' : scores.length >= 3 ? 'bg-amber-500 w-2/3' : 'bg-red-400 w-1/3'
                    }`} />
                  </div>
                  <span>{scores.length >= 5 ? 'High' : scores.length >= 3 ? 'Medium' : 'Low'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-[10px] border-0 ${topConfig.bg} ${topConfig.color}`}>
              {topConfig.icon} {topScore.composite_score}/100
            </Badge>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        {expanded && marketAvgPrice != null && topScore && (
          <div className={`px-2.5 py-1.5 rounded-md text-[10px] font-medium ${
            topScore.bid_price <= marketAvgPrice
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
          }`}>
            {topScore.bid_price <= marketAvgPrice
              ? `✅ Current best (${formatCurrency(topScore.bid_price, currency)}) is at or below market average (${formatCurrency(marketAvgPrice, currency)}) — safe to award`
              : `⏳ Current best (${formatCurrency(topScore.bid_price, currency)}) is above market average (${formatCurrency(marketAvgPrice, currency)}) — price may drop further`}
          </div>
        )}

        {expanded && (
          <div className="space-y-2 pt-1">
            {scores.map((score, idx) => {
              const config = RECOMMENDATION_CONFIG[score.recommendation];
              return (
                <div key={score.supplier_id} className={`p-3 rounded-lg border ${config.border} ${config.bg} space-y-2`}>
                  {/* Top row: rank + price + recommendation */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </span>
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          Supplier {score.supplier_id.slice(0, 6)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          L{score.rank} • {formatCurrency(score.bid_price, currency)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] border-0 ${config.bg} ${config.color}`}>
                      {config.label}
                    </Badge>
                  </div>

                  {/* Score breakdown */}
                  <div className="grid grid-cols-3 gap-2">
                    <ScoreBar label="Price" value={score.price_score} icon={TrendingDown} />
                    <ScoreBar label="Reliability" value={score.reliability_score} icon={Shield} />
                    <ScoreBar label="Relationship" value={score.relationship_score} icon={Users} />
                  </div>

                  {/* Composite score bar */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Composite Score</span>
                      <span className="font-bold">{score.composite_score}/100</span>
                    </div>
                    <Progress value={score.composite_score} className="h-1.5" />
                  </div>

                  {/* Why not L1 insight */}
                  {score.rank !== 1 && score.recommendation === 'strong' && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      ⚠ Not lowest price — recommended for higher reliability & relationship strength
                    </p>
                  )}

                  {/* Reasoning */}
                  <div className="flex flex-wrap gap-1">
                    {score.reasoning.map((r, i) => (
                      <span key={i} className="text-[9px] text-muted-foreground bg-background/50 rounded px-1.5 py-0.5 border border-border/30">
                        {r}
                      </span>
                    ))}
                  </div>

                  {/* Award CTA */}
                  {onAward && idx < 3 && (
                    <Button
                      size="sm"
                      className={`w-full h-7 text-xs gap-1.5 ${
                        idx === 0
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-muted hover:bg-muted/80 text-foreground'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Award this auction to Supplier ${score.supplier_id.slice(0, 6)} at ${formatCurrency(score.bid_price, currency)}?`)) {
                          onAward(score.supplier_id);
                        }
                      }}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {idx === 0 ? 'Award to this supplier' : 'Select instead'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

function ScoreBar({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-400'
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-[9px] font-mono text-muted-foreground text-right">{value}</p>
    </div>
  );
}
