import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, AlertTriangle } from 'lucide-react';
import { BuyerPurchasesList } from '@/components/crm/BuyerPurchasesList';
import { BuyerPurchaseForm } from '@/components/crm/BuyerPurchaseForm';
import { BuyerPurchaseViewer } from '@/components/crm/BuyerPurchaseViewer';
import { PurchaseOrderExecutionCard } from './PurchaseOrderExecutionCard';
import { POApprovalQueue } from './POApprovalQueue';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useCanCreatePO } from '@/hooks/useCanCreatePO';
import { useBuyerCompanyContext } from '@/hooks/useBuyerCompanyContext';

interface PurchaseOrdersPageProps {
  userId: string;
  onBack: () => void;
}

export function PurchaseOrdersPage({ userId, onBack }: PurchaseOrdersPageProps) {
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false);
  const [purchaseViewerOpen, setPurchaseViewerOpen] = useState(false);
  const [editPurchaseId, setEditPurchaseId] = useState<string | null>(null);
  const [viewPurchaseId, setViewPurchaseId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [auctionPOs, setAuctionPOs] = useState<any[]>([]);
  const [manualPOs, setManualPOs] = useState<any[]>([]);
  const requestIdRef = useRef(0);
  const { role } = useUserRole(userId);
  const { allowed: canCreatePO, blocking_po_id, blocking_po_title, message: blockMessage } = useCanCreatePO(userId);
  const { selectedPurchaserId } = useBuyerCompanyContext();
  const [companyRoles, setCompanyRoles] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('buyer_company_members')
        .select('role')
        .eq('user_id', userId)
        .eq('is_active', true);
      if (cancelled) return;
      setCompanyRoles((data || []).map((r: any) => String(r.role || '').toLowerCase()));
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const isManager = companyRoles.some((r) => ['manager', 'buyer_manager', 'operations_manager'].includes(r));
  const isPurchaseHead = companyRoles.some((r) => ['purchase_head', 'vp'].includes(r));

  const loadData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const shouldApply = () => requestIdRef.current === requestId;

    setAuctionPOs([]);
    setManualPOs([]);

    // Auctions are scoped via RPC — DB filters by status; we only keep rows with a winner.
    const { data: scopedAuctions } = await (supabase as any).rpc(
      'get_scoped_auctions_by_purchaser',
      {
        p_user_id: userId,
        p_selected_purchaser: selectedPurchaserId,
        p_status: 'completed',
      }
    );
    if (!shouldApply()) return;
    const auctionData = (scopedAuctions || []).filter((a: any) => a.winner_supplier_id);

    const enriched = await Promise.all(
      (auctionData || []).map(async (a: any) => {
        const { data: sup } = await supabase
          .from('reverse_auction_suppliers')
          .select('supplier_company_name')
          .eq('auction_id', a.id)
          .eq('supplier_id', a.winner_supplier_id)
          .maybeSingle();
        return { ...a, po_number: `PO-${a.id.slice(0, 8).toUpperCase()}`, supplier_company_name: sup?.supplier_company_name || '—', status: 'draft' };
      })
    );
    if (!shouldApply()) return;
    setAuctionPOs(enriched);

    // Load manual POs scoped to the acting purchaser (falls back to caller).
    const effectivePurchaser = selectedPurchaserId || userId;
    const { data: poData } = await supabase
      .from('purchase_orders')
      .select('id, po_number, vendor_name, status, total_amount, currency, order_date')
      .eq('purchaser_id', effectivePurchaser)
      .order('created_at', { ascending: false });
    if (!shouldApply()) return;
    setManualPOs(poData || []);
  }, [userId, selectedPurchaserId]);

  useEffect(() => { loadData(); }, [loadData, refreshKey]);

  const handleCreatePurchase = () => {
    if (!canCreatePO) return; // blocked by hook
    setEditPurchaseId(null);
    setPurchaseFormOpen(true);
  };
  const handleEditPurchase = (id: string) => { setEditPurchaseId(id); setPurchaseFormOpen(true); };
  const handleViewPurchase = (id: string) => { setViewPurchaseId(id); setPurchaseViewerOpen(true); };
  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const allPOs = [
    ...auctionPOs.map((a) => ({
      id: a.id,
      po_number: a.po_number,
      supplier_company_name: a.supplier_company_name,
      title: a.title,
      status: a.status || 'draft',
      winning_bid: a.winning_bid,
      quantity: a.quantity,
      currency: a.currency || 'INR',
    })),
    ...manualPOs.map((p) => ({
      id: p.id,
      po_number: p.po_number,
      vendor_name: p.vendor_name,
      status: p.status || 'draft',
      total_amount: Number(p.total_amount),
      currency: p.currency || 'INR',
    })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground">Purchase Orders</h2>
        <p className="text-sm text-muted-foreground">Track execution lifecycle for all procurement orders</p>
      </div>

      {/* PO Creation Block Warning */}
      {!canCreatePO && (
        <Card className="border-destructive/50 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm text-destructive">Pending Order — New PO Blocked</p>
              <p className="text-xs text-muted-foreground">{blockMessage}</p>
              {blocking_po_title && (
                <p className="text-xs font-mono text-muted-foreground">Order: {blocking_po_title}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {allPOs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Order Execution</span>
            <Badge variant="secondary" className="text-xs">{allPOs.length}</Badge>
          </div>
          {allPOs.map((po) => (
            <PurchaseOrderExecutionCard
              key={po.id}
              po={po}
              userId={userId}
              userRole={role}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}

      {(isManager || isPurchaseHead) && (
        <div className="space-y-3">
          {isManager && <POApprovalQueue stage="manager" />}
          {isPurchaseHead && <POApprovalQueue stage="purchase_head" />}
        </div>
      )}

      <BuyerPurchasesList
        key={refreshKey}
        userId={userId}
        onCreatePurchase={handleCreatePurchase}
        onEditPurchase={handleEditPurchase}
        onViewPurchase={handleViewPurchase}
      />

      <BuyerPurchaseForm
        open={purchaseFormOpen}
        onOpenChange={setPurchaseFormOpen}
        userId={userId}
        editId={editPurchaseId}
        onSuccess={handleRefresh}
      />

      {viewPurchaseId && (
        <BuyerPurchaseViewer
          open={purchaseViewerOpen}
          onOpenChange={setPurchaseViewerOpen}
          purchaseId={viewPurchaseId}
        />
      )}
    </div>
  );
}
