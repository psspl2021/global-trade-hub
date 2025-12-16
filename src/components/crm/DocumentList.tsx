import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, ShoppingCart, Receipt, Loader2, Eye, Edit, Trash2, Download, MinusCircle, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface DocumentListProps {
  userId: string;
  onCreateInvoice: (type: 'proforma_invoice' | 'tax_invoice') => void;
  onCreatePO: () => void;
  onCreateNote: (type: 'debit_note' | 'credit_note') => void;
  onViewInvoice: (id: string) => void;
  onViewPO: (id: string) => void;
  onEditInvoice: (id: string) => void;
  onEditPO: (id: string) => void;
  onEditNote: (id: string, type: 'debit_note' | 'credit_note') => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export const DocumentList = ({
  userId,
  onCreateInvoice,
  onCreatePO,
  onCreateNote,
  onViewInvoice,
  onViewPO,
  onEditInvoice,
  onEditPO,
  onEditNote,
}: DocumentListProps) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    setLoading(true);
    
    const [invoicesRes, posRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('*')
        .eq('supplier_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('purchase_orders')
        .select('*')
        .eq('supplier_id', userId)
        .order('created_at', { ascending: false }),
    ]);

    if (invoicesRes.error && import.meta.env.DEV) console.error('Error fetching invoices:', invoicesRes.error);
    if (posRes.error && import.meta.env.DEV) console.error('Error fetching POs:', posRes.error);

    setInvoices(invoicesRes.data || []);
    setPurchaseOrders(posRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchDocuments();
  }, [userId]);

  const deleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    // First delete invoice items
    await supabase.from('invoice_items').delete().eq('invoice_id', id);
    
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete document', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Document deleted successfully' });
      fetchDocuments();
    }
  };

  const deletePO = async (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    
    // First delete PO items
    await supabase.from('po_items').delete().eq('po_id', id);
    
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete purchase order', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Purchase order deleted successfully' });
      fetchDocuments();
    }
  };

  const exportToExcel = async (documents: any[], type: string) => {
    if (documents.length === 0) {
      toast({ title: 'No data', description: 'No documents to export', variant: 'destructive' });
      return;
    }

    const exportData = documents.map((doc) => ({
      'Document Number': doc.invoice_number || doc.po_number,
      'Type': type,
      'Party Name': doc.buyer_name || doc.vendor_name,
      'GSTIN': doc.buyer_gstin || doc.vendor_gstin || '',
      'Date': format(new Date(doc.issue_date || doc.order_date), 'dd-MM-yyyy'),
      'Subtotal': Number(doc.subtotal),
      'Tax Amount': Number(doc.tax_amount),
      'Total Amount': Number(doc.total_amount),
      'Status': doc.status,
      'Created At': format(new Date(doc.created_at), 'dd-MM-yyyy HH:mm'),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type);
    XLSX.writeFile(wb, `${type.replace(' ', '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast({ title: 'Exported', description: `${documents.length} ${type}(s) exported successfully` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const proformaInvoices = invoices.filter(i => i.document_type === 'proforma_invoice');
  const taxInvoices = invoices.filter(i => i.document_type === 'tax_invoice');
  const debitNotes = invoices.filter(i => i.document_type === 'debit_note');
  const creditNotes = invoices.filter(i => i.document_type === 'credit_note');

  const renderDocumentCard = (doc: any, isInvoice: boolean, docType?: 'debit_note' | 'credit_note') => (
    <Card key={doc.id}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{doc.invoice_number || doc.po_number}</span>
              <Badge className={statusColors[doc.status]}>{doc.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{doc.buyer_name || doc.vendor_name}</p>
            <p className="text-sm">₹{Number(doc.total_amount).toLocaleString()}</p>
            {doc.reference_invoice_number && (
              <p className="text-xs text-muted-foreground">Ref: {doc.reference_invoice_number}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {format(new Date(doc.issue_date || doc.order_date), 'dd MMM yyyy')}
            </p>
            <div className="flex gap-1 mt-2">
              <Button size="icon" variant="ghost" onClick={() => isInvoice ? onViewInvoice(doc.id) : onViewPO(doc.id)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => {
                  if (docType) {
                    onEditNote(doc.id, docType);
                  } else if (isInvoice) {
                    onEditInvoice(doc.id);
                  } else {
                    onEditPO(doc.id);
                  }
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => isInvoice ? deleteInvoice(doc.id) : deletePO(doc.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderEmptyState = (icon: React.ReactNode, message: string, onCreateClick: () => void, buttonText: string) => (
    <Card>
      <CardContent className="py-8 text-center text-muted-foreground">
        {icon}
        <p>{message}</p>
        <Button onClick={onCreateClick} className="mt-4" variant="outline">
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => onCreateInvoice('proforma_invoice')} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Proforma Invoice
        </Button>
        <Button onClick={() => onCreateInvoice('tax_invoice')} size="sm" variant="secondary">
          <Plus className="h-4 w-4 mr-1" /> Tax Invoice
        </Button>
        <Button onClick={onCreatePO} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Purchase Order
        </Button>
        <Button onClick={() => onCreateNote('debit_note')} size="sm" variant="outline">
          <PlusCircle className="h-4 w-4 mr-1" /> Debit Note
        </Button>
        <Button onClick={() => onCreateNote('credit_note')} size="sm" variant="outline">
          <MinusCircle className="h-4 w-4 mr-1" /> Credit Note
        </Button>
      </div>

      <Tabs defaultValue="proforma" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="proforma" className="text-xs">
            <FileText className="h-3 w-3 mr-1 hidden sm:inline" />
            PI ({proformaInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="tax" className="text-xs">
            <Receipt className="h-3 w-3 mr-1 hidden sm:inline" />
            Tax ({taxInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="po" className="text-xs">
            <ShoppingCart className="h-3 w-3 mr-1 hidden sm:inline" />
            PO ({purchaseOrders.length})
          </TabsTrigger>
          <TabsTrigger value="debit" className="text-xs">
            <PlusCircle className="h-3 w-3 mr-1 hidden sm:inline" />
            DN ({debitNotes.length})
          </TabsTrigger>
          <TabsTrigger value="credit" className="text-xs">
            <MinusCircle className="h-3 w-3 mr-1 hidden sm:inline" />
            CN ({creditNotes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proforma" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" variant="ghost" onClick={() => exportToExcel(proformaInvoices, 'Proforma Invoice')}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
          {proformaInvoices.length === 0 ? (
            renderEmptyState(
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />,
              'No proforma invoices yet',
              () => onCreateInvoice('proforma_invoice'),
              'Create First Proforma Invoice'
            )
          ) : (
            <div className="space-y-3">{proformaInvoices.map((inv) => renderDocumentCard(inv, true))}</div>
          )}
        </TabsContent>

        <TabsContent value="tax" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" variant="ghost" onClick={() => exportToExcel(taxInvoices, 'Tax Invoice')}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
          {taxInvoices.length === 0 ? (
            renderEmptyState(
              <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />,
              'No tax invoices yet',
              () => onCreateInvoice('tax_invoice'),
              'Create First Tax Invoice'
            )
          ) : (
            <div className="space-y-3">{taxInvoices.map((inv) => renderDocumentCard(inv, true))}</div>
          )}
        </TabsContent>

        <TabsContent value="po" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" variant="ghost" onClick={() => exportToExcel(purchaseOrders, 'Purchase Order')}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
          {purchaseOrders.length === 0 ? (
            renderEmptyState(
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />,
              'No purchase orders yet',
              onCreatePO,
              'Create First Purchase Order'
            )
          ) : (
            <div className="space-y-3">{purchaseOrders.map((po) => renderDocumentCard(po, false))}</div>
          )}
        </TabsContent>

        <TabsContent value="debit" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" variant="ghost" onClick={() => exportToExcel(debitNotes, 'Debit Note')}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
          {debitNotes.length === 0 ? (
            renderEmptyState(
              <PlusCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />,
              'No debit notes yet',
              () => onCreateNote('debit_note'),
              'Create First Debit Note'
            )
          ) : (
            <div className="space-y-3">{debitNotes.map((dn) => renderDocumentCard(dn, true, 'debit_note'))}</div>
          )}
        </TabsContent>

        <TabsContent value="credit" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" variant="ghost" onClick={() => exportToExcel(creditNotes, 'Credit Note')}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
          {creditNotes.length === 0 ? (
            renderEmptyState(
              <MinusCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />,
              'No credit notes yet',
              () => onCreateNote('credit_note'),
              'Create First Credit Note'
            )
          ) : (
            <div className="space-y-3">{creditNotes.map((cn) => renderDocumentCard(cn, true, 'credit_note'))}</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
