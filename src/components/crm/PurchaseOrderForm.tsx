import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';

interface POItem {
  id?: string;
  description: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
}

interface PurchaseOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  editId?: string | null;
  onSuccess: () => void;
}

const GST_RATES = [0, 5, 12, 18, 28];

export const PurchaseOrderForm = ({
  open,
  onOpenChange,
  userId,
  editId,
  onSuccess,
}: PurchaseOrderFormProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [poNumber, setPoNumber] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorGstin, setVendorGstin] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [items, setItems] = useState<POItem[]>([
    { description: '', hsn_code: '', quantity: 1, unit: 'units', unit_price: 0, tax_rate: 18, tax_amount: 0, total: 0 },
  ]);

  useEffect(() => {
    if (open && !editId) {
      generatePONumber();
      resetForm();
    } else if (open && editId) {
      loadPO(editId);
    }
  }, [open, editId]);

  const generatePONumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    setPoNumber(`PO-${timestamp}`);
  };

  const resetForm = () => {
    setVendorName('');
    setVendorAddress('');
    setVendorGstin('');
    setVendorEmail('');
    setVendorPhone('');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setExpectedDeliveryDate('');
    setDeliveryAddress('');
    setNotes('');
    setTerms('');
    setDiscountPercent(0);
    setItems([{ description: '', hsn_code: '', quantity: 1, unit: 'units', unit_price: 0, tax_rate: 18, tax_amount: 0, total: 0 }]);
  };

  const loadPO = async (id: string) => {
    setLoading(true);
    const { data: po, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !po) {
      toast({ title: 'Error', description: 'Failed to load purchase order', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { data: poItems } = await supabase
      .from('po_items')
      .select('*')
      .eq('po_id', id);

    setPoNumber(po.po_number);
    setVendorName(po.vendor_name);
    setVendorAddress(po.vendor_address || '');
    setVendorGstin(po.vendor_gstin || '');
    setVendorEmail(po.vendor_email || '');
    setVendorPhone(po.vendor_phone || '');
    setOrderDate(po.order_date);
    setExpectedDeliveryDate(po.expected_delivery_date || '');
    setDeliveryAddress(po.delivery_address || '');
    setNotes(po.notes || '');
    setTerms(po.terms_and_conditions || '');
    setDiscountPercent(Number(po.discount_percent) || 0);
    setItems(
      poItems?.map((item) => ({
        id: item.id,
        description: item.description,
        hsn_code: item.hsn_code || '',
        quantity: Number(item.quantity),
        unit: item.unit || 'units',
        unit_price: Number(item.unit_price),
        tax_rate: Number(item.tax_rate),
        tax_amount: Number(item.tax_amount),
        total: Number(item.total),
      })) || []
    );

    setLoading(false);
  };

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    const qty = updated[index].quantity || 0;
    const price = updated[index].unit_price || 0;
    const taxRate = updated[index].tax_rate || 0;
    const subtotal = qty * price;
    const taxAmount = (subtotal * taxRate) / 100;
    updated[index].tax_amount = taxAmount;
    updated[index].total = subtotal + taxAmount;

    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      { description: '', hsn_code: '', quantity: 1, unit: 'units', unit_price: 0, tax_rate: 18, tax_amount: 0, total: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxAmount = items.reduce((sum, item) => sum + item.tax_amount, 0);
    const discountAmount = (subtotal * discountPercent) / 100;
    const total = subtotal + taxAmount - discountAmount;
    return { subtotal, taxAmount, discountAmount, total };
  };

  const handleSubmit = async () => {
    if (!vendorName.trim()) {
      toast({ title: 'Error', description: 'Vendor name is required', variant: 'destructive' });
      return;
    }

    if (items.some((item) => !item.description.trim())) {
      toast({ title: 'Error', description: 'All items must have a description', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { subtotal, taxAmount, discountAmount, total } = calculateTotals();

    try {
      if (editId) {
        const { error: updateError } = await supabase
          .from('purchase_orders')
          .update({
            po_number: poNumber,
            vendor_name: vendorName,
            vendor_address: vendorAddress || null,
            vendor_gstin: vendorGstin || null,
            vendor_email: vendorEmail || null,
            vendor_phone: vendorPhone || null,
            order_date: orderDate,
            expected_delivery_date: expectedDeliveryDate || null,
            delivery_address: deliveryAddress || null,
            subtotal,
            tax_amount: taxAmount,
            discount_percent: discountPercent,
            discount_amount: discountAmount,
            total_amount: total,
            notes: notes || null,
            terms_and_conditions: terms || null,
          })
          .eq('id', editId);

        if (updateError) throw updateError;

        await supabase.from('po_items').delete().eq('po_id', editId);

        const itemsToInsert = items.map((item) => ({
          po_id: editId,
          description: item.description,
          hsn_code: item.hsn_code || null,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          total: item.total,
        }));

        const { error: itemsError } = await supabase.from('po_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      } else {
        const { data: newPO, error: insertError } = await supabase
          .from('purchase_orders')
          .insert({
            po_number: poNumber,
            supplier_id: userId,
            vendor_name: vendorName,
            vendor_address: vendorAddress || null,
            vendor_gstin: vendorGstin || null,
            vendor_email: vendorEmail || null,
            vendor_phone: vendorPhone || null,
            order_date: orderDate,
            expected_delivery_date: expectedDeliveryDate || null,
            delivery_address: deliveryAddress || null,
            subtotal,
            tax_amount: taxAmount,
            discount_percent: discountPercent,
            discount_amount: discountAmount,
            total_amount: total,
            notes: notes || null,
            terms_and_conditions: terms || null,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;

        const itemsToInsert = items.map((item) => ({
          po_id: newPO.id,
          description: item.description,
          hsn_code: item.hsn_code || null,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          total: item.total,
        }));

        const { error: itemsError } = await supabase.from('po_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      toast({ title: 'Success', description: editId ? 'Purchase order updated' : 'Purchase order created' });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }

    setSaving(false);
  };

  const { subtotal, taxAmount, discountAmount, total } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editId ? 'Edit' : 'Create'} Purchase Order</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* PO Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>PO Number</Label>
                <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
              </div>
              <div>
                <Label>Order Date</Label>
                <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
              </div>
            </div>

            {/* Vendor Details */}
            <Card>
              <CardContent className="pt-4 space-y-4">
                <h3 className="font-semibold">Vendor Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="Vendor/Supplier name" />
                  </div>
                  <div>
                    <Label>GSTIN</Label>
                    <Input value={vendorGstin} onChange={(e) => setVendorGstin(e.target.value)} placeholder="22AAAAA0000A1Z5" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={vendorEmail} onChange={(e) => setVendorEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={vendorPhone} onChange={(e) => setVendorPhone(e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Address</Label>
                    <Textarea value={vendorAddress} onChange={(e) => setVendorAddress(e.target.value)} rows={2} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Items</h3>
                  <Button size="sm" variant="outline" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Description *</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Product/Service name"
                          />
                        </div>
                        <div className="w-24">
                          <Label className="text-xs">HSN Code</Label>
                          <Input
                            value={item.hsn_code}
                            onChange={(e) => updateItem(index, 'hsn_code', e.target.value)}
                          />
                        </div>
                        {items.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="mt-5"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <div>
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Unit</Label>
                          <Input
                            value={item.unit}
                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Unit Price (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">GST %</Label>
                          <Select
                            value={String(item.tax_rate)}
                            onValueChange={(val) => updateItem(index, 'tax_rate', parseInt(val))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {GST_RATES.map((rate) => (
                                <SelectItem key={rate} value={String(rate)}>
                                  {rate}%
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Total</Label>
                          <Input value={`₹${item.total.toLocaleString()}`} disabled />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery & Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Expected Delivery Date</Label>
                <Input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
              </div>
              <div>
                <Label>Discount %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div>
              <Label>Delivery Address</Label>
              <Textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} rows={2} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Terms & Conditions</Label>
                <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={2} />
              </div>
            </div>

            {/* Totals */}
            <Card className="bg-muted">
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST:</span>
                  <span>₹{taxAmount.toLocaleString()}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({discountPercent}%):</span>
                    <span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" /> Save Purchase Order
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
