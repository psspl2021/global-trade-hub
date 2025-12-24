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
    <form onSubmit={handleSubmit} className="bg-background border border-border rounded-lg overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-primary text-primary-foreground text-center py-3">
        <h2 className="text-lg font-semibold tracking-wide">QUOTATION</h2>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Delivery Timeline */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <Label className="text-sm font-medium text-foreground whitespace-nowrap">Delivery Timeline:</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(Number(e.target.value))}
              className="w-20 h-9 text-center border-border"
              min={1}
              required
            />
            <span className="text-sm text-muted-foreground">days</span>
          </div>
        </div>

        {/* Item Details Card */}
        <div className="border border-border rounded-md overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <span className="text-sm font-medium text-foreground">Item Details</span>
          </div>
          <div className="p-4 space-y-4">
            {/* Product Info */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Product</span>
              <span className="font-medium text-foreground">{productName}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* HSN Code */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">HSN Code</Label>
                <Input
                  type="text"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  placeholder="e.g. 7214"
                  className="h-9"
                />
              </div>

              {/* GST Rate */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">GST Rate</Label>
                <Select value={gstRate.toString()} onValueChange={(v) => setGstRate(Number(v))}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GST_RATE_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r.toString()}>{r}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Quantity</Label>
                <div className="h-9 px-3 flex items-center bg-muted/30 border border-border rounded-md text-sm">
                  {quantity.toLocaleString('en-IN')} {unit}
                </div>
              </div>

              {/* Rate */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Rate (₹/{unit})</Label>
                <Input
                  type="number"
                  value={rate || ''}
                  onChange={(e) => setRate(Number(e.target.value))}
                  placeholder="0.00"
                  className="h-9"
                  min={0}
                  step="0.01"
                  required
                />
              </div>
            </div>

            {/* Discount */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Discount %</Label>
              <Input
                type="number"
                value={discountPercent || ''}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                placeholder="0"
                className="h-9 w-24"
                min={0}
                max={100}
                step="0.1"
              />
              {discountAmount > 0 && (
                <span className="text-sm text-green-600">-₹{formatCurrency(discountAmount)}</span>
              )}
            </div>

            {/* Product Amount */}
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">Line Total</span>
              <span className="font-semibold text-foreground">₹{formatCurrency(productNetAmount)}</span>
            </div>
          </div>
        </div>

        {/* Additional Charges */}
        <div className="border border-border rounded-md overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Additional Charges</span>
            <button
              type="button"
              onClick={addCharge}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
          
          {additionalCharges.length > 0 ? (
            <div className="divide-y divide-border">
              {additionalCharges.map((charge) => (
                <div key={charge.id} className="p-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => removeCharge(charge.id)}
                    className="text-destructive hover:text-destructive/80 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Input
                    type="text"
                    value={charge.description}
                    onChange={(e) => updateCharge(charge.id, 'description', e.target.value)}
                    placeholder="Description (e.g., Transport)"
                    className="h-8 flex-1"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-sm text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={charge.amount || ''}
                      onChange={(e) => updateCharge(charge.id, 'amount', e.target.value)}
                      placeholder="0"
                      className="h-8 w-24 text-right"
                      min={0}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-sm text-muted-foreground">
              No additional charges added
            </div>
          )}
        </div>

        {/* GST Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">GST Type</Label>
          <RadioGroup
            value={gstType}
            onValueChange={(v) => setGstType(v as 'intra' | 'inter')}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="intra" id="gst-intra" />
              <Label htmlFor="gst-intra" className="text-sm cursor-pointer">Intra-state (CGST + SGST)</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="inter" id="gst-inter" />
              <Label htmlFor="gst-inter" className="text-sm cursor-pointer">Inter-state (IGST)</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Summary */}
        <div className="border border-border rounded-md overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <span className="text-sm font-medium text-foreground">Summary</span>
          </div>
          <div className="p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{formatCurrency(productNetAmount)}</span>
            </div>
            {additionalChargesTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Additional Charges</span>
                <span>₹{formatCurrency(additionalChargesTotal)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxable Value</span>
              <span className="font-medium">₹{formatCurrency(taxableValue)}</span>
            </div>
            
            {gstType === 'inter' ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IGST @ {gstRate}%</span>
                <span>₹{formatCurrency(igst)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CGST @ {gstRate / 2}%</span>
                  <span>₹{formatCurrency(cgst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SGST @ {gstRate / 2}%</span>
                  <span>₹{formatCurrency(sgst)}</span>
                </div>
              </>
            )}
            
            <div className="flex justify-between pt-3 mt-2 border-t-2 border-primary">
              <span className="font-bold text-foreground">Grand Total</span>
              <span className="font-bold text-primary text-base">₹{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="space-y-2">
          <Label htmlFor="bid-terms" className="text-sm font-medium text-foreground">Terms & Conditions (Optional)</Label>
          <Textarea
            id="bid-terms"
            value={termsAndConditions}
            onChange={(e) => setTermsAndConditions(e.target.value)}
            placeholder="Enter any terms and conditions..."
            rows={2}
            className="resize-none"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={submitting || rate <= 0 || deliveryDays <= 0}
          className="w-full h-11"
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            isEditing ? 'Update Bid' : 'Submit Bid'
          )}
        </Button>

        {rate <= 0 && (
          <p className="text-center text-xs text-destructive">Please enter a rate to submit your bid</p>
        )}
      </div>
    </form>
  );
};
