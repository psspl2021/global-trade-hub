/**
 * AuctionPOGenerator — Zero-storage PO: Preview → Confirm & Send
 * Industry-standard format (Tally/Vertex style), locked auction pricing
 */
import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Truck, IndianRupee, CheckCircle2, Package, Lock, Eye, Send, X, Printer, Calendar, Building2, User } from 'lucide-react';
import { calculatePOTotals, generatePONotes, POLineItem } from '@/hooks/useAuctionPO';
import { supabase } from '@/integrations/supabase/client';
import { ReverseAuction } from '@/hooks/useReverseAuction';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getTaxIdLabel } from '@/components/global/TaxIdField';

const TAX_OPTIONS = [
  { value: '0', label: '0% (Exempt)' },
  { value: '5', label: '5% GST' },
  { value: '12', label: '12% GST' },
  { value: '18', label: '18% GST' },
  { value: '28', label: '28% GST' },
  { value: 'custom', label: 'Custom' },
];

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
}

interface BuyerInfo {
  company_name: string;
  address: string;
  gst: string;
  contact: string;
  email: string;
  country?: string | null;
}

interface SupplierInfo {
  company_name: string;
  address: string;
  gst: string;
  contact: string;
  email: string;
  country?: string | null;
}


interface AuctionPOGeneratorProps {
  auction: ReverseAuction;
  winnerSupplierId: string;
  winningPrice: number;
  onPOCreated?: () => void;
}

export function AuctionPOGenerator({ auction, winnerSupplierId, winningPrice, onPOCreated }: AuctionPOGeneratorProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<POLineItem[]>([]);
  const [freight, setFreight] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [customNotes, setCustomNotes] = useState('');
  const [buyer, setBuyer] = useState<BuyerInfo>({ company_name: '', address: '', gst: '', contact: '', email: '' });
  const [supplier, setSupplier] = useState<SupplierInfo>({ company_name: '', address: '', gst: '', contact: '', email: '' });
  const printRef = useRef<HTMLDivElement>(null);

  const poNumber = useMemo(() => `PO-RA-${Date.now().toString(36).toUpperCase()}`, []);

  // Load auction items + buyer/supplier profiles
  useEffect(() => {
    async function load() {
      // Load SKUs
      const { data: auctionItems } = await supabase
        .from('reverse_auction_items')
        .select('*')
        .eq('auction_id', auction.id);

      if (auctionItems && auctionItems.length > 0) {
        // Distribute winning price proportionally across SKUs
        const startingTotal = auctionItems.reduce(
          (sum, item) => sum + (item.unit_price || 0) * item.quantity,
          0
        );

        setItems(auctionItems.map(item => {
          let derivedUnitPrice: number;
          if (startingTotal > 0 && winningPrice > 0) {
            // Proportional distribution: each SKU gets its share of the winning total
            const lineShare = ((item.unit_price || 0) * item.quantity) / startingTotal;
            const lineTotal = winningPrice * lineShare;
            derivedUnitPrice = lineTotal / item.quantity;
          } else {
            derivedUnitPrice = item.unit_price || 0;
          }
          return {
            item_id: item.id,
            description: item.product_name,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: derivedUnitPrice,
            tax_rate: 18,
          };
        }));
      } else {
        setItems([{
          item_id: auction.id,
          description: auction.title,
          quantity: auction.quantity,
          unit: auction.unit,
          unit_price: winningPrice / (auction.quantity || 1),
          tax_rate: 18,
        }]);
      }

      // Load buyer profile
      if (user?.id) {
        const { data: buyerProfile } = await supabase
          .from('profiles')
          .select('company_name, contact_person, phone, city, state, address, gstin, country')
          .eq('id', user.id)
          .single();
        if (buyerProfile) {
          setBuyer({
            company_name: buyerProfile.company_name || '',
            address: buyerProfile.address || [buyerProfile.city, buyerProfile.state].filter(Boolean).join(', '),
            gst: buyerProfile.gstin || '',
            contact: buyerProfile.contact_person || '',
            email: user.email || '',
            country: (buyerProfile as any).country || null,
          });
        }
      }

      // Load supplier profile — try profiles first, fallback to auction suppliers table
      const { data: supplierProfile } = await supabase
        .from('profiles')
        .select('company_name, contact_person, phone, city, state, email, address, gstin, country')
        .eq('id', winnerSupplierId)
        .single();

      // Also get supplier info from the auction suppliers table (has email + company)
      const { data: auctionSupplier } = await supabase
        .from('reverse_auction_suppliers')
        .select('supplier_email, supplier_company_name')
        .eq('auction_id', auction.id)
        .eq('supplier_id', winnerSupplierId)
        .single();

      setSupplier({
        company_name: supplierProfile?.company_name || auctionSupplier?.supplier_company_name || '',
        address: supplierProfile?.address || (supplierProfile ? [supplierProfile.city, supplierProfile.state].filter(Boolean).join(', ') : ''),
        gst: supplierProfile?.gstin || '',
        contact: supplierProfile?.contact_person || '',
        email: supplierProfile?.email || auctionSupplier?.supplier_email || '',
        country: (supplierProfile as any)?.country || null,
      });
    }
    load();
  }, [auction.id, winnerSupplierId, winningPrice, user]);

  const handleTaxChange = (index: number, value: string) => {
    if (value === 'custom') {
      const custom = prompt('Enter custom tax %');
      if (custom && !isNaN(Number(custom))) {
        setItems(prev => prev.map((item, i) =>
          i === index ? { ...item, tax_rate: Number(custom) } : item
        ));
      }
    } else {
      setItems(prev => prev.map((item, i) =>
        i === index ? { ...item, tax_rate: Number(value) } : item
      ));
    }
  };

  const totals = useMemo(() => {
    const base = calculatePOTotals(items, freight);
    return {
      ...base,
      otherCharges,
      grandTotal: base.grandTotal + otherCharges,
    };
  }, [items, freight, otherCharges]);

  const autoNotes = generatePONotes(items, auction.title);

  const handleConfirmAndSend = async () => {
    if (!user?.id) {
      toast.error('You must be signed in to send a Purchase Order');
      return;
    }
    setSending(true);
    try {
      const orderDate = new Date().toISOString().slice(0, 10);
      const expectedDeliveryDate = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      // 1) Upsert the PO row (auction_id is unique per active auction PO)
      const { data: insertedPO, error: poError } = await supabase
        .from('purchase_orders')
        .upsert(
          {
            po_number: poNumber,
            po_source: 'auction',
            po_status: 'sent',
            status: 'sent',
            auction_id: auction.id,
            supplier_id: winnerSupplierId,
            purchaser_id: user.id,
            created_by: user.id,
            vendor_name: supplier.company_name || 'Awarded Supplier',
            vendor_email: supplier.email || null,
            vendor_address: supplier.address || null,
            vendor_gstin: supplier.gst || null,
            vendor_phone: supplier.contact || null,
            currency: 'INR',
            subtotal: totals.subtotal,
            tax_amount: totals.taxTotal,
            discount_amount: 0,
            total_amount: totals.grandTotal,
            po_value: totals.grandTotal,
            order_date: orderDate,
            expected_delivery_date: expectedDeliveryDate,
            delivery_due_date: expectedDeliveryDate,
            terms_and_conditions: paymentTerms,
            notes: customNotes || autoNotes || null,
          },
          { onConflict: 'auction_id' }
        )
        .select('id')
        .single();

      if (poError) throw poError;
      const poId = insertedPO?.id;
      if (!poId) throw new Error('PO creation returned no id');

      // 2) Replace line items
      await supabase.from('po_items').delete().eq('po_id', poId);
      const itemsPayload = items.map((it) => ({
        po_id: poId,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: it.unit_price,
        tax_rate: it.tax_rate,
        tax_amount: (it.unit_price * it.quantity * it.tax_rate) / 100,
        total: it.unit_price * it.quantity * (1 + it.tax_rate / 100),
      }));
      if (itemsPayload.length > 0) {
        const { error: itemsError } = await supabase.from('po_items').insert(itemsPayload);
        if (itemsError) throw itemsError;
      }

      toast.success(`Purchase Order ${poNumber} submitted for approval (Manager → Head of Procurement)`);
      setSent(true);
      onPOCreated?.();
    } catch (err: any) {
      console.error('PO send error:', err);
      toast.error(err?.message || 'Failed to send Purchase Order');
    } finally {
      setSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (sent) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-6 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="font-semibold text-amber-800">Submitted for Approval</h3>
          <p className="text-sm text-amber-700">
            {poNumber} — {formatINR(totals.grandTotal)} pending Manager → Head of Procurement sign-off
          </p>
          <p className="text-xs text-amber-600/80">
            The supplier {supplier.company_name || ''} will receive the PO automatically once both approvers sign off.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Generate Purchase Order</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              Awarded to {supplier.company_name || 'Supplier'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SKU Table — Prices LOCKED */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Line Items (Price Locked from Auction)
            </Label>
            {items.map((item, idx) => (
              <div key={item.item_id} className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.description}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.quantity} {item.unit}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Unit Price</Label>
                    <div className="h-8 flex items-center px-3 bg-muted/50 rounded-lg border border-input text-sm font-medium text-foreground">
                      {formatINR(item.unit_price)}
                      <Lock className="w-3 h-3 ml-auto text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Tax Rate</Label>
                    <Select
                      value={TAX_OPTIONS.find(t => t.value === String(item.tax_rate)) ? String(item.tax_rate) : 'custom'}
                      onValueChange={v => handleTaxChange(idx, v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TAX_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  Line: {formatINR(item.unit_price * item.quantity)} + {formatINR((item.tax_rate / 100) * item.unit_price * item.quantity)} tax
                </div>
              </div>
            ))}
          </div>

          {/* Freight + Other */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="relative flex-1">
                <Label className="text-[10px] text-muted-foreground">Freight (₹)</Label>
                <Input
                  type="number"
                  value={freight || ''}
                  onChange={e => setFreight(Number(e.target.value) || 0)}
                  className="h-8 text-sm"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="relative flex-1">
                <Label className="text-[10px] text-muted-foreground">Other Charges (₹)</Label>
                <Input
                  type="number"
                  value={otherCharges || ''}
                  onChange={e => setOtherCharges(Number(e.target.value) || 0)}
                  className="h-8 text-sm"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Delivery + Payment Terms */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] text-muted-foreground">Delivery (days)</Label>
              <Input
                type="number"
                value={deliveryDays}
                onChange={e => setDeliveryDays(Number(e.target.value) || 7)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Payment Terms</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Advance">Advance</SelectItem>
                  <SelectItem value="Net 15">Net 15</SelectItem>
                  <SelectItem value="Net 30">Net 30</SelectItem>
                  <SelectItem value="Net 45">Net 45</SelectItem>
                  <SelectItem value="Net 60">Net 60</SelectItem>
                  <SelectItem value="Against Delivery">Against Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Notes */}
          <div>
            <Label className="text-[10px] text-muted-foreground">Additional Notes (optional)</Label>
            <Textarea
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value)}
              placeholder="Any special instructions..."
              className="text-sm h-16 resize-none"
            />
          </div>

          <Separator />

          {/* Totals Summary */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>{formatINR(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span><span>{formatINR(totals.taxTotal)}</span>
            </div>
            {freight > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Freight</span><span>{formatINR(freight)}</span>
              </div>
            )}
            {otherCharges > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Other Charges</span><span>{formatINR(otherCharges)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Grand Total</span>
              <span className="text-primary">{formatINR(totals.grandTotal)}</span>
            </div>
          </div>

          {/* Price Lock Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              Unit prices and quantities are locked from the auction award. Only tax rates, freight, and other charges can be adjusted.
            </p>
          </div>

          {/* Preview Button */}
          <Button
            onClick={() => setShowPreview(true)}
            disabled={items.length === 0 || totals.grandTotal <= 0}
            className="w-full gap-2"
            size="lg"
          >
            <Eye className="w-4 h-4" />
            Preview Purchase Order
          </Button>
        </CardContent>
      </Card>

      {/* ─── PO Preview Modal (Industry Standard / Print-Ready) ─── */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <div ref={printRef} className="bg-white text-foreground">
            {/* ─── HEADER ─── */}
            <div className="px-6 pt-6 pb-4 border-b border-border/60">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold tracking-tight">PURCHASE ORDER</h1>
                  <p className="text-xs text-muted-foreground mt-1">ProcureSaathi</p>
                </div>
                <div className="text-right text-sm space-y-0.5">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-muted-foreground">PO No:</span>
                    <span className="font-semibold">{poNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Date:</span>
                    <span>{format(new Date(), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-muted-foreground">Delivery:</span>
                    <span>{deliveryDays} days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── BUYER + SUPPLIER ─── */}
            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Buyer</span>
                </div>
                <p className="text-sm font-semibold">{buyer.company_name || 'Your Company'}</p>
                {buyer.address && <p className="text-xs text-muted-foreground">{buyer.address}</p>}
                {buyer.gst && <p className="text-xs text-muted-foreground">{getTaxIdLabel(buyer.country)}: {buyer.gst}</p>}
                {buyer.contact && <p className="text-xs text-muted-foreground">{buyer.contact}</p>}
              </div>
              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier</span>
                </div>
                <p className="text-sm font-semibold">{supplier.company_name || 'Supplier'}</p>
                {supplier.address && <p className="text-xs text-muted-foreground">{supplier.address}</p>}
                {supplier.gst && <p className="text-xs text-muted-foreground">{getTaxIdLabel(supplier.country)}: {supplier.gst}</p>}
                {supplier.contact && <p className="text-xs text-muted-foreground">{supplier.contact}</p>}
              </div>
            </div>

            {/* ─── LINE ITEMS TABLE ─── */}
            <div className="px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-center">GST %</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => {
                    const base = item.unit_price * item.quantity;
                    const tax = (item.tax_rate / 100) * base;
                    return (
                      <TableRow key={item.item_id}>
                        <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{item.description}</div>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {formatINR(item.unit_price)}
                          <Lock className="w-2.5 h-2.5 inline ml-1 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="text-center text-sm">{item.tax_rate}%</TableCell>
                        <TableCell className="text-right text-sm">{formatINR(tax)}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">{formatINR(base + tax)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* ─── TOTALS ─── */}
            <div className="px-6 py-4 flex justify-end">
              <div className="w-72 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatINR(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax Total</span>
                  <span>{formatINR(totals.taxTotal)}</span>
                </div>
                {freight > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Freight</span>
                    <span>{formatINR(freight)}</span>
                  </div>
                )}
                {otherCharges > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Other Charges</span>
                    <span>{formatINR(otherCharges)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatINR(totals.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* ─── TERMS ─── */}
            <div className="px-6 pb-4 border-t border-border/40 pt-4 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Terms & Conditions</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Delivery timeline: {deliveryDays} days from PO confirmation</p>
                <p>• Payment terms: {paymentTerms}</p>
                <p>• {autoNotes}</p>
                {customNotes && <p>• {customNotes}</p>}
              </div>
            </div>
          </div>

          {/* ─── ACTIONS (hidden on print) ─── */}
          <DialogFooter className="px-6 pb-6 pt-2 print:hidden gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(false)} className="gap-1.5">
              <X className="w-3.5 h-3.5" />
              Close
            </Button>
            <Button size="sm" onClick={handleConfirmAndSend} disabled={sending} className="gap-1.5">
              <Send className="w-3.5 h-3.5" />
              {sending ? 'Sending...' : 'Confirm & Send PO'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
