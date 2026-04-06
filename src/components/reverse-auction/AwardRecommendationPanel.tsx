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
  Shield, Users, Star, BarChart3
} from 'lucide-react';
import { ReverseAuctionBid } from '@/hooks/useReverseAuction';
import { computeAwardScores, SupplierScore } from '@/hooks/useAwardRecommendation';

interface AwardRecommendationPanelProps {
  bids: ReverseAuctionBid[];
  startingPrice: number;
  currency?: string;
}

const RECOMMENDATION_CONFIG = {
  strong: { label: 'Recommended', color: 'text-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: '🏆' },
  good: { label: 'Good Option', color: 'text-blue-700', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: '👍' },
  consider: { label: 'Consider', color: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-border', icon: '🤔' },
};

function formatCurrency(value: number, currency: string = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export function AwardRecommendationPanel({ bids, startingPrice, currency = 'INR' }: AwardRecommendationPanelProps) {
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
              <p className="text-[10px] text-muted-foreground">
                AI-scored ranking • {scores.length} supplier{scores.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-[10px] border-0 ${topConfig.bg} ${topConfig.color}`}>
              {topConfig.icon} {topScore.composite_score}/100
            </Badge>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

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

                  {/* Reasoning */}
                  <div className="flex flex-wrap gap-1">
                    {score.reasoning.map((r, i) => (
                      <span key={i} className="text-[9px] text-muted-foreground bg-background/50 rounded px-1.5 py-0.5 border border-border/30">
                        {r}
                      </span>
                    ))}
                  </div>
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
