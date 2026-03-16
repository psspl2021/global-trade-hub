/**
 * Create Reverse Auction Form — Enterprise Edition
 * Features:
 * 1) AI-generated title from multi-line items
 * 2) Multiple product line items (+ Add Product)
 * 3) Supplier search + manual add supplier
 * 4) First 5 domestic auctions → 50% fee discount
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Gavel, Plus, X, Clock, IndianRupee, Search, Sparkles, Shield, TrendingUp, Receipt, UserPlus, Trash2, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useReverseAuction, CreateAuctionInput } from '@/hooks/useReverseAuction';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSuggestedStartingPrice, getMarketBenchmark, type RFQSignal } from '@/utils/aiAuctionPricing';
import { getAuctionFee, formatINR } from '@/utils/auctionPricing';
import { generateAuctionTitle, type AuctionLineItem } from '@/utils/generateAuctionTitle';
import { parseAuctionTitle } from '@/utils/parseAuctionTitle';
import { useAuth } from '@/hooks/useAuth';

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

const UNIT_OPTIONS = [
  { label: 'MT', value: 'MT' },
  { label: 'KG', value: 'KG' },
  { label: 'Pieces', value: 'Pcs' },
  { label: 'Litres', value: 'Ltrs' },
];

interface SupplierOption {
  id: string;
  company_name: string;
  contact_person: string;
  city: string | null;
  manual?: boolean;
}

function calculateEndTime(date: string, time: string, durationMinutes: number): Date | null {
  if (!date || !time) return null;
  const start = new Date(`${date}T${time}`);
  if (isNaN(start.getTime())) return null;
  return new Date(start.getTime() + durationMinutes * 60 * 1000);
}

interface CreateReverseAuctionFormProps {
  onCreated?: () => void;
}

export function CreateReverseAuctionForm({ onCreated }: CreateReverseAuctionFormProps) {
  const { createAuction } = useReverseAuction();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Multi Line Items (Feature #2) ──
  const [items, setItems] = useState<AuctionLineItem[]>([
    { product: '', quantity: '', unit: 'MT' }
  ]);

  const addLineItem = () => {
    setItems(prev => [...prev, { product: '', quantity: '', unit: 'MT' }]);
  };

  const updateItem = (index: number, key: keyof AuctionLineItem, value: string) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Form state
  const [category, setCategory] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [minBidStep, setMinBidStep] = useState('0.25');
  const [transactionType, setTransactionType] = useState('domestic');

  // ── AI Title (Feature #1) ──
  const [auctionTitle, setAuctionTitle] = useState('');
  useEffect(() => {
    if (auctionTitle) return;
    const title = generateAuctionTitle(items, transactionType);
    if (title) {
      setAuctionTitle(title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, transactionType]);

  // ── Supplier Search + Manual Add (Feature #3) ──
  const [supplierSearch, setSupplierSearch] = useState('');
  const [allSuppliers, setAllSuppliers] = useState<SupplierOption[]>([]);
  const [invitedSuppliers, setInvitedSuppliers] = useState<SupplierOption[]>([]);
  const [showResults, setShowResults] = useState(false);

  // ── Buyer Auction Count for Discount (Feature #4) ──
  const [buyerAuctionCount, setBuyerAuctionCount] = useState<number>(0);

  // RFQ signals for AI pricing
  const [rfqSignals, setRfqSignals] = useState<RFQSignal[]>([]);

  useEffect(() => {
    if (!open || !user) return;

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

    const fetchAuctionCount = async () => {
      const { count } = await supabase
        .from('reverse_auctions')
        .select('id', { count: 'exact', head: true })
        .eq('buyer_id', user.id);
      setBuyerAuctionCount(count || 0);
    };

    fetchSuppliers();
    fetchRFQSignals();
    fetchAuctionCount();
  }, [open, user]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return [];
    const q = supplierSearch.toLowerCase();
    const invitedIds = new Set(invitedSuppliers.filter(s => !s.manual).map(s => s.id));
    return allSuppliers
      .filter(s => !invitedIds.has(s.id) && (
        (s.company_name || '').toLowerCase().includes(q) ||
        (s.contact_person || '').toLowerCase().includes(q)
      ))
      .slice(0, 8);
  }, [supplierSearch, allSuppliers, invitedSuppliers]);

  const addSupplier = (supplier: SupplierOption) => {
    if (invitedSuppliers.some(s => s.id === supplier.id)) return;
    if (invitedSuppliers.length >= 20) {
      toast.error('Maximum 20 suppliers per auction');
      return;
    }
    setInvitedSuppliers(prev => [...prev, supplier]);
    setSupplierSearch('');
    setShowResults(false);
  };

  const addManualSupplier = () => {
    const name = supplierSearch.trim();
    if (!name) return;
    if (invitedSuppliers.length >= 20) {
      toast.error('Maximum 20 suppliers per auction');
      return;
    }
    const manualSupplier: SupplierOption = {
      id: `manual-${Date.now()}`,
      company_name: name,
      contact_person: '',
      city: null,
      manual: true,
    };
    setInvitedSuppliers(prev => [...prev, manualSupplier]);
    setSupplierSearch('');
    setShowResults(false);
  };

  const removeSupplier = (id: string) => {
    setInvitedSuppliers(prev => prev.filter(s => s.id !== id));
  };

  // AI suggested pricing (based on first item)
  const primaryProduct = items[0]?.product || '';
  const primaryUnit = items[0]?.unit || 'MT';
  const productSlug = useMemo(() => primaryProduct.toLowerCase().replace(/\s+/g, '-'), [primaryProduct]);
  const suggestedPrice = useMemo(() => {
    if (!primaryProduct) return null;
    return getSuggestedStartingPrice(productSlug, rfqSignals);
  }, [primaryProduct, productSlug, rfqSignals]);

  const benchmarkPrice = useMemo(() => {
    if (!primaryProduct) return null;
    return getMarketBenchmark(productSlug, rfqSignals);
  }, [primaryProduct, productSlug, rfqSignals]);

  // Calculated end time
  const auctionEnd = useMemo(() => calculateEndTime(startDate, startTime, durationMinutes), [startDate, startTime, durationMinutes]);

  // Auction fee with discount logic (Feature #4)
  const auctionFee = useMemo(() => getAuctionFee(transactionType, buyerAuctionCount), [transactionType, buyerAuctionCount]);

  const handleSubmit = async () => {
    const validItems = items.filter(i => i.product.trim() && i.quantity.trim());

    if (!auctionTitle || validItems.length === 0 || !category || !startDate || !startTime) {
      toast.error('Please fill all required fields and add at least one product.');
      return;
    }

    if (invitedSuppliers.length === 0) {
      toast.error('Please invite at least one supplier to start the reverse auction.');
      return;
    }

    if (!startingPrice || parseFloat(startingPrice) <= 0) {
      toast.error('Starting price is required for reverse auctions.');
      return;
    }

    const start = new Date(`${startDate}T${startTime}`);
    if (start < new Date()) {
      toast.error('Auction start time must be in the future.');
      return;
    }

    if (reservePrice && parseFloat(reservePrice) >= parseFloat(startingPrice)) {
      toast.error('Reserve price must be lower than the starting price.');
      return;
    }

    if (!auctionEnd) {
      toast.error('Could not calculate auction end time.');
      return;
    }

    if (!auctionFee) {
      toast.error('Could not calculate auction fee.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Record payment
      const { data: payment, error: payError } = await supabase
        .from('auction_payments')
        .insert({
          buyer_id: user!.id,
          transaction_type: transactionType,
          base_fee: auctionFee.base,
          gst: auctionFee.gst,
          total_amount: auctionFee.total,
          payment_status: 'paid',
        } as any)
        .select()
        .single();

      if (payError) {
        toast.error('Auction payment failed: ' + payError.message);
        setIsSubmitting(false);
        return;
      }

      // Build product slug from all items
      const combinedSlug = validItems.map(i => i.product.toLowerCase().replace(/\s+/g, '-')).join('_');
      const totalQty = validItems.reduce((sum, i) => sum + parseFloat(i.quantity || '0'), 0);

      // Step 2: Create auction
      const input: CreateAuctionInput = {
        title: auctionTitle,
        product_slug: combinedSlug,
        category,
        quantity: totalQty,
        unit: validItems[0].unit,
        starting_price: parseFloat(startingPrice),
        reserve_price: reservePrice ? parseFloat(reservePrice) : undefined,
        auction_start: start.toISOString(),
        auction_end: auctionEnd.toISOString(),
        transaction_type: transactionType,
        minimum_bid_step_pct: parseFloat(minBidStep),
        invited_supplier_ids: invitedSuppliers.filter(s => !s.manual).map(s => s.id),
      };

      const result = await createAuction(input);

      // Step 3: Link payment to auction
      if (result && payment) {
        await supabase
          .from('auction_payments')
          .update({ auction_id: (result as any).id } as any)
          .eq('id', (payment as any).id);
      }

      if (result) {
        setOpen(false);
        resetForm();
        onCreated?.();
      }
    } catch (err: any) {
      toast.error('Failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setItems([{ product: '', quantity: '', unit: 'MT' }]);
    setCategory('');
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
          {/* ── AI Generated Title (Feature #1) ── */}
          <div>
            <Label className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              AI Generated Auction Title
            </Label>
            <Input
              value={auctionTitle}
              onChange={(e) => {
                const value = e.target.value;
                setAuctionTitle(value);
                const parsed = parseAuctionTitle(value);
                if (parsed.length > 0) {
                  setItems(parsed.map(p => ({
                    product: p.product,
                    quantity: p.quantity,
                    unit: p.unit || 'MT',
                  })));
                }
              }}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData('text');
                const parsed = parseAuctionTitle(pasted);
                if (parsed.length > 0) {
                  e.preventDefault();
                  setAuctionTitle(pasted);
                  setItems(parsed.map(p => ({
                    product: p.product,
                    quantity: p.quantity,
                    unit: p.unit || 'MT',
                  })));
                }
              }}
              placeholder="e.g. hr coil 2mm 30 ton, 5mm 10 ton — auto-fills line items"
              className="mt-1"
            />
            {auctionTitle && (
              <p className="text-xs text-muted-foreground mt-1">Auto-generated — you can edit if needed</p>
            )}
          </div>

          {/* ── Multi Line Items (Feature #2) ── */}
          <div>
            <Label className="flex items-center gap-1.5 mb-2">
              <Package className="w-3.5 h-3.5" />
              Products / Line Items
            </Label>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_100px_90px_32px] gap-2 items-end">
                  <div>
                    {i === 0 && <span className="text-xs text-muted-foreground">Product</span>}
                    <Input
                      placeholder="e.g. HR Coil IS2062"
                      value={item.product}
                      onChange={e => updateItem(i, 'product', e.target.value)}
                    />
                  </div>
                  <div>
                    {i === 0 && <span className="text-xs text-muted-foreground">Qty</span>}
                    <Input
                      type="number"
                      placeholder="500"
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    disabled={items.length <= 1}
                    onClick={() => removeItem(i)}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLineItem}
              className="mt-2 gap-1 text-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Product
            </Button>
          </div>

          {/* Category */}
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startPrice">Starting Price (per {primaryUnit}) *</Label>
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
                      Market benchmark: {formatINR(benchmarkPrice)} • Suggested starting price: <strong>{formatINR(suggestedPrice)}</strong>
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

          {/* ── Auction Platform Fee with Discount (Feature #4) ── */}
          {auctionFee && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-3">
                <div className="flex items-start gap-2">
                  <Receipt className="w-4 h-4 text-primary mt-0.5" />
                  <div className="text-sm w-full">
                    <p className="font-semibold text-foreground">{auctionFee.label}</p>
                    {auctionFee.discountApplied && (
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                          🎉 50% Launch Discount Applied
                        </Badge>
                        <span className="text-xs text-muted-foreground line-through">
                          {formatINR(auctionFee.originalBase || 5000)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({5 - buyerAuctionCount} discount auction{5 - buyerAuctionCount !== 1 ? 's' : ''} remaining)
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Platform Fee</p>
                        <p className="font-medium text-foreground">{formatINR(auctionFee.base)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">GST (18%)</p>
                        <p className="font-medium text-foreground">{formatINR(auctionFee.gst)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Payable</p>
                        <p className="font-bold text-primary">{formatINR(auctionFee.total)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Payment required before auction goes live.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {auctionEnd && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Auction ends: <span className="font-medium text-foreground">{auctionEnd.toLocaleString()}</span>
            </div>
          )}

          {/* ── Supplier Search & Manual Add (Feature #3) ── */}
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
                onBlur={() => { setTimeout(() => setShowResults(false), 150); }}
              />
            </div>

            {/* Search results dropdown */}
            {showResults && supplierSearch.trim() && (
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

                {/* Manual add option when no DB matches */}
                {filteredSuppliers.length === 0 && (
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-accent/50 flex items-center gap-2 text-sm transition-colors text-primary"
                    onMouseDown={addManualSupplier}
                  >
                    <UserPlus className="w-4 h-4" />
                    Add "{supplierSearch.trim()}" as manual supplier
                  </button>
                )}
              </div>
            )}

            {/* Invited suppliers tags */}
            {invitedSuppliers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {invitedSuppliers.map(s => (
                  <Badge key={s.id} variant="secondary" className="gap-1 pr-1">
                    {s.company_name}
                    {s.manual && <span className="text-[10px] opacity-60">(manual)</span>}
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
            {isSubmitting ? 'Processing Payment...' : `Pay ${auctionFee ? formatINR(auctionFee.total) : ''} & Create Auction`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
