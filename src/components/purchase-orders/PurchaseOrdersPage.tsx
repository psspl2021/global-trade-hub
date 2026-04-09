import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText } from 'lucide-react';
import { BuyerPurchasesList } from '@/components/crm/BuyerPurchasesList';
import { BuyerPurchaseForm } from '@/components/crm/BuyerPurchaseForm';
import { BuyerPurchaseViewer } from '@/components/crm/BuyerPurchaseViewer';
import { supabase } from '@/integrations/supabase/client';

interface PurchaseOrdersPageProps {
  userId: string;
  onBack: () => void;
}

function formatINR(v: number) {
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function PurchaseOrdersPage({ userId, onBack }: PurchaseOrdersPageProps) {
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false);
  const [purchaseViewerOpen, setPurchaseViewerOpen] = useState(false);
  const [editPurchaseId, setEditPurchaseId] = useState<string | null>(null);
  const [viewPurchaseId, setViewPurchaseId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [auctionPOs, setAuctionPOs] = useState<any[]>([]);

  useEffect(() => {
    const loadAuctionPOs = async () => {
      const { data } = await supabase
        .from('reverse_auctions')
        .select('id, title, status, winning_bid, winning_price, quantity, currency, winner_supplier_id')
        .eq('buyer_id', userId)
        .eq('status', 'completed')
        .not('winner_supplier_id', 'is', null)
        .order('created_at', { ascending: false });

      // Fetch supplier company names for winners
      const enriched = await Promise.all(
        (data || []).map(async (a) => {
          const { data: sup } = await supabase
            .from('reverse_auction_suppliers')
            .select('supplier_company_name')
            .eq('auction_id', a.id)
            .eq('supplier_id', a.winner_supplier_id)
            .maybeSingle();
          return { ...a, supplier_company_name: sup?.supplier_company_name || '—' };
        })
      );
      setAuctionPOs(enriched);
    };
    loadAuctionPOs();
  }, [userId]);

  const handleCreatePurchase = () => {
    setEditPurchaseId(null);
    setPurchaseFormOpen(true);
  };

  const handleEditPurchase = (id: string) => {
    setEditPurchaseId(id);
    setPurchaseFormOpen(true);
  };

  const handleViewPurchase = (id: string) => {
    setViewPurchaseId(id);
    setPurchaseViewerOpen(true);
  };

  const handleRefresh = () => setRefreshKey((k) => k + 1);

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
        <p className="text-sm text-muted-foreground">Track and manage all your purchase records</p>
      </div>

      {/* Auction-based POs */}
      {auctionPOs.length > 0 && (
        <Card className="rounded-[0.625rem] overflow-hidden">
          <div className="flex items-center gap-2.5 p-4 border-b">
            <FileText className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Auction Purchase Orders</span>
            <Badge variant="secondary" className="text-xs">{auctionPOs.length}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="text-left p-3 font-medium text-muted-foreground">PO Ref</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Auction</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {auctionPOs.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-mono text-xs">PO-{a.id.slice(0, 8).toUpperCase()}</td>
                    <td className="p-3 font-medium truncate max-w-[200px]">{a.title}</td>
                    <td className="p-3 text-right font-semibold">
                      {a.winning_bid ? formatINR(a.winning_bid * (a.quantity || 1)) : '—'}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                        Awarded
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
