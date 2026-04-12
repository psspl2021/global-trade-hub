import { useSupplierScore, getScoreBadge } from '@/hooks/useSupplierScore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SupplierScoreCardProps {
  supplierId: string;
  supplierName?: string;
}

export function SupplierScoreCard({ supplierId, supplierName }: SupplierScoreCardProps) {
  const { score, loading } = useSupplierScore(supplierId);

  if (loading || !score) return null;

  const badge = getScoreBadge(score.composite);

  const metrics = [
    { label: 'On-Time Delivery', value: score.on_time_delivery_score, weight: '50%' },
    { label: 'Price Competitiveness', value: score.price_competitiveness_score, weight: '20%' },
    { label: 'Quality', value: score.quality_score, weight: '20%' },
    { label: 'Reliability', value: score.reliability_score, weight: '10%' },
  ];

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>🏆 {supplierName || 'Supplier'} Score</span>
          <span className={`text-xs font-semibold ${badge.color}`}>{badge.label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <span className="text-2xl font-bold">{score.composite.toFixed(0)}</span>
          <span className="text-muted-foreground text-xs ml-1">/ 100</span>
          <p className="text-xs text-muted-foreground mt-0.5">{score.total_orders_scored} orders evaluated</p>
        </div>
        <div className="space-y-2">
          {metrics.map((m) => (
            <div key={m.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{m.label} ({m.weight})</span>
                <span className="font-medium">{m.value.toFixed(0)}%</span>
              </div>
              <Progress value={m.value} className="h-1.5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
