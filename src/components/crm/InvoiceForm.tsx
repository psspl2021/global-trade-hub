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
import { Loader2, Plus, Trash2, Save, UserPlus } from 'lucide-react';
import { CompanyLogoUpload } from './CompanyLogoUpload';
import { SupplierCustomerForm } from './SupplierCustomerForm';

interface InvoiceItem {
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

interface Customer {
  id: string;
  customer_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  gstin: string | null;
}

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  documentType: 'proforma_invoice' | 'tax_invoice';
  editId?: string | null;
  onSuccess: () => void;
}

const GST_RATES = [0, 5, 12, 18, 28];
const UNIT_OPTIONS = ['units', 'kg', 'g', 'ton', 'mt', 'quintal', 'ltr', 'ml', 'pcs', 'box', 'carton', 'bag', 'roll', 'mtr', 'sqft', 'sqm', 'dozen', 'pair', 'set'];

export const InvoiceForm = ({
  open,
  onOpenChange,
  userId,
  documentType,
  editId,
  onSuccess,
}: InvoiceFormProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const { toast } = useToast();

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerGstin, setBuyerGstin] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankLocation, setBankLocation] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', hsn_code: '', quantity: 1, unit: 'units', unit_price: 0, tax_rate: 18, tax_amount: 0, total: 0 },
  ]);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyGstin, setCompanyGstin] = useState('');
  const [savedBankDetails, setSavedBankDetails] = useState<{bankName: string; bankAccount: string; bankIfsc: string; bankLocation: string; label: string;}[]>([]);
  const [savedTerms, setSavedTerms] = useState<string[]>([]);

  useEffect(() => {
    // Fetch current logo and saved bank details/terms
    const fetchData = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_logo_url, company_name, address, gstin')
        .eq('id', userId)
        .maybeSingle();
      setCurrentLogoUrl(profileData?.company_logo_url || null);
      setCompanyName(profileData?.company_name || '');
      setCompanyAddress(profileData?.address || '');
      setCompanyGstin(profileData?.gstin || '');

      // Fetch unique saved bank details
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('bank_details, terms_and_conditions')
        .eq('supplier_id', userId)
        .not('bank_details', 'is', null);

      if (invoicesData) {
        const uniqueTerms = [...new Set(invoicesData.map(i => i.terms_and_conditions).filter(Boolean))] as string[];
        setSavedTerms(uniqueTerms);
        
        // Parse bank details JSON and deduplicate
        const parsedBankDetails: {bankName: string; bankAccount: string; bankIfsc: string; bankLocation: string; label: string;}[] = [];
        const seenAccounts = new Set<string>();
        invoicesData.forEach(i => {
          if (i.bank_details) {
            try {
              const parsed = JSON.parse(i.bank_details);
              if (parsed.bankAccount && !seenAccounts.has(parsed.bankAccount)) {
                seenAccounts.add(parsed.bankAccount);
                parsedBankDetails.push({
                  ...parsed,
                  label: `${parsed.bankName} - ${parsed.bankAccount}`
                });
              }
            } catch {
              // Legacy format - skip
            }
          }
        });
        setSavedBankDetails(parsedBankDetails);
      }
    };
    if (open) {
      fetchData();
      fetchCustomers();
    }
  }, [open, userId]);

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from('supplier_customers')
      .select('id, customer_name, company_name, email, phone, address, gstin')
      .eq('supplier_id', userId)
      .order('customer_name');
    setCustomers(data || []);
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

  useEffect(() => {
    if (open && !editId) {
      generateInvoiceNumber();
      resetForm();
    } else if (open && editId) {
      loadInvoice(editId);
    }
  }, [open, editId]);

  const generateInvoiceNumber = () => {
    const prefix = documentType === 'proforma_invoice' ? 'PI' : 'INV';
    const timestamp = Date.now().toString().slice(-6);
    setInvoiceNumber(`${prefix}-${timestamp}`);
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setBuyerName('');
    setBuyerAddress('');
    setBuyerGstin('');
    setBuyerEmail('');
    setBuyerPhone('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setNotes('');
    setTerms('');
    setBankName('');
    setBankAccount('');
    setBankIfsc('');
    setBankLocation('');
    setDiscountPercent(0);
    setItems([{ description: '', hsn_code: '', quantity: 1, unit: 'units', unit_price: 0, tax_rate: 18, tax_amount: 0, total: 0 }]);
  };

  const loadInvoice = async (id: string) => {
    setLoading(true);
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !invoice) {
      toast({ title: 'Error', description: 'Failed to load invoice', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { data: invoiceItems } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id);

    setInvoiceNumber(invoice.invoice_number);
    setBuyerName(invoice.buyer_name);
    setBuyerAddress(invoice.buyer_address || '');
    setBuyerGstin(invoice.buyer_gstin || '');
    setBuyerEmail(invoice.buyer_email || '');
    setBuyerPhone(invoice.buyer_phone || '');
    setIssueDate(invoice.issue_date);
    setDueDate(invoice.due_date || '');
    setNotes(invoice.notes || '');
    setTerms(invoice.terms_and_conditions || '');
    // Parse bank details from JSON
    if (invoice.bank_details) {
      try {
        const parsed = JSON.parse(invoice.bank_details);
        setBankName(parsed.bankName || '');
        setBankAccount(parsed.bankAccount || '');
        setBankIfsc(parsed.bankIfsc || '');
        setBankLocation(parsed.bankLocation || '');
      } catch {
        // Legacy format - clear fields
        setBankName('');
        setBankAccount('');
        setBankIfsc('');
        setBankLocation('');
      }
    } else {
      setBankName('');
      setBankAccount('');
      setBankIfsc('');
      setBankLocation('');
    }
    setDiscountPercent(Number(invoice.discount_percent) || 0);
    setItems(
      invoiceItems?.map((item) => ({
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

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate totals
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
    if (!buyerName.trim()) {
      toast({ title: 'Error', description: 'Buyer name is required', variant: 'destructive' });
      return;
    }

    if (!buyerGstin.trim()) {
      toast({ title: 'Error', description: 'Buyer GSTIN is required', variant: 'destructive' });
      return;
    }

    if (items.some((item) => !item.description.trim())) {
      toast({ title: 'Error', description: 'All items must have a description', variant: 'destructive' });
      return;
    }

    if (items.some((item) => !item.hsn_code.trim())) {
      toast({ title: 'Error', description: 'All items must have an HSN code', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { subtotal, taxAmount, discountAmount, total } = calculateTotals();

    try {
      if (editId) {
        // Update existing invoice
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            invoice_number: invoiceNumber,
            buyer_name: buyerName,
            buyer_address: buyerAddress || null,
            buyer_gstin: buyerGstin || null,
            buyer_email: buyerEmail || null,
            buyer_phone: buyerPhone || null,
            issue_date: issueDate,
            due_date: dueDate || null,
            subtotal,
            tax_amount: taxAmount,
            discount_percent: discountPercent,
            discount_amount: discountAmount,
            total_amount: total,
            notes: notes || null,
            terms_and_conditions: terms || null,
            bank_details: JSON.stringify({ bankName, bankAccount, bankIfsc, bankLocation }) || null,
          })
          .eq('id', editId);

        if (updateError) throw updateError;

        // Delete existing items and re-insert
        await supabase.from('invoice_items').delete().eq('invoice_id', editId);

        const itemsToInsert = items.map((item) => ({
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

        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      } else {
        // Create new invoice
        const { data: newInvoice, error: insertError } = await supabase
          .from('invoices')
          .insert({
            invoice_number: invoiceNumber,
            supplier_id: userId,
            buyer_name: buyerName,
            buyer_address: buyerAddress || null,
            buyer_gstin: buyerGstin || null,
            buyer_email: buyerEmail || null,
            buyer_phone: buyerPhone || null,
            document_type: documentType,
            issue_date: issueDate,
            due_date: dueDate || null,
            subtotal,
            tax_amount: taxAmount,
            discount_percent: discountPercent,
            discount_amount: discountAmount,
            total_amount: total,
            notes: notes || null,
            terms_and_conditions: terms || null,
            bank_details: JSON.stringify({ bankName, bankAccount, bankIfsc, bankLocation }) || null,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;

        const itemsToInsert = items.map((item) => ({
          invoice_id: newInvoice.id,
          description: item.description,
          hsn_code: item.hsn_code || null,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          total: item.total,
        }));

        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      toast({ title: 'Success', description: editId ? 'Invoice updated' : 'Invoice created' });
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
          <DialogTitle>
            {editId ? 'Edit' : 'Create'} {documentType === 'proforma_invoice' ? 'Proforma Invoice' : 'Tax Invoice'}
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
              currentLogoUrl={currentLogoUrl}
              onLogoChange={setCurrentLogoUrl}
            />

            {/* Supplier Company Details */}
            <Card>
              <CardContent className="pt-4 space-y-4">
                <h3 className="font-semibold">Your Company Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company name" />
                  </div>
                  <div>
                    <Label>Company GSTIN</Label>
                    <Input value={companyGstin} onChange={(e) => setCompanyGstin(e.target.value)} placeholder="Your GSTIN" />
                  </div>
                  <div className="md:col-span-1">
                    <Label>Company Address</Label>
                    <Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Your company address" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Invoice Number</Label>
                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </div>
              <div>
                <Label>Issue Date</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
            </div>

            {/* Buyer Details */}
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Buyer Details</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomerForm(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" /> New Customer
                  </Button>
                </div>
                
                {/* Customer Selection */}
                <div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Company/Customer name" />
                  </div>
                  <div>
                    <Label>GSTIN *</Label>
                    <Input value={buyerGstin} onChange={(e) => setBuyerGstin(e.target.value)} placeholder="22AAAAA0000A1Z5" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Address</Label>
                    <Textarea value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} rows={2} />
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
                        <div className="w-28">
                          <Label className="text-xs">HSN Code *</Label>
                          <Input
                            value={item.hsn_code}
                            onChange={(e) => updateItem(index, 'hsn_code', e.target.value)}
                            placeholder="Required"
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
                          <Label className="text-xs">Unit *</Label>
                          <Select
                            value={item.unit}
                            onValueChange={(val) => updateItem(index, 'unit', val)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIT_OPTIONS.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                {savedTerms.length > 0 && (
                  <Select onValueChange={(val) => setTerms(val)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select from saved..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {savedTerms.map((t, idx) => (
                        <SelectItem key={idx} value={t}>
                          {t.length > 50 ? t.substring(0, 50) + '...' : t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={2} placeholder="Or type new terms..." />
              </div>
            </div>

            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Bank Details (for payment)</h3>
                  {savedBankDetails.length > 0 && (
                    <Select onValueChange={(val) => {
                      const selected = savedBankDetails.find(b => b.bankAccount === val);
                      if (selected) {
                        setBankName(selected.bankName);
                        setBankAccount(selected.bankAccount);
                        setBankIfsc(selected.bankIfsc);
                        setBankLocation(selected.bankLocation);
                      }
                    }}>
                      <SelectTrigger className="w-[200px] bg-background">
                        <SelectValue placeholder="Select from saved..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {savedBankDetails.map((b, idx) => (
                          <SelectItem key={idx} value={b.bankAccount}>
                            {b.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Bank Name</Label>
                    <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g., HDFC Bank" />
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="e.g., 1234567890123" />
                  </div>
                  <div>
                    <Label>IFSC Code</Label>
                    <Input value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} placeholder="e.g., HDFC0001234" />
                  </div>
                  <div>
                    <Label>Branch Location</Label>
                    <Input value={bankLocation} onChange={(e) => setBankLocation(e.target.value)} placeholder="e.g., Mumbai Main Branch" />
                  </div>
                </div>
              </CardContent>
            </Card>

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
                <Save className="h-4 w-4 mr-2" /> Save Invoice
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
