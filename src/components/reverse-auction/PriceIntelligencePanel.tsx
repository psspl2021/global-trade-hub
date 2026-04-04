/**
 * Historical Price Intelligence Panel
 * Shows past auction data + suggested pricing for a category
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, Lightbulb } from 'lucide-react';
import { useHistoricalPricing } from '@/hooks/useHistoricalPricing';

interface PriceIntelligencePanelProps {
  category: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export function PriceIntelligencePanel({ category }: PriceIntelligencePanelProps) {
  const { insight, isLoading, getPriceInsight } = useHistoricalPricing();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (category && !loaded) {
      getPriceInsight(category);
      setLoaded(true);
    }
  }, [category, loaded, getPriceInsight]);

  useEffect(() => { setLoaded(false); }, [category]);

  if (!category || (!insight && !isLoading)) return null;

  return (
    <Card className="border-blue-200/60 bg-blue-50/30 dark:bg-blue-950/10 dark:border-blue-800/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          Price Intelligence
          <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
            {insight?.auctionCount || 0} past auctions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Analyzing historical prices...</p>
        ) : insight ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-md bg-background border">
                <p className="text-xs text-muted-foreground">Avg Won Price</p>
                <p className="text-sm font-bold text-foreground">{formatCurrency(insight.avgPrice)}</p>
              </div>
              <div className="text-center p-2 rounded-md bg-background border">
                <p className="text-xs text-muted-foreground">Min</p>
                <p className="text-sm font-bold text-emerald-700">{formatCurrency(insight.minPrice)}</p>
              </div>
              <div className="text-center p-2 rounded-md bg-background border">
                <p className="text-xs text-muted-foreground">Max</p>
                <p className="text-sm font-bold text-foreground">{formatCurrency(insight.maxPrice)}</p>
              </div>
            </div>

            {/* Recent auctions */}
            {insight.lastAuctions.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Recent Completed Auctions</p>
                {insight.lastAuctions.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-background">
                    <span className="text-foreground truncate max-w-[180px]">{a.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatCurrency(a.winning_price)}</span>
                      <span className="text-emerald-600 flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" />
                        {a.savings_pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Suggested starting: <span className="font-bold">{formatCurrency(insight.suggestedStartingPrice)}</span> (10% above avg win price)
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No historical data for this category yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
