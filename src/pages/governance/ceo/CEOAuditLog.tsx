/**
 * CEOAuditLog — filterable, human-readable governance audit viewer.
 */
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ScrollText, Filter, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { RequireCapability } from '@/components/governance/RequireCapability';

interface AuditEntry {
  id: string;
  actor_id: string;
  actor_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  reason: string | null;
  metadata: any;
  created_at: string;
}

const ACTION_OPTIONS = [
  { value: 'all', label: 'All actions' },
  { value: 'override_po', label: 'PO override approval' },
  { value: 'acknowledge_override', label: 'Manager acknowledged override' },
  { value: 'view_auction_list', label: 'Viewed auction list' },
  { value: 'view_rfq_list', label: 'Viewed RFQ list' },
  { value: 'view_auction_live', label: 'Viewed live auction' },
  { value: 'view_quotes_full', label: 'Viewed full RFQ quotes' },
];

const fmtINR = (n: number | null | undefined) =>
  n == null ? '' : '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

function renderHeadline(e: AuditEntry): string {
  const m = e.metadata ?? {};
  switch (e.action) {
    case 'override_po':
      return `CEO overrode PO ${m.po_number ?? ''}${m.po_value ? ` (${fmtINR(m.po_value)})` : ''}${m.supplier_name ? ` · ${m.supplier_name}` : ''}`;
    case 'acknowledge_override':
      return `Manager acknowledged override on PO ${m.po_number ?? ''}${m.po_value ? ` (${fmtINR(m.po_value)})` : ''}`;
    case 'view_auction_list':
      return 'Viewed company auction list';
    case 'view_rfq_list':
      return 'Viewed company RFQ list';
    case 'view_auction_live':
      return `Viewed live auction${m.auction_title ? ` — ${m.auction_title}` : ''}`;
    case 'view_quotes_full':
      return `Viewed full RFQ quotes${m.rfq_title ? ` — ${m.rfq_title}` : ''}`;
    default:
      return e.action;
  }
}

function CEOAuditLogInner() {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase
        .from('governance_audit_log' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (actionFilter !== 'all') q = q.eq('action', actionFilter);
      if (from) q = q.gte('created_at', new Date(from).toISOString());
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        q = q.lte('created_at', end.toISOString());
      }
      const { data, error } = await q;
      if (error) console.error(error);
      setItems((data as any) ?? []);
      setLoading(false);
    })();
  }, [actionFilter, from, to]);

  const hasFilters = actionFilter !== 'all' || from || to;
  const reset = () => {
    setActionFilter('all');
    setFrom('');
    setTo('');
  };

  const grouped = useMemo(() => items, [items]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-3 flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" /> Filters
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Action</label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-56 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">From</label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-40 h-9"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">To</label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-40 h-9"
            />
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={reset} className="h-9">
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
          <div className="ml-auto text-xs text-muted-foreground">
            {loading ? '…' : `${items.length} entr${items.length === 1 ? 'y' : 'ies'}`}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-10 flex justify-center text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading audit log…
          </CardContent>
        </Card>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No audit entries match these filters.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {grouped.map((e) => (
              <div key={e.id} className="px-4 py-3 flex items-start gap-3 text-sm">
                <ScrollText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{renderHeadline(e)}</span>
                    {e.actor_role && (
                      <Badge variant="outline" className="text-xs">
                        {e.actor_role.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  {e.reason && (
                    <div className="text-xs text-muted-foreground mt-1 italic">
                      "{e.reason}"
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
                  {format(new Date(e.created_at), 'dd MMM HH:mm')}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CEOAuditLog() {
  return (
    <RequireCapability cap="can_view_audit_logs">
      <CEOAuditLogInner />
    </RequireCapability>
  );
}
