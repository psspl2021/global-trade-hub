/**
 * Create Reverse Auction Form — Buyer Tool
 * Allows buyers to set up a reverse auction with invited suppliers
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Gavel, Plus, X, Clock, IndianRupee } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useReverseAuction, CreateAuctionInput } from '@/hooks/useReverseAuction';

const CATEGORIES = [
  'Metals - Ferrous', 'Metals - Non Ferrous', 'Polymers & Plastics',
  'Chemicals', 'Building Materials', 'Industrial Supplies',
  'Packaging Materials', 'Energy & Power', 'Textiles & Fabrics'
];

const DURATION_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '24 hours', value: 1440 },
];

interface CreateReverseAuctionFormProps {
  onCreated?: () => void;
}

export function CreateReverseAuctionForm({ onCreated }: CreateReverseAuctionFormProps) {
  const { createAuction } = useReverseAuction();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [product, setProduct] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('MT');
  const [startingPrice, setStartingPrice] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [transactionType, setTransactionType] = useState('domestic');
  const [minBidStep, setMinBidStep] = useState('0.25');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [invitedSuppliers, setInvitedSuppliers] = useState<string[]>([]);

  const addSupplier = () => {
    if (supplierEmail.trim() && !invitedSuppliers.includes(supplierEmail.trim())) {
      setInvitedSuppliers(prev => [...prev, supplierEmail.trim()]);
      setSupplierEmail('');
    }
  };

  const removeSupplier = (email: string) => {
    setInvitedSuppliers(prev => prev.filter(s => s !== email));
  };

  const handleSubmit = async () => {
    if (!title || !product || !category || !quantity || !startingPrice) {
      return;
    }

    setIsSubmitting(true);
    const now = new Date();
    const end = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const input: CreateAuctionInput = {
      title,
      product_slug: product.toLowerCase().replace(/\s+/g, '-'),
      category,
      quantity: parseFloat(quantity),
      unit,
      starting_price: parseFloat(startingPrice),
      reserve_price: reservePrice ? parseFloat(reservePrice) : undefined,
      auction_start: now.toISOString(),
      auction_end: end.toISOString(),
      transaction_type: transactionType,
      minimum_bid_step_pct: parseFloat(minBidStep),
      invited_supplier_ids: invitedSuppliers,
    };

    const result = await createAuction(input);
    setIsSubmitting(false);

    if (result) {
      setOpen(false);
      resetForm();
      onCreated?.();
    }
  };

  const resetForm = () => {
    setTitle('');
    setProduct('');
    setCategory('');
    setQuantity('');
    setStartingPrice('');
    setReservePrice('');
    setInvitedSuppliers([]);
    setSupplierEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
          <Gavel className="w-4 h-4" />
          Create Reverse Auction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-amber-600" />
            Create Reverse Auction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div>
            <Label htmlFor="title">Auction Title</Label>
            <Input id="title" placeholder="e.g. HR Coil Q2 Procurement" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {/* Product & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product">Product</Label>
              <Input id="product" placeholder="e.g. HR Coil IS2062" value={product} onChange={e => setProduct(e.target.value)} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input id="qty" type="number" placeholder="500" value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
            <div>
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MT">MT</SelectItem>
                  <SelectItem value="KG">KG</SelectItem>
                  <SelectItem value="Pcs">Pieces</SelectItem>
                  <SelectItem value="Ltrs">Litres</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startPrice">Starting Price (per {unit})</Label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input id="startPrice" type="number" className="pl-8" placeholder="61000" value={startingPrice} onChange={e => setStartingPrice(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="reservePrice">Reserve Price (optional)</Label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input id="reservePrice" type="number" className="pl-8" placeholder="55000" value={reservePrice} onChange={e => setReservePrice(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Auction Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Duration</Label>
              <Select value={String(durationMinutes)} onValueChange={v => setDurationMinutes(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(d => <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Min Bid Step (%)</Label>
              <Input type="number" step="0.05" value={minBidStep} onChange={e => setMinBidStep(e.target.value)} />
            </div>
            <div>
              <Label>Trade Type</Label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="domestic">Domestic</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Invite Suppliers */}
          <div>
            <Label>Invite Suppliers (by ID)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Supplier User ID"
                value={supplierEmail}
                onChange={e => setSupplierEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSupplier())}
              />
              <Button variant="outline" size="icon" onClick={addSupplier}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {invitedSuppliers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {invitedSuppliers.map(s => (
                  <Badge key={s} variant="secondary" className="gap-1">
                    {s.slice(0, 8)}...
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeSupplier(s)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="py-3">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Anti-Sniping Protection</p>
                  <p className="text-xs mt-1">If a bid is placed in the last 30 seconds, the auction automatically extends by 60 seconds.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating...' : 'Create Reverse Auction'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
