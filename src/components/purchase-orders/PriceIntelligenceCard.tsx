import { usePriceIntelligence } from '@/hooks/usePriceIntelligence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Minus, AlertTriangle } from 'lucide-react';

interface PriceIntelligenceCardProps {
  product: string;
  city?: string;
  yourPrice: number;
  currency?: string;
}

export function PriceIntelligenceCard({ product, city, yourPrice, currency = '₹' }: PriceIntelligenceCardProps) {
  const { intel, loading, compare } = usePriceIntelligence(product, city);

  if (loading) return null;
  if (!intel.available) return null;

  const comparison = compare(yourPrice);

  const verdictConfig = {
    good: { icon: TrendingDown, label: 'Below Market', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    fair: { icon: Minus, label: 'At Market', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
    overpaying: { icon: TrendingUp, label: 'Above Market', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    no_data: { icon: AlertTriangle, label: 'No Data', color: 'bg-muted text-muted-foreground' },
  };

  const config = verdictConfig[comparison.verdict];
  const VerdictIcon = config.icon;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          📊 Price Intelligence
          <Badge variant="outline" className={config.color}>
            <VerdictIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-muted-foreground text-xs">Market Low</p>
            <p className="font-semibold">{currency}{intel.price_min?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Market Avg</p>
            <p className="font-semibold">{currency}{intel.price_avg?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Market High</p>
            <p className="font-semibold">{currency}{intel.price_max?.toLocaleString()}</p>
          </div>
        </div>
        {comparison.overpayPercent !== null && comparison.verdict === 'overpaying' && (
          <p className="text-red-600 dark:text-red-400 font-medium text-xs">
            ⚠️ You're paying {comparison.overpayPercent.toFixed(1)}% above market average
          </p>
        )}
      </CardContent>
    </Card>
  );
}
