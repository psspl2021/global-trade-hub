/**
 * SupplierPOViewerDialog — Read-only PO preview + PDF download for the winning supplier.
 * Loads purchase_orders + po_items via RLS (auth.uid() = supplier_id) and reuses the
 * shared generateDocumentPDF helper for downloads.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Download, FileText, Calendar, Building2, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { generateDocumentPDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poId: string | null;
}

interface POData {
  id: string;
  po_number: string;
  vendor_name: string | null;
  vendor_address: string | null;
  vendor_gstin: string | null;
  vendor_email: string | null;
  vendor_phone: string | null;
  total_amount: number | null;
  subtotal: number | null;
  tax_amount: number | null;
  currency: string | null;
  order_date: string | null;
  expected_delivery_date: string | null;
  status: string;
  po_status: string | null;
  notes: string | null;
  terms_and_conditions: string | null;
  delivery_address: string | null;
  region_type: string | null;
}

interface POItem {
  id: string;
  description: string;
  hsn_code: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  tax_rate: number | null;
  tax_amount: number;
  total: number;
}

export function SupplierPOViewerDialog({ open, onOpenChange, poId }: Props) {
  const [loading, setLoading] = useState(false);
  const [po, setPO] = useState<POData | null>(null);
  const [items, setItems] = useState<POItem[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!open || !poId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: poRow }, { data: itemRows }] = await Promise.all([
        supabase
          .from('purchase_orders')
          .select(
            'id, po_number, vendor_name, vendor_address, vendor_gstin, vendor_email, vendor_phone, total_amount, subtotal, tax_amount, currency, order_date, expected_delivery_date, status, po_status, notes, terms_and_conditions, delivery_address, region_type'
          )
          .eq('id', poId)
          .maybeSingle(),
        supabase
          .from('po_items')
          .select('id, description, hsn_code, quantity, unit, unit_price, tax_rate, tax_amount, total')
          .eq('po_id', poId),
      ]);
      if (cancelled) return;
      setPO((poRow as POData) || null);
      setItems((itemRows as POItem[]) || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, poId]);

  const formatMoney = (amt: number | null | undefined) => {
    if (amt == null) return '—';
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: (po?.currency || 'INR').toUpperCase(),
        maximumFractionDigits: 2,
      }).format(amt);
    } catch {
      return `${po?.currency || ''} ${amt.toFixed(2)}`;
    }
  };

  const handleDownload = async () => {
    if (!po) return;
    setDownloading(true);
    try {
      await generateDocumentPDF({
        documentType: 'purchase_order',
        documentNumber: po.po_number,
        issueDate: po.order_date || new Date().toISOString(),
        expectedDeliveryDate: po.expected_delivery_date || undefined,

        // Buyer issuing the PO appears as "company" on the document
        companyName: po.vendor_name || 'Buyer',
        companyAddress: po.vendor_address || '',
        companyGstin: po.vendor_gstin || '',

        // Supplier is the recipient on a PO
        buyerName: 'Supplier (You)',
        buyerAddress: po.delivery_address || '',
        buyerGstin: '',
        buyerEmail: po.vendor_email || undefined,
        buyerPhone: po.vendor_phone || undefined,

        items: items.map((it) => ({
          description: it.description,
          hsn_code: it.hsn_code || undefined,
          quantity: it.quantity,
          unit: it.unit || 'unit',
          unit_price: it.unit_price,
          tax_rate: it.tax_rate || 0,
          tax_amount: it.tax_amount,
          total: it.total,
        })),

        subtotal: po.subtotal || 0,
        taxAmount: po.tax_amount || 0,
        totalAmount: po.total_amount || 0,

        notes: po.notes || undefined,
        terms: po.terms_and_conditions || undefined,
        deliveryAddress: po.delivery_address || undefined,
      });
      toast.success('Purchase Order downloaded');
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Purchase Order
            {po?.po_number && (
              <Badge variant="outline" className="ml-1 text-xs">{po.po_number}</Badge>
            )}
            {po?.region_type === 'global' && (
              <Badge className="bg-blue-600 text-white text-[10px]">Global</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading purchase order…
          </div>
        ) : !po ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            Purchase order not available.
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-border/60 p-3 space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Issued by</div>
                <div className="flex items-center gap-2 font-semibold">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  {po.vendor_name || 'Buyer'}
                </div>
                {po.vendor_address && <p className="text-xs text-muted-foreground">{po.vendor_address}</p>}
                {po.vendor_gstin && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Hash className="w-3 h-3" /> GSTIN: {po.vendor_gstin}
                  </p>
                )}
              </div>
              <div className="rounded-md border border-border/60 p-3 space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status & dates</div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize text-[10px]">
                    {po.po_status || po.status || 'draft'}
                  </Badge>
                </div>
                {po.order_date && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Issued: {format(new Date(po.order_date), 'dd MMM yyyy')}
                  </p>
                )}
                {po.expected_delivery_date && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Expected delivery: {format(new Date(po.expected_delivery_date), 'dd MMM yyyy')}
                  </p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="rounded-md border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit price</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-4">
                        No line items on this PO.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell className="text-sm">
                          <div className="font-medium">{it.description}</div>
                          {it.hsn_code && (
                            <div className="text-[10px] text-muted-foreground">HSN: {it.hsn_code}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {it.quantity} {it.unit || ''}
                        </TableCell>
                        <TableCell className="text-right text-sm">{formatMoney(it.unit_price)}</TableCell>
                        <TableCell className="text-right text-sm">
                          {formatMoney(it.tax_amount)}
                          {it.tax_rate ? <span className="text-[10px] text-muted-foreground"> ({it.tax_rate}%)</span> : null}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatMoney(it.total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatMoney(po.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatMoney(po.tax_amount)}</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-1.5 font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(po.total_amount)}</span>
                </div>
              </div>
            </div>

            {(po.notes || po.terms_and_conditions) && (
              <div className="text-xs text-muted-foreground space-y-1">
                {po.notes && <p><span className="font-medium text-foreground">Notes: </span>{po.notes}</p>}
                {po.terms_and_conditions && (
                  <p><span className="font-medium text-foreground">Terms: </span>{po.terms_and_conditions}</p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleDownload} disabled={!po || downloading} className="gap-1.5">
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SupplierPOViewerDialog;
