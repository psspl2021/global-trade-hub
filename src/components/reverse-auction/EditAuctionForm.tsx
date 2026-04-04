/**
 * Edit Auction Form — Full RFQ-style edit with line items
 * Prefills data from existing auction + items
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Pencil, Plus, Trash2, Package, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useReverseAuction, ReverseAuction } from '@/hooks/useReverseAuction';
import { toast } from 'sonner';

const UNIT_OPTIONS = [
  { label: 'MT', value: 'MT' },
  { label: 'KG', value: 'KG' },
  { label: 'Pieces', value: 'Pcs' },
  { label: 'Litres', value: 'Ltrs' },
];

const CATEGORIES = [
  'Metals - Ferrous', 'Metals - Non Ferrous', 'Polymers & Plastics',
  'Chemicals', 'Building Materials', 'Industrial Supplies',
  'Packaging Materials', 'Energy & Power', 'Textiles & Fabrics'
];

interface LineItem {
  product_name: string;
  quantity: string;
  unit: string;
  description: string;
  category: string;
}

interface EditAuctionFormProps {
  auction: ReverseAuction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export function EditAuctionForm({ auction, open, onOpenChange, onUpdated }: EditAuctionFormProps) {
  const { updateAuction } = useReverseAuction();

  const [title, setTitle] = useState(auction.title || '');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState(String(auction.starting_price || ''));
  const [quantity, setQuantity] = useState(String(auction.quantity || ''));
  const [unit, setUnit] = useState(auction.unit || 'MT');
  const [destinationCountry, setDestinationCountry] = useState('India');
  const [destinationState, setDestinationState] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [certifications, setCertifications] = useState('');
  const [qualityStandards, setQualityStandards] = useState('');
  const [deadline, setDeadline] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load auction details + items when dialog opens
  useEffect(() => {
    if (!open) return;
    const loadData = async () => {
      setIsLoading(true);
      // Load auction RFQ fields
      const { data: auctionData } = await supabase
        .from('reverse_auctions')
        .select('*')
        .eq('id', auction.id)
        .single();

      if (auctionData) {
        const a = auctionData as any;
        setTitle(a.title || '');
        setDescription(a.description || '');
        setStartingPrice(String(a.starting_price || ''));
        setQuantity(String(a.quantity || ''));
        setUnit(a.unit || 'MT');
        setDestinationCountry(a.destination_country || 'India');
        setDestinationState(a.destination_state || '');
        setDeliveryAddress(a.delivery_address || '');
        setPaymentTerms(a.payment_terms || '');
        setCertifications(a.certifications || '');
        setQualityStandards(a.quality_standards || '');
        setDeadline(a.deadline ? new Date(a.deadline).toISOString().split('T')[0] : '');
      }

      // Load line items
      const { data: itemsData } = await supabase
        .from('reverse_auction_items')
        .select('*')
        .eq('auction_id', auction.id)
        .order('created_at');

      if (itemsData && itemsData.length > 0) {
        setItems(itemsData.map((it: any) => ({
          product_name: it.product_name || '',
          quantity: String(it.quantity || ''),
          unit: it.unit || 'MT',
          description: it.description || '',
          category: it.category || auction.category || '',
        })));
      } else {
        // Fallback: single item from auction
        setItems([{
          product_name: auction.product_slug?.replace(/-/g, ' ') || '',
          quantity: String(auction.quantity || ''),
          unit: auction.unit || 'MT',
          description: '',
          category: auction.category || '',
        }]);
      }
      setIsLoading(false);
    };
    loadData();
  }, [open, auction.id, auction.product_slug, auction.quantity, auction.unit]);

  const addItem = () => setItems(prev => [...prev, { product_name: '', quantity: '', unit: 'MT', description: '' }]);
  const removeItem = (i: number) => { if (items.length > 1) setItems(prev => prev.filter((_, idx) => idx !== i)); };
  const updateItem = (i: number, key: keyof LineItem, value: string) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: value } : item));
  };

  const editCount = (auction as any).buyer_edit_count || 0;

  const handleSave = async () => {
    if (editCount >= 2) {
      toast.error('Maximum 2 edits allowed per auction');
      return;
    }

    const validItems = items.filter(i => i.product_name.trim() && i.quantity.trim());
    if (validItems.length === 0) {
      toast.error('At least one product item is required');
      return;
    }

    setIsSaving(true);
    try {
      const totalQty = validItems.reduce((sum, i) => sum + parseFloat(i.quantity || '0'), 0);
      const slug = validItems.map(i => i.product_name.toLowerCase().replace(/\s+/g, '-')).join('_');

      const result = await updateAuction(auction.id, {
        title: title || undefined,
        starting_price: startingPrice ? parseFloat(startingPrice) : undefined,
        quantity: totalQty,
        unit: validItems[0].unit,
        product_slug: slug,
        description: description || undefined,
        destination_country: destinationCountry || undefined,
        destination_state: destinationState || undefined,
        delivery_address: deliveryAddress || undefined,
        payment_terms: paymentTerms || undefined,
        certifications: certifications || undefined,
        quality_standards: qualityStandards || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        line_items: validItems.map(i => ({
          product_name: i.product_name,
          quantity: parseFloat(i.quantity || '0'),
          unit: i.unit,
          description: i.description || undefined,
          category: auction.category,
        })),
      }, editCount);

      if (result) {
        onOpenChange(false);
        onUpdated?.();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" />
            Edit Auction
          </DialogTitle>
          <DialogDescription>
            Update auction details and line items. ({editCount}/2 edits used)
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading auction data...</div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Title */}
            <div>
              <Label>Auction Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            {/* Line Items */}
            <div>
              <Label className="flex items-center gap-1.5 mb-2">
                <Package className="w-3.5 h-3.5" />
                Products / Line Items
              </Label>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="space-y-1.5 p-2.5 rounded-lg border border-border/50 bg-muted/20">
                    <div className="grid grid-cols-[1fr_100px_90px_32px] gap-2 items-end">
                      <div>
                        {i === 0 && <span className="text-xs text-muted-foreground">Product</span>}
                        <Input
                          placeholder="e.g. HR Coil IS2062"
                          value={item.product_name}
                          onChange={e => updateItem(i, 'product_name', e.target.value)}
                        />
                      </div>
                      <div>
                        {i === 0 && <span className="text-xs text-muted-foreground">Qty</span>}
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateItem(i, 'quantity', e.target.value)}
                        />
                      </div>
                      <div>
                        {i === 0 && <span className="text-xs text-muted-foreground">Unit</span>}
                        <Select value={item.unit} onValueChange={v => updateItem(i, 'unit', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map(u => (
                              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9" disabled={items.length <= 1} onClick={() => removeItem(i)}>
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Product description / specs (optional)"
                      value={item.description}
                      onChange={e => updateItem(i, 'description', e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-2 gap-1 text-primary">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </Button>
            </div>

            {/* Description */}
            <div>
              <Label>Description / Specifications</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Starting Price */}
            <div>
              <Label>Starting Price (₹ per {unit})</Label>
              <Input type="number" value={startingPrice} onChange={e => setStartingPrice(e.target.value)} />
            </div>

            {/* Delivery & RFQ Details */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-sm font-semibold">🌍 Delivery & RFQ Details</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Destination Country</Label>
                  <Input value={destinationCountry} onChange={e => setDestinationCountry(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Destination State</Label>
                  <Input value={destinationState} onChange={e => setDestinationState(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Delivery Address</Label>
                <Input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} />
              </div>
            </div>

            {/* Commercial Terms */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-sm font-semibold">📜 Commercial Terms</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Terms</Label>
                  <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Certifications</Label>
                  <Input value={certifications} onChange={e => setCertifications(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Quality Standards</Label>
                  <Input value={qualityStandards} onChange={e => setQualityStandards(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Procurement Deadline</Label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading || editCount >= 2} className="gap-1">
            <Save className="w-3 h-3" />
            {isSaving ? 'Saving...' : `Save Changes (${editCount}/2)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
