import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Package, Users, Truck, ShoppingCart } from 'lucide-react';
import { DocumentList } from './DocumentList';
import { InvoiceForm } from './InvoiceForm';
import { PurchaseOrderForm } from './PurchaseOrderForm';
import { DebitCreditNoteForm } from './DebitCreditNoteForm';
import { DocumentViewer } from './DocumentViewer';
import { BuyerStockManagement } from './BuyerStockManagement';
import { LeadsList } from './LeadsList';
import { LeadForm } from './LeadForm';
import { LeadViewer } from './LeadViewer';
import { BuyerSuppliersList } from './BuyerSuppliersList';
import { BuyerSupplierForm } from './BuyerSupplierForm';
import { BuyerPurchasesList } from './BuyerPurchasesList';
import { BuyerPurchaseForm } from './BuyerPurchaseForm';
import { BuyerPurchaseViewer } from './BuyerPurchaseViewer';
import { useCRMSEO } from '@/hooks/useCRMSEO';

interface BuyerCRMProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const BuyerCRM = ({ open, onOpenChange, userId }: BuyerCRMProps) => {
  useCRMSEO({ pageType: 'leads' });

  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'proforma_invoice' | 'tax_invoice'>('proforma_invoice');
  const [poFormOpen, setPoFormOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerType, setViewerType] = useState<'invoice' | 'purchase_order'>('invoice');
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);
  const [editPOId, setEditPOId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debit/Credit Note states
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [noteType, setNoteType] = useState<'debit_note' | 'credit_note'>('debit_note');
  const [editNoteId, setEditNoteId] = useState<string | null>(null);

  // Lead states
  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [leadViewerOpen, setLeadViewerOpen] = useState(false);
  const [editLeadId, setEditLeadId] = useState<string | null>(null);
  const [viewLeadId, setViewLeadId] = useState<string | null>(null);
  const [leadsRefreshKey, setLeadsRefreshKey] = useState(0);

  // Supplier states
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [editSupplierId, setEditSupplierId] = useState<string | null>(null);
  const [suppliersRefreshKey, setSuppliersRefreshKey] = useState(0);

  // Purchase states
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false);
  const [purchaseViewerOpen, setPurchaseViewerOpen] = useState(false);
  const [editPurchaseId, setEditPurchaseId] = useState<string | null>(null);
  const [viewPurchaseId, setViewPurchaseId] = useState<string | null>(null);
  const [purchasesRefreshKey, setPurchasesRefreshKey] = useState(0);

  const handleCreateInvoice = (type: 'proforma_invoice' | 'tax_invoice') => {
    setInvoiceType(type);
    setEditInvoiceId(null);
    setInvoiceFormOpen(true);
  };

  const handleCreatePO = () => {
    setEditPOId(null);
    setPoFormOpen(true);
  };

  const handleCreateNote = (type: 'debit_note' | 'credit_note') => {
    setNoteType(type);
    setEditNoteId(null);
    setNoteFormOpen(true);
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

  const handleEditNote = (id: string, type: 'debit_note' | 'credit_note') => {
    setNoteType(type);
    setEditNoteId(id);
    setNoteFormOpen(true);
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  // Lead handlers
  const handleCreateLead = () => {
    setEditLeadId(null);
    setLeadFormOpen(true);
  };

  const handleViewLead = (id: string) => {
    setViewLeadId(id);
    setLeadViewerOpen(true);
  };

  const handleEditLead = (id: string) => {
    setEditLeadId(id);
    setLeadFormOpen(true);
  };

  const handleLeadsRefresh = () => {
    setLeadsRefreshKey((k) => k + 1);
  };

  // Supplier handlers
  const handleCreateSupplier = () => {
    setEditSupplierId(null);
    setSupplierFormOpen(true);
  };

  const handleEditSupplier = (id: string) => {
    setEditSupplierId(id);
    setSupplierFormOpen(true);
  };

  const handleSuppliersRefresh = () => {
    setSuppliersRefreshKey((k) => k + 1);
  };

  // Purchase handlers
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

  const handlePurchasesRefresh = () => {
    setPurchasesRefreshKey((k) => k + 1);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buyer CRM</DialogTitle>
            <DialogDescription>
              Manage inventory, suppliers, purchases, documents, and contacts
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="stock" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="stock" className="text-xs sm:text-sm">
                <Package className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Inventory</span>
                <span className="sm:hidden">Stock</span>
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="text-xs sm:text-sm">
                <Truck className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Suppliers</span>
                <span className="sm:hidden">Supp.</span>
              </TabsTrigger>
              <TabsTrigger value="purchases" className="text-xs sm:text-sm">
                <ShoppingCart className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Purchases</span>
                <span className="sm:hidden">Purch.</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs sm:text-sm">
                <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Documents</span>
                <span className="sm:hidden">Docs</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="text-xs sm:text-sm">
                <Users className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Contacts</span>
                <span className="sm:hidden">Cont.</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stock" className="mt-4">
              <BuyerStockManagement userId={userId} />
            </TabsContent>

            <TabsContent value="suppliers" className="mt-4">
              <BuyerSuppliersList
                key={suppliersRefreshKey}
                userId={userId}
                onCreateSupplier={handleCreateSupplier}
                onEditSupplier={handleEditSupplier}
              />
            </TabsContent>

            <TabsContent value="purchases" className="mt-4">
              <BuyerPurchasesList
                key={purchasesRefreshKey}
                userId={userId}
                onCreatePurchase={handleCreatePurchase}
                onEditPurchase={handleEditPurchase}
                onViewPurchase={handleViewPurchase}
              />
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <DocumentList
                key={refreshKey}
                userId={userId}
                onCreateInvoice={handleCreateInvoice}
                onCreatePO={handleCreatePO}
                onCreateNote={handleCreateNote}
                onViewInvoice={handleViewInvoice}
                onViewPO={handleViewPO}
                onEditInvoice={handleEditInvoice}
                onEditPO={handleEditPO}
                onEditNote={handleEditNote}
              />
            </TabsContent>

            <TabsContent value="contacts" className="mt-4">
              <LeadsList
                key={leadsRefreshKey}
                userId={userId}
                onCreateLead={handleCreateLead}
                onViewLead={handleViewLead}
                onEditLead={handleEditLead}
              />
            </TabsContent>
          </Tabs>
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

      <DebitCreditNoteForm
        open={noteFormOpen}
        onOpenChange={setNoteFormOpen}
        userId={userId}
        noteType={noteType}
        editId={editNoteId}
        onSuccess={handleRefresh}
      />

      <DocumentViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        documentType={viewerType}
        documentId={viewerId}
        onRefresh={handleRefresh}
      />

      <LeadForm
        open={leadFormOpen}
        onOpenChange={setLeadFormOpen}
        userId={userId}
        editId={editLeadId}
        onSuccess={handleLeadsRefresh}
      />

      <LeadViewer
        open={leadViewerOpen}
        onOpenChange={setLeadViewerOpen}
        leadId={viewLeadId}
        supplierId={userId}
      />

      <BuyerSupplierForm
        open={supplierFormOpen}
        onOpenChange={setSupplierFormOpen}
        userId={userId}
        editId={editSupplierId}
        onSuccess={handleSuppliersRefresh}
      />

      <BuyerPurchaseForm
        open={purchaseFormOpen}
        onOpenChange={setPurchaseFormOpen}
        userId={userId}
        editId={editPurchaseId}
        onSuccess={handlePurchasesRefresh}
      />

      <BuyerPurchaseViewer
        open={purchaseViewerOpen}
        onOpenChange={setPurchaseViewerOpen}
        purchaseId={viewPurchaseId}
      />
    </>
  );
};
