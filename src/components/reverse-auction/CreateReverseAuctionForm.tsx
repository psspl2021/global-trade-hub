/**
 * Create Reverse Auction Form — Buyer Tool
 * AI-generated title, supplier search, manual start date/time, auto end calculation
 * Validations: supplier invite required, future start time, reserve < starting price
 * AI suggested starting price from RFQ analytics
 */
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Gavel, Plus, X, Clock, IndianRupee, Search, Sparkles, Shield, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useReverseAuction, CreateAuctionInput } from '@/hooks/useReverseAuction';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSuggestedStartingPrice, getMarketBenchmark, type RFQSignal } from '@/utils/aiAuctionPricing';

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

interface SupplierOption {
  id: string;
  company_name: string;
  contact_person: string;
  city: string | null;
}

function generateAuctionTitle(product: string, quantity: string, unit: string, tradeType: string): string {
  if (!product || !quantity) return '';
  const tradeLabel = tradeType === 'domestic' ? 'Domestic' : tradeType === 'import' ? 'Import' : 'Export';
  return `${product} – ${quantity} ${unit} Reverse Auction (${tradeLabel})`;
}

function calculateEndTime(date: string, time: string, durationMinutes: number): Date | null {
  if (!date || !time) return null;
  const start = new Date(`${date}T${time}`);
  if (isNaN(start.getTime())) return null;
  return new Date(start.getTime() + durationMinutes * 60 * 1000);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

interface CreateReverseAuctionFormProps {
  onCreated?: () => void;
}

export function CreateReverseAuctionForm({ onCreated }: CreateReverseAuctionFormProps) {
  const { createAuction } = useReverseAuction();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [product, setProduct] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('MT');
  const [startingPrice, setStartingPrice] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [minBidStep, setMinBidStep] = useState('0.25');
  const [transactionType, setTransactionType] = useState('domestic');

  // AI title
  const [auctionTitle, setAuctionTitle] = useState('');
  useEffect(() => {
    setAuctionTitle(generateAuctionTitle(product, quantity, unit, transactionType));
  }, [product, quantity, unit, transactionType]);

  // Supplier search
  const [supplierSearch, setSupplierSearch] = useState('');
  const [allSuppliers, setAllSuppliers] = useState<SupplierOption[]>([]);
  const [invitedSuppliers, setInvitedSuppliers] = useState<SupplierOption[]>([]);
  const [showResults, setShowResults] = useState(false);

  // RFQ signals for AI pricing
  const [rfqSignals, setRfqSignals] = useState<RFQSignal[]>([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, company_name, contact_person, city')
        .eq('business_type', 'supplier')
        .order('company_name');
      if (data) setAllSuppliers(data as SupplierOption[]);
    };

    const fetchRFQSignals = async () => {
      const { data } = await supabase
        .from('category_price_benchmarks')
        .select('subcategory, benchmark_price, unit, category');
      if (data) {
        setRfqSignals(
          data.map((d: any) => ({
            product_slug: (d.subcategory || d.category || '').toLowerCase().replace(/\s+/g, '-'),
            avg_price: d.benchmark_price,
          }))
        );
      }
    };

    if (open) {
      fetchSuppliers();
      fetchRFQSignals();
    }
  }, [open]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return [];
    const q = supplierSearch.toLowerCase();
    const invitedIds = new Set(invitedSuppliers.map(s => s.id));
    return allSuppliers
      .filter(s => !invitedIds.has(s.id) && (
        s.company_name.toLowerCase().includes(q) ||
        s.contact_person.toLowerCase().includes(q)
      ))
      .slice(0, 8);
  }, [supplierSearch, allSuppliers, invitedSuppliers]);

  const addSupplier = (supplier: SupplierOption) => {
    setInvitedSuppliers(prev => [...prev, supplier]);
    setSupplierSearch('');
    setShowResults(false);
  };

  const removeSupplier = (id: string) => {
    setInvitedSuppliers(prev => prev.filter(s => s.id !== id));
  };

  // AI suggested pricing
  const productSlug = useMemo(() => product.toLowerCase().replace(/\s+/g, '-'), [product]);
  const suggestedPrice = useMemo(() => {
    if (!product) return null;
    return getSuggestedStartingPrice(productSlug, rfqSignals);
  }, [product, productSlug, rfqSignals]);

  const benchmarkPrice = useMemo(() => {
    if (!product) return null;
    return getMarketBenchmark(productSlug, rfqSignals);
  }, [product, productSlug, rfqSignals]);

  // Calculated end time
  const auctionEnd = useMemo(() => calculateEndTime(startDate, startTime, durationMinutes), [startDate, startTime, durationMinutes]);

  const handleSubmit = async () => {
    // === VALIDATION ===

    if (!auctionTitle || !product || !category || !quantity || !startDate || !startTime) {
      toast.error('Please fill all required fields.');
      return;
    }

    // FIX 1: Require at least one invited supplier
    if (invitedSuppliers.length === 0) {
      toast.error('Please invite at least one supplier to start the reverse auction.');
      return;
    }

    // MANDATORY: Starting price required
    if (!startingPrice || parseFloat(startingPrice) <= 0) {
      toast.error('Starting price is required for reverse auctions.');
      return;
    }

    // FIX 2: Prevent past start time
    const start = new Date(`${startDate}T${startTime}`);
    if (start < new Date()) {
      toast.error('Auction start time must be in the future.');
      return;
    }

    // FIX 3: Reserve price must be lower than starting price
    if (reservePrice && parseFloat(reservePrice) >= parseFloat(startingPrice)) {
      toast.error('Reserve price must be lower than the starting price.');
      return;
    }

    if (!auctionEnd) {
      toast.error('Could not calculate auction end time.');
      return;
    }

    setIsSubmitting(true);

    const input: CreateAuctionInput = {
      title: auctionTitle,
      product_slug: productSlug,
      category,
      quantity: parseFloat(quantity),
      unit,
      starting_price: parseFloat(startingPrice),
      reserve_price: reservePrice ? parseFloat(reservePrice) : undefined,
      auction_start: start.toISOString(),
      auction_end: auctionEnd.toISOString(),
      transaction_type: transactionType,
      minimum_bid_step_pct: parseFloat(minBidStep),
      invited_supplier_ids: invitedSuppliers.map(s => s.id),
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
    setProduct('');
    setCategory('');
    setQuantity('');
    setStartingPrice('');
    setReservePrice('');
    setStartDate('');
    setStartTime('');
    setInvitedSuppliers([]);
    setSupplierSearch('');
    setAuctionTitle('');
  };

  const today = new Date().toISOString().split('T')[0];

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
          {/* AI Generated Title */}
          <div>
            <Label className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              AI Generated Auction Title
            </Label>
            <Input
              value={auctionTitle}
              onChange={e => setAuctionTitle(e.target.value)}
              placeholder="Title auto-generates from product, quantity & trade type"
              className="mt-1"
            />
            {auctionTitle && (
              <p className="text-xs text-muted-foreground mt-1">Auto-generated — you can edit if needed</p>
            )}
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
              <Label htmlFor="startPrice">Starting Price (per {unit}) *</Label>
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

          {/* AI Suggested Price */}
          {suggestedPrice && benchmarkPrice && (
            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
              <CardContent className="py-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium">AI Pricing Intelligence</p>
                    <p className="text-xs mt-1">
                      Market benchmark: {formatCurrency(benchmarkPrice)} • Suggested starting price: <strong>{formatCurrency(suggestedPrice)}</strong>
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-blue-700 dark:text-blue-300 mt-1"
                      onClick={() => setStartingPrice(String(suggestedPrice))}
                    >
                      Use suggested price
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Start Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Auction Start Date</Label>
              <Input type="date" min={today} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Auction Start Time</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
          </div>

          {/* Duration, Bid Step, Trade Type */}
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

          {/* Calculated end time display */}
          {auctionEnd && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Auction ends: <span className="font-medium text-foreground">{auctionEnd.toLocaleString()}</span>
            </div>
          )}

          {/* Supplier Search & Invite */}
          <div>
            <Label className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Invite Suppliers *
            </Label>
            <div className="relative mt-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search supplier by name..."
                className="pl-9"
                value={supplierSearch}
                onChange={e => { setSupplierSearch(e.target.value); setShowResults(true); }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
              />
            </div>

            {/* Search results dropdown */}
            {showResults && filteredSuppliers.length > 0 && (
              <div className="border rounded-md mt-1 max-h-48 overflow-y-auto bg-popover shadow-md">
                {filteredSuppliers.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-accent/50 flex items-center justify-between text-sm transition-colors"
                    onMouseDown={() => addSupplier(s)}
                  >
                    <div>
                      <p className="font-medium text-foreground">{s.company_name}</p>
                      <p className="text-xs text-muted-foreground">{s.contact_person}{s.city ? ` • ${s.city}` : ''}</p>
                    </div>
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {supplierSearch.trim() && showResults && filteredSuppliers.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">No matching suppliers found</p>
            )}

            {/* Invited suppliers tags */}
            {invitedSuppliers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {invitedSuppliers.map(s => (
                  <Badge key={s.id} variant="secondary" className="gap-1 pr-1">
                    {s.company_name}
                    <button type="button" onClick={() => removeSupplier(s.id)} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {invitedSuppliers.length === 0 && (
              <p className="text-xs text-destructive mt-1">At least one supplier must be invited</p>
            )}
          </div>

          {/* Anti-Sniping Info */}
          <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="py-3">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Anti-Sniping Protection</p>
                  <p className="text-xs mt-1">If a bid is placed in the last 30 seconds, the auction automatically extends by 60 seconds.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Creating...' : 'Create Reverse Auction'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
