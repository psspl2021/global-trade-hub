import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Loader2, Send } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="bg-card rounded-lg border shadow-sm">
      {/* Header */}
      <div className="bg-[#0a6e97] text-white text-center py-4 rounded-t-lg">
        <h2 className="text-xl font-semibold">Bid Quotation</h2>
        <p className="text-sm opacity-90">Submit your best offer for this requirement</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Delivery Timeline */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <Label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Delivery Timeline*
          </Label>
          <input
            type="number"
            value={deliveryDays}
            onChange={(e) => setDeliveryDays(Number(e.target.value))}
            className="w-16 border-b border-muted-foreground/40 bg-transparent text-center focus:border-primary focus:outline-none py-1"
            min={1}
            required
          />
          <span className="text-sm text-muted-foreground">days</span>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-foreground/20">
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Sl.</th>
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Product Name</th>
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground">HSN Code</th>
                <th className="text-left py-2 px-2 font-semibold text-muted-foreground">GST Rate</th>
                <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Qty</th>
                <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Rate (₹)</th>
                <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Discount %</th>
                <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-muted/30">
                <td className="py-3 px-2 text-muted-foreground">1</td>
                <td className="py-3 px-2">
                  <div className="font-medium">{productName}</div>
                </td>
                <td className="py-3 px-2">
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    placeholder="Enter"
                    className="w-20 border-b border-muted-foreground/40 bg-transparent focus:border-primary focus:outline-none py-1"
                  />
                </td>
                <td className="py-3 px-2">
                  <Select value={gstRate.toString()} onValueChange={(v) => setGstRate(Number(v))}>
                    <SelectTrigger className="w-20 h-8 border-0 border-b border-muted-foreground/40 rounded-none bg-transparent focus:ring-0 focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {GST_RATE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r.toString()}>{r}%</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-3 px-2 text-right">
                  <span className="font-medium">{quantity.toLocaleString('en-IN')}</span>
                  <span className="text-muted-foreground ml-1">{unit}</span>
                </td>
                <td className="py-3 px-2">
                  <input
                    type="number"
                    value={rate || ''}
                    onChange={(e) => setRate(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-24 border-b border-muted-foreground/40 bg-transparent text-right focus:border-primary focus:outline-none py-1"
                    min={0}
                    step="0.01"
                    required
                  />
                </td>
                <td className="py-3 px-2">
                  <input
                    type="number"
                    value={discountPercent || ''}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    placeholder="0"
                    className="w-16 border-b border-muted-foreground/40 bg-transparent text-right focus:border-primary focus:outline-none py-1"
                    min={0}
                    max={100}
                    step="0.1"
                  />
                </td>
                <td className="py-3 px-2 text-right font-medium">
                  ₹{formatCurrency(productNetAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Additional Charges */}
        <div className="space-y-3">
          {additionalCharges.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Additional Charges</Label>
              {additionalCharges.map((charge, index) => (
                <div key={charge.id} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => removeCharge(charge.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-muted-foreground w-6">{index + 2}.</span>
                  <input
                    type="text"
                    value={charge.description}
                    onChange={(e) => updateCharge(charge.id, 'description', e.target.value)}
                    placeholder="e.g., Transport, Labour"
                    className="flex-1 border-b border-muted-foreground/40 bg-transparent focus:border-primary focus:outline-none py-1 text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">₹</span>
                    <input
                      type="number"
                      value={charge.amount || ''}
                      onChange={(e) => updateCharge(charge.id, 'amount', e.target.value)}
                      placeholder="0.00"
                      className="w-24 border-b border-muted-foreground/40 bg-transparent text-right focus:border-primary focus:outline-none py-1 text-sm"
                      min={0}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addCharge}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Add additional charges
          </button>
        </div>

        {/* GST Type */}
        <div className="flex items-center gap-4 py-3 border-t border-b">
          <Label className="text-sm font-medium text-muted-foreground">GST Type:</Label>
          <RadioGroup
            value={gstType}
            onValueChange={(v) => setGstType(v as 'intra' | 'inter')}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="intra" id="intra" />
              <Label htmlFor="intra" className="cursor-pointer text-sm font-normal">
                Intra-state (CGST + SGST)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="inter" id="inter" />
              <Label htmlFor="inter" className="cursor-pointer text-sm font-normal">
                Inter-state (IGST)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Summary Section */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Taxable Value</span>
              <span className="font-medium">₹{formatCurrency(taxableValue)}</span>
            </div>
            {gstType === 'inter' ? (
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">IGST ({gstRate}%)</span>
                <span className="font-medium">₹{formatCurrency(igst)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">CGST ({gstRate / 2}%)</span>
                  <span className="font-medium">₹{formatCurrency(cgst)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">SGST ({gstRate / 2}%)</span>
                  <span className="font-medium">₹{formatCurrency(sgst)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between py-2 border-t-2 border-foreground/20 text-base">
              <span className="font-bold">Grand Total</span>
              <span className="font-bold text-primary">₹{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="terms" className="text-sm font-medium text-muted-foreground">
            Terms and Conditions
          </Label>
          <Textarea
            id="terms"
            value={termsAndConditions}
            onChange={(e) => setTermsAndConditions(e.target.value)}
            placeholder="Enter any terms and conditions for this bid..."
            rows={3}
            className="resize-none border-muted-foreground/40 focus:border-primary"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={submitting || rate <= 0 || deliveryDays <= 0}
          className="w-full bg-[#0a6e97] hover:bg-[#085a7a] text-white"
          size="lg"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {isEditing ? 'Update Bid' : 'Submit Bid'}
        </Button>
      </div>
    </form>
  );
};
