import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Loader2, Send } from 'lucide-react';

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
      {/* Product Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="p-2 text-left font-medium w-16">Sl. No.</th>
              <th className="p-2 text-left font-medium min-w-[150px]">Product Name</th>
              <th className="p-2 text-left font-medium w-24">HSN Code</th>
              <th className="p-2 text-left font-medium w-24">GST Rate (%)</th>
              <th className="p-2 text-left font-medium w-24">Quantity</th>
              <th className="p-2 text-left font-medium w-28">Rate</th>
              <th className="p-2 text-left font-medium w-24">Discount</th>
              <th className="p-2 text-right font-medium w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 text-center align-top">1</td>
              <td className="p-2 align-top">
                <div className="font-medium">{product.productName}</div>
              </td>
              <td className="p-2 align-top">
                <Input
                  type="text"
                  value={product.hsnCode}
                  onChange={(e) => setProduct({ ...product, hsnCode: e.target.value })}
                  placeholder="HSN Code*"
                  className="h-8 w-full text-sm"
                />
              </td>
              <td className="p-2 align-top">
                <Select
                  value={product.gstRate.toString()}
                  onValueChange={(value) => setProduct({ ...product, gstRate: Number(value) })}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg">
                    {GST_RATE_OPTIONS.map((rate) => (
                      <SelectItem key={rate} value={rate.toString()}>
                        {rate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="p-2 align-top">
                <div className="space-y-1">
                  <div className="font-medium">{product.quantity.toLocaleString('en-IN')}</div>
                  <div className="text-muted-foreground text-xs">{product.unit}</div>
                </div>
              </td>
              <td className="p-2 align-top">
                <Input
                  type="number"
                  value={product.rate || ''}
                  onChange={(e) => setProduct({ ...product, rate: Number(e.target.value) })}
                  placeholder="Enter rate"
                  className="h-8 w-full text-sm"
                  min={0}
                  required
                />
              </td>
              <td className="p-2 align-top">
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={product.discountPercent || ''}
                    onChange={(e) => setProduct({ ...product, discountPercent: Number(e.target.value) })}
                    placeholder="0"
                    className="h-8 w-16 text-sm"
                    min={0}
                    max={100}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </td>
              <td className="p-2 text-right align-top font-semibold">
                {productNetAmount > 0 ? productNetAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Product Subtotal */}
      {productNetAmount > 0 && (
        <div className="flex justify-end">
          <div className="text-right font-semibold border-t border-b py-2 px-4 inline-block">
            {productNetAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>
      )}

      {/* Additional Charges Section */}
      <div className="space-y-2">
        {additionalCharges.map((charge) => (
          <div key={charge.id} className="flex items-center gap-2 pl-2">
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
              placeholder="LABOUR CHARGES"
              className="flex-1 h-8 text-sm uppercase"
            />
            <Input
              type="number"
              value={charge.amount || ''}
              onChange={(e) => updateCharge(charge.id, 'amount', e.target.value)}
              placeholder="Amount"
              className="w-32 h-8 text-sm text-right"
              min={0}
            />
          </div>
        ))}

        {/* GST Line Item Display */}
        {taxableValue > 0 && product.gstRate > 0 && (
          <div className="flex items-center justify-between pl-10 pr-2 py-1">
            <span className="font-medium text-sm">{gstType === 'inter' ? 'IGST' : 'CGST + SGST'}</span>
            <span className="font-semibold text-sm">{gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        )}
      </div>

      {/* Action Links */}
      <div className="space-y-1 pt-2">
        <button
          type="button"
          onClick={addCharge}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Add additional charges
        </button>
      </div>

      {/* GST Type Selection */}
      <div className="flex items-center gap-6 pt-2">
        <RadioGroup
          value={gstType}
          onValueChange={(v) => setGstType(v as 'intra' | 'inter')}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="intra" id="intra" />
            <Label htmlFor="intra" className="cursor-pointer text-sm">
              Intra-state
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="inter" id="inter" />
            <Label htmlFor="inter" className="cursor-pointer text-sm">
              Inter-state
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Total Amount */}
      <div className="flex justify-end border-t pt-4">
        <div className="flex items-baseline gap-4">
          <span className="text-lg font-semibold">Total Amount</span>
          <span className="text-2xl font-bold">{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* GST Break-up Table */}
      <div className="space-y-3">
        <h4 className="font-semibold text-center text-base">GST Break-up</h4>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left font-medium"></th>
                <th className="p-2 text-center font-medium border-l">Taxable Value</th>
                {gstType === 'inter' ? (
                  <th className="p-2 text-center font-medium border-l" colSpan={2}>
                    IGST
                  </th>
                ) : (
                  <>
                    <th className="p-2 text-center font-medium border-l" colSpan={2}>
                      CGST
                    </th>
                    <th className="p-2 text-center font-medium border-l" colSpan={2}>
                      SGST
                    </th>
                  </>
                )}
                <th className="p-2 text-center font-medium border-l">Total</th>
              </tr>
              <tr className="bg-muted/30 text-xs border-b">
                <th className="p-2"></th>
                <th className="p-2 border-l"></th>
                {gstType === 'inter' ? (
                  <>
                    <th className="p-2 text-center border-l">Rate</th>
                    <th className="p-2 text-center">Amount</th>
                  </>
                ) : (
                  <>
                    <th className="p-2 text-center border-l">Rate</th>
                    <th className="p-2 text-center">Amount</th>
                    <th className="p-2 text-center border-l">Rate</th>
                    <th className="p-2 text-center">Amount</th>
                  </>
                )}
                <th className="p-2 text-center border-l">Tax Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2"></td>
                <td className="p-2 text-center border-l">
                  {taxableValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </td>
                {gstType === 'inter' ? (
                  <>
                    <td className="p-2 text-center border-l">{product.gstRate}%</td>
                    <td className="p-2 text-center">
                      {igst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 text-center border-l">{product.gstRate / 2}%</td>
                    <td className="p-2 text-center">
                      {cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 text-center border-l">{product.gstRate / 2}%</td>
                    <td className="p-2 text-center">
                      {sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                  </>
                )}
                <td className="p-2 text-center border-l">
                  {gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="font-semibold bg-muted/20 border-t-2 border-primary/30">
                <td className="p-2">Total</td>
                <td className="p-2 text-center border-l font-bold">
                  {taxableValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </td>
                {gstType === 'inter' ? (
                  <>
                    <td className="p-2 border-l"></td>
                    <td className="p-2 text-center font-bold">
                      {igst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 border-l"></td>
                    <td className="p-2 text-center font-bold">
                      {cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border-l"></td>
                    <td className="p-2 text-center font-bold">
                      {sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                  </>
                )}
                <td className="p-2 text-center border-l font-bold">
                  {gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Days */}
      <div className="flex items-center gap-4 pt-2">
        <Label htmlFor="deliveryDays" className="whitespace-nowrap font-medium">
          Delivery Timeline (days) *
        </Label>
        <Input
          id="deliveryDays"
          type="number"
          value={deliveryDays}
          onChange={(e) => setDeliveryDays(Number(e.target.value))}
          className="w-24 h-9"
          min={1}
          required
        />
      </div>

      {/* Terms and Conditions */}
      <div className="border rounded-lg overflow-hidden">
        <div className="text-center font-semibold py-2 border-b border-dashed bg-muted/20">
          Terms and conditions
        </div>
        <Textarea
          value={termsAndConditions}
          onChange={(e) => setTermsAndConditions(e.target.value)}
          placeholder="Enter Terms and Conditions"
          rows={3}
          className="border-0 focus-visible:ring-0 resize-none rounded-none"
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
