import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrderTimeline } from './PurchaseOrderTimeline';
import { PurchaseOrderActions } from './PurchaseOrderActions';
import {
  PO_STATUS_LABELS,
  PO_STATUS_COLORS,
  type POExecutionStatus,
} from '@/lib/po-execution-engine';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, Globe2, ChevronDown, ChevronUp } from 'lucide-react';
import { ExportDocumentsPanel } from '@/components/global/ExportDocumentsPanel';
import { MultiCurrencyInvoiceView } from '@/components/global/MultiCurrencyInvoiceView';
import { InternationalLogisticsButton } from '@/components/global/InternationalLogisticsButton';

interface PurchaseOrderExecutionCardProps {
  po: {
    id: string;
    po_number: string;
    vendor_name?: string;
    supplier_company_name?: string;
    title?: string;
    total_amount?: number;
    status: string;
    winning_bid?: number;
    quantity?: number;
    currency?: string;
    po_source?: string;
    external_po_number?: string;
    erp_sync_enabled?: boolean;
    erp_sync_status?: string;
  };
  userId: string;
  userRole: string | null;
  onRefresh: () => void;
}

function formatAmount(amount: number, currency?: string) {
  if (currency === 'INR' || !currency) {
    return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
  return amount.toLocaleString('en-US', { style: 'currency', currency });
}

export function PurchaseOrderExecutionCard({ po, userId, userRole, onRefresh }: PurchaseOrderExecutionCardProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [supplierConfirmed, setSupplierConfirmed] = useState<boolean | null>(null);
  const currentStatus = (po.status || 'draft') as POExecutionStatus;
  const colors = PO_STATUS_COLORS[currentStatus] || PO_STATUS_COLORS.draft;

  const displayName = po.vendor_name || po.supplier_company_name || '—';
  const displayTitle = po.title || po.po_number;
  const displayAmount = po.total_amount || (po.winning_bid && po.quantity ? po.winning_bid * po.quantity : 0);
  const isExternal = po.po_source === 'external';
  const erpDisabled = po.erp_sync_enabled === false || po.erp_sync_status === 'not_enabled';

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('po_status_history')
        .select('*')
        .eq('po_id', po.id)
        .order('created_at', { ascending: true });
      setHistory(data || []);
    };

    const checkConfirmation = async () => {
      if (!isExternal || !po.external_po_number) {
        setSupplierConfirmed(null);
        return;
      }
      const { data } = await supabase
        .from('supplier_po_acknowledgements' as any)
        .select('id')
        .eq('po_id', po.id)
        .eq('confirmed_po_number', po.external_po_number)
        .limit(1);
      setSupplierConfirmed((data as any[])?.length > 0);
    };

    load();
    checkConfirmation();
  }, [po.id, currentStatus, isExternal, po.external_po_number]);

  const pendingConfirmation = isExternal && supplierConfirmed === false;

  return (
    <Card className="rounded-[0.625rem] overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 border-b">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">{po.po_number}</span>
            <Badge variant="outline" className={cn('text-xs', colors.bg, colors.text, colors.border)}>
              {PO_STATUS_LABELS[currentStatus]}
            </Badge>
            {isExternal ? (
              <Badge variant="secondary" className="text-[10px]">External PO</Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Platform PO</Badge>
            )}
            {erpDisabled && (
              <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600">ERP Sync: Off</Badge>
            )}
          </div>
          <p className="font-semibold text-sm truncate mt-0.5">{displayTitle}</p>
          <p className="text-xs text-muted-foreground">{displayName}</p>
        </div>
        {displayAmount > 0 && (
          <span className="text-lg font-bold whitespace-nowrap">
            {formatAmount(displayAmount, po.currency)}
          </span>
        )}
      </div>

      {/* Pending supplier confirmation warning */}
      {pendingConfirmation && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-xs">Waiting for supplier to confirm PO number. Lifecycle progression blocked.</span>
        </div>
      )}

      {/* Timeline */}
      <div className="px-4 pt-3 pb-1">
        <PurchaseOrderTimeline currentStatus={currentStatus} />
      </div>

      {/* Actions */}
      <div className="px-4 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <PurchaseOrderActions
          poId={po.id}
          currentStatus={currentStatus}
          userId={userId}
          userRole={userRole}
          onStatusChange={onRefresh}
          disabled={pendingConfirmation}
        />
        {history.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            Last: {new Date(history[history.length - 1].created_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </Card>
  );
}
