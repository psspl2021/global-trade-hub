/**
 * Create Reverse Auction Form — Enterprise Edition with Wizard UX
 * Features:
 * 1) AI-generated title from multi-line items
 * 2) Multiple product line items (+ Add Product)
 * 3) Supplier search + manual add supplier + AI recommendations
 * 4) Industry templates + Historical price intelligence
 * 5) Guided wizard: AI Input → Review Items → Suppliers → Pricing → Launch
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Gavel, Plus, X, Clock, IndianRupee, Search, Sparkles, Shield, TrendingUp, Receipt, UserPlus, Trash2, Package, Wallet, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useReverseAuction, CreateAuctionInput } from '@/hooks/useReverseAuction';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSuggestedStartingPrice, getMarketBenchmark, type RFQSignal } from '@/utils/aiAuctionPricing';
import { getAuctionFee, formatINR } from '@/utils/auctionPricing';
import { generateAuctionTitle, type AuctionLineItem } from '@/utils/generateAuctionTitle';
import { parseAuctionTitle } from '@/utils/parseAuctionTitle';
import { checkActiveAuctionLimit } from '@/hooks/useAuctionLimits';
import { useAuth } from '@/hooks/useAuth';
import { useCurrencyFormatter, getCurrencySymbol } from '@/lib/currency';
import { SupplierRecommendationPanel } from './SupplierRecommendationPanel';
import { PriceIntelligencePanel } from './PriceIntelligencePanel';
import { RfqTemplateSelector } from './RfqTemplateSelector';
import { AiRfqPreview } from './AiRfqPreview';
import { AuctionPaywallGate } from './AuctionPaywallGate';

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
  email?: string;
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
  onDraftSaved?: () => void;
  mode?: 'dialog' | 'page';
}

export function CreateReverseAuctionForm({ onCreated, onDraftSaved, mode = 'dialog' }: CreateReverseAuctionFormProps) {
  const { createAuction } = useReverseAuction();
  const { user } = useAuth();
  const navigateToCredits = useNavigate();
  const [open, setOpen] = useState(false);
  const [showPaywallGate, setShowPaywallGate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const WIZARD_STEPS = ['AI Input', 'Review Items', 'Suppliers', 'Pricing & Details', 'Launch'];

  // AI Preview state
  const [aiPreviewData, setAiPreviewData] = useState<{
    items: AuctionLineItem[];
    category?: string;
    title?: string;
    description?: string;
    qualityStandards?: string;
    certifications?: string;
    paymentTerms?: string;
  } | null>(null);

  // ── Multi Line Items (Feature #2) ──
  const [items, setItems] = useState<AuctionLineItem[]>([
    { product: '', quantity: '', unit: 'MT', price: '', description: '' }
  ]);

  const addLineItem = () => {
    setItems(prev => [...prev, { product: '', quantity: '', unit: 'MT', price: '', description: '' }]);
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

  // RFQ-style fields
  const [description, setDescription] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('India');
  const [destinationState, setDestinationState] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [certifications, setCertifications] = useState('');
  const [qualityStandards, setQualityStandards] = useState('');
  const [deadline, setDeadline] = useState('');

  // Global trade fields
  const [auctionCurrency, setAuctionCurrency] = useState('INR');
  const [incoterm, setIncoterm] = useState('');
  const [originCountry, setOriginCountry] = useState('India');
  const [shipmentMode, setShipmentMode] = useState('');

  // ── AI Title (Feature #1) — auto-fill but allow manual override ──
  const [auctionTitle, setAuctionTitle] = useState('');
  const [isManualTitle, setIsManualTitle] = useState(false);
  const [autoTitle, setAutoTitle] = useState('');

  // ── AI RFQ Generator ──
  const [aiDescription, setAiDescription] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

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

      // Robust unit normalization
      const UNIT_MAP: Record<string, string> = {
        tons: 'MT', ton: 'MT', tonnes: 'MT', mt: 'MT',
        kilograms: 'KG', kilogram: 'KG', kg: 'KG', kgs: 'KG',
        pieces: 'Pcs', piece: 'Pcs', nos: 'Pcs', pcs: 'Pcs',
        liters: 'Ltrs', liter: 'Ltrs', litres: 'Ltrs', ltrs: 'Ltrs',
        meters: 'Meters', meter: 'Meters', sets: 'Sets', set: 'Sets',
        cartons: 'Cartons', carton: 'Cartons', boxes: 'Boxes', box: 'Boxes',
      };
      const normalizeUnit = (u: string) => UNIT_MAP[u?.toLowerCase()?.trim()] || 'MT';

      // Smart category detection
      const CATEGORY_KEYWORDS: Record<string, string[]> = {
        "Metals - Ferrous": ["steel", "hr", "cr", "coil", "plate", "tmt", "rebar", "billet", "slab", "iron", "ferrous"],
        "Metals - Non Ferrous": ["aluminium", "aluminum", "copper", "brass", "zinc", "nickel", "tin", "lead"],
        "Chemicals": ["chemical", "acid", "solvent", "alkali", "reagent", "caustic"],
        "Polymers & Plastics": ["plastic", "polymer", "granule", "hdpe", "ldpe", "pvc", "polypropylene", "nylon"],
        "Minerals & Ores": ["mineral", "ore", "calcium", "ite", "ite powder"],
        "Energy & Fuels": ["fuel", "diesel", "petrol", "coal", "gas", "lpg", "oil"],
        "Textiles & Fibers": ["textile", "cotton", "fabric", "yarn", "fiber", "fibre"],
        "Paper & Packaging": ["paper", "cardboard", "packaging", "corrugated", "carton"],
      };

      let detectedCategory: string | undefined;
      if (rfq.category) {
        const text = (rfq.category + ' ' + (rfq.items?.map((i: any) => i.item_name).join(' ') || '')).toLowerCase();
        let detected: string | null = null;
        for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
          if (keywords.some(k => text.includes(k))) { detected = cat; break; }
        }
        detectedCategory = detected
          ? CATEGORIES.find(c => c === detected)
          : CATEGORIES.find(c => c.toLowerCase().includes(rfq.category.toLowerCase().split(' ')[0]));
      }

      const parsedItems: AuctionLineItem[] = rfq.items?.length > 0
        ? rfq.items.map((it: any) => ({
            product: it.item_name || '',
            quantity: String(it.quantity || ''),
            unit: normalizeUnit(it.unit || ''),
            description: it.description || '',
          }))
        : [];

      // Show AI Preview instead of directly applying
      setAiPreviewData({
        items: parsedItems,
        category: detectedCategory,
        title: rfq.title,
        description: rfq.description,
        qualityStandards: rfq.quality_standards,
        certifications: rfq.certifications_required,
        paymentTerms: rfq.payment_terms,
      });

      toast.success(`AI parsed ${parsedItems.length} items. Review before applying.`);
    } catch (err: any) {
      console.error('AI RFQ error:', err);
      toast.error(err.message || 'Failed to generate. Please try again.');
    } finally {
      setIsAiGenerating(false);
    }
  }, [aiDescription]);

  // Apply AI preview to form
  const applyAiPreview = useCallback(() => {
    if (!aiPreviewData) return;
    if (aiPreviewData.items.length > 0) setItems(aiPreviewData.items);
    if (aiPreviewData.category) setCategory(aiPreviewData.category);
    if (aiPreviewData.title) { setAuctionTitle(aiPreviewData.title); setIsManualTitle(false); }
    if (aiPreviewData.description) setDescription(aiPreviewData.description);
    if (aiPreviewData.qualityStandards) setQualityStandards(aiPreviewData.qualityStandards);
    if (aiPreviewData.certifications) setCertifications(aiPreviewData.certifications);
    if (aiPreviewData.paymentTerms) setPaymentTerms(aiPreviewData.paymentTerms);
    setAiPreviewData(null);
    setWizardStep(1); // Move to Review Items step
    toast.success('Applied to form!');
  }, [aiPreviewData]);

  // Apply template
  const handleApplyTemplate = useCallback((template: any) => {
    const hasExistingItems = items.some(i => i.product.trim() !== '');
    if (hasExistingItems && !window.confirm('Replace current items with template?')) return;
    
    setItems(template.default_items.map((it: any) => ({
      product: it.product_name || '',
      quantity: String(it.quantity || ''),
      unit: it.unit || 'MT',
      description: it.description || '',
      price: '',
    })));
    if (template.category) setCategory(template.category);
    if (template.quality_standards) setQualityStandards(template.quality_standards);
    if (template.certifications) setCertifications(template.certifications);
    if (template.payment_terms) setPaymentTerms(template.payment_terms);
    setWizardStep(1);
    toast.success(`Template "${template.template_name}" applied!`);
  }, [items]);

  useEffect(() => {
    const generated = generateAuctionTitle(
      items.map(i => ({ product: i.product, quantity: i.quantity, unit: i.unit, category: category })),
      transactionType
    );
    setAutoTitle(generated);
    if (!isManualTitle && generated) {
      setAuctionTitle(generated);
    }
  }, [items, transactionType, category, isManualTitle]);

  // ── Supplier Search + Manual Add (Feature #3) ──
  const [supplierSearch, setSupplierSearch] = useState('');
  const [allSuppliers, setAllSuppliers] = useState<SupplierOption[]>([]);
  const [invitedSuppliers, setInvitedSuppliers] = useState<SupplierOption[]>([]);
  const [showResults, setShowResults] = useState(false);

  // ── Buyer Auction Count for Discount (Feature #4) ──
  const [buyerAuctionCount, setBuyerAuctionCount] = useState<number>(0);

  // RFQ signals for AI pricing
  const [rfqSignals, setRfqSignals] = useState<RFQSignal[]>([]);

  // ── Draft auto-save (page mode only) ──
  const [draftLoaded, setDraftLoaded] = useState(false);
  useEffect(() => {
    if (mode !== 'page' || draftLoaded) return;
    try {
      const raw = localStorage.getItem('auction_draft');
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.items?.length) setItems(draft.items);
        if (draft.category) setCategory(draft.category);
        if (draft.startingPrice) setStartingPrice(draft.startingPrice);
        if (draft.invitedSuppliers?.length) setInvitedSuppliers(draft.invitedSuppliers);
        if (draft.auctionTitle) setAuctionTitle(draft.auctionTitle);
      }
    } catch {}
    setDraftLoaded(true);
  }, [mode, draftLoaded]);

  useEffect(() => {
    if (mode !== 'page') return;
    const draft = { items, category, startingPrice, invitedSuppliers, auctionTitle };
    localStorage.setItem('auction_draft', JSON.stringify(draft));
    onDraftSaved?.();
  }, [mode, items, category, startingPrice, invitedSuppliers, auctionTitle, onDraftSaved]);

  useEffect(() => {
    if (mode === 'dialog' && !open) return;
    if (!user) return;

    const fetchSuppliers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, company_name, contact_person, city, email')
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
      // Scoped O(1) count — DB enforces purchaser isolation, no row payload transferred.
      const { data } = await (supabase as any).rpc('get_scoped_auctions_count', {
        p_user_id: user.id,
        p_selected_purchaser: null,
      });
      setBuyerAuctionCount(Number(data) || 0);
    };

    fetchSuppliers();
    fetchRFQSignals();
    fetchAuctionCount();
  }, [mode, open, user]);

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
    // Prevent duplicates by id AND email
    if (invitedSuppliers.some(s => s.id === supplier.id || (supplier.email && s.email === supplier.email))) {
      toast.info('This supplier is already invited');
      return;
    }
    if (invitedSuppliers.length >= 20) {
      toast.error('Maximum 20 suppliers per auction');
      return;
    }
    setInvitedSuppliers(prev => [...prev, supplier]);
    setSupplierSearch('');
    setShowResults(false);
  };

  const addManualSupplier = () => {
    const input = supplierSearch.trim();
    if (!input) return;
    if (invitedSuppliers.length >= 20) {
      toast.error('Maximum 20 suppliers per auction');
      return;
    }
    // Check if input looks like an email
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    
    // Prevent duplicate email invites
    if (isEmail && invitedSuppliers.some(s => s.email === input)) {
      toast.info('This email is already invited');
      return;
    }
    
    const manualSupplier: SupplierOption = {
      id: `manual-${Date.now()}`,
      company_name: isEmail ? input : input,
      contact_person: '',
      city: null,
      email: isEmail ? input : undefined,
      manual: true,
    };
    setInvitedSuppliers(prev => [...prev, manualSupplier]);
    setSupplierSearch('');
    setShowResults(false);
  };

  const removeSupplier = (id: string) => {
    setInvitedSuppliers(prev => prev.filter(s => s.id !== id));
  };

  // Auto-calculated total order value from line items
  const calculatedTotal = useMemo(() => {
    const raw = items.reduce((sum, i) => sum + (Math.round(Number(i.quantity || 0) * 100) / 100) * (Math.round(Number(i.price || 0) * 100) / 100), 0);
    return Math.round(raw * 100) / 100;
  }, [items]);

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

  // ── Buyer Auction Credits ──
  const [buyerCredits, setBuyerCredits] = useState<{ id: string; total: number; used: number; isTrial: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchCredits = async () => {
      const { data } = await supabase
        .from('buyer_auction_credits')
        .select('id, total_credits, used_credits, plan_id')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) setBuyerCredits({ id: (data as any).id, total: (data as any).total_credits, used: (data as any).used_credits, isTrial: !(data as any).plan_id && (data as any).total_credits === 5 });
    };
    fetchCredits();
  }, [user]);

  const remainingCredits = buyerCredits ? buyerCredits.total - buyerCredits.used : 0;
  const hasCredits = remainingCredits > 0;

  // Low credits warning
  useEffect(() => {
    if (buyerCredits && remainingCredits <= 1 && remainingCredits >= 0) {
      toast.warning('Low Credits — You have ' + remainingCredits + ' credit(s) left. Buy more to continue auctions.');
    }
  }, [remainingCredits, buyerCredits]);

  const handleSubmit = async () => {
    // Double-click protection
    if (isSubmitting) return;

    // ── Active Auction Limit Check (server-enforced) ──
    if (user) {
      const limitCheck = await checkActiveAuctionLimit(user.id);
      if (!limitCheck.allowed) {
        toast.error(limitCheck.reason || 'You have reached your live auction limit.');
        return;
      }
    }

    const validItems = items.filter(i => i.product.trim() && i.quantity.trim());

    // Auto-generate title if missing
    let finalTitle = auctionTitle;
    if (!finalTitle && validItems.length > 0 && category) {
      finalTitle = generateAuctionTitle(
        validItems.map(i => ({ product: i.product, quantity: i.quantity, unit: i.unit })),
        category
      );
      setAuctionTitle(finalTitle);
    }

    if (!finalTitle || validItems.length === 0 || !category || !startDate || !startTime) {
      const missing: string[] = [];
      if (!finalTitle) missing.push('auction title');
      if (validItems.length === 0) missing.push('at least one product');
      if (!category) missing.push('category');
      if (!startDate) missing.push('start date');
      if (!startTime) missing.push('start time');
      toast.error(`Please fill: ${missing.join(', ')}.`);
      return;
    }

    if (invitedSuppliers.length === 0) {
      toast.error('Please invite at least one supplier to start the reverse auction.');
      return;
    }

    // Validate each item has valid price & quantity
    const invalidPrice = validItems.some(i => !i.price || Number(i.price) <= 0);
    if (invalidPrice) {
      toast.error('Each line item must have a valid price.');
      return;
    }
    if (validItems.some(i => Number(i.price) > 1e8)) {
      toast.error('Price per item exceeds maximum allowed value.');
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

    const start = new Date(`${startDate}T${startTime}`);
    if (start < new Date()) {
      toast.error('Auction start time must be in the future.');
      return;
    }

    if (reservePrice && parseFloat(reservePrice) >= calculatedTotal) {
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

    // Check for credits — show paywall gate
    if (!hasCredits) {
      setShowPaywallGate(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const isTrial = buyerCredits?.isTrial && remainingCredits > 0;
      let paymentId: string | null = null;

      // Trial users skip payment — only paid plan users need payment records
      if (!isTrial) {
        // Record payment — reuse orphaned payment if exists, otherwise insert
        const { data: existingPayment } = await supabase
          .from('auction_payments')
          .select('id')
          .eq('buyer_id', user!.id)
          .is('auction_id', null)
          .eq('payment_status', 'paid' as any)
          .maybeSingle();

        if (existingPayment) {
          const { error: updateErr } = await supabase
            .from('auction_payments')
            .update({
              transaction_type: transactionType,
              base_fee: auctionFee.base,
              gst: auctionFee.gst,
              total_amount: auctionFee.total,
            } as any)
            .eq('id', (existingPayment as any).id);
          if (updateErr) {
            toast.error('Auction payment failed: ' + updateErr.message);
            setIsSubmitting(false);
            return;
          }
          paymentId = (existingPayment as any).id;
        } else {
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
          paymentId = (payment as any).id;
        }
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
        starting_price: calculatedTotal,
        reserve_price: reservePrice ? parseFloat(reservePrice) : undefined,
        auction_start: start.toISOString(),
        auction_end: auctionEnd.toISOString(),
        transaction_type: transactionType,
        minimum_bid_step_pct: parseFloat(minBidStep),
        invited_supplier_ids: invitedSuppliers.filter(s => !s.manual).map(s => s.id),
        invited_suppliers: invitedSuppliers.map(s => ({
          id: s.id,
          email: s.email,
          manual: s.manual,
        })),
        description: description || undefined,
        rfq_type: transactionType,
        destination_country: destinationCountry || undefined,
        destination_state: destinationState || undefined,
        delivery_address: deliveryAddress || undefined,
        payment_terms: paymentTerms || undefined,
        certifications: certifications || undefined,
        quality_standards: qualityStandards || undefined,
        currency: auctionCurrency || 'INR',
        incoterm: incoterm || undefined,
        origin_country: originCountry || undefined,
        shipment_mode: shipmentMode || undefined,
        line_items: validItems.map(i => ({
          product_name: i.product,
          category: category,
          quantity: parseFloat(i.quantity || '0'),
          unit: i.unit,
          description: i.description || undefined,
          unit_price: parseFloat(i.price || '0'),
        })),
        deadline: deadline || undefined,
      };

      const result = await createAuction(input);

      // Step 3: AFTER SUCCESS — consume 1 credit and link payment
      if (result) {
        const { error: creditError } = await supabase.rpc('consume_auction_credit', {
          p_credit_id: buyerCredits!.id,
        });
        if (creditError) {
          console.error('Credit consumption failed:', creditError);
          toast.error('Credit deduction failed. Please contact support.');
        }

        if (paymentId) {
          await supabase
            .from('auction_payments')
            .update({ auction_id: (result as any).id } as any)
            .eq('id', paymentId);
        }

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
    setItems([{ product: '', quantity: '', unit: 'MT', price: '', description: '' }]);
    setCategory('');
    setStartingPrice('');
    setReservePrice('');
    setStartDate('');
    setStartTime('');
    setInvitedSuppliers([]);
    setSupplierSearch('');
    setAuctionTitle('');
    setDescription('');
    setDestinationCountry('India');
    setDestinationState('');
    setDeliveryAddress('');
    setPaymentTerms('');
    setCertifications('');
    setQualityStandards('');
  };

  const today = new Date().toISOString().split('T')[0];

  const invitedIds = useMemo(() => new Set(invitedSuppliers.filter(s => !s.manual).map(s => s.id)), [invitedSuppliers]);

  const formContent = (
    <div className="space-y-4 py-2">
          {/* ── Wizard Progress ── */}
          <div className="flex items-center gap-1 mb-2 overflow-x-auto">
            {WIZARD_STEPS.map((step, i) => (
              <div key={step} className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                i <= 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                <span className="w-4 text-center">{i + 1}</span>
                <span className="hidden sm:inline">{step}</span>
              </div>
            ))}
          </div>

          {/* ── AI-Assisted RFQ Input ── */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4 pb-3 space-y-3">
              <Label className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-primary" />
                AI-Assisted Requirement (Optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Describe your needs in plain text — AI will auto-fill products, quantities, category & specs.
              </p>
              <Textarea
                placeholder="Example: I need 30 MT HR Coil IS2062 E250 and 25 MT HR Plates 10mm, delivery to Pune within 20 days."
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
              >
                {isAiGenerating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> AI is structuring your auction...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate Auction from Description</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* AI Preview Before Apply */}
          {aiPreviewData && (
            <AiRfqPreview
              items={aiPreviewData.items}
              category={aiPreviewData.category}
              title={aiPreviewData.title}
              description={aiPreviewData.description}
              qualityStandards={aiPreviewData.qualityStandards}
              certifications={aiPreviewData.certifications}
              paymentTerms={aiPreviewData.paymentTerms}
              onApply={applyAiPreview}
              onCancel={() => setAiPreviewData(null)}
            />
          )}

          {/* ── Industry Templates ── */}
          <RfqTemplateSelector category={category} onApplyTemplate={handleApplyTemplate} />

          {/* ── AI Generated Title ── */}
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
                setIsManualTitle(value !== autoTitle && value.length > 0);
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
                  const cleanTitle = parsed.map(p => p.product).join(', ') + ' Reverse Auction';
                  setAuctionTitle(cleanTitle);
                  setIsManualTitle(true);
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
            {auctionTitle && !isManualTitle && (
              <p className="text-xs text-muted-foreground mt-1">✨ Auto-generated from items — editable</p>
            )}
            {isManualTitle && (
              <button type="button" onClick={() => { setIsManualTitle(false); setAuctionTitle(autoTitle); }} className="text-xs text-primary mt-1 hover:underline">
                ↺ Reset to auto-generated title
              </button>
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
                <div key={i} className="space-y-1.5 p-2.5 rounded-lg border border-border/50 bg-muted/20">
                  <div className="grid grid-cols-[1fr_80px_80px_100px_32px] gap-2 items-end">
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
                    <div>
                      {i === 0 && <span className="text-xs text-muted-foreground">Price</span>}
                      <Input
                        type="number"
                        placeholder="61000"
                        value={item.price || ''}
                        onChange={e => updateItem(i, 'price', e.target.value)}
                      />
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
                  <Input
                    placeholder="Product description / specs (optional)"
                    value={item.description || ''}
                    onChange={e => updateItem(i, 'description', e.target.value)}
                    className="text-xs h-8"
                  />
                  {item.quantity && item.price && (
                    <p className="text-xs text-muted-foreground text-right">
                      Line total: {(parseFloat(item.quantity || '0') * parseFloat(item.price || '0')).toLocaleString()}
                    </p>
                  )}
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

          {/* Description */}
          <div>
            <Label htmlFor="auctionDesc">Description / Specifications</Label>
            <textarea
              id="auctionDesc"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
              placeholder="Describe requirements, specifications, quality expectations..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* RFQ Details Section */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              🌍 Delivery & RFQ Details
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Destination Country</Label>
                <Input
                  value={destinationCountry}
                  onChange={e => setDestinationCountry(e.target.value)}
                  placeholder="India"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Destination State</Label>
                <Input
                  value={destinationState}
                  onChange={e => setDestinationState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Delivery Address</Label>
              <Input
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
                placeholder="Warehouse / factory delivery address"
              />
            </div>
          </div>

          {/* Global Trade Fields — shown for import/export transactions */}
          {transactionType !== 'domestic' && (
            <div className="space-y-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                🌐 Global Trade Details
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Currency</Label>
                  <Select value={auctionCurrency} onValueChange={setAuctionCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">₹ INR</SelectItem>
                      <SelectItem value="USD">$ USD</SelectItem>
                      <SelectItem value="EUR">€ EUR</SelectItem>
                      <SelectItem value="GBP">£ GBP</SelectItem>
                      <SelectItem value="AED">د.إ AED</SelectItem>
                      <SelectItem value="SAR">﷼ SAR</SelectItem>
                      <SelectItem value="CNY">¥ CNY</SelectItem>
                      <SelectItem value="VND">₫ VND</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Incoterm</Label>
                  <Select value={incoterm} onValueChange={setIncoterm}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOB">FOB — Free on Board</SelectItem>
                      <SelectItem value="CIF">CIF — Cost, Insurance & Freight</SelectItem>
                      <SelectItem value="EXW">EXW — Ex Works</SelectItem>
                      <SelectItem value="CFR">CFR — Cost & Freight</SelectItem>
                      <SelectItem value="DDP">DDP — Delivered Duty Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Origin Country</Label>
                  <Input
                    value={originCountry}
                    onChange={e => setOriginCountry(e.target.value)}
                    placeholder="e.g. China"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Shipment Mode</Label>
                  <Select value={shipmentMode} onValueChange={setShipmentMode}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sea">🚢 Sea Freight</SelectItem>
                      <SelectItem value="air">✈️ Air Freight</SelectItem>
                      <SelectItem value="road">🚛 Road Transport</SelectItem>
                      <SelectItem value="rail">🚂 Rail Freight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Commercial Terms Section */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              📜 Commercial Terms
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Payment Terms</Label>
                <Input
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                  placeholder="e.g. 30 days credit"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Certifications Required</Label>
                <Input
                  value={certifications}
                  onChange={e => setCertifications(e.target.value)}
                  placeholder="e.g. ISO 9001, BIS"
                />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Procurement Deadline</Label>
              <Input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                placeholder="When do you need delivery?"
              />
            </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Quality Standards</Label>
              <Input
                value={qualityStandards}
                onChange={e => setQualityStandards(e.target.value)}
                placeholder="e.g. IS2062 Grade E250"
              />
            </div>
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
                {getCurrencySymbol(auctionCurrency)}{calculatedTotal.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reservePrice">Reserve Price (optional)</Label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input id="reservePrice" type="number" className="pl-8" min="0" step="0.01" placeholder="55000" value={reservePrice} onChange={e => setReservePrice(e.target.value)} />
              </div>
            </div>
          </div>

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
          {/* ── AI Supplier Recommendations ── */}
          {category && (
            <SupplierRecommendationPanel
              category={category}
              buyerId={user?.id}
              onAddSupplier={(s) => addSupplier({ ...s, email: s.email || undefined } as any)}
              invitedIds={invitedIds}
            />
          )}

          {/* ── Price Intelligence ── */}
          {category && <PriceIntelligencePanel category={category} />}

          <div>
            <Label className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Invite Suppliers *
            </Label>
            <div className="relative mt-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search supplier name or enter email to invite..."
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

                {/* Manual add option — always show at bottom */}
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-accent/50 flex items-center gap-2 text-sm transition-colors text-primary border-t"
                  onMouseDown={addManualSupplier}
                >
                  <UserPlus className="w-4 h-4" />
                  {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplierSearch.trim())
                    ? `Invite "${supplierSearch.trim()}" via email`
                    : `Add "${supplierSearch.trim()}" as supplier`}
                </button>
              </div>
            )}

            {/* Invited suppliers tags */}
            {invitedSuppliers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {invitedSuppliers.map(s => (
                  <Badge key={s.id} variant="secondary" className="gap-1 pr-1">
                    {s.company_name}
                    {s.manual && s.email && <span className="text-[10px] opacity-60">(email)</span>}
                    {s.manual && !s.email && <span className="text-[10px] opacity-60">(manual)</span>}
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

            {/* Supplier liquidity nudge */}
            {invitedSuppliers.length > 0 && invitedSuppliers.length < 3 && (
              <div className="flex items-center gap-2 mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                <span className="text-amber-600 text-sm">🎯</span>
                <div>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Add at least 3 suppliers to unlock best pricing</p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">More competition = better price discovery</p>
                </div>
              </div>
            )}
            {invitedSuppliers.length >= 3 && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                ✅ {invitedSuppliers.length} suppliers — strong competition drives better pricing
              </p>
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

          {/* Credits Status */}
          {buyerCredits !== null && (
            <Card className={hasCredits ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' : 'border-destructive/30 bg-destructive/5'}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {buyerCredits.isTrial ? '🎁 Free Trial Pack' : 'Auction Credits'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {buyerCredits.isTrial && (
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700">
                        Trial · Free
                      </Badge>
                    )}
                    <Badge variant={hasCredits ? 'secondary' : 'destructive'}>
                      {remainingCredits} remaining
                    </Badge>
                  </div>
                </div>
                {buyerCredits.isTrial && hasCredits && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    You have <strong>{remainingCredits} free trial auction(s)</strong> left. Once used, choose a plan to continue.{' '}
                    <button onClick={() => navigateToCredits('/buyer?tab=auctions&buy_credits=true')} className="underline font-medium text-primary hover:text-primary/80">
                      View Plans
                    </button>
                  </p>
                )}
                {!hasCredits && (
                  <p className="text-xs text-destructive mt-1">
                    {buyerCredits.isTrial ? 'Your free trial is over! ' : 'No credits available. '}
                    <button onClick={() => navigateToCredits('/buyer?tab=auctions&buy_credits=true')} className="underline font-medium hover:text-destructive/80">
                      Choose a Plan
                    </button>{' '}
                    to continue creating auctions.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Button
            onClick={hasCredits ? handleSubmit : () => navigateToCredits('/buyer?tab=auctions&buy_credits=true')}
            disabled={isSubmitting}
            className="w-full"
            variant={hasCredits ? 'default' : 'destructive'}
          >
            {isSubmitting ? 'Creating Auction...' : hasCredits ? `Use 1 Credit & Create Auction` : '🛒 Buy Credits to Continue'}
          </Button>
    </div>
  );

  if (mode === 'page') {
    return (
      <>
        {formContent}
        {showPaywallGate && (
          <AuctionPaywallGate
            onActivate={() => {
              setShowPaywallGate(false);
              navigateToCredits('/buyer?tab=auctions&buy_credits=true');
            }}
            onViewDetails={() => {
              setShowPaywallGate(false);
              navigateToCredits('/buyer?tab=auctions&buy_credits=true');
            }}
          />
        )}
      </>
    );
  }

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
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
