import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DocumentList } from './DocumentList';
import { InvoiceForm } from './InvoiceForm';
import { PurchaseOrderForm } from './PurchaseOrderForm';
import { DocumentViewer } from './DocumentViewer';

interface SupplierCRMProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const SupplierCRM = ({ open, onOpenChange, userId }: SupplierCRMProps) => {
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'proforma_invoice' | 'tax_invoice'>('proforma_invoice');
  const [poFormOpen, setPoFormOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerType, setViewerType] = useState<'invoice' | 'purchase_order'>('invoice');
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);
  const [editPOId, setEditPOId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateInvoice = (type: 'proforma_invoice' | 'tax_invoice') => {
    setInvoiceType(type);
    setEditInvoiceId(null);
    setInvoiceFormOpen(true);
  };

  const handleCreatePO = () => {
    setEditPOId(null);
    setPoFormOpen(true);
  };

  const handleViewInvoice = (id: string) => {
    setViewerType('invoice');
    setViewerId(id);
    setViewerOpen(true);
  };

  const handleViewPO = (id: string) => {
    setViewerType('purchase_order');
    setViewerId(id);
    setViewerOpen(true);
  };

  const handleEditInvoice = (id: string) => {
    setEditInvoiceId(id);
    setInvoiceFormOpen(true);
  };

  const handleEditPO = (id: string) => {
    setEditPOId(id);
    setPoFormOpen(true);
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Supplier CRM</DialogTitle>
            <DialogDescription>
              Manage your proforma invoices, tax invoices, and purchase orders
            </DialogDescription>
          </DialogHeader>

          <DocumentList
            key={refreshKey}
            userId={userId}
            onCreateInvoice={handleCreateInvoice}
            onCreatePO={handleCreatePO}
            onViewInvoice={handleViewInvoice}
            onViewPO={handleViewPO}
            onEditInvoice={handleEditInvoice}
            onEditPO={handleEditPO}
          />
        </DialogContent>
      </Dialog>

      <InvoiceForm
        open={invoiceFormOpen}
        onOpenChange={setInvoiceFormOpen}
        userId={userId}
        documentType={invoiceType}
        editId={editInvoiceId}
        onSuccess={handleRefresh}
      />

      <PurchaseOrderForm
        open={poFormOpen}
        onOpenChange={setPoFormOpen}
        userId={userId}
        editId={editPOId}
        onSuccess={handleRefresh}
      />

      <DocumentViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        documentType={viewerType}
        documentId={viewerId}
        onRefresh={handleRefresh}
      />
    </>
  );
};
