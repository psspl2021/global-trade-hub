import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Loader2, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const GST_RATE_OPTIONS = [0, 5, 12, 18, 28] as const;

interface ProductLine {
  id: string;
  productName: string;
  hsnCode: string;
  gstRate: number;
  quantity: number;
  unit: string;
  rate: number;
  discountPercent: number;
}

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
  // Calculated values
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
  const [product, setProduct] = useState<ProductLine>({
    id: '1',
    productName,
    hsnCode: initialData?.hsnCode || '',
    gstRate: initialData?.gstRate || 18,
    quantity,
    unit,
    rate: initialData?.rate || 0,
    discountPercent: initialData?.discountPercent || 0,
  });

  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>(
    initialData?.additionalCharges || []
  );
  
  const [gstType, setGstType] = useState<'intra' | 'inter'>(initialData?.gstType || 'inter');
  const [deliveryDays, setDeliveryDays] = useState(initialData?.deliveryDays || 7);
  const [termsAndConditions, setTermsAndConditions] = useState(initialData?.termsAndConditions || '');

  // Calculate product amount
  const productAmount = product.rate * product.quantity;
  const discountAmount = productAmount * (product.discountPercent / 100);
  const productNetAmount = productAmount - discountAmount;

  // Calculate additional charges total
  const additionalChargesTotal = additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);

  // Taxable value = product net amount + additional charges
  const taxableValue = productNetAmount + additionalChargesTotal;

  // GST calculation
  const gstAmount = taxableValue * (product.gstRate / 100);
  const grandTotal = taxableValue + gstAmount;

  // GST breakdown
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
    if (product.rate <= 0 || deliveryDays <= 0) return;

    onSubmit({
      rate: product.rate,
      hsnCode: product.hsnCode,
      gstRate: product.gstRate,
      discountPercent: product.discountPercent,
      deliveryDays,
      additionalCharges,
      gstType,
      termsAndConditions,
      taxableValue,
      totalGst: gstAmount,
      grandTotal,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product Card */}
      <Card className="overflow-hidden">
        <div className="bg-primary text-primary-foreground px-4 py-3">
          <h3 className="font-semibold text-sm">Product Details</h3>
        </div>
        <CardContent className="p-4 space-y-4">
          {/* Product Name & Quantity - Read Only */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Product Name</Label>
              <p className="font-medium text-sm mt-1">{product.productName}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Quantity</Label>
              <p className="font-medium text-sm mt-1">{product.quantity.toLocaleString('en-IN')} {product.unit}</p>
            </div>
          </div>

          {/* Input Fields Row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="hsnCode" className="text-xs">HSN Code</Label>
              <Input
                id="hsnCode"
                type="text"
                value={product.hsnCode}
                onChange={(e) => setProduct({ ...product, hsnCode: e.target.value })}
                placeholder="Enter HSN"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gstRate" className="text-xs">GST Rate (%)</Label>
              <Select
                value={product.gstRate.toString()}
                onValueChange={(value) => setProduct({ ...product, gstRate: Number(value) })}
              >
                <SelectTrigger id="gstRate" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {GST_RATE_OPTIONS.map((rate) => (
                    <SelectItem key={rate} value={rate.toString()}>
                      {rate}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="rate" className="text-xs">Rate per {unit} *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input
                  id="rate"
                  type="number"
                  value={product.rate || ''}
                  onChange={(e) => setProduct({ ...product, rate: Number(e.target.value) })}
                  placeholder="0.00"
                  className="h-9 pl-7"
                  min={0}
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="discount" className="text-xs">Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                value={product.discountPercent || ''}
                onChange={(e) => setProduct({ ...product, discountPercent: Number(e.target.value) })}
                placeholder="0"
                className="h-9"
                min={0}
                max={100}
                step="0.1"
              />
            </div>
          </div>

          {/* Amount Display */}
          {productNetAmount > 0 && (
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">Product Amount</span>
              <span className="font-bold text-lg">₹{productNetAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Charges Section */}
      <div className="space-y-2">
        {additionalCharges.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Additional Charges</Label>
            {additionalCharges.map((charge) => (
              <div key={charge.id} className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCharge(charge.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Input
                  type="text"
                  value={charge.description}
                  onChange={(e) => updateCharge(charge.id, 'description', e.target.value)}
                  placeholder="e.g., Labour, Transport"
                  className="flex-1 h-9 text-sm"
                />
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <Input
                    type="number"
                    value={charge.amount || ''}
                    onChange={(e) => updateCharge(charge.id, 'amount', e.target.value)}
                    placeholder="0"
                    className="h-9 text-sm text-right pl-7"
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

      {/* GST Type Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">GST Type</Label>
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

      {/* Summary Card */}
      {taxableValue > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Taxable Value</span>
              <span className="font-medium">₹{taxableValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            {gstType === 'inter' ? (
              <div className="flex justify-between text-sm">
                <span>IGST ({product.gstRate}%)</span>
                <span className="font-medium">₹{igst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span>CGST ({product.gstRate / 2}%)</span>
                  <span className="font-medium">₹{cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>SGST ({product.gstRate / 2}%)</span>
                  <span className="font-medium">₹{sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
              <span>Grand Total</span>
              <span className="text-primary">₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Days */}
      <div className="flex items-center gap-4">
        <Label htmlFor="deliveryDays" className="whitespace-nowrap font-medium text-sm">
          Delivery Timeline *
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="deliveryDays"
            type="number"
            value={deliveryDays}
            onChange={(e) => setDeliveryDays(Number(e.target.value))}
            className="w-20 h-9"
            min={1}
            required
          />
          <span className="text-sm text-muted-foreground">days</span>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-2">
        <Label htmlFor="terms" className="text-sm font-medium">Terms and Conditions</Label>
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
        disabled={submitting || product.rate <= 0 || deliveryDays <= 0}
        className="w-full"
        size="lg"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        {isEditing ? 'Update Bid' : 'Submit Bid'}
      </Button>
    </form>
  );
};
