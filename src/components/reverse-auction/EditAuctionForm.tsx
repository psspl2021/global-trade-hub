/**
 * Edit Auction Form — Full RFQ-style edit with line items + supplier management
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { generateAuctionTitle } from '@/utils/generateAuctionTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Plus, Trash2, Package, Save, Users, UserPlus, Mail, X, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useReverseAuction, ReverseAuction } from '@/hooks/useReverseAuction';
import { toast } from 'sonner';
import { getCurrencySymbol, getCurrencyLocale } from '@/lib/currency';

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
  category: string;
  quantity: string;
  unit: string;
  price: string;
  description: string;
}

interface InvitedSupplier {
  id: string;
  supplier_id: string | null;
  supplier_email: string | null;
  supplier_company_name: string | null;
  invite_status: string;
  is_active: boolean;
}

interface EditAuctionFormProps {
  auction: ReverseAuction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export function EditAuctionForm({ auction, open, onOpenChange, onUpdated }: EditAuctionFormProps) {
  const { updateAuction, republishAuction } = useReverseAuction();
  const isRepublishMode = ['cancelled', 'completed', 'expired'].includes((auction as any).status);

  const [title, setTitle] = useState('');
  const [isManualTitle, setIsManualTitle] = useState(false);
  const [autoTitle, setAutoTitle] = useState('');
  const initialTitleRef = useRef('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('MT');
  const [destinationCountry, setDestinationCountry] = useState('India');
  const [destinationState, setDestinationState] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [certifications, setCertifications] = useState('');
  const [qualityStandards, setQualityStandards] = useState('');
  const [deadline, setDeadline] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [minBidStepPct, setMinBidStepPct] = useState(0.25);
  const [transactionType, setTransactionType] = useState('domestic');
  const [items, setItems] = useState<LineItem[]>([]);
  const [suppliers, setSuppliers] = useState<InvitedSupplier[]>([]);
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);

  // ── AI RFQ Generator ──
  const [aiDescription, setAiDescription] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const UNIT_MAP: Record<string, string> = {
    tons: 'MT', ton: 'MT', tonnes: 'MT', mt: 'MT',
    kilograms: 'KG', kilogram: 'KG', kg: 'KG', kgs: 'KG',
    pieces: 'Pcs', piece: 'Pcs', nos: 'Pcs', pcs: 'Pcs',
    liters: 'Ltrs', liter: 'Ltrs', litres: 'Ltrs', ltrs: 'Ltrs',
    meters: 'Meters', meter: 'Meters', sets: 'Sets', set: 'Sets',
    cartons: 'Cartons', carton: 'Cartons', boxes: 'Boxes', box: 'Boxes',
  };
  const normalizeUnit = (u: string) => UNIT_MAP[u?.toLowerCase()?.trim()] || 'MT';

  const CATEGORY_KEYWORDS: Record<string, string[]> = {
    "Metals - Ferrous": ["steel", "hr", "cr", "coil", "plate", "tmt", "rebar", "billet", "slab", "iron", "ferrous"],
    "Metals - Non Ferrous": ["aluminium", "aluminum", "copper", "brass", "zinc", "nickel", "tin", "lead"],
    "Chemicals": ["chemical", "acid", "solvent", "alkali", "reagent", "caustic"],
    "Polymers & Plastics": ["plastic", "polymer", "granule", "hdpe", "ldpe", "pvc", "polypropylene", "nylon"],
    "Minerals & Ores": ["mineral", "ore", "calcium"],
    "Energy & Fuels": ["fuel", "diesel", "petrol", "coal", "gas", "lpg", "oil"],
    "Textiles & Fibers": ["textile", "cotton", "fabric", "yarn", "fiber", "fibre"],
    "Paper & Packaging": ["paper", "cardboard", "packaging", "corrugated", "carton"],
  };

  const handleAiGenerate = useCallback(async () => {
    if (aiDescription.trim().length < 10) {
      toast.error('Please describe your requirement in more detail');
      return;
    }
    setIsAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-rfq', {
        body: { description: aiDescription.trim() }
      });
      if (error) throw new Error(error.message || 'Failed to generate');
      if (data?.error) throw new Error(data.error);
      const rfq = data?.rfq;
      if (!rfq) throw new Error('Invalid AI response');

      const hasExistingItems = items.some(i => i.product_name.trim() !== '');
      if (hasExistingItems) {
        const confirmReplace = window.confirm(
          'This will replace your current items with AI-generated ones. Continue?'
        );
        if (!confirmReplace) { setIsAiGenerating(false); return; }
      }

      if (rfq.items?.length > 0) {
        setItems(rfq.items.map((it: any) => ({
          product_name: it.item_name || '',
          category: '',
          quantity: String(it.quantity || ''),
          unit: normalizeUnit(it.unit || ''),
          price: '',
          description: it.description || '',
        })));
      }

      // Smart category detection
      if (rfq.category) {
        const text = (rfq.category + ' ' + (rfq.items?.map((i: any) => i.item_name).join(' ') || '')).toLowerCase();
        let detected: string | null = null;
        for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
          if (keywords.some(k => text.includes(k))) { detected = cat; break; }
        }
        const matched = detected
          ? CATEGORIES.find(c => c === detected)
          : CATEGORIES.find(c => c.toLowerCase().includes(rfq.category.toLowerCase().split(' ')[0]));
        if (matched) {
          setItems(prev => prev.map(i => ({ ...i, category: matched })));
        }
      }

      if (rfq.title) { setTitle(rfq.title); setIsManualTitle(false); }
      if (rfq.description) setDescription(rfq.description);
      if (rfq.delivery_location) setDeliveryAddress(rfq.delivery_location);
      if (rfq.quality_standards) setQualityStandards(rfq.quality_standards);
      if (rfq.certifications_required) setCertifications(rfq.certifications_required);
      if (rfq.payment_terms) setPaymentTerms(rfq.payment_terms);

      toast.success(`AI generated ${rfq.items?.length || 0} line items! Review & adjust below.`);
    } catch (err: any) {
      console.error('AI RFQ error:', err);
      toast.error(err.message || 'Failed to generate. Please try again.');
    } finally {
      setIsAiGenerating(false);
    }
  }, [aiDescription, items]);

  useEffect(() => {
    if (!open) return;
    const loadData = async () => {
      setIsLoading(true);

      // Load auction + items + suppliers in parallel
      const [auctionRes, itemsRes, suppliersRes] = await Promise.all([
        supabase.from('reverse_auctions').select('*').eq('id', auction.id).single(),
        supabase.from('reverse_auction_items').select('*').eq('auction_id', auction.id).order('created_at'),
        supabase.from('reverse_auction_suppliers').select('*').eq('auction_id', auction.id),
      ]);

      if (auctionRes.data) {
        const a = auctionRes.data as any;
        setTitle(a.title || '');
        initialTitleRef.current = a.title || '';
        setIsManualTitle(false);
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
        setReservePrice(a.reserve_price ? String(a.reserve_price) : '');
        setMinBidStepPct(a.minimum_bid_step_pct || 0.25);
        setTransactionType(a.transaction_type || 'domestic');
        if (a.auction_start) {
          const sd = new Date(a.auction_start);
          setStartDate(sd.toISOString().split('T')[0]);
          setStartTime(sd.toTimeString().slice(0, 5));
          if (a.auction_end) {
            const dur = Math.round((new Date(a.auction_end).getTime() - sd.getTime()) / 60000);
            setDurationMinutes(dur > 0 ? dur : 30);
          }
        }
      }

      if (itemsRes.data && itemsRes.data.length > 0) {
        setItems(itemsRes.data.map((it: any) => ({
          product_name: it.product_name || '',
          category: it.category || '',
          quantity: String(it.quantity || ''),
          unit: it.unit || 'MT',
          price: String(it.unit_price || ''),
          description: it.description || '',
        })));
      } else {
        setItems([{
          product_name: auction.product_slug?.replace(/-/g, ' ') || '',
          category: auction.category || '',
          quantity: String(auction.quantity || ''),
          unit: auction.unit || 'MT',
          price: '',
          description: '',
        }]);
      }

      setSuppliers((suppliersRes.data || []).map((s: any) => ({
        id: s.id,
        supplier_id: s.supplier_id,
        supplier_email: s.supplier_email,
        supplier_company_name: s.supplier_company_name,
        invite_status: s.invite_status || 'pending',
        is_active: s.is_active !== false,
      })));

      setIsLoading(false);
    };
    loadData();
  }, [open, auction.id]);

  // Auto-calculated total order value from line items
  const calculatedTotal = useMemo(() => {
    const raw = items.reduce((sum, i) => sum + (Math.round(Number(i.quantity || 0) * 100) / 100) * (Math.round(Number(i.price || 0) * 100) / 100), 0);
    return Math.round(raw * 100) / 100;
  }, [items]);

  // Auto-title from items
  useEffect(() => {
    const generated = generateAuctionTitle(
      items.map(i => ({ product: i.product_name, quantity: i.quantity, unit: i.unit, category: i.category || auction.category })),
      (auction as any).transaction_type || 'domestic'
    );
    setAutoTitle(generated);
    if (!isManualTitle && generated && title === initialTitleRef.current) {
      setTitle(generated);
    }
  }, [items, auction.category, isManualTitle]);

  const addItem = () => setItems(prev => [...prev, { product_name: '', category: '', quantity: '', unit: 'MT', price: '', description: '' }]);
  const removeItem = (i: number) => { if (items.length > 1) setItems(prev => prev.filter((_, idx) => idx !== i)); };
  const updateItem = (i: number, key: keyof LineItem, value: string) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: value } : item));
  };

  const editCount = (auction as any).buyer_edit_count || 0;

  // Supplier management
  const activeSuppliers = suppliers.filter(s => s.is_active);
  const addSupplier = async () => {
    const email = newSupplierEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid email');
      return;
    }
    if (activeSuppliers.some(s => s.supplier_email === email)) {
      toast.error('Supplier already invited');
      return;
    }
    setIsAddingSupplier(true);
    try {
      // ── Supplier Limit Check (server-enforced, max 20) ──
      const { checkSupplierLimit } = await import('@/hooks/useAuctionLimits');
      const supplierCheck = await checkSupplierLimit(auction.id);
      if (!supplierCheck.valid) {
        toast.error(supplierCheck.reason || 'Maximum 20 suppliers per auction.');
        setIsAddingSupplier(false);
        return;
      }

      // Resolve supplier_id from profiles if the email matches an existing user
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      const { data, error } = await supabase.from('reverse_auction_suppliers').insert({
        auction_id: auction.id,
        supplier_email: email,
        supplier_id: profile?.id || null,
        supplier_source: 'buyer_invite',
      } as any).select().single();
      if (error) throw error;
      setSuppliers(prev => [...prev, {
        id: (data as any).id,
        supplier_id: null,
        supplier_email: email,
        supplier_company_name: null,
        invite_status: 'pending',
        is_active: true,
      }]);
      setNewSupplierEmail('');
      toast.success(`Supplier ${email} added`);
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';
      if (code === 'P0001' || msg.includes('Supplier limit reached') || msg.includes('maximum 20')) {
        toast.error('Maximum 20 suppliers allowed per auction.');
      } else {
        toast.error('Failed to add supplier: ' + msg);
      }
    } finally {
      setIsAddingSupplier(false);
    }
  };

  const deactivateSupplier = async (supplier: InvitedSupplier) => {
    try {
      await supabase.from('reverse_auction_suppliers')
        .update({ is_active: false } as any)
        .eq('id', supplier.id);
      setSuppliers(prev => prev.map(s => s.id === supplier.id ? { ...s, is_active: false } : s));
      toast.success('Supplier removed from auction');
    } catch (err: any) {
      toast.error('Failed to remove supplier');
    }
  };

  const reactivateSupplier = async (supplier: InvitedSupplier) => {
    try {
      await supabase.from('reverse_auction_suppliers')
        .update({ is_active: true } as any)
        .eq('id', supplier.id);
      setSuppliers(prev => prev.map(s => s.id === supplier.id ? { ...s, is_active: true } : s));
      toast.success('Supplier re-added');
    } catch (err: any) {
      toast.error('Failed to re-add supplier');
    }
  };

  const handleSave = async () => {
    if (!isRepublishMode && editCount >= 2) {
      toast.error('Maximum 2 edits allowed per auction');
      return;
    }
    const validItems = items.filter(i => i.product_name.trim() && i.quantity.trim());
    if (validItems.length === 0) {
      toast.error('At least one product item is required');
      return;
    }
    const invalidPrice = validItems.some(i => !i.price || Number(i.price) <= 0);
    if (invalidPrice) {
      toast.error('Each line item must have a valid price.');
      return;
    }
    if (validItems.some(i => Number(i.price) > 1e8)) {
      toast.error('Price per item cannot exceed ₹10,00,00,000.');
      return;
    }
    const invalidQty = validItems.some(i => Number(i.quantity) <= 0);
    if (invalidQty) {
      toast.error('Each line item must have a quantity greater than 0.');
      return;
    }
    if (validItems.some(i => Number(i.quantity) > 1e6)) {
      toast.error('Quantity per item cannot exceed 10,00,000.');
      return;
    }
    if (calculatedTotal <= 0) {
      toast.error('Starting price must be greater than 0. Check your line item prices.');
      return;
    }
    setIsSaving(true);
    try {
      const totalQty = validItems.reduce((sum, i) => sum + parseFloat(i.quantity || '0'), 0);
      const slug = validItems.map(i => i.product_name.toLowerCase().replace(/\s+/g, '-')).join('_');

      const updates: any = {
        title: title || undefined,
        starting_price: calculatedTotal,
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
        reserve_price: reservePrice ? Number(reservePrice) : null,
        minimum_bid_step_pct: Number(minBidStepPct),
        transaction_type: transactionType,
        line_items: validItems.map(i => ({
          product_name: i.product_name,
          quantity: parseFloat(i.quantity || '0'),
          unit: i.unit,
          description: i.description || undefined,
          category: i.category || auction.category,
          unit_price: parseFloat(i.price || '0'),
        })),
      };
      if (startDate && startTime) {
        const start = new Date(`${startDate}T${startTime}`);
        if (!isNaN(start.getTime())) {
          updates.auction_start = start.toISOString();
          updates.auction_end = new Date(start.getTime() + durationMinutes * 60000).toISOString();
        }
      }
      // If auction was cancelled/completed/expired, republish first (resets edit count + status to scheduled)
      if (isRepublishMode) {
        await republishAuction(auction.id);
      }
      const result = await updateAuction(auction.id, updates, isRepublishMode ? 0 : editCount);

      if (result) {
        onOpenChange(false);
        onUpdated?.();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const inviteStatusColor: Record<string, string> = {
    sent: 'bg-blue-100 text-blue-700',
    opened: 'bg-amber-100 text-amber-700',
    clicked: 'bg-emerald-100 text-emerald-700',
    bid_submitted: 'bg-purple-100 text-purple-700',
    pending: 'bg-muted text-muted-foreground',
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
            Update auction details, line items, and manage suppliers.
            <span className={`ml-2 font-medium ${editCount >= 2 ? 'text-destructive' : editCount >= 1 ? 'text-amber-600' : 'text-muted-foreground'}`}>
              ({editCount}/2 edits used)
            </span>
            {editCount === 1 && <span className="block mt-1 text-amber-600 text-xs font-medium">⚠ Last edit remaining — make it count!</span>}
            {editCount >= 2 && <span className="block mt-1 text-destructive text-xs font-medium">❌ No edits remaining</span>}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading auction data...</div>
        ) : (
          <div className="space-y-5 py-2">
            {/* ── AI-Assisted Requirement ── */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4 pb-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-semibold">AI-Assisted Requirement (Optional)</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Describe your needs in plain text — AI will auto-fill products, quantities, category & specs below.
                </p>
                <Textarea
                  placeholder="Example: I need 30 MT HR Coil IS2062 E250 and 25 MT HR Plates 10mm, delivery to Pune within 20 days. BIS certified with mill TC."
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  className="min-h-[80px] text-sm bg-background"
                  maxLength={2000}
                />
                <Button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={isAiGenerating || aiDescription.trim().length < 10}
                  className="w-full gap-2"
                  variant="default"
                >
                  {isAiGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate from Description
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Title */}
            <div>
              <Label>Auction Title</Label>
              <Input
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  setIsManualTitle(e.target.value !== autoTitle && e.target.value.length > 0);
                }}
                className="mt-1"
              />
              {title && !isManualTitle && (
                <p className="text-xs text-muted-foreground mt-1">✨ Auto-generated from items — editable</p>
              )}
              {isManualTitle && (
                <button type="button" onClick={() => { setIsManualTitle(false); setTitle(autoTitle); }} className="text-xs text-primary mt-1 hover:underline">
                  ↺ Reset to auto-generated title
                </button>
              )}
            </div>

            {/* ─── Line Items ─── */}
            <div>
              <Label className="flex items-center gap-1.5 mb-2">
                <Package className="w-3.5 h-3.5 text-primary" />
                Products / Line Items
              </Label>
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                    {/* Row 1: Product + Category + Qty + Unit + Price + Remove */}
                    <div className="grid grid-cols-[1fr_1fr_70px_70px_90px_36px] gap-2 items-end">
                      <div>
                        {i === 0 && <span className="text-xs text-muted-foreground mb-0.5 block">Product *</span>}
                        <Input
                          placeholder="e.g. HR Coil IS2062"
                          value={item.product_name}
                          onChange={e => updateItem(i, 'product_name', e.target.value)}
                        />
                      </div>
                      <div>
                        {i === 0 && <span className="text-xs text-muted-foreground mb-0.5 block">Category</span>}
                        <Select value={item.category} onValueChange={v => updateItem(i, 'category', v)}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        {i === 0 && <span className="text-xs text-muted-foreground mb-0.5 block">Qty *</span>}
                        <Input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                      </div>
                      <div>
                        {i === 0 && <span className="text-xs text-muted-foreground mb-0.5 block">Unit</span>}
                        <Select value={item.unit} onValueChange={v => updateItem(i, 'unit', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        {i === 0 && <span className="text-xs text-muted-foreground mb-0.5 block">Price (₹)</span>}
                        <Input type="number" placeholder="61000" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 mt-auto" disabled={items.length <= 1} onClick={() => removeItem(i)}>
                        <Trash2 className="w-4 h-4 text-destructive/70" />
                      </Button>
                    </div>
                    {/* Row 2: Description (full width) */}
                    <Textarea
                      placeholder="Product description / specs (optional)"
                      value={item.description}
                      onChange={e => updateItem(i, 'description', e.target.value)}
                      className="min-h-[60px] text-sm"
                      rows={2}
                    />
                    {item.quantity && item.price && (
                      <p className="text-xs text-muted-foreground text-right">
                        Line total: ₹{(parseFloat(item.quantity || '0') * parseFloat(item.price || '0')).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-2 gap-1 text-primary">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </Button>
            </div>

            {/* Description */}
            <div>
              <Label>Overall Description / Specifications</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1" />
            </div>

            {/* Grand Total Order Value */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Total Order Value (Auto-calculated) 🔒</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {calculatedTotal > 0
                      ? `Sum of ${items.filter(i => i.price && i.quantity).length} line items`
                      : 'Add price & quantity to line items'}
                  </p>
                </div>
                <p className={`text-2xl font-bold ${calculatedTotal > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                  ₹{calculatedTotal.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* ─── Delivery & RFQ Details ─── */}
            <div className="space-y-3 pt-3 border-t border-border">
              <Label className="text-sm font-semibold">🌍 Delivery & RFQ Details</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Destination Country</Label>
                  <Input value={destinationCountry} onChange={e => setDestinationCountry(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Destination State</Label>
                  <Input value={destinationState} onChange={e => setDestinationState(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Delivery Address</Label>
                <Input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} className="mt-1" />
              </div>
            </div>

            {/* ─── Commercial Terms ─── */}
            <div className="space-y-3 pt-3 border-t border-border">
              <Label className="text-sm font-semibold">📜 Commercial Terms</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Terms</Label>
                  <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Certifications</Label>
                  <Input value={certifications} onChange={e => setCertifications(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Quality Standards</Label>
                  <Input value={qualityStandards} onChange={e => setQualityStandards(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Procurement Deadline</Label>
                  <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} min={new Date().toISOString().split('T')[0]} className="mt-1" />
                </div>
              </div>
            </div>

            {/* ─── Auction Scheduling ─── */}
            <div className="space-y-3 pt-3 border-t border-border">
              <Label className="text-sm font-semibold">⏱️ Auction Schedule</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Reserve Price (₹) — Optional</Label>
                  <Input type="number" value={reservePrice} onChange={e => setReservePrice(e.target.value)} placeholder="Optional" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Min Bid Step (%)</Label>
                  <Input type="number" step="0.05" value={minBidStepPct} onChange={e => setMinBidStepPct(Number(e.target.value))} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Auction Start Date</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Auction Start Time</Label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Duration</Label>
                  <select
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(Number(e.target.value))}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={1440}>24 hours</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Trade Type</Label>
                  <select
                    value={transactionType}
                    onChange={e => setTransactionType(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                  >
                    <option value="domestic">Domestic</option>
                    <option value="import">Import</option>
                    <option value="export">Export</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ─── Supplier Management ─── */}
            <div className="space-y-3 pt-3 border-t border-border">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                Invited Suppliers ({activeSuppliers.length})
              </Label>

              {/* Add new supplier */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="supplier@company.com"
                    value={newSupplierEmail}
                    onChange={e => setNewSupplierEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSupplier()}
                    className="pl-8"
                  />
                </div>
                <Button type="button" size="sm" onClick={addSupplier} disabled={isAddingSupplier} className="gap-1 shrink-0">
                  <UserPlus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </div>

              {/* Supplier list */}
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {suppliers.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2 text-center">No suppliers invited yet</p>
                )}
                {suppliers.map(s => (
                  <div key={s.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-md border text-sm ${s.is_active ? 'bg-background border-border' : 'bg-muted/40 border-border/50 opacity-60'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{s.supplier_email || s.supplier_company_name || 'Unknown'}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${inviteStatusColor[s.invite_status] || inviteStatusColor.pending}`}>
                        {s.invite_status}
                      </Badge>
                      {!s.is_active && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-destructive border-destructive/30">removed</Badge>}
                    </div>
                    {s.is_active ? (
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deactivateSupplier(s)}>
                        <X className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    ) : (
                      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs shrink-0" onClick={() => reactivateSupplier(s)}>
                        Re-add
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading || (!isRepublishMode && editCount >= 2)} className="gap-1">
            <Save className="w-3 h-3" />
            {isSaving ? 'Saving...' : isRepublishMode ? 'Republish Auction' : `Save Changes (${editCount}/2)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
