/**
 * CEO Insights Panel — decision intelligence summary above the metric cards.
 * Shows risk level, supplier concentration, avg payment delay, and upcoming payments.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldCheck, TrendingUp, CalendarClock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

interface ActionItem {
  type: string;
  title: string;
  impact: number;
  description: string;
}

interface Insights {
  overdue_ratio?: number;
  risk_level?: 'NORMAL' | 'HIGH' | string;
  avg_payment_delay_days?: number;
  supplier_risk?: SupplierRisk;
  upcoming_payments?: UpcomingPayment[];
  cash_pressure_score?: number;
  priority?: 'STABLE' | 'WARNING' | 'CRITICAL' | string;
  actions?: ActionItem[];
}

export function CEOInsightsPanel({
  insights,
  baseCurrency = 'INR',
}: {
  insights: Insights | null | undefined;
  baseCurrency?: string;
}) {
  const navigate = useNavigate();
  if (!insights) return null;

  const isHighRisk = insights.risk_level === 'HIGH';
  const isDependencyRisk = insights.supplier_risk?.level === 'DEPENDENCY_RISK';
  const overduePct = ((insights.overdue_ratio ?? 0) * 100).toFixed(1);
  const concentrationPct = insights.supplier_risk?.concentration_pct ?? 0;
  const upcoming = insights.upcoming_payments ?? [];
  const priority = insights.priority ?? 'STABLE';
  const cashPressure = insights.cash_pressure_score ?? 0;
  const actions = insights.actions ?? [];

  const priorityVariant: 'destructive' | 'secondary' | 'default' =
    priority === 'CRITICAL' ? 'destructive' : priority === 'WARNING' ? 'default' : 'secondary';
  const priorityBorder =
    priority === 'CRITICAL'
      ? 'hsl(var(--destructive))'
      : priority === 'WARNING'
      ? 'hsl(var(--warning, var(--primary)))'
      : 'hsl(var(--primary))';

  return (
    <Card className="border-l-4" style={{ borderLeftColor: priorityBorder }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            {priority === 'CRITICAL' ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-primary" />
            )}
            Decision Intelligence
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={priorityVariant}>Priority: {priority}</Badge>
            <Badge variant="outline">Cash Pressure: {cashPressure}</Badge>
            <Badge variant={isHighRisk ? 'destructive' : 'secondary'}>
              Risk: {insights.risk_level ?? 'NORMAL'}
            </Badge>
          </div>
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

        {actions.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Recommended Actions</div>
            <div className="space-y-2">
              {actions.map((a, i) => (
                <button
                  key={a.type}
                  type="button"
                  onClick={() => navigate(`/governance/intelligence/action/${a.type}`)}
                  className={`w-full text-left rounded-md border p-3 text-sm flex items-start gap-3 transition-colors hover:bg-accent/50 hover:border-primary/40 cursor-pointer ${
                    i === 0 && priority === 'CRITICAL'
                      ? 'bg-destructive/10 border-destructive/20'
                      : 'bg-muted/30'
                  }`}
                  aria-label={`Open details for ${a.title}`}
                >
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.description}</div>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0">
                    {a.impact}
                    {a.type === 'PLAN_CASHFLOW' ? '' : '%'}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
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
