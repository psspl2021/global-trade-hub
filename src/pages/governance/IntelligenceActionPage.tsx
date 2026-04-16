/**
 * IntelligenceActionPage — drilldown for a CEO/CFO recommended action.
 * Route: /governance/intelligence/action/:actionType
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Users, CalendarClock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatBaseAmount } from '@/components/governance/intelligence/IntelligenceMetricCard';

type ActionType = 'CLEAR_OVERDUE' | 'DIVERSIFY_SUPPLIERS' | 'PLAN_CASHFLOW';

interface ActionRow {
  po_id: string;
  po_number?: string | null;
  supplier_name?: string | null;
  amount: number;
  due_date?: string | null;
  order_date?: string | null;
  days_overdue?: number;
  days_until_due?: number;
  status?: string | null;
  payment_status?: string | null;
}

interface ActionDetails {
  action_type: ActionType;
  base_currency: string;
  count: number;
  total_amount: number;
  rows: ActionRow[];
  error?: string;
}

const META: Record<ActionType, { title: string; description: string; icon: any; tone: string }> = {
  CLEAR_OVERDUE: {
    title: 'Clear Overdue Payables',
    description: 'Purchase orders past their payment due date — settle to restore supplier trust.',
    icon: AlertTriangle,
    tone: 'text-destructive',
  },
  DIVERSIFY_SUPPLIERS: {
    title: 'Reduce Supplier Dependency',
    description: 'All POs concentrated with the top supplier. Consider diversifying to reduce risk.',
    icon: Users,
    tone: 'text-primary',
  },
  PLAN_CASHFLOW: {
    title: 'Plan Upcoming Payments',
    description: 'Payments due in the next 7 days — align cashflow before they fall overdue.',
    icon: CalendarClock,
    tone: 'text-primary',
  },
};

export default function IntelligenceActionPage() {
  const { actionType } = useParams<{ actionType: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<ActionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const at = (actionType ?? '').toUpperCase() as ActionType;
  const meta = META[at];

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!user?.id || !meta) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const { data: rpc, error: rpcErr } = await supabase.rpc(
        'get_intelligence_action_details' as any,
        { p_user_id: user.id, p_action_type: at } as any
      );
      if (cancelled) return;
      if (rpcErr) {
        setError(rpcErr.message);
        setData(null);
      } else {
        const d = rpc as unknown as ActionDetails;
        if (d?.error) setError(d.error);
        setData(d);
      }
      setLoading(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, at, meta]);

  if (!meta) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Unknown action type.
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = meta.icon;
  const base = data?.base_currency ?? 'INR';

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className={`h-5 w-5 ${meta.tone}`} />
            {meta.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Affected POs</div>
            <div className="text-2xl font-semibold">{data?.count ?? 0}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Total Exposure</div>
            <div className="text-2xl font-semibold tabular-nums">
              {formatBaseAmount(data?.total_amount ?? 0, base)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Affected Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-destructive">{error}</div>
          ) : !data?.rows?.length ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nothing to show — you're clear on this front.
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {data.rows.map((r) => (
                <div
                  key={r.po_id}
                  className="flex items-center justify-between px-3 py-3 text-sm gap-3 flex-wrap"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{r.supplier_name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.po_number ?? r.po_id.slice(0, 8)}
                      {r.due_date && ` · due ${new Date(r.due_date).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {typeof r.days_overdue === 'number' && r.days_overdue > 0 && (
                      <Badge variant="destructive">{r.days_overdue}d overdue</Badge>
                    )}
                    {typeof r.days_until_due === 'number' && (
                      <Badge variant="outline">in {r.days_until_due}d</Badge>
                    )}
                    {r.payment_status && (
                      <Badge variant="secondary" className="capitalize">
                        {r.payment_status}
                      </Badge>
                    )}
                    <div className="font-semibold tabular-nums">
                      {formatBaseAmount(r.amount ?? 0, base)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
