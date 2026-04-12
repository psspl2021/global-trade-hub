/**
 * Audit & Compliance Timeline — Enterprise procurement audit trail
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Search, Download, FileText, Clock, CheckCircle, Package, Truck, CreditCard, Users, Gavel, FileCheck } from 'lucide-react';
import { fetchAuditTimeline } from '@/utils/procurementAuditLogger';
import { useAuditExport } from '@/hooks/useAuditExport';
import { toast } from 'sonner';

const ACTION_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  RFQ_CREATED: { icon: <FileText className="w-3 h-3" />, color: 'bg-blue-500', label: 'RFQ Created' },
  RFQ_UPDATED: { icon: <FileCheck className="w-3 h-3" />, color: 'bg-blue-400', label: 'RFQ Updated' },
  SUPPLIER_INVITED: { icon: <Users className="w-3 h-3" />, color: 'bg-indigo-500', label: 'Supplier Invited' },
  INVITE_ACCEPTED: { icon: <CheckCircle className="w-3 h-3" />, color: 'bg-green-500', label: 'Invite Accepted' },
  BID_PLACED: { icon: <Gavel className="w-3 h-3" />, color: 'bg-amber-500', label: 'Bid Placed' },
  BID_UPDATED: { icon: <Gavel className="w-3 h-3" />, color: 'bg-amber-400', label: 'Bid Updated' },
  AUCTION_STARTED: { icon: <Clock className="w-3 h-3" />, color: 'bg-purple-500', label: 'Auction Started' },
  AUCTION_CLOSED: { icon: <CheckCircle className="w-3 h-3" />, color: 'bg-purple-600', label: 'Auction Closed' },
  PO_CREATED: { icon: <FileText className="w-3 h-3" />, color: 'bg-emerald-500', label: 'PO Created' },
  PO_SENT_TO_SUPPLIER: { icon: <Package className="w-3 h-3" />, color: 'bg-emerald-400', label: 'PO Sent' },
  PO_ACCEPTED: { icon: <CheckCircle className="w-3 h-3" />, color: 'bg-emerald-600', label: 'PO Accepted' },
  SHIPMENT_MARKED: { icon: <Truck className="w-3 h-3" />, color: 'bg-orange-500', label: 'Shipment Marked' },
  DELIVERY_CONFIRMED: { icon: <Package className="w-3 h-3" />, color: 'bg-teal-500', label: 'Delivery Confirmed' },
  PAYMENT_MARKED_DONE: { icon: <CreditCard className="w-3 h-3" />, color: 'bg-green-600', label: 'Payment Done' },
};

export function AuditComplianceTimeline() {
  const [filterType, setFilterType] = useState<'auction_id' | 'rfq_id' | 'po_id'>('auction_id');
  const [filterId, setFilterId] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { downloadCSV } = useAuditExport();

  const handleSearch = async () => {
    if (!filterId.trim()) { toast.error('Enter an ID to search'); return; }
    setLoading(true);
    try {
      const data = await fetchAuditTimeline({ [filterType]: filterId.trim() });
      setEvents(data);
      if (!data.length) toast.info('No audit events found');
    } catch (e: any) {
      toast.error(e.message || 'Failed to fetch audit trail');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!events.length) return;
    const rows = events.map(e => ({
      timestamp: e.created_at,
      action: e.action_type,
      role: e.performed_by_role,
      performed_by: e.performed_by,
      system_action: e.is_system_action ? 'Yes' : 'No',
      hash: e.hash_signature,
    }));
    downloadCSV(rows, `audit-trail-${filterId.slice(0, 8)}.csv`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-slate-700 to-zinc-800">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Audit & Compliance</h2>
          <p className="text-xs text-muted-foreground">Immutable, tamper-proof procurement ledger</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auction_id">Auction ID</SelectItem>
                <SelectItem value="rfq_id">RFQ ID</SelectItem>
                <SelectItem value="po_id">PO ID</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Enter UUID..."
              value={filterId}
              onChange={e => setFilterId(e.target.value)}
              className="font-mono text-sm"
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-1" /> Search
            </Button>
          </div>

          {/* Timeline */}
          {events.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <Badge variant="outline">{events.length} events</Badge>
                <Button size="sm" variant="outline" onClick={handleExportCSV}>
                  <Download className="h-3 w-3 mr-1" /> Export CSV
                </Button>
              </div>

              <div className="relative space-y-0">
                {events.map((event, idx) => {
                  const meta = ACTION_META[event.action_type] || {
                    icon: <Clock className="w-3 h-3" />,
                    color: 'bg-gray-400',
                    label: event.action_type,
                  };
                  const time = new Date(event.created_at).toLocaleString();
                  return (
                    <div key={event.id} className="flex gap-3 items-start relative">
                      {/* Vertical line */}
                      {idx < events.length - 1 && (
                        <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border" />
                      )}
                      {/* Dot */}
                      <div className={`w-7 h-7 rounded-full ${meta.color} flex items-center justify-center text-white shrink-0 z-10`}>
                        {meta.icon}
                      </div>
                      {/* Content */}
                      <div className="pb-4 min-w-0">
                        <p className="text-sm font-medium">{meta.label}</p>
                        <p className="text-xs text-muted-foreground">{time} • {event.performed_by_role}</p>
                        {event.hash_signature && (
                          <p className="text-[10px] font-mono text-muted-foreground/50 truncate">
                            hash: {event.hash_signature.slice(0, 16)}...
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
