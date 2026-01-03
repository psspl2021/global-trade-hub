import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Validation to prevent contact info in terms
const containsContactInfo = (text: string): { hasContact: boolean; type: string } => {
  const normalized = text.toLowerCase().replace(/\s+/g, '');
  
  // Phone number patterns (Indian and international)
  const phonePatterns = [
    /\+?\d{10,13}/,
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
    /\d{4}[-.\s]?\d{3}[-.\s]?\d{3}/,
    /\d{5}[-.\s]?\d{5}/,
  ];
  
  for (const pattern of phonePatterns) {
    if (pattern.test(normalized)) {
      return { hasContact: true, type: 'phone number' };
    }
  }
  
  // Email pattern
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (emailPattern.test(text)) {
    return { hasContact: true, type: 'email address' };
  }
  
  // Company name indicators (common patterns)
  const companyIndicators = [
    /\b(pvt\.?\s*ltd\.?|private\s+limited|llp|inc\.?|corp\.?|limited|enterprises?|trading|industries|solutions)\b/i,
  ];
  
  for (const pattern of companyIndicators) {
    if (pattern.test(text)) {
      return { hasContact: true, type: 'company name' };
    }
  }
  
  return { hasContact: false, type: '' };
};

const GST_RATE_OPTIONS = [0, 5, 12, 18, 28] as const;

interface AdditionalCharge {
  id: string;
  description: string;
  amount: number;
}

interface LineItem {
  id: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit: string;
  category: string;
  budget_min?: number;
  budget_max?: number;
}

interface ItemBid {
  rate: number;
  hsnCode: string;
  gstRate: number;
  discountPercent: number;
}

interface BidFormInvoiceProps {
  requirementId: string;
  requirementTitle: string;
  requirementQuantity: number;
  requirementUnit: string;
  onSubmit: (data: BidFormInvoiceData) => void;
  submitting: boolean;
  isEditing?: boolean;
  initialData?: Partial<BidFormInvoiceData>;
}

export interface BidFormInvoiceData {
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    rate: number;
    hsnCode: string;
    gstRate: number;
    discountPercent: number;
    lineTotal: number;
  }>;
  deliveryDays: number;
  additionalCharges: AdditionalCharge[];
  gstType: 'intra' | 'inter';
  termsAndConditions: string;
  subtotal: number;
  taxableValue: number;
  totalGst: number;
  grandTotal: number;
}

export const BidFormInvoice = ({
  requirementId,
  requirementTitle,
  requirementQuantity,
  requirementUnit,
  onSubmit,
  submitting,
  isEditing = false,
  initialData,
}: BidFormInvoiceProps) => {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemBids, setItemBids] = useState<Record<string, ItemBid>>({});
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>(
    initialData?.additionalCharges || []
  );
  const [gstType, setGstType] = useState<'intra' | 'inter'>(initialData?.gstType || 'inter');
  const [deliveryDays, setDeliveryDays] = useState(initialData?.deliveryDays || 7);
  const [termsAndConditions, setTermsAndConditions] = useState(initialData?.termsAndConditions || '');

  // Fetch line items from backend
  useEffect(() => {
    const fetchLineItems = async () => {
      setLoadingItems(true);
      const { data, error } = await supabase
        .from('requirement_items')
        .select('*')
        .eq('requirement_id', requirementId);

      if (!error && data && data.length > 0) {
        setLineItems(data);
        // Initialize item bids
        const initialBids: Record<string, ItemBid> = {};
        data.forEach(item => {
          initialBids[item.id] = {
            rate: 0,
            hsnCode: '',
            gstRate: 18,
            discountPercent: 0,
          };
        });
        setItemBids(initialBids);
      } else {
        // No line items - create a single item from requirement
        const singleItem: LineItem = {
          id: 'main',
          item_name: requirementTitle,
          quantity: requirementQuantity,
          unit: requirementUnit,
          category: '',
        };
        setLineItems([singleItem]);
        setItemBids({
          main: {
            rate: initialData?.items?.[0]?.rate || 0,
            hsnCode: initialData?.items?.[0]?.hsnCode || '',
            gstRate: initialData?.items?.[0]?.gstRate || 18,
            discountPercent: initialData?.items?.[0]?.discountPercent || 0,
          },
        });
      }
      setLoadingItems(false);
    };

    fetchLineItems();
  }, [requirementId, requirementTitle, requirementQuantity, requirementUnit]);

  const updateItemBid = (itemId: string, field: keyof ItemBid, value: number | string) => {
    setItemBids(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: typeof value === 'string' && field !== 'hsnCode' ? Number(value) : value,
      },
    }));
  };

  // Calculate line totals
  const calculateLineTotal = (item: LineItem, bid: ItemBid) => {
    const amount = bid.rate * item.quantity;
    const discount = amount * (bid.discountPercent / 100);
    return amount - discount;
  };

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => {
    const bid = itemBids[item.id];
    if (!bid) return sum;
    return sum + calculateLineTotal(item, bid);
  }, 0);

  const additionalChargesTotal = additionalCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
  const taxableValue = subtotal + additionalChargesTotal;
  
  // Calculate total GST (weighted by each item's GST rate)
  const totalGst = lineItems.reduce((sum, item) => {
    const bid = itemBids[item.id];
    if (!bid) return sum;
    const lineTotal = calculateLineTotal(item, bid);
    const proportionalAdditional = subtotal > 0 ? (lineTotal / subtotal) * additionalChargesTotal : 0;
    return sum + (lineTotal + proportionalAdditional) * (bid.gstRate / 100);
  }, 0);

  const grandTotal = taxableValue + totalGst;
  const cgst = gstType === 'intra' ? totalGst / 2 : 0;
  const sgst = gstType === 'intra' ? totalGst / 2 : 0;
  const igst = gstType === 'inter' ? totalGst : 0;

  const addCharge = () => {
    setAdditionalCharges([
      ...additionalCharges,
      { id: Date.now().toString(), description: '', amount: 0 },
    ]);
  };

  const removeCharge = (id: string) => {
    setAdditionalCharges(additionalCharges.filter(c => c.id !== id));
  };

  const updateCharge = (id: string, field: 'description' | 'amount', value: string | number) => {
    setAdditionalCharges(
      additionalCharges.map(c =>
        c.id === id ? { ...c, [field]: field === 'amount' ? Number(value) : value } : c
      )
    );
  };

  const allItemsHaveRate = lineItems.every(item => itemBids[item.id]?.rate > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allItemsHaveRate || deliveryDays <= 0) return;

    // Validate terms don't contain contact info
    if (termsAndConditions.trim()) {
      const contactCheck = containsContactInfo(termsAndConditions);
      if (contactCheck.hasContact) {
        toast.error(`Terms cannot contain ${contactCheck.type}. Please remove it and try again.`);
        return;
      }
    }

    const items = lineItems.map(item => {
      const bid = itemBids[item.id];
      return {
        itemId: item.id,
        itemName: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        rate: bid.rate,
        hsnCode: bid.hsnCode,
        gstRate: bid.gstRate,
        discountPercent: bid.discountPercent,
        lineTotal: calculateLineTotal(item, bid),
      };
    });

    onSubmit({
      items,
      deliveryDays,
      additionalCharges,
      gstType,
      termsAndConditions,
      subtotal,
      taxableValue,
      totalGst,
      grandTotal,
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loadingItems) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading items...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-background border border-border rounded-lg overflow-hidden">
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
              onChange={e => setDeliveryDays(Number(e.target.value))}
              className="w-20 h-9 text-center border-border"
              min={1}
              required
            />
            <span className="text-sm text-muted-foreground">days</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-border rounded-md overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <span className="text-sm font-medium text-foreground">Line Items ({lineItems.length})</span>
          </div>
          
          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-2 px-4 py-2 bg-muted/30 text-xs font-medium text-muted-foreground border-b border-border">
            <div className="col-span-3">Item</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-2">HSN</div>
            <div className="col-span-2">Rate (₹)</div>
            <div className="col-span-1 text-center">GST%</div>
            <div className="col-span-1 text-center">Disc%</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          {/* Items */}
          <div className="divide-y divide-border">
            {lineItems.map((item, index) => {
              const bid = itemBids[item.id] || { rate: 0, hsnCode: '', gstRate: 18, discountPercent: 0 };
              const lineTotal = calculateLineTotal(item, bid);

              return (
                <div key={item.id} className="p-4">
                  {/* Mobile View */}
                  <div className="md:hidden space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      <p className="font-medium text-foreground">{item.item_name}</p>
                      {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.quantity.toLocaleString('en-IN')} {item.unit}
                      </p>
                      {(item.budget_min || item.budget_max) && (
                        <p className="text-xs text-muted-foreground">
                          Budget: {item.budget_min && item.budget_max
                            ? `₹${item.budget_min.toLocaleString()} - ₹${item.budget_max.toLocaleString()}`
                            : item.budget_max
                              ? `Up to ₹${item.budget_max.toLocaleString()}`
                              : `From ₹${item.budget_min?.toLocaleString()}`}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">HSN Code</Label>
                        <Input
                          type="text"
                          value={bid.hsnCode}
                          onChange={e => updateItemBid(item.id, 'hsnCode', e.target.value)}
                          placeholder="e.g. 7214"
                          className="h-9 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Rate (₹/{item.unit})</Label>
                        <Input
                          type="number"
                          value={bid.rate || ''}
                          onChange={e => updateItemBid(item.id, 'rate', e.target.value)}
                          placeholder="0.00"
                          className="h-9 mt-1"
                          min={0}
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">GST Rate</Label>
                        <Select value={bid.gstRate.toString()} onValueChange={v => updateItemBid(item.id, 'gstRate', v)}>
                          <SelectTrigger className="h-9 mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GST_RATE_OPTIONS.map(r => (
                              <SelectItem key={r} value={r.toString()}>{r}%</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Discount %</Label>
                        <Input
                          type="number"
                          value={bid.discountPercent || ''}
                          onChange={e => updateItemBid(item.id, 'discountPercent', e.target.value)}
                          placeholder="0"
                          className="h-9 mt-1"
                          min={0}
                          max={100}
                          step="0.1"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground">Line Total</span>
                      <span className="font-semibold text-foreground">₹{formatCurrency(lineTotal)}</span>
                    </div>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:grid md:grid-cols-12 gap-2 items-center">
                    <div className="col-span-3">
                      <p className="font-medium text-foreground text-sm">{item.item_name}</p>
                      {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                    </div>
                    <div className="col-span-1 text-center text-sm">
                      {item.quantity.toLocaleString('en-IN')} {item.unit}
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="text"
                        value={bid.hsnCode}
                        onChange={e => updateItemBid(item.id, 'hsnCode', e.target.value)}
                        placeholder="HSN"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={bid.rate || ''}
                        onChange={e => updateItemBid(item.id, 'rate', e.target.value)}
                        placeholder="Rate"
                        className="h-8 text-sm"
                        min={0}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <Select value={bid.gstRate.toString()} onValueChange={v => updateItemBid(item.id, 'gstRate', v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GST_RATE_OPTIONS.map(r => (
                            <SelectItem key={r} value={r.toString()}>{r}%</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1">
                      <Input
                        type="number"
                        value={bid.discountPercent || ''}
                        onChange={e => updateItemBid(item.id, 'discountPercent', e.target.value)}
                        placeholder="0"
                        className="h-8 text-sm text-center"
                        min={0}
                        max={100}
                        step="0.1"
                      />
                    </div>
                    <div className="col-span-2 text-right font-medium text-sm">
                      ₹{formatCurrency(lineTotal)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subtotal */}
          <div className="px-4 py-3 bg-muted/30 border-t border-border flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
            <span className="font-semibold text-foreground">₹{formatCurrency(subtotal)}</span>
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
              {additionalCharges.map(charge => (
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
                    onChange={e => updateCharge(charge.id, 'description', e.target.value)}
                    placeholder="Description (e.g., Transport)"
                    className="h-8 flex-1"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-sm text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={charge.amount || ''}
                      onChange={e => updateCharge(charge.id, 'amount', e.target.value)}
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
            onValueChange={v => setGstType(v as 'intra' | 'inter')}
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
              <span>₹{formatCurrency(subtotal)}</span>
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
                <span className="text-muted-foreground">IGST</span>
                <span>₹{formatCurrency(igst)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CGST</span>
                  <span>₹{formatCurrency(cgst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SGST</span>
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
            onChange={e => setTermsAndConditions(e.target.value)}
            placeholder="Enter any terms and conditions..."
            rows={2}
            className="resize-none"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={submitting || !allItemsHaveRate || deliveryDays <= 0}
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

        {!allItemsHaveRate && (
          <p className="text-center text-xs text-destructive">Please enter a rate for all items</p>
        )}
      </div>
    </form>
  );
};
