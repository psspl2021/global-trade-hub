import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, Save, UserPlus } from 'lucide-react';
import { CompanyLogoUpload } from './CompanyLogoUpload';
import { SupplierCustomerForm } from './SupplierCustomerForm';

interface NoteItem {
  description: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
}

interface Customer {
  id: string;
  customer_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  gstin: string | null;
}

interface DebitCreditNoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  noteType: 'debit_note' | 'credit_note';
  editId?: string | null;
  onSuccess: () => void;
}

const GST_RATES = [0, 5, 12, 18, 28];
const UNIT_OPTIONS = ['units', 'kg', 'tons', 'liters', 'meters', 'pieces', 'boxes', 'bags', 'rolls'];

export const DebitCreditNoteForm = ({
  open,
  onOpenChange,
  userId,
  noteType,
  editId,
  onSuccess,
}: DebitCreditNoteFormProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyGstin, setCompanyGstin] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const { toast } = useToast();

  // Form state
  const [noteNumber, setNoteNumber] = useState('');
  const [referenceInvoiceId, setReferenceInvoiceId] = useState('');
  const [referenceInvoiceNumber, setReferenceInvoiceNumber] = useState('');
  const [referenceInvoiceDate, setReferenceInvoiceDate] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerGstin, setBuyerGstin] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<NoteItem[]>([
    { description: '', hsn_code: '', quantity: 1, unit: 'units', unit_price: 0, tax_rate: 18, tax_amount: 0, total: 0 },
  ]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      fetchInvoices();
      fetchCompanyLogo();
      fetchCustomers();
      if (editId) {
        loadNote(editId);
      } else {
        resetForm();
        generateNoteNumber();
      }
    }
  }, [open, editId]);

  const fetchCompanyLogo = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('company_logo_url, company_name, address, gstin')
      .eq('id', userId)
      .single();
    if (data) {
      setCompanyLogo(data.company_logo_url);
      setCompanyName(data.company_name || '');
      setCompanyAddress(data.address || '');
      setCompanyGstin(data.gstin || '');
    }
  };

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from('supplier_customers')
      .select('id, customer_name, company_name, email, phone, address, gstin')
      .eq('supplier_id', userId)
      .order('customer_name');
    setCustomers(data || []);
  };

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_number, buyer_name, buyer_address, buyer_gstin, buyer_email, buyer_phone, total_amount')
      .eq('supplier_id', userId)
      .in('document_type', ['proforma_invoice', 'tax_invoice'])
      .order('created_at', { ascending: false });
    setInvoices(data || []);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomerId(customerId);
      setBuyerName(customer.customer_name);
      setBuyerAddress(customer.address || '');
      setBuyerGstin(customer.gstin || '');
      setBuyerEmail(customer.email || '');
      setBuyerPhone(customer.phone || '');
    }
  };

  const handleCustomerCreated = () => {
    fetchCustomers();
  };

  const generateNoteNumber = () => {
    const prefix = noteType === 'debit_note' ? 'DN' : 'CN';
    const timestamp = Date.now().toString(36).toUpperCase();
    setNoteNumber(`${prefix}-${timestamp}`);
  };

  const resetForm = () => {
    setNoteNumber('');
    setReferenceInvoiceId('');
    setReferenceInvoiceNumber('');
    setReferenceInvoiceDate('');
    setSelectedCustomerId('');
    setBuyerName('');
    setBuyerAddress('');
    setBuyerGstin('');
    setBuyerEmail('');
    setBuyerPhone('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setReason('');
    setItems([{ description: '', hsn_code: '', quantity: 1, unit: 'units', unit_price: 0, tax_rate: 18, tax_amount: 0, total: 0 }]);
    setNotes('');
  };

  const loadNote = async (id: string) => {
    setLoading(true);
    const { data: note } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    const { data: noteItems } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id);

    if (note) {
      setNoteNumber(note.invoice_number);
      setReferenceInvoiceId(note.reference_invoice_id || '');
      setReferenceInvoiceNumber(note.reference_invoice_number || '');
      setBuyerName(note.buyer_name);
      setBuyerAddress(note.buyer_address || '');
      setBuyerGstin(note.buyer_gstin || '');
      setBuyerEmail(note.buyer_email || '');
      setBuyerPhone(note.buyer_phone || '');
      setIssueDate(note.issue_date);
      setReason(note.notes || '');
      setNotes(note.terms_and_conditions || '');
    }

    if (noteItems && noteItems.length > 0) {
      setItems(noteItems.map((item) => ({
        description: item.description,
        hsn_code: item.hsn_code || '',
        quantity: Number(item.quantity),
        unit: item.unit || 'units',
        unit_price: Number(item.unit_price),
        tax_rate: Number(item.tax_rate) || 18,
        tax_amount: Number(item.tax_amount),
        total: Number(item.total),
      })));
    }

    setLoading(false);
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (invoice) {
      setReferenceInvoiceId(invoiceId);
      setReferenceInvoiceNumber(invoice.invoice_number);
      setBuyerName(invoice.buyer_name);
      setBuyerAddress(invoice.buyer_address || '');
      setBuyerGstin(invoice.buyer_gstin || '');
      setBuyerEmail(invoice.buyer_email || '');
      setBuyerPhone(invoice.buyer_phone || '');
    }
  };

  const updateItem = (index: number, field: keyof NoteItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate totals
    const qty = Number(newItems[index].quantity) || 0;
    const price = Number(newItems[index].unit_price) || 0;
    const taxRate = Number(newItems[index].tax_rate) || 0;
    const baseAmount = qty * price;
    const taxAmount = baseAmount * (taxRate / 100);
    newItems[index].tax_amount = taxAmount;
    newItems[index].total = baseAmount + taxAmount;

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', hsn_code: '', quantity: 1, unit: 'units', unit_price: 0, tax_rate: 18, tax_amount: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
    const taxAmount = items.reduce((sum, item) => sum + Number(item.tax_amount), 0);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async () => {
    if (!buyerName.trim()) {
      toast({ title: 'Error', description: 'Party name is required', variant: 'destructive' });
      return;
    }

    if (items.some((item) => !item.description.trim())) {
      toast({ title: 'Error', description: 'All items must have a description', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { subtotal, taxAmount, total } = calculateTotals();

    const noteData = {
      supplier_id: userId,
      document_type: noteType,
      invoice_number: noteNumber,
      reference_invoice_id: referenceInvoiceId || null,
      reference_invoice_number: referenceInvoiceNumber || null,
      buyer_name: buyerName,
      buyer_address: buyerAddress,
      buyer_gstin: buyerGstin,
      buyer_email: buyerEmail,
      buyer_phone: buyerPhone,
      issue_date: issueDate,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
      notes: reason,
      terms_and_conditions: notes,
      status: 'draft' as const,
    };

    try {
      if (editId) {
        // Update existing note
        const { error: updateError } = await supabase
          .from('invoices')
          .update(noteData)
          .eq('id', editId);

        if (updateError) throw updateError;

        // Delete existing items and re-insert
        await supabase.from('invoice_items').delete().eq('invoice_id', editId);

        const itemsData = items.map((item) => ({
          invoice_id: editId,
          description: item.description,
          hsn_code: item.hsn_code || null,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          total: item.total,
        }));

        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsData);
        if (itemsError) throw itemsError;

        toast({ title: 'Success', description: `${noteType === 'debit_note' ? 'Debit Note' : 'Credit Note'} updated` });
      } else {
        // Create new note
        const { data: newNote, error: insertError } = await supabase
          .from('invoices')
          .insert(noteData)
          .select()
          .single();

        if (insertError) throw insertError;

        const itemsData = items.map((item) => ({
          invoice_id: newNote.id,
          description: item.description,
          hsn_code: item.hsn_code || null,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          total: item.total,
        }));

        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsData);
        if (itemsError) throw itemsError;

        toast({ title: 'Success', description: `${noteType === 'debit_note' ? 'Debit Note' : 'Credit Note'} created` });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editId ? 'Edit' : 'Create'} {noteType === 'debit_note' ? 'Debit Note' : 'Credit Note'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Company Logo */}
            <CompanyLogoUpload 
              userId={userId} 
              currentLogoUrl={companyLogo}
              onLogoChange={setCompanyLogo}
            />

            {/* Supplier Company Details */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Company Name</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company name" />
              </div>
              <div>
                <Label>Company GSTIN</Label>
                <Input value={companyGstin} onChange={(e) => setCompanyGstin(e.target.value)} placeholder="Your GSTIN" />
              </div>
              <div>
                <Label>Company Address</Label>
                <Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Your company address" />
              </div>
            </div>

            {/* Note Number & Reference Invoice */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{noteType === 'debit_note' ? 'Debit Note' : 'Credit Note'} Number *</Label>
                <Input value={noteNumber} onChange={(e) => setNoteNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Reference Invoice (Optional)</Label>
                {invoices.length > 0 && (
                  <Select value={referenceInvoiceId} onValueChange={handleInvoiceSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select from existing invoices..." />
                    </SelectTrigger>
                    <SelectContent>
                      {invoices.map((inv) => (
                        <SelectItem key={inv.id} value={inv.id}>
                          {inv.invoice_number} - {inv.buyer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Input 
                  value={referenceInvoiceNumber} 
                  onChange={(e) => {
                    setReferenceInvoiceNumber(e.target.value);
                    setReferenceInvoiceId(''); // Clear selected ID when manually typing
                  }} 
                  placeholder="Or enter invoice number manually..."
                />
              </div>
              <div>
                <Label>Reference Invoice Date</Label>
                <Input 
                  type="date" 
                  value={referenceInvoiceDate} 
                  onChange={(e) => setReferenceInvoiceDate(e.target.value)} 
                />
              </div>
            </div>

            {/* Party Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label>Select Customer</Label>
                  <Select value={selectedCustomerId} onValueChange={handleCustomerSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.customer_name} {customer.company_name ? `(${customer.company_name})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-5"
                  onClick={() => setShowCustomerForm(true)}
                >
                  <UserPlus className="h-4 w-4 mr-1" /> New
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Party Name *</Label>
                  <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
                </div>
                <div>
                  <Label>GSTIN</Label>
                  <Input value={buyerGstin} onChange={(e) => setBuyerGstin(e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <Label>Address</Label>
              <Textarea value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} rows={2} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Email</Label>
                <Input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
              </div>
              <div>
                <Label>Issue Date *</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Reason for {noteType === 'debit_note' ? 'Debit Note' : 'Credit Note'}</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={noteType === 'debit_note' ? 'e.g., Additional charges, Price adjustment...' : 'e.g., Sales return, Price reduction...'}
                rows={2}
              />
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Line Items</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Item {index + 1}</span>
                      {items.length > 1 && (
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-2">
                        <Label className="text-xs">Description *</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">HSN Code</Label>
                        <Input
                          value={item.hsn_code}
                          onChange={(e) => updateItem(index, 'hsn_code', e.target.value)}
                          placeholder="HSN"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit</Label>
                        <Select value={item.unit} onValueChange={(val) => updateItem(index, 'unit', val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          min="0"
                          step="any"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Rate (₹)</Label>
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                          min="0"
                          step="any"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">GST %</Label>
                        <Select
                          value={String(item.tax_rate)}
                          onValueChange={(val) => updateItem(index, 'tax_rate', Number(val))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GST_RATES.map((rate) => (
                              <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">GST Amt</Label>
                        <Input value={`₹${item.tax_amount.toFixed(2)}`} disabled />
                      </div>
                      <div>
                        <Label className="text-xs">Total</Label>
                        <Input value={`₹${item.total.toFixed(2)}`} disabled className="font-medium" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST:</span>
                  <span>₹{taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Additional Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save {noteType === 'debit_note' ? 'Debit Note' : 'Credit Note'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Customer Form Modal */}
      <SupplierCustomerForm
        open={showCustomerForm}
        onOpenChange={setShowCustomerForm}
        userId={userId}
        onSuccess={handleCustomerCreated}
      />
    </Dialog>
  );
};
