import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ScrollText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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

const ACTION_LABEL: Record<string, string> = {
  override_po: 'PO override approval',
  acknowledge_override: 'Manager acknowledged override',
  view_auction_list: 'Viewed auction list',
  view_rfq_list: 'Viewed RFQ list',
  view_auction_live: 'Viewed live auction leaderboard',
  view_quotes_full: 'Viewed full RFQ quotes',
};

export default function CEOAuditLog() {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('governance_audit_log' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) console.error(error);
      setItems((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <Card><CardContent className="py-10 flex justify-center text-muted-foreground gap-2">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading audit log…
    </CardContent></Card>
  );

  if (items.length === 0) return (
    <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No audit entries yet.</CardContent></Card>
  );

  return (
    <Card>
      <CardContent className="p-0 divide-y">
        {items.map((e) => (
          <div key={e.id} className="px-4 py-3 flex items-start gap-3 text-sm">
            <ScrollText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{ACTION_LABEL[e.action] ?? e.action}</span>
                {e.actor_role && <Badge variant="outline" className="text-xs">{e.actor_role.toUpperCase()}</Badge>}
                {e.entity_type && <span className="text-xs text-muted-foreground">on {e.entity_type}</span>}
              </div>
              {e.reason && <div className="text-xs text-muted-foreground mt-1">"{e.reason}"</div>}
              {e.metadata?.po_number && <div className="text-xs text-muted-foreground mt-0.5">{e.metadata.po_number}</div>}
            </div>
            <div className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
              {format(new Date(e.created_at), 'dd MMM HH:mm')}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
