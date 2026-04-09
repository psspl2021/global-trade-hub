import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BuyerPurchasesList } from '@/components/crm/BuyerPurchasesList';
import { BuyerPurchaseForm } from '@/components/crm/BuyerPurchaseForm';
import { BuyerPurchaseViewer } from '@/components/crm/BuyerPurchaseViewer';

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
