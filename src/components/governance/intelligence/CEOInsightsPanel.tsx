/**
 * CEO Insights Panel — decision intelligence summary above the metric cards.
 * Shows risk level, supplier concentration, avg payment delay, and upcoming payments.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldCheck, TrendingUp, CalendarClock } from 'lucide-react';
import { formatBaseAmount } from './IntelligenceMetricCard';

interface UpcomingPayment {
  po_id: string;
  po_number?: string | null;
  supplier_name?: string | null;
  amount: number;
  due_date: string;
}

interface SupplierRisk {
  level: 'NORMAL' | 'DEPENDENCY_RISK' | string;
  top_supplier?: string | null;
  top_supplier_value?: number;
  concentration_pct?: number;
}

interface Insights {
  overdue_ratio?: number;
  risk_level?: 'NORMAL' | 'HIGH' | string;
  avg_payment_delay_days?: number;
  supplier_risk?: SupplierRisk;
  upcoming_payments?: UpcomingPayment[];
}

export function CEOInsightsPanel({
  insights,
  baseCurrency = 'INR',
}: {
  insights: Insights | null | undefined;
  baseCurrency?: string;
}) {
  if (!insights) return null;

  const isHighRisk = insights.risk_level === 'HIGH';
  const isDependencyRisk = insights.supplier_risk?.level === 'DEPENDENCY_RISK';
  const overduePct = ((insights.overdue_ratio ?? 0) * 100).toFixed(1);
  const concentrationPct = insights.supplier_risk?.concentration_pct ?? 0;
  const upcoming = insights.upcoming_payments ?? [];

  return (
    <Card className="border-l-4" style={{ borderLeftColor: isHighRisk ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {isHighRisk ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-primary" />
            )}
            Decision Intelligence
          </CardTitle>
          <Badge variant={isHighRisk ? 'destructive' : 'secondary'}>
            Risk: {insights.risk_level ?? 'NORMAL'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Overdue Ratio
            </div>
            <div className={`text-lg font-semibold ${isHighRisk ? 'text-destructive' : ''}`}>
              {overduePct}%
            </div>
            <div className="text-xs text-muted-foreground">
              Avg delay: {insights.avg_payment_delay_days ?? 0}d
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Top Supplier Share</div>
            <div className={`text-lg font-semibold ${isDependencyRisk ? 'text-destructive' : ''}`}>
              {concentrationPct}%
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {insights.supplier_risk?.top_supplier ?? '—'}
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarClock className="h-3 w-3" /> Upcoming (7d)
            </div>
            <div className="text-lg font-semibold">{upcoming.length}</div>
            <div className="text-xs text-muted-foreground">payments due</div>
          </div>
        </div>

        {(isHighRisk || isDependencyRisk) && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm">
            <div className="font-medium text-destructive mb-1">Top Action</div>
            {isHighRisk && (
              <div className="text-foreground">
                Clear overdue payables — {overduePct}% of total exposure is past due.
              </div>
            )}
            {isDependencyRisk && (
              <div className="text-foreground">
                Diversify sourcing — {insights.supplier_risk?.top_supplier} holds {concentrationPct}% of spend.
              </div>
            )}
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Next 7 Days</div>
            <div className="divide-y rounded-md border">
              {upcoming.slice(0, 5).map((p) => (
                <div key={p.po_id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.supplier_name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {p.po_number ?? p.po_id.slice(0, 8)} · due {new Date(p.due_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="font-semibold tabular-nums">
                    {formatBaseAmount(p.amount ?? 0, baseCurrency)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CEOInsightsPanel;
