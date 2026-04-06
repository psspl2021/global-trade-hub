/**
 * AuctionPOGenerator — Generate Purchase Order from awarded reverse auction
 * SKU-level pricing, per-item tax dropdown, freight, live totals
 */
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FileText, Truck, IndianRupee, CheckCircle2, Package } from 'lucide-react';
import { useAuctionPO, POLineItem, calculatePOTotals, generatePONotes } from '@/hooks/useAuctionPO';
import { supabase } from '@/integrations/supabase/client';
import { ReverseAuction } from '@/hooks/useReverseAuction';

const TAX_OPTIONS = [
  { value: '0', label: '0% (Exempt)' },
  { value: '5', label: '5% GST' },
  { value: '12', label: '12% GST' },
  { value: '18', label: '18% GST' },
  { value: '28', label: '28% GST' },
  { value: 'custom', label: 'Custom' },
];

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

interface AuctionPOGeneratorProps {
  auction: ReverseAuction;
  winnerSupplierId: string;
  winningPrice: number;
  onPOCreated?: () => void;
}

export function AuctionPOGenerator({ auction, winnerSupplierId, winningPrice, onPOCreated }: AuctionPOGeneratorProps) {
  const { generatePO, isGenerating } = useAuctionPO();
  const [items, setItems] = useState<POLineItem[]>([]);
  const [freight, setFreight] = useState(0);
  const [poCreated, setPOCreated] = useState(false);
  const [supplierName, setSupplierName] = useState('Supplier');

  // Load auction items (SKUs) from reverse_auction_items
  useEffect(() => {
    async function loadItems() {
      const { data: auctionItems } = await supabase
        .from('reverse_auction_items')
        .select('*')
        .eq('auction_id', auction.id);

      if (auctionItems && auctionItems.length > 0) {
        setItems(auctionItems.map(item => ({
          item_id: item.id,
          description: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price || 0,
          tax_rate: 18, // default GST
        })));
      } else {
        // Fallback: single item from auction itself
        setItems([{
          item_id: auction.id,
          description: auction.title,
          quantity: auction.quantity,
          unit: auction.unit,
          unit_price: winningPrice,
          tax_rate: 18,
        }]);
      }

      // Load supplier name
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, contact_person')
        .eq('id', winnerSupplierId)
        .single();

      if (profile) {
        setSupplierName(profile.company_name || profile.contact_person || 'Supplier');
      }
    }
    loadItems();
  }, [auction.id, winnerSupplierId, winningPrice]);

  const updateItem = (index: number, field: keyof POLineItem, value: number | string) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleTaxChange = (index: number, value: string) => {
    if (value === 'custom') {
      const custom = prompt('Enter custom tax %');
      if (custom && !isNaN(Number(custom))) {
        updateItem(index, 'tax_rate', Number(custom));
      }
    } else {
      updateItem(index, 'tax_rate', Number(value));
    }
  };

  const totals = useMemo(() => calculatePOTotals(items, freight), [items, freight]);

  const handleGenerate = async () => {
    const po = await generatePO({
      auctionId: auction.id,
      auctionTitle: auction.title,
      supplierId: winnerSupplierId,
      supplierName,
      items,
      freight,
      currency: 'INR',
    });

    if (po) {
      setPOCreated(true);
      onPOCreated?.();
    }
  };

  if (poCreated) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="py-6 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="font-semibold text-emerald-800">Purchase Order Created</h3>
          <p className="text-sm text-emerald-700">
            PO has been generated for {formatINR(totals.grandTotal)} and saved to your documents.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Generate Purchase Order</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">Awarded to {supplierName}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SKU Table */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Line Items</Label>
          {items.map((item, idx) => (
            <div key={item.item_id} className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.description}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.quantity} {item.unit}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Unit Price (₹)</Label>
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Tax Rate</Label>
                  <Select
                    value={TAX_OPTIONS.find(t => t.value === String(item.tax_rate)) ? String(item.tax_rate) : 'custom'}
                    onValueChange={v => handleTaxChange(idx, v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                Line total: {formatINR(item.unit_price * item.quantity)} + {formatINR((item.tax_rate / 100) * item.unit_price * item.quantity)} tax
              </div>
            </div>
          ))}
        </div>

        {/* Freight */}
        <div className="flex items-center gap-3">
          <Truck className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm">Freight</Label>
          <div className="relative flex-1 max-w-[160px]">
            <IndianRupee className="w-3.5 h-3.5 absolute left-2.5 top-2 text-muted-foreground" />
            <Input
              type="number"
              value={freight}
              onChange={e => setFreight(Number(e.target.value))}
              className="h-8 text-sm pl-7"
              placeholder="0"
            />
          </div>
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatINR(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span>{formatINR(totals.taxTotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Freight</span>
            <span>{formatINR(freight)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span>Grand Total</span>
            <span className="text-primary">{formatINR(totals.grandTotal)}</span>
          </div>
        </div>

        {/* AI Notes Preview */}
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Auto-generated Notes</p>
          <p className="text-xs text-muted-foreground italic">
            {generatePONotes(items, auction.title)}
          </p>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || items.length === 0 || totals.grandTotal <= 0}
          className="w-full gap-2"
          size="lg"
        >
          <FileText className="w-4 h-4" />
          {isGenerating ? 'Generating PO...' : 'Generate Purchase Order'}
        </Button>
      </CardContent>
    </Card>
  );
}
