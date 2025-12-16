import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: 'invoice' | 'purchase_order';
  documentId: string | null;
  onRefresh: () => void;
}

const statusOptions = ['draft', 'sent', 'accepted', 'rejected', 'paid', 'cancelled'];

export const DocumentViewer = ({
  open,
  onOpenChange,
  documentType,
  documentId,
  onRefresh,
}: DocumentViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [supplier, setSupplier] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && documentId) {
      loadDocument();
    }
  }, [open, documentId]);

  const loadDocument = async () => {
    setLoading(true);

    if (documentType === 'invoice') {
      const { data: inv } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', documentId)
        .single();

      const { data: invItems } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', documentId);

      if (inv) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', inv.supplier_id)
          .single();
        setSupplier(profile);
      }

      setDocument(inv);
      setItems(invItems || []);
    } else {
      const { data: po } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('id', documentId)
        .single();

      const { data: poItems } = await supabase
        .from('po_items')
        .select('*')
        .eq('po_id', documentId);

      if (po) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', po.supplier_id)
          .single();
        setSupplier(profile);
      }

      setDocument(po);
      setItems(poItems || []);
    }

    setLoading(false);
  };

  const updateStatus = async (newStatus: 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid' | 'cancelled') => {
    const table = documentType === 'invoice' ? 'invoices' : 'purchase_orders';
    const { error } = await supabase
      .from(table)
      .update({ status: newStatus })
      .eq('id', documentId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Status updated' });
      setDocument({ ...document, status: newStatus });
      onRefresh();
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${document?.invoice_number || document?.po_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; color: #333; }
          .section { margin: 15px 0; }
          .section-title { font-weight: bold; margin-bottom: 5px; }
          .totals { text-align: right; margin-top: 20px; }
          .total-row { display: flex; justify-content: flex-end; gap: 20px; padding: 5px 0; }
          .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportExcel = () => {
    if (!document || items.length === 0) {
      toast({ title: 'No data', description: 'No items to export', variant: 'destructive' });
      return;
    }

    const exportData = items.map((item, idx) => ({
      'S.No': idx + 1,
      'Description': item.description,
      'HSN Code': item.hsn_code || '',
      'Quantity': Number(item.quantity),
      'Unit': item.unit || 'units',
      'Rate': Number(item.unit_price),
      'GST %': Number(item.tax_rate) || 0,
      'GST Amount': Number(item.tax_amount),
      'Total': Number(item.total),
    }));

    // Add summary row
    exportData.push({
      'S.No': '',
      'Description': 'TOTALS',
      'HSN Code': '',
      'Quantity': '',
      'Unit': '',
      'Rate': '',
      'GST %': '',
      'GST Amount': Number(document.tax_amount),
      'Total': Number(document.total_amount),
    } as any);

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Items');

    // Add document details sheet
    const docDetails = [
      { 'Field': 'Document Number', 'Value': document.invoice_number || document.po_number },
      { 'Field': 'Type', 'Value': getDocumentTypeName() },
      { 'Field': 'Party Name', 'Value': document.buyer_name || document.vendor_name },
      { 'Field': 'GSTIN', 'Value': document.buyer_gstin || document.vendor_gstin || '' },
      { 'Field': 'Date', 'Value': format(new Date(document.issue_date || document.order_date), 'dd-MM-yyyy') },
      { 'Field': 'Subtotal', 'Value': Number(document.subtotal) },
      { 'Field': 'Tax Amount', 'Value': Number(document.tax_amount) },
      { 'Field': 'Total', 'Value': Number(document.total_amount) },
      { 'Field': 'Status', 'Value': document.status },
    ];
    const detailsWs = XLSX.utils.json_to_sheet(docDetails);
    XLSX.utils.book_append_sheet(wb, detailsWs, 'Details');

    const filename = `${(document.invoice_number || document.po_number).replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast({ title: 'Exported', description: 'Document exported to Excel' });
  };

  const getDocumentTypeName = () => {
    if (documentType === 'purchase_order') return 'PURCHASE ORDER';
    switch (document?.document_type) {
      case 'proforma_invoice': return 'PROFORMA INVOICE';
      case 'tax_invoice': return 'TAX INVOICE';
      case 'debit_note': return 'DEBIT NOTE';
      case 'credit_note': return 'CREDIT NOTE';
      default: return 'INVOICE';
    }
  };

  if (!open) return null;

  const isInvoice = documentType === 'invoice';
  const docNumber = isInvoice ? document?.invoice_number : document?.po_number;
  const partyName = isInvoice ? document?.buyer_name : document?.vendor_name;
  const partyAddress = isInvoice ? document?.buyer_address : document?.vendor_address;
  const partyGstin = isInvoice ? document?.buyer_gstin : document?.vendor_gstin;
  const partyEmail = isInvoice ? document?.buyer_email : document?.vendor_email;
  const partyPhone = isInvoice ? document?.buyer_phone : document?.vendor_phone;
  const docDate = isInvoice ? document?.issue_date : document?.order_date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{getDocumentTypeName()}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleExportExcel}>
                <Download className="h-4 w-4 mr-1" /> Excel
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !document ? (
          <div className="text-center py-12 text-muted-foreground">Document not found</div>
        ) : (
          <>
            {/* Status Control */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">Status:</span>
              <Select value={document.status} onValueChange={(val) => updateStatus(val as 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid' | 'cancelled')}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Printable Content */}
            <div ref={printRef} className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-primary">{getDocumentTypeName()}</h2>
                  <p className="text-lg font-semibold mt-1">{docNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    Date: {format(new Date(docDate), 'dd MMM yyyy')}
                  </p>
                  {isInvoice && document.due_date && (
                    <p className="text-sm text-muted-foreground">
                      Due: {format(new Date(document.due_date), 'dd MMM yyyy')}
                    </p>
                  )}
                  {!isInvoice && document.expected_delivery_date && (
                    <p className="text-sm text-muted-foreground">
                      Expected Delivery: {format(new Date(document.expected_delivery_date), 'dd MMM yyyy')}
                    </p>
                  )}
                  {document.reference_invoice_number && (
                    <p className="text-sm text-muted-foreground">
                      Reference: {document.reference_invoice_number}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {supplier?.company_logo_url && (
                    <img 
                      src={supplier.company_logo_url} 
                      alt="Company Logo" 
                      className="h-16 w-auto mb-2 ml-auto object-contain"
                    />
                  )}
                  <h3 className="font-bold">{supplier?.company_name || 'Your Company'}</h3>
                  {supplier?.address && <p className="text-sm">{supplier.address}</p>}
                  {supplier?.gstin && <p className="text-sm">GSTIN: {supplier.gstin}</p>}
                  {supplier?.phone && <p className="text-sm">Phone: {supplier.phone}</p>}
                  {supplier?.email && <p className="text-sm">{supplier.email}</p>}
                </div>
              </div>

              {/* Party Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                    {isInvoice ? 'Bill To:' : 'Vendor:'}
                  </h4>
                  <p className="font-bold">{partyName}</p>
                  {partyAddress && <p className="text-sm">{partyAddress}</p>}
                  {partyGstin && <p className="text-sm">GSTIN: {partyGstin}</p>}
                  {partyPhone && <p className="text-sm">Phone: {partyPhone}</p>}
                  {partyEmail && <p className="text-sm">{partyEmail}</p>}
                </div>
                {!isInvoice && document.delivery_address && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Ship To:</h4>
                    <p className="text-sm">{document.delivery_address}</p>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left text-sm">#</th>
                    <th className="border p-2 text-left text-sm">Description</th>
                    <th className="border p-2 text-left text-sm">HSN</th>
                    <th className="border p-2 text-right text-sm">Qty</th>
                    <th className="border p-2 text-right text-sm">Rate</th>
                    <th className="border p-2 text-right text-sm">GST %</th>
                    <th className="border p-2 text-right text-sm">GST Amt</th>
                    <th className="border p-2 text-right text-sm">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="border p-2 text-sm">{idx + 1}</td>
                      <td className="border p-2 text-sm">{item.description}</td>
                      <td className="border p-2 text-sm">{item.hsn_code || '-'}</td>
                      <td className="border p-2 text-right text-sm">
                        {Number(item.quantity)} {item.unit}
                      </td>
                      <td className="border p-2 text-right text-sm">₹{Number(item.unit_price).toLocaleString()}</td>
                      <td className="border p-2 text-right text-sm">{Number(item.tax_rate)}%</td>
                      <td className="border p-2 text-right text-sm">₹{Number(item.tax_amount).toLocaleString()}</td>
                      <td className="border p-2 text-right text-sm font-medium">₹{Number(item.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{Number(document.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST:</span>
                    <span>₹{Number(document.tax_amount).toLocaleString()}</span>
                  </div>
                  {Number(document.discount_percent) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({document.discount_percent}%):</span>
                      <span>-₹{Number(document.discount_amount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>₹{Number(document.total_amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Bank Details (Invoice only) */}
              {isInvoice && document.bank_details && (() => {
                try {
                  const bank = JSON.parse(document.bank_details);
                  return (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-sm mb-2">Bank Details:</h4>
                      <div className="text-sm grid grid-cols-2 gap-2">
                        <div><span className="text-muted-foreground">Bank Name:</span> {bank.bankName}</div>
                        <div><span className="text-muted-foreground">A/C No:</span> {bank.bankAccount}</div>
                        <div><span className="text-muted-foreground">IFSC:</span> {bank.bankIfsc}</div>
                        <div><span className="text-muted-foreground">Branch:</span> {bank.bankLocation}</div>
                      </div>
                    </div>
                  );
                } catch {
                  return (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-sm mb-1">Bank Details:</h4>
                      <p className="text-sm whitespace-pre-wrap">{document.bank_details}</p>
                    </div>
                  );
                }
              })()}

              {/* Notes & Terms */}
              <div className="grid grid-cols-2 gap-6 text-sm">
                {document.notes && (
                  <div>
                    <h4 className="font-semibold mb-1">
                      {document.document_type === 'debit_note' || document.document_type === 'credit_note' ? 'Reason:' : 'Notes:'}
                    </h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{document.notes}</p>
                  </div>
                )}
                {document.terms_and_conditions && (
                  <div>
                    <h4 className="font-semibold mb-1">Terms & Conditions:</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{document.terms_and_conditions}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
