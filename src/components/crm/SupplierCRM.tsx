import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Users } from 'lucide-react';
import { DocumentList } from './DocumentList';
import { InvoiceForm } from './InvoiceForm';
import { PurchaseOrderForm } from './PurchaseOrderForm';
import { DebitCreditNoteForm } from './DebitCreditNoteForm';
import { DocumentViewer } from './DocumentViewer';
import { LeadsList } from './LeadsList';
import { LeadForm } from './LeadForm';
import { LeadViewer } from './LeadViewer';
import { useCRMSEO } from '@/hooks/useCRMSEO';

interface SupplierCRMProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const SupplierCRM = ({ open, onOpenChange, userId }: SupplierCRMProps) => {
  // SEO for CRM
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

  // Lead states
  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [leadViewerOpen, setLeadViewerOpen] = useState(false);
  const [editLeadId, setEditLeadId] = useState<string | null>(null);
  const [viewLeadId, setViewLeadId] = useState<string | null>(null);
  const [leadsRefreshKey, setLeadsRefreshKey] = useState(0);

  // Debit/Credit Note states
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [noteType, setNoteType] = useState<'debit_note' | 'credit_note'>('debit_note');
  const [editNoteId, setEditNoteId] = useState<string | null>(null);

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Supplier CRM</DialogTitle>
            <DialogDescription>
              Manage leads, invoices, and purchase orders
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="leads" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="leads" className="text-sm">
                <Users className="h-4 w-4 mr-2" />
                Leads
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-sm">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leads" className="mt-4">
              <LeadsList
                key={leadsRefreshKey}
                userId={userId}
                onCreateLead={handleCreateLead}
                onViewLead={handleViewLead}
                onEditLead={handleEditLead}
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
    </>
  );
};
