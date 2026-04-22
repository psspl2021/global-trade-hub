/**
 * AuctionPOBanner — Surfaces the auto-built Purchase Order (and its export docs)
 * for a completed reverse auction. Polls briefly after the auction completes since
 * PO creation runs async via edge function / DB trigger.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props {
  auctionId: string;
  isGlobal?: boolean;
  /** When true, render supplier-facing copy (no "View PO" navigation to buyer dashboard). */
  isSupplier?: boolean;
}

interface POSummary {
  id: string;
  po_number: string;
  region_type: string | null;
  total_amount: number | null;
  currency: string | null;
  erp_sync_status: string | null;
}

export function AuctionPOBanner({ auctionId, isGlobal = false, isSupplier = false }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [po, setPo] = useState<POSummary | null>(null);
  const [docCount, setDocCount] = useState(0);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 12; // ~24s total

    const fetchPO = async () => {
      const { data } = await supabase
        .from('purchase_orders')
        .select('id, po_number, region_type, total_amount, currency, erp_sync_status')
        .eq('auction_id', auctionId)
        .neq('po_status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        setPo(data as POSummary);
        // Fetch export doc count for global POs
        const { count } = await supabase
          .from('export_documents')
          .select('id', { count: 'exact', head: true })
          .eq('purchase_order_id', data.id);
        if (!cancelled) setDocCount(count || 0);
        setPolling(false);
        return;
      }

      attempts += 1;
      if (attempts < maxAttempts) {
        setTimeout(fetchPO, 2000);
      } else {
        setPolling(false);
      }
    };

    fetchPO();
    return () => { cancelled = true; };
  }, [auctionId]);

  if (polling && !po) {
    return (
      <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-3 flex items-center gap-2 text-sm text-blue-900 dark:text-blue-200 mb-3">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        <span>Auto-building Purchase Order from winning bid…</span>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3 flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200 mb-3">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="font-medium">No Purchase Order auto-built yet</p>
          <p className="text-xs opacity-90">If this persists, check the auto-build logs or generate one manually below.</p>
        </div>
      </div>
    );
  }

  // Destination authority: when the parent explicitly tells us this auction is domestic
  // (isGlobal=false based on currency + destination_country), trust it over the PO row's
  // region_type. This prevents domestic India POs from being mislabeled as Global and
  // showing irrelevant export docs (Commercial Invoice, Packing List, COO, BoL).
  const isGlobalPO = isGlobal && po.region_type === 'global';

  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 p-3 mb-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                Purchase Order auto-built
              </span>
              <Badge variant="outline" className="text-[10px] border-emerald-300 dark:border-emerald-700">
                {po.po_number}
              </Badge>
              {isGlobalPO && (
                <Badge className="bg-blue-600 text-white text-[10px]">Global</Badge>
              )}
              {isGlobalPO && docCount > 0 && (
                <Badge variant="outline" className="text-[10px] border-emerald-300 dark:border-emerald-700">
                  {docCount}/4 export docs
                </Badge>
              )}
              {po.erp_sync_status && (
                <Badge variant="outline" className="text-[10px] capitalize border-emerald-300 dark:border-emerald-700">
                  ERP: {po.erp_sync_status}
                </Badge>
              )}
            </div>
            {po.total_amount != null && (
              <p className="text-xs text-emerald-800 dark:text-emerald-200/80 mt-0.5">
                Total {new Intl.NumberFormat('en-US', { style: 'currency', currency: po.currency || 'USD', maximumFractionDigits: 0 }).format(po.total_amount)}
                {isGlobalPO && ' • Commercial Invoice, Packing List, COO & Bill of Lading generated'}
              </p>
            )}
          </div>
        </div>
        {!isSupplier && (
          <Button
            size="sm"
            variant="outline"
            className="border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 gap-1.5 shrink-0"
            onClick={() => {
              // Open the Purchase Orders module of the buyer dashboard.
              // IMPORTANT: drop ?auction=... so the dashboard exits LiveAuctionView and
              // mounts the PurchaseOrdersPage; otherwise the same auction screen re-renders.
              navigate('/dashboard?view=reverse-auction&auctionView=purchase-orders', { replace: false });
            }}
          >
            <FileText className="w-3.5 h-3.5" />
            View PO
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Button>
        )}
        {isSupplier && (
          <Badge variant="outline" className="text-[10px] border-emerald-300 dark:border-emerald-700 shrink-0">
            Sent to you
          </Badge>
        )}
      </div>
    </div>
  );
}

export default AuctionPOBanner;
