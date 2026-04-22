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
  // Identity joins for accurate FROM/TO blocks
  buyer_company_id: string | null;
  supplier_id: string;
  created_by: string | null;
}

interface PartyInfo {
  name: string;
  contactPerson?: string;
  address: string;
  gstin: string;
  email: string;
  phone: string;
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

/** Indian fiscal year string for a given date: Apr 1 → Mar 31, formatted as "YYYY-YY". */
function indianFiscalYear(input: string | Date | null | undefined): string {
  const d = input ? new Date(input) : new Date();
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = d.getMonth(); // 0 = Jan
  const startYear = m >= 3 ? y : y - 1; // April (3) onwards
  const endYY = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYear}-${endYY}`;
}

/** Strip non-alphanumerics and take the trailing numeric portion to use as the PO sequence. */
function poSequenceFromNumber(poNumber: string): string {
  const digits = (poNumber.match(/\d+/g) || []).join('');
  const tail = digits.slice(-4) || (poNumber.replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase());
  return tail || poNumber;
}

function joinAddress(parts: Array<string | null | undefined>): string {
  return parts.filter((p) => !!(p && String(p).trim())).join(', ');
}

export function SupplierPOViewerDialog({ open, onOpenChange, poId }: Props) {
  const [loading, setLoading] = useState(false);
  const [po, setPO] = useState<POData | null>(null);
  const [items, setItems] = useState<POItem[]>([]);
  const [buyerParty, setBuyerParty] = useState<PartyInfo | null>(null);
  const [supplierParty, setSupplierParty] = useState<PartyInfo | null>(null);
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
            'id, po_number, vendor_name, vendor_address, vendor_gstin, vendor_email, vendor_phone, total_amount, subtotal, tax_amount, currency, order_date, expected_delivery_date, status, po_status, notes, terms_and_conditions, delivery_address, region_type, buyer_company_id, supplier_id, created_by'
          )
          .eq('id', poId)
          .maybeSingle(),
        supabase
          .from('po_items')
          .select('id, description, hsn_code, quantity, unit, unit_price, tax_rate, tax_amount, total')
          .eq('po_id', poId),
      ]);

      if (cancelled) return;

      const typed = (poRow as POData) || null;
      setPO(typed);
      setItems((itemRows as POItem[]) || []);

      // Resolve real buyer + supplier identities so the PDF header reflects who
      // is sending the PO and who is receiving it (the PO row's vendor_* fields
      // historically capture the supplier, not the buyer).
      if (typed) {
        const [buyerCompanyRes, buyerProfileRes, supplierProfileRes] = await Promise.all([
          typed.buyer_company_id
            ? supabase
                .from('buyer_companies')
                .select('company_name, address, city, state, country, gstin')
                .eq('id', typed.buyer_company_id)
                .maybeSingle()
            : Promise.resolve({ data: null } as any),
          typed.created_by
            ? supabase
                .from('profiles')
                .select('full_name, email, phone, company_name, address, city, state, country, gstin')
                .eq('id', typed.created_by)
                .maybeSingle()
            : Promise.resolve({ data: null } as any),
          supabase
            .from('profiles')
            .select('full_name, email, phone, company_name, address, city, state, country, gstin')
            .eq('id', typed.supplier_id)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        const bc: any = buyerCompanyRes?.data || {};
        const bp: any = buyerProfileRes?.data || {};
        setBuyerParty({
          name: bc.company_name || bp.company_name || 'Buyer',
          contactPerson: bp.full_name || '',
          address: joinAddress([bc.address || bp.address, bc.city || bp.city, bc.state || bp.state, bc.country || bp.country]),
          gstin: bc.gstin || bp.gstin || '',
          email: bp.email || '',
          phone: bp.phone || '',
        });

        const sp: any = supplierProfileRes?.data || {};
        setSupplierParty({
          name: sp.company_name || typed.vendor_name || 'Supplier',
          address: joinAddress([sp.address || typed.vendor_address, sp.city, sp.state, sp.country]) || '',
          gstin: sp.gstin || typed.vendor_gstin || '',
          email: sp.email || typed.vendor_email || '',
          phone: sp.phone || typed.vendor_phone || '',
        });
      } else {
        setBuyerParty(null);
        setSupplierParty(null);
      }

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

  // Derived: human-friendly PO number "<seq>/FY" (e.g. "99EH10/2026-27")
  const displayPoNumber = po
    ? `${poSequenceFromNumber(po.po_number)}/${indianFiscalYear(po.order_date)}`
    : '';

  const handleDownload = async () => {
    if (!po || !buyerParty || !supplierParty) return;
    setDownloading(true);
    try {
      const issueDate = po.order_date
        ? format(new Date(po.order_date), 'dd MMM yyyy')
        : format(new Date(), 'dd MMM yyyy');
      const deliveryDate = po.expected_delivery_date
        ? format(new Date(po.expected_delivery_date), 'dd MMM yyyy')
        : undefined;

      await generateDocumentPDF({
        documentType: 'purchase_order',
        documentNumber: displayPoNumber,
        issueDate,
        expectedDeliveryDate: deliveryDate,

        // Header (FROM): Buyer company — name, GSTIN, address. We pass `null`
        // for companyLogo so the shared PDF generator skips the platform logo
        // and the buyer's identity headlines the document instead.
        companyLogo: null as any,
        companyName: buyerParty.name,
        companyAddress: joinAddress([
          buyerParty.address,
          buyerParty.email ? `Email: ${buyerParty.email}` : '',
          buyerParty.phone ? `Phone: ${buyerParty.phone}` : '',
        ]),
        companyGstin: buyerParty.gstin,

        // Vendor block (TO): Supplier
        buyerName: supplierParty.name,
        buyerAddress: supplierParty.address,
        buyerGstin: supplierParty.gstin,
        buyerEmail: supplierParty.email || undefined,
        buyerPhone: supplierParty.phone || undefined,

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

        notes: po.notes
          ? `${po.notes}\n\nInternal Ref: ${po.po_number}`
          : `Internal Ref: ${po.po_number}`,
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
            {displayPoNumber && (
              <Badge variant="outline" className="ml-1 text-xs font-mono">{displayPoNumber}</Badge>
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
            {/* Status & dates strip */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <Badge variant="outline" className="capitalize text-[10px]">
                {po.po_status || po.status || 'draft'}
              </Badge>
              {po.order_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Issued: {format(new Date(po.order_date), 'dd MMM yyyy')}
                </span>
              )}
              {po.expected_delivery_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Expected delivery: {format(new Date(po.expected_delivery_date), 'dd MMM yyyy')}
                </span>
              )}
              <span className="ml-auto text-[10px] uppercase tracking-wide">Internal Ref: {po.po_number}</span>
            </div>

            {/* From / To parties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-border/60 p-3 space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From (Buyer)</div>
                <div className="flex items-center gap-2 font-semibold">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  {buyerParty?.name || '—'}
                </div>
                {buyerParty?.address && <p className="text-xs text-muted-foreground">{buyerParty.address}</p>}
                {buyerParty?.gstin && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Hash className="w-3 h-3" /> GSTIN: {buyerParty.gstin}
                  </p>
                )}
                {buyerParty?.email && (
                  <p className="text-xs text-muted-foreground">Email: {buyerParty.email}</p>
                )}
                {buyerParty?.phone && (
                  <p className="text-xs text-muted-foreground">Phone: {buyerParty.phone}</p>
                )}
              </div>
              <div className="rounded-md border border-border/60 p-3 space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To (Supplier — You)</div>
                <div className="flex items-center gap-2 font-semibold">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  {supplierParty?.name || '—'}
                </div>
                {supplierParty?.address && <p className="text-xs text-muted-foreground">{supplierParty.address}</p>}
                {supplierParty?.gstin && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Hash className="w-3 h-3" /> GSTIN: {supplierParty.gstin}
                  </p>
                )}
                {supplierParty?.email && (
                  <p className="text-xs text-muted-foreground">Email: {supplierParty.email}</p>
                )}
                {supplierParty?.phone && (
                  <p className="text-xs text-muted-foreground">Phone: {supplierParty.phone}</p>
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
