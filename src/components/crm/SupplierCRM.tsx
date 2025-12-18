import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Users, Package, UserCheck, ShoppingCart } from 'lucide-react';
import { DocumentList } from './DocumentList';
import { InvoiceForm } from './InvoiceForm';
import { PurchaseOrderForm } from './PurchaseOrderForm';
import { DebitCreditNoteForm } from './DebitCreditNoteForm';
import { DocumentViewer } from './DocumentViewer';
import { LeadsList } from './LeadsList';
import { LeadForm } from './LeadForm';
import { LeadViewer } from './LeadViewer';
import { SupplierCustomersList } from './SupplierCustomersList';
import { SupplierCustomerForm } from './SupplierCustomerForm';
import { SupplierSalesList } from './SupplierSalesList';
import { SupplierSaleForm } from './SupplierSaleForm';
import { SupplierSaleViewer } from './SupplierSaleViewer';
import { SupplierStockManagementWrapper } from './SupplierStockManagementWrapper';
import { useCRMSEO } from '@/hooks/useCRMSEO';

interface SupplierCRMProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const SupplierCRM = ({ open, onOpenChange, userId }: SupplierCRMProps) => {
  useCRMSEO({ pageType: 'leads' });

  // Document states
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'proforma_invoice' | 'tax_invoice'>('proforma_invoice');
  const [poFormOpen, setPoFormOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerType, setViewerType] = useState<'invoice' | 'purchase_order'>('invoice');
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);
  const [editPOId, setEditPOId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [noteType, setNoteType] = useState<'debit_note' | 'credit_note'>('debit_note');
  const [editNoteId, setEditNoteId] = useState<string | null>(null);

  // Lead states
  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [leadViewerOpen, setLeadViewerOpen] = useState(false);
  const [editLeadId, setEditLeadId] = useState<string | null>(null);
  const [viewLeadId, setViewLeadId] = useState<string | null>(null);
  const [leadsRefreshKey, setLeadsRefreshKey] = useState(0);

  // Customer states
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState<string | null>(null);
  const [customersRefreshKey, setCustomersRefreshKey] = useState(0);

  // Sales states
  const [saleFormOpen, setSaleFormOpen] = useState(false);
  const [saleViewerOpen, setSaleViewerOpen] = useState(false);
  const [editSaleId, setEditSaleId] = useState<string | null>(null);
  const [viewSaleId, setViewSaleId] = useState<string | null>(null);
  const [salesRefreshKey, setSalesRefreshKey] = useState(0);

  // Document handlers
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

  const handleRefresh = () => setRefreshKey((k) => k + 1);

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

  const handleLeadsRefresh = () => setLeadsRefreshKey((k) => k + 1);

  // Customer handlers
  const handleCreateCustomer = () => {
    setEditCustomerId(null);
    setCustomerFormOpen(true);
  };

  const handleEditCustomer = (id: string) => {
    setEditCustomerId(id);
    setCustomerFormOpen(true);
  };

  const handleCustomersRefresh = () => setCustomersRefreshKey((k) => k + 1);

  // Sales handlers
  const handleCreateSale = () => {
    setEditSaleId(null);
    setSaleFormOpen(true);
  };

  const handleViewSale = (id: string) => {
    setViewSaleId(id);
    setSaleViewerOpen(true);
  };

  const handleEditSale = (id: string) => {
    setEditSaleId(id);
    setSaleFormOpen(true);
  };

  const handleSalesRefresh = () => setSalesRefreshKey((k) => k + 1);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Supplier CRM</DialogTitle>
            <DialogDescription>
              Manage stock, customers, sales, documents, and leads
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="stock" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="stock" className="text-xs sm:text-sm">
                <Package className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Stock</span>
              </TabsTrigger>
              <TabsTrigger value="customers" className="text-xs sm:text-sm">
                <UserCheck className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Customers</span>
              </TabsTrigger>
              <TabsTrigger value="sales" className="text-xs sm:text-sm">
                <ShoppingCart className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Sales</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs sm:text-sm">
                <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
              <TabsTrigger value="leads" className="text-xs sm:text-sm">
                <Users className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Leads</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stock" className="mt-4">
              <SupplierStockManagementWrapper userId={userId} />
            </TabsContent>

            <TabsContent value="customers" className="mt-4">
              <SupplierCustomersList
                key={customersRefreshKey}
                userId={userId}
                onCreateCustomer={handleCreateCustomer}
                onEditCustomer={handleEditCustomer}
              />
            </TabsContent>

            <TabsContent value="sales" className="mt-4">
              <SupplierSalesList
                key={salesRefreshKey}
                userId={userId}
                onCreateSale={handleCreateSale}
                onEditSale={handleEditSale}
                onViewSale={handleViewSale}
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

            <TabsContent value="leads" className="mt-4">
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

      {/* Document Forms */}
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

      {/* Lead Forms */}
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

      {/* Customer Forms */}
      <SupplierCustomerForm
        open={customerFormOpen}
        onOpenChange={setCustomerFormOpen}
        userId={userId}
        editId={editCustomerId}
        onSuccess={handleCustomersRefresh}
      />

      {/* Sales Forms */}
      <SupplierSaleForm
        open={saleFormOpen}
        onOpenChange={setSaleFormOpen}
        userId={userId}
        editId={editSaleId}
        onSuccess={handleSalesRefresh}
      />

      <SupplierSaleViewer
        open={saleViewerOpen}
        onOpenChange={setSaleViewerOpen}
        saleId={viewSaleId}
      />
    </>
  );
};