/**
 * PO Lifecycle + Purchaser Attribution Panel
 * Surfaces the deterministic stage pipeline and operational accountability
 * for the CEO/CFO view. Data shape comes from get_company_intelligence_v2:
 *   - pos[]: { po_id, po_number, amount, due_date, stage, purchaser, purchaser_id, is_overdue, ceo_override }
 *   - insights.top_purchasers[]: { purchaser_id, purchaser, total_pos, total_value, overdue_count, stuck_count, override_count }
 *   - summary.stage_counts: { STAGE: count }
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Workflow, Users } from 'lucide-react';
import { formatBaseAmount } from './IntelligenceMetricCard';
import { Link } from 'react-router-dom';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';

type Stage =
  | 'PO_CREATED'
  | 'PENDING_APPROVAL'
  | 'PENDING_ACK'
  | 'CEO_OVERRIDE'
  | 'FLAGGED'
  | 'FORCE_CLOSED'
  | 'FINALIZED'
  | 'PAID'
  | string;

interface POLifecycleRow {
  po_id: string;
  po_number?: string | null;
  amount?: number;
  due_date?: string | null;
  stage: Stage;
  purchaser?: string | null;
  purchaser_id?: string | null;
  is_overdue?: boolean;
  ceo_override?: boolean;
}

interface PurchaserStats {
  purchaser_id: string;
  purchaser: string;
  total_pos: number;
  total_value: number;
  overdue_count: number;
  stuck_count: number;
  override_count: number;
}

const STAGE_ORDER: Stage[] = [
  'PO_CREATED',
  'PENDING_APPROVAL',
  'CEO_OVERRIDE',
  'PENDING_ACK',
  'FLAGGED',
  'FINALIZED',
  'PAID',
];

const STAGE_LABEL: Record<string, string> = {
  PO_CREATED: 'Created',
  PENDING_APPROVAL: 'Pending Approval',
  CEO_OVERRIDE: 'CEO Override',
  PENDING_ACK: 'Pending Ack',
  FLAGGED: 'Flagged',
  FORCE_CLOSED: 'Force Closed',
  FINALIZED: 'Finalized',
  PAID: 'Paid',
};

function stageVariant(stage: Stage): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (stage) {
    case 'PAID':
    case 'FINALIZED':
      return 'secondary';
    case 'PENDING_ACK':
    case 'FLAGGED':
    case 'FORCE_CLOSED':
      return 'destructive';
    case 'CEO_OVERRIDE':
    case 'PENDING_APPROVAL':
      return 'default';
    default:
      return 'outline';
  }
}

export function POLifecyclePanel({
  pos,
  topPurchasers,
  stageCounts,
  baseCurrency = 'INR',
  detailHref,
}: {
  pos?: POLifecycleRow[];
  topPurchasers?: PurchaserStats[];
  stageCounts?: Record<string, number>;
  baseCurrency?: string;
  detailHref?: string;
}) {
  const rows = Array.isArray(pos) ? pos : [];
  const purchasers = Array.isArray(topPurchasers) ? topPurchasers : [];
  const counts = stageCounts && typeof stageCounts === 'object' ? stageCounts : {};

  if (rows.length === 0 && purchasers.length === 0) return null;

  const stuckRows = rows
    .filter((r) =>
      ['PENDING_ACK', 'PENDING_APPROVAL', 'FLAGGED', 'CEO_OVERRIDE'].includes(r.stage),
    )
    .slice(0, 8);

  const fmtDate = (d?: string | null) => {
    if (!d) return '—';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Workflow className="h-4 w-4 text-primary" />
            PO Lifecycle &amp; Purchaser Attribution
          </CardTitle>
          {detailHref ? (
            <Button asChild size="sm" variant="outline">
              <Link to={detailHref}>Open Purchase Orders</Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Stage pipeline */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">Pipeline</div>
          <div className="flex flex-wrap gap-2">
            {STAGE_ORDER.map((s) => {
              const c = Number(counts[s] ?? 0);
              return (
                <Badge key={s} variant={stageVariant(s)} className="gap-1.5">
                  <span>{STAGE_LABEL[s] ?? s}</span>
                  <span className="font-mono tabular-nums opacity-80">{c}</span>
                </Badge>
              );
            })}
            {counts['FORCE_CLOSED'] ? (
              <Badge variant="destructive" className="gap-1.5">
                <span>{STAGE_LABEL.FORCE_CLOSED}</span>
                <span className="font-mono tabular-nums opacity-80">
                  {counts['FORCE_CLOSED']}
                </span>
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Stuck POs */}
        {stuckRows.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              POs Awaiting Action
            </div>
            <div className="divide-y rounded-md border">
              {stuckRows.map((r) => (
                <div
                  key={r.po_id}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">
                      {r.po_number ?? r.po_id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.purchaser ?? '—'} · due {fmtDate(r.due_date)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={stageVariant(r.stage)}>
                      {STAGE_LABEL[r.stage] ?? r.stage}
                    </Badge>
                    <span className="font-semibold tabular-nums text-xs">
                      {formatBaseAmount(Number(r.amount ?? 0), baseCurrency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top purchasers accountability */}
        {purchasers.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Users className="h-3 w-3" /> Purchaser Accountability
            </div>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Purchaser</th>
                    <th className="text-right px-3 py-2 font-medium">POs</th>
                    <th className="text-right px-3 py-2 font-medium">Value</th>
                    <th className="text-right px-3 py-2 font-medium">Stuck</th>
                    <th className="text-right px-3 py-2 font-medium">Overdue</th>
                    <th className="text-right px-3 py-2 font-medium">Overrides</th>
                  </tr>
                </thead>
                <tbody>
                  {purchasers.map((p) => (
                    <tr key={p.purchaser_id} className="border-t">
                      <td className="px-3 py-2 truncate max-w-[200px]">{p.purchaser}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{p.total_pos}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatBaseAmount(Number(p.total_value ?? 0), baseCurrency)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {p.stuck_count > 0 ? (
                          <span className="text-destructive font-medium">{p.stuck_count}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {p.overdue_count > 0 ? (
                          <span className="text-destructive font-medium">
                            {p.overdue_count}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {p.override_count > 0 ? (
                          <Badge variant="outline">{p.override_count}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default POLifecyclePanel;
