import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Download, Plus, Trash2, FileText, Upload, Printer, ArrowLeft } from 'lucide-react';
import { generateDocumentPDF } from '@/lib/pdfGenerator';
import { Link } from 'react-router-dom';

interface DocumentItem {
  description: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
}

const GST_RATES = [0, 5, 12, 18, 28];
const UNIT_OPTIONS = ['units', 'kg', 'g', 'ton', 'mt', 'quintal', 'ltr', 'ml', 'pcs', 'box', 'carton', 'bag', 'roll', 'mtr', 'sqft', 'sqm', 'dozen', 'pair', 'set'];

type DocumentType = 'tax_invoice' | 'proforma_invoice' | 'purchase_order' | 'debit_note' | 'credit_note';

const documentTypeLabels: Record<DocumentType, string> = {
  tax_invoice: 'Tax Invoice',
  proforma_invoice: 'Proforma Invoice',
  purchase_order: 'Purchase Order',
  debit_note: 'Debit Note',
  credit_note: 'Credit Note',
};

const InvoiceGenerator = () => {
  const { toast } = useToast();
  const [documentType, setDocumentType] = useState<DocumentType>('tax_invoice');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Company details
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyGstin, setCompanyGstin] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyState, setCompanyState] = useState('');

  // Buyer/Vendor details
  const [buyerName, setBuyerName] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerGstin, setBuyerGstin] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerCity, setBuyerCity] = useState('');
  const [buyerState, setBuyerState] = useState('');

  // Document details
  const [documentNumber, setDocumentNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [referenceDate, setReferenceDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [reason, setReason] = useState('');

  // Items
  const [items, setItems] = useState<DocumentItem[]>([
    { description: '', hsn_code: '', quantity: 1, unit: 'units', unit_price: 0, tax_rate: 18, tax_amount: 0, total: 0 },
  ]);

  // Additional
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankLocation, setBankLocation] = useState('');

  // Generate document number on type change
  useEffect(() => {
    const prefix = documentType === 'tax_invoice' ? 'INV' : 
                   documentType === 'proforma_invoice' ? 'PI' :
                   documentType === 'purchase_order' ? 'PO' :
                   documentType === 'debit_note' ? 'DN' : 'CN';
    const timestamp = Date.now().toString().slice(-6);
    setDocumentNumber(`${prefix}-${timestamp}`);
  }, [documentType]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast({ title: 'Error', description: 'Logo size should be less than 1MB', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateItem = (index: number, field: keyof DocumentItem, value: any) => {
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

  const handleDownload = () => {
    const { subtotal, taxAmount, discountAmount, total } = calculateTotals();

    if (!companyName.trim()) {
      toast({ title: 'Error', description: 'Please enter your company name', variant: 'destructive' });
      return;
    }

    if (!buyerName.trim()) {
      toast({ title: 'Error', description: 'Please enter buyer/vendor name', variant: 'destructive' });
      return;
    }

    if (items.some((item) => !item.description.trim())) {
      toast({ title: 'Error', description: 'All items must have a description', variant: 'destructive' });
      return;
    }

    const fullCompanyAddress = [companyAddress, companyCity, companyState].filter(Boolean).join(', ');
    const fullBuyerAddress = [buyerAddress, buyerCity, buyerState].filter(Boolean).join(', ');

    generateDocumentPDF({
      documentType,
      documentNumber,
      issueDate,
      dueDate: dueDate || undefined,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      referenceInvoiceNumber: referenceNumber || undefined,
      referenceInvoiceDate: referenceDate || undefined,
      companyName,
      companyAddress: fullCompanyAddress,
      companyGstin,
      companyLogo: logoPreview,
      buyerName,
      buyerAddress: fullBuyerAddress,
      buyerGstin,
      buyerEmail,
      buyerPhone,
      items,
      subtotal,
      discountPercent: discountPercent > 0 ? discountPercent : undefined,
      discountAmount: discountPercent > 0 ? discountAmount : undefined,
      taxAmount,
      totalAmount: total,
      notes,
      terms,
      reason: reason || undefined,
      deliveryAddress: deliveryAddress || undefined,
      bankDetails: bankName ? { bankName, bankAccount, bankIfsc, bankLocation } : undefined,
    });

    toast({ title: 'Success', description: 'Document downloaded successfully!' });
  };

  const handlePrint = () => {
    handleDownload();
  };

  const { subtotal, taxAmount, discountAmount, total } = calculateTotals();

  const isPurchaseOrder = documentType === 'purchase_order';
  const isNote = documentType === 'debit_note' || documentType === 'credit_note';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Free GST Invoice Generator</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Type Selection */}
            <Card>
              <CardContent className="pt-4">
                <Tabs value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
                  <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="tax_invoice" className="text-xs sm:text-sm">Tax Invoice</TabsTrigger>
                    <TabsTrigger value="proforma_invoice" className="text-xs sm:text-sm">Proforma</TabsTrigger>
                    <TabsTrigger value="purchase_order" className="text-xs sm:text-sm">Purchase Order</TabsTrigger>
                    <TabsTrigger value="debit_note" className="text-xs sm:text-sm">Debit Note</TabsTrigger>
                    <TabsTrigger value="credit_note" className="text-xs sm:text-sm">Credit Note</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* Logo and Company Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Your Company</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                      ) : (
                        <div className="text-center text-muted-foreground text-xs">
                          <Upload className="h-6 w-6 mx-auto mb-1" />
                          Upload Logo
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                    <p className="text-xs text-muted-foreground mt-1 text-center">Max 1MB</p>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">Company Name *</Label>
                      <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your Company Name" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">GSTIN</Label>
                      <Input value={companyGstin} onChange={(e) => setCompanyGstin(e.target.value)} placeholder="22AAAAA0000A1Z5" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-3">
                    <Label className="text-xs">Address</Label>
                    <Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Street Address" />
                  </div>
                  <div>
                    <Label className="text-xs">City</Label>
                    <Input value={companyCity} onChange={(e) => setCompanyCity(e.target.value)} placeholder="City" />
                  </div>
                  <div>
                    <Label className="text-xs">State</Label>
                    <Input value={companyState} onChange={(e) => setCompanyState(e.target.value)} placeholder="State" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buyer/Vendor Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{isPurchaseOrder ? 'Vendor Details' : 'Bill To'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 md:col-span-1">
                    <Label className="text-xs">{isPurchaseOrder ? 'Vendor Name *' : 'Client Name *'}</Label>
                    <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Company/Person Name" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <Label className="text-xs">GSTIN</Label>
                    <Input value={buyerGstin} onChange={(e) => setBuyerGstin(e.target.value)} placeholder="22AAAAA0000A1Z5" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-3">
                    <Label className="text-xs">Address</Label>
                    <Input value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} placeholder="Street Address" />
                  </div>
                  <div>
                    <Label className="text-xs">City</Label>
                    <Input value={buyerCity} onChange={(e) => setBuyerCity(e.target.value)} placeholder="City" />
                  </div>
                  <div>
                    <Label className="text-xs">State</Label>
                    <Input value={buyerState} onChange={(e) => setBuyerState(e.target.value)} placeholder="State" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="email@company.com" />
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="+91 9876543210" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Document Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">{documentTypeLabels[documentType]} No.</Label>
                    <Input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">{isPurchaseOrder ? 'Order Date' : 'Invoice Date'}</Label>
                    <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                  </div>
                  {!isNote && (
                    <div>
                      <Label className="text-xs">{isPurchaseOrder ? 'Expected Delivery' : 'Due Date'}</Label>
                      <Input 
                        type="date" 
                        value={isPurchaseOrder ? expectedDeliveryDate : dueDate} 
                        onChange={(e) => isPurchaseOrder ? setExpectedDeliveryDate(e.target.value) : setDueDate(e.target.value)} 
                      />
                    </div>
                  )}
                  {isNote && (
                    <>
                      <div>
                        <Label className="text-xs">Reference Invoice No.</Label>
                        <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="INV-123" />
                      </div>
                      <div>
                        <Label className="text-xs">Reference Date</Label>
                        <Input type="date" value={referenceDate} onChange={(e) => setReferenceDate(e.target.value)} />
                      </div>
                    </>
                  )}
                </div>
                {isPurchaseOrder && (
                  <div>
                    <Label className="text-xs">Delivery Address</Label>
                    <Textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} rows={2} placeholder="Delivery location" />
                  </div>
                )}
                {isNote && (
                  <div>
                    <Label className="text-xs">Reason for {documentType === 'debit_note' ? 'Debit Note' : 'Credit Note'}</Label>
                    <Textarea 
                      value={reason} 
                      onChange={(e) => setReason(e.target.value)} 
                      rows={2} 
                      placeholder={documentType === 'debit_note' ? 'Additional charges, price adjustment...' : 'Sales return, price reduction...'}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Items</CardTitle>
                  <Button size="sm" variant="outline" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        <Label className="text-xs">HSN/SAC</Label>
                        <Input
                          value={item.hsn_code}
                          onChange={(e) => updateItem(index, 'hsn_code', e.target.value)}
                          placeholder="Code"
                        />
                      </div>
                      {items.length > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="mt-5 text-destructive hover:text-destructive"
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
                          step="any"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit</Label>
                        <Select value={item.unit} onValueChange={(val) => updateItem(index, 'unit', val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map((unit) => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Rate (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">GST %</Label>
                        <Select value={String(item.tax_rate)} onValueChange={(val) => updateItem(index, 'tax_rate', parseInt(val))}>
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
                        <Label className="text-xs">Total</Label>
                        <Input value={`₹${item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} disabled className="font-medium" />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Discount %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional notes for the customer" />
                  </div>
                  <div>
                    <Label className="text-xs">Terms & Conditions</Label>
                    <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={2} placeholder="Payment terms, warranty, etc." />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Details */}
            {!isPurchaseOrder && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Bank Details (for payment)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Bank Name</Label>
                      <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="HDFC Bank" />
                    </div>
                    <div>
                      <Label className="text-xs">Account Number</Label>
                      <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="1234567890123" />
                    </div>
                    <div>
                      <Label className="text-xs">IFSC Code</Label>
                      <Input value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} placeholder="HDFC0001234" />
                    </div>
                    <div>
                      <Label className="text-xs">Branch Location</Label>
                      <Input value={bankLocation} onChange={(e) => setBankLocation(e.target.value)} placeholder="Mumbai Main Branch" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({discountPercent}%):</span>
                      <span>-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST:</span>
                    <span>₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-primary">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5">
                <CardContent className="pt-4">
                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">Download your {documentTypeLabels[documentType]}</p>
                    <Button onClick={handleDownload} className="w-full" size="lg">
                      <Download className="h-4 w-4 mr-2" /> Download PDF
                    </Button>
                    <Button variant="outline" onClick={handlePrint} className="w-full">
                      <Printer className="h-4 w-4 mr-2" /> Print
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center text-xs text-muted-foreground p-4">
                <p>Create professional invoices for free with Procuresaathi's GST Invoice Generator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
