import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Loader2 } from 'lucide-react';

const GST_RATE_OPTIONS = [0, 5, 12, 18, 28] as const;

interface AdditionalCharge {
  id: string;
  description: string;
  amount: number;
}

interface BidFormInvoiceProps {
  productName: string;
  quantity: number;
  unit: string;
  onSubmit: (data: BidFormInvoiceData) => void;
  submitting: boolean;
  isEditing?: boolean;
  initialData?: Partial<BidFormInvoiceData>;
}

export interface BidFormInvoiceData {
  rate: number;
  hsnCode: string;
  gstRate: number;
  discountPercent: number;
  deliveryDays: number;
  additionalCharges: AdditionalCharge[];
  gstType: 'intra' | 'inter';
  termsAndConditions: string;
  taxableValue: number;
  totalGst: number;
  grandTotal: number;
}

export const BidFormInvoice = ({
  productName,
  quantity,
  unit,
  onSubmit,
  submitting,
  isEditing = false,
  initialData,
}: BidFormInvoiceProps) => {
  const [hsnCode, setHsnCode] = useState(initialData?.hsnCode || '');
  const [gstRate, setGstRate] = useState(initialData?.gstRate || 18);
  const [rate, setRate] = useState(initialData?.rate || 0);
  const [discountPercent, setDiscountPercent] = useState(initialData?.discountPercent || 0);
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>(
    initialData?.additionalCharges || []
  );
  const [gstType, setGstType] = useState<'intra' | 'inter'>(initialData?.gstType || 'inter');
  const [deliveryDays, setDeliveryDays] = useState(initialData?.deliveryDays || 7);
  const [termsAndConditions, setTermsAndConditions] = useState(initialData?.termsAndConditions || '');

  // Calculations
  const productAmount = rate * quantity;
  const discountAmount = productAmount * (discountPercent / 100);
  const productNetAmount = productAmount - discountAmount;
  const additionalChargesTotal = additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
  const taxableValue = productNetAmount + additionalChargesTotal;
  const gstAmount = taxableValue * (gstRate / 100);
  const grandTotal = taxableValue + gstAmount;
  const cgst = gstType === 'intra' ? gstAmount / 2 : 0;
  const sgst = gstType === 'intra' ? gstAmount / 2 : 0;
  const igst = gstType === 'inter' ? gstAmount : 0;

  const addCharge = () => {
    setAdditionalCharges([
      ...additionalCharges,
      { id: Date.now().toString(), description: '', amount: 0 },
    ]);
  };

  const removeCharge = (id: string) => {
    setAdditionalCharges(additionalCharges.filter((c) => c.id !== id));
  };

  const updateCharge = (id: string, field: 'description' | 'amount', value: string | number) => {
    setAdditionalCharges(
      additionalCharges.map((c) =>
        c.id === id ? { ...c, [field]: field === 'amount' ? Number(value) : value } : c
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rate <= 0 || deliveryDays <= 0) return;

    onSubmit({
      rate,
      hsnCode,
      gstRate,
      discountPercent,
      deliveryDays,
      additionalCharges,
      gstType,
      termsAndConditions,
      taxableValue,
      totalGst: gstAmount,
      grandTotal,
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-border rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-6 py-4">
        <h2 className="text-xl font-bold text-primary-foreground text-center">BID QUOTATION</h2>
      </div>

      <div className="p-6">
        {/* Delivery Timeline Row */}
        <div className="mb-6 flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
          <Label className="font-semibold text-foreground">Delivery Timeline:</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(Number(e.target.value))}
              className="w-20 h-9 text-center"
              min={1}
              required
            />
            <span className="text-muted-foreground">days</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-border rounded-lg overflow-hidden mb-6">
          {/* Table Header */}
          <div className="bg-muted/50 grid grid-cols-12 gap-2 p-3 text-sm font-semibold text-foreground border-b border-border">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-3">Item Details</div>
            <div className="col-span-1 text-center">HSN</div>
            <div className="col-span-1 text-center">GST</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-2 text-center">Rate (₹)</div>
            <div className="col-span-1 text-center">Disc %</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>

          {/* Table Row */}
          <div className="grid grid-cols-12 gap-2 p-3 items-center bg-white">
            <div className="col-span-1 text-center text-muted-foreground font-medium">1</div>
            
            <div className="col-span-3">
              <p className="font-medium text-foreground">{productName}</p>
            </div>
            
            <div className="col-span-1">
              <Input
                type="text"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                placeholder="HSN"
                className="h-9 text-center text-sm"
              />
            </div>
            
            <div className="col-span-1">
              <Select value={gstRate.toString()} onValueChange={(v) => setGstRate(Number(v))}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GST_RATE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r.toString()}>{r}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-1 text-center">
              <span className="font-medium">{quantity}</span>
              <span className="text-muted-foreground text-xs ml-1">{unit}</span>
            </div>
            
            <div className="col-span-2">
              <Input
                type="number"
                value={rate || ''}
                onChange={(e) => setRate(Number(e.target.value))}
                placeholder="0.00"
                className="h-9 text-right"
                min={0}
                step="0.01"
                required
              />
            </div>
            
            <div className="col-span-1">
              <Input
                type="number"
                value={discountPercent || ''}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                placeholder="0"
                className="h-9 text-center"
                min={0}
                max={100}
                step="0.1"
              />
            </div>
            
            <div className="col-span-2 text-right font-semibold text-foreground">
              ₹{formatCurrency(productNetAmount)}
            </div>
          </div>

          {/* Additional Charges */}
          {additionalCharges.map((charge, index) => (
            <div key={charge.id} className="grid grid-cols-12 gap-2 p-3 items-center bg-muted/20 border-t border-border">
              <div className="col-span-1 text-center">
                <button
                  type="button"
                  onClick={() => removeCharge(charge.id)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="col-span-6">
                <Input
                  type="text"
                  value={charge.description}
                  onChange={(e) => updateCharge(charge.id, 'description', e.target.value)}
                  placeholder="Additional charge description (e.g., Transport, Labour)"
                  className="h-9"
                />
              </div>
              
              <div className="col-span-3">
                <Input
                  type="number"
                  value={charge.amount || ''}
                  onChange={(e) => updateCharge(charge.id, 'amount', e.target.value)}
                  placeholder="Amount"
                  className="h-9 text-right"
                  min={0}
                />
              </div>
              
              <div className="col-span-2 text-right font-semibold text-foreground">
                ₹{formatCurrency(charge.amount || 0)}
              </div>
            </div>
          ))}

          {/* Add Charge Button */}
          <div className="p-3 border-t border-border bg-muted/10">
            <button
              type="button"
              onClick={addCharge}
              className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Add Additional Charges
            </button>
          </div>
        </div>

        {/* GST Type Selection */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          <Label className="font-semibold text-foreground mb-3 block">GST Type</Label>
          <RadioGroup
            value={gstType}
            onValueChange={(v) => setGstType(v as 'intra' | 'inter')}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="intra" id="intra" />
              <Label htmlFor="intra" className="cursor-pointer text-sm">
                Intra-state (CGST + SGST)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="inter" id="inter" />
              <Label htmlFor="inter" className="cursor-pointer text-sm">
                Inter-state (IGST)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Summary Section */}
        <div className="border border-border rounded-lg overflow-hidden mb-6">
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <h3 className="font-semibold text-foreground">Summary</h3>
          </div>
          
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">₹{formatCurrency(productNetAmount + additionalChargesTotal)}</span>
            </div>
            
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount ({discountPercent}%)</span>
                <span className="font-medium text-green-600">-₹{formatCurrency(discountAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxable Value</span>
              <span className="font-medium">₹{formatCurrency(taxableValue)}</span>
            </div>
            
            {gstType === 'inter' ? (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IGST @ {gstRate}%</span>
                <span className="font-medium">₹{formatCurrency(igst)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CGST @ {gstRate / 2}%</span>
                  <span className="font-medium">₹{formatCurrency(cgst)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">SGST @ {gstRate / 2}%</span>
                  <span className="font-medium">₹{formatCurrency(sgst)}</span>
                </div>
              </>
            )}
            
            <div className="flex justify-between pt-3 mt-3 border-t-2 border-primary">
              <span className="text-lg font-bold text-foreground">Grand Total</span>
              <span className="text-lg font-bold text-primary">₹{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-6">
          <Label htmlFor="terms" className="font-semibold text-foreground mb-2 block">
            Terms & Conditions (Optional)
          </Label>
          <Textarea
            id="terms"
            value={termsAndConditions}
            onChange={(e) => setTermsAndConditions(e.target.value)}
            placeholder="Enter any terms and conditions for this bid..."
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={submitting || rate <= 0 || deliveryDays <= 0}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            isEditing ? 'Update Bid' : 'Submit Bid'
          )}
        </Button>

        {rate <= 0 && (
          <p className="text-center text-sm text-destructive mt-2">
            Please enter a rate to submit your bid
          </p>
        )}
      </div>
    </form>
  );
};
