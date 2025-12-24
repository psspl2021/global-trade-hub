import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Loader2, Send } from 'lucide-react';

const GST_RATE_OPTIONS = [5, 12, 18, 28] as const;

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
  const additionalChargesTotal = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary text-primary-foreground text-sm">
              <th className="p-2 text-left border">Sl. No.</th>
              <th className="p-2 text-left border min-w-[140px]">Product Name</th>
              <th className="p-2 text-left border">HSN Code</th>
              <th className="p-2 text-left border">GST (%)</th>
              <th className="p-2 text-left border">Qty</th>
              <th className="p-2 text-left border min-w-[100px]">Rate (₹)</th>
              <th className="p-2 text-left border">Discount (%)</th>
              <th className="p-2 text-right border min-w-[100px]">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-sm">
              <td className="p-2 border text-center">1</td>
              <td className="p-2 border">
                <div className="font-medium">{product.productName}</div>
              </td>
              <td className="p-2 border">
                <Input
                  type="text"
                  value={product.hsnCode}
                  onChange={(e) => setProduct({ ...product, hsnCode: e.target.value })}
                  placeholder="HSN Code"
                  className="h-8 w-24"
                />
              </td>
              <td className="p-2 border">
                <Select
                  value={product.gstRate.toString()}
                  onValueChange={(value) => setProduct({ ...product, gstRate: Number(value) })}
                >
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GST_RATE_OPTIONS.map((rate) => (
                      <SelectItem key={rate} value={rate.toString()}>
                        {rate}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="p-2 border">
                <div className="whitespace-nowrap">
                  {product.quantity.toLocaleString('en-IN')} {product.unit}
                </div>
              </td>
              <td className="p-2 border">
                <Input
                  type="number"
                  value={product.rate || ''}
                  onChange={(e) => setProduct({ ...product, rate: Number(e.target.value) })}
                  placeholder="Rate"
                  className="h-8 w-24"
                  min={0}
                  required
                />
              </td>
              <td className="p-2 border">
                <Input
                  type="number"
                  value={product.discountPercent || ''}
                  onChange={(e) => setProduct({ ...product, discountPercent: Number(e.target.value) })}
                  placeholder="0"
                  className="h-8 w-16"
                  min={0}
                  max={100}
                />
              </td>
              <td className="p-2 border text-right font-semibold">
                {productNetAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Subtotal Row */}
      <div className="flex justify-end">
        <div className="text-right border-t border-b py-2 px-4 font-semibold">
          Subtotal: ₹{productNetAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Additional Charges Section */}
      <div className="space-y-3">
        {additionalCharges.map((charge, index) => (
          <div key={charge.id} className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeCharge(charge.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Input
              type="text"
              value={charge.description}
              onChange={(e) => updateCharge(charge.id, 'description', e.target.value)}
              placeholder="Charge description (e.g., LABOUR CHARGES)"
              className="flex-1"
            />
            <Input
              type="number"
              value={charge.amount || ''}
              onChange={(e) => updateCharge(charge.id, 'amount', e.target.value)}
              placeholder="Amount"
              className="w-32"
              min={0}
            />
          </div>
        ))}

        {/* GST on additional charges */}
        {additionalChargesTotal > 0 && (
          <div className="flex justify-end text-sm text-muted-foreground">
            <span>
              {gstType === 'inter' ? 'IGST' : 'CGST + SGST'} on Additional Charges ({product.gstRate}%): ₹
              {(additionalChargesTotal * (product.gstRate / 100)).toLocaleString('en-IN', {
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        )}
      </div>

      {/* Add Discount and Add Charges Links */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={addCharge}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Add additional charges
        </button>
      </div>

      {/* GST Type Selection */}
      <div className="flex items-center gap-6">
        <RadioGroup
          value={gstType}
          onValueChange={(v) => setGstType(v as 'intra' | 'inter')}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="intra" id="intra" />
            <Label htmlFor="intra" className="cursor-pointer">
              Intra-state
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="inter" id="inter" />
            <Label htmlFor="inter" className="cursor-pointer">
              Inter-state
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Total Amount */}
      <div className="flex justify-end border-t pt-4">
        <div className="text-right space-y-1">
          <div className="text-xl font-bold">
            Total Amount: ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* GST Break-up Table */}
      <div className="space-y-2">
        <h4 className="font-semibold text-center">GST Break-up</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 border text-left"></th>
                <th className="p-2 border text-center">Taxable Value</th>
                {gstType === 'inter' ? (
                  <>
                    <th className="p-2 border text-center" colSpan={2}>
                      IGST
                    </th>
                  </>
                ) : (
                  <>
                    <th className="p-2 border text-center" colSpan={2}>
                      CGST
                    </th>
                    <th className="p-2 border text-center" colSpan={2}>
                      SGST
                    </th>
                  </>
                )}
                <th className="p-2 border text-center">Total</th>
              </tr>
              <tr className="bg-muted/50 text-xs">
                <th className="p-2 border"></th>
                <th className="p-2 border"></th>
                {gstType === 'inter' ? (
                  <>
                    <th className="p-2 border text-center">Rate</th>
                    <th className="p-2 border text-center">Amount</th>
                  </>
                ) : (
                  <>
                    <th className="p-2 border text-center">Rate</th>
                    <th className="p-2 border text-center">Amount</th>
                    <th className="p-2 border text-center">Rate</th>
                    <th className="p-2 border text-center">Amount</th>
                  </>
                )}
                <th className="p-2 border text-center">Tax Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border"></td>
                <td className="p-2 border text-center">
                  {taxableValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </td>
                {gstType === 'inter' ? (
                  <>
                    <td className="p-2 border text-center">{product.gstRate}%</td>
                    <td className="p-2 border text-center">
                      {igst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 border text-center">{product.gstRate / 2}%</td>
                    <td className="p-2 border text-center">
                      {cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border text-center">{product.gstRate / 2}%</td>
                    <td className="p-2 border text-center">
                      {sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                  </>
                )}
                <td className="p-2 border text-center">
                  {gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="font-semibold bg-muted/30">
                <td className="p-2 border">Total</td>
                <td className="p-2 border text-center">
                  {taxableValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </td>
                {gstType === 'inter' ? (
                  <>
                    <td className="p-2 border"></td>
                    <td className="p-2 border text-center font-bold">
                      {igst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 border"></td>
                    <td className="p-2 border text-center font-bold">
                      {cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border"></td>
                    <td className="p-2 border text-center font-bold">
                      {sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                  </>
                )}
                <td className="p-2 border text-center font-bold">
                  {gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Days */}
      <div className="flex items-center gap-4">
        <Label htmlFor="deliveryDays" className="whitespace-nowrap">
          Delivery Timeline (days) *
        </Label>
        <Input
          id="deliveryDays"
          type="number"
          value={deliveryDays}
          onChange={(e) => setDeliveryDays(Number(e.target.value))}
          className="w-24"
          min={1}
          required
        />
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-2 border rounded-lg p-4">
        <h4 className="font-semibold text-center border-b pb-2">Terms and conditions</h4>
        <Textarea
          value={termsAndConditions}
          onChange={(e) => setTermsAndConditions(e.target.value)}
          placeholder="Enter Terms and Conditions"
          rows={3}
          className="border-0 focus-visible:ring-0 resize-none"
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
