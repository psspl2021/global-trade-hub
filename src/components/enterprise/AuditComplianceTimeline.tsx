/**
 * Audit & Compliance Timeline — Enterprise procurement audit trail
 * With chain verification, date/action/user filters, and ERP status visibility
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Search, Download, FileText, Clock, CheckCircle, Package, Truck, CreditCard, Users, Gavel, FileCheck, ShieldCheck, ShieldAlert, Filter, RefreshCw } from 'lucide-react';
import { fetchAuditTimeline, verifyAuditChain } from '@/utils/procurementAuditLogger';
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
  ERP_SYNCED: { icon: <RefreshCw className="w-3 h-3" />, color: 'bg-cyan-500', label: 'ERP Synced' },
  ERP_SYNC_FAILED: { icon: <ShieldAlert className="w-3 h-3" />, color: 'bg-red-500', label: 'ERP Sync Failed' },
};

const ACTION_TYPES = Object.keys(ACTION_META);

export function AuditComplianceTimeline() {
  const [filterType, setFilterType] = useState<'auction_id' | 'rfq_id' | 'po_id'>('auction_id');
  const [filterId, setFilterId] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [chainStatus, setChainStatus] = useState<{ is_intact: boolean; total_records: number; verified_records: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { downloadCSV } = useAuditExport();

  const handleSearch = async () => {
    if (!filterId.trim()) { toast.error('Enter an ID to search'); return; }
    setLoading(true);
    setChainStatus(null);
    try {
      const filters: any = { [filterType]: filterId.trim() };
      if (actionFilter !== 'all') filters.action_type = actionFilter;
      if (dateFrom) filters.date_from = new Date(dateFrom).toISOString();
      if (dateTo) filters.date_to = new Date(dateTo + 'T23:59:59').toISOString();

      const [data, chain] = await Promise.all([
        fetchAuditTimeline(filters),
        verifyAuditChain({ [filterType]: filterId.trim() }),
      ]);

      setEvents(data);
      setChainStatus(chain);
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
      previous_hash: e.previous_hash || 'GENESIS',
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
          <p className="text-xs text-muted-foreground">Immutable, chain-linked, tamper-proof procurement ledger</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-4">
          {/* Primary search */}
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
            <Button onClick={handleSearch} disabled={loading} size="sm">
              <Search className="h-4 w-4 mr-1" /> Search
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <div className="flex gap-2 flex-wrap p-3 rounded-lg bg-muted/50 border">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {ACTION_TYPES.map(a => (
                    <SelectItem key={a} value={a}>{ACTION_META[a]?.label || a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[150px]" placeholder="From" />
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[150px]" placeholder="To" />
            </div>
          )}

          {/* Chain verification banner */}
          {chainStatus && (
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${chainStatus.is_intact ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'}`}>
              {chainStatus.is_intact ? (
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className={`text-sm font-semibold ${chainStatus.is_intact ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                  {chainStatus.is_intact ? '✔ Chain Verified — No tampering detected' : '✖ Chain Broken — Potential tampering detected'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {chainStatus.verified_records}/{chainStatus.total_records} records verified via SHA-256 hash chain
                </p>
              </div>
            </div>
          )}

          {/* Timeline */}
          {events.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <Badge variant="outline">{events.length} events</Badge>
                <Button size="sm" variant="outline" onClick={handleExportCSV}>
                  <Download className="h-3 w-3 mr-1" /> Export CSV
                </Button>
              </div>

              <div className="relative space-y-0 max-h-[500px] overflow-y-auto pr-2">
                {events.map((event, idx) => {
                  const meta = ACTION_META[event.action_type] || {
                    icon: <Clock className="w-3 h-3" />,
                    color: 'bg-gray-400',
                    label: event.action_type,
                  };
                  const time = new Date(event.created_at).toLocaleString();
                  return (
                    <div key={event.id} className="flex gap-3 items-start relative">
                      {idx < events.length - 1 && (
                        <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border" />
                      )}
                      <div className={`w-7 h-7 rounded-full ${meta.color} flex items-center justify-center text-white shrink-0 z-10`}>
                        {meta.icon}
                      </div>
                      <div className="pb-4 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{meta.label}</p>
                          {event.is_system_action && <Badge variant="secondary" className="text-[10px] px-1 py-0">System</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{time} • {event.performed_by_role}</p>
                        {event.previous_hash && (
                          <p className="text-[10px] font-mono text-muted-foreground/50 truncate">
                            chain: ...{event.previous_hash.slice(-8)} → {event.hash_signature.slice(0, 8)}...
                          </p>
                        )}
                        {!event.previous_hash && (
                          <p className="text-[10px] font-mono text-muted-foreground/50">
                            chain: GENESIS → {event.hash_signature?.slice(0, 8)}...
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
