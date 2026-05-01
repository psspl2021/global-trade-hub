/**
 * Pre-login lightweight Reverse Auction setup.
 * 3-step bridge that captures intent and hands off to the full
 * post-login flow (CreateReverseAuctionPage) — which is intentionally
 * left untouched.
 *
 * Flow:
 *   Step 1 — Suppliers (AI-matched / manual)
 *   Step 2 — Auction rules (duration / starting price / min decrement)
 *   Step 3 — Review & launch  → login gate → /buyer/create-reverse-auction
 */
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft, ArrowRight, Gavel, Sparkles, Users, CheckCircle2, Clock,
  TrendingDown, Mail, AlertCircle,
} from 'lucide-react';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';
import { useSEO } from '@/hooks/useSEO';
import { useAuth } from '@/hooks/useAuth';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

type SupplierMode = 'ai' | 'manual';
type PricingMethod = 'per_unit' | 'total';

const DRAFT_KEY = 'reverse_auction_pre_login_draft';

const SetupReverseAuction = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useSEO({
    title: 'Set up Reverse Auction in 30 seconds | ProcureSaathi',
    description: 'Configure a live reverse auction — choose suppliers, set rules, launch. Suppliers compete by lowering price in real time.',
    canonical: 'https://procuresaathi.com/setup-reverse-auction',
  });

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);

  // Step 1
  const [supplierMode, setSupplierMode] = useState<SupplierMode>('ai');
  const [requirement, setRequirement] = useState('');

  // Step 2
  const [duration, setDuration] = useState('30');
  const [pricingMethod, setPricingMethod] = useState<PricingMethod>('per_unit');
  const [startingPrice, setStartingPrice] = useState('');
  const [minDecrement, setMinDecrement] = useState('');
  // Manually-selected unit (overrides inference). Empty = use inferred or fallback.
  const [unitOverride, setUnitOverride] = useState<string>('');
  const [methodSwitchNote, setMethodSwitchNote] = useState(false);
  const [unitSwitchNote, setUnitSwitchNote] = useState(false);
  // Equivalence preview shown briefly before reset on unit switch (per-unit only).
  const [unitConvertPreview, setUnitConvertPreview] = useState<{
    fromUnit: string; toUnit: string; fromPrice: number; toPrice: number;
  } | null>(null);

  // ── Currency input sanitization ─────────────────────────────────
  // Accepts: "65,000", "65000", "65k", "65K", "₹65000", " 65 000 "
  // Rejects (returns ''): empty, NaN, negatives, zero
  const sanitizeCurrencyInput = (raw: string): string => {
    if (raw == null) return '';
    let s = String(raw).trim();
    if (!s) return '';
    // Strip currency symbol, commas, whitespace, and stray non-numeric punctuation (keep digits, dot, k/K)
    s = s.replace(/[₹$€£¥,\s]/g, '');
    // Reject explicit negatives
    if (s.startsWith('-')) return '';
    // Handle k/K shorthand → multiply by 1000
    let multiplier = 1;
    if (/[kK]$/.test(s)) {
      multiplier = 1000;
      s = s.slice(0, -1);
    } else if (/[lL]$/.test(s)) {
      multiplier = 100000;
      s = s.slice(0, -1);
    } else if (/(cr|CR|Cr)$/.test(s)) {
      multiplier = 10000000;
      s = s.replace(/(cr|CR|Cr)$/, '');
    }
    if (!s || !/^\d*\.?\d*$/.test(s)) return '';
    const n = Number(s) * multiplier;
    if (!Number.isFinite(n) || n <= 0) return '';
    // Hard upper sanity cap (₹999 Cr) to prevent garbage huge values
    if (n > 9_990_000_000) return '';
    return String(Math.round(n));
  };

  const handleStartingPriceChange = (raw: string) => {
    // Allow user to type freely; sanitize only when they leave or paste formatted text.
    // We store the raw string to allow intermediate typing, but downstream logic uses the
    // numeric guards below.
    setStartingPrice(raw);
  };

  const handleStartingPriceBlur = () => {
    const cleaned = sanitizeCurrencyInput(startingPrice);
    setStartingPrice(cleaned);
  };

  const handleMinDecrementChange = (raw: string) => {
    setMinDecrement(raw);
  };

  const handleMinDecrementBlur = () => {
    const cleaned = sanitizeCurrencyInput(minDecrement);
    setMinDecrement(cleaned);
  };

  // Numeric guards used everywhere downstream (parses sanitized OR raw)
  const parseSafe = (v: string): number => {
    const cleaned = sanitizeCurrencyInput(v);
    return cleaned ? Number(cleaned) : NaN;
  };

  // When pricing method changes, reset BOTH starting price + decrement (prevent unit/scale mismatch)
  const handlePricingMethodChange = (m: PricingMethod) => {
    if (m === pricingMethod) return;
    setPricingMethod(m);
    setStartingPrice('');
    setMinDecrement('');
    setUnitConvertPreview(null);
    setMethodSwitchNote(true);
    window.setTimeout(() => setMethodSwitchNote(false), 4000);
  };

  // When unit changes (per-unit mode), reset pricing fields to keep semantic meaning consistent
  const handleUnitOverrideChange = (u: string) => {
    const prevUnit = unitOverride || ''; // we may not know inferred here; capture before override
    const prevPriceNum = parseSafe(startingPrice);
    setUnitOverride(u);
    if (pricingMethod === 'per_unit' && (startingPrice || minDecrement)) {
      // Build conversion preview (ton↔kg only — only deterministic conversion we support)
      if (Number.isFinite(prevPriceNum) && prevPriceNum > 0) {
        const conv = convertUnitPrice(prevPriceNum, prevUnit, u);
        if (conv != null) {
          setUnitConvertPreview({ fromUnit: prevUnit || '—', toUnit: u, fromPrice: prevPriceNum, toPrice: conv });
          window.setTimeout(() => setUnitConvertPreview(null), 5000);
        }
      }
      setStartingPrice('');
      setMinDecrement('');
      setUnitSwitchNote(true);
      window.setTimeout(() => setUnitSwitchNote(false), 4000);
    }
  };

  // Deterministic unit conversion for known pairs (ton ↔ kg). Returns null if not convertible.
  function convertUnitPrice(price: number, from: string, to: string): number | null {
    if (!from || !to || from === to) return null;
    if (from === 'ton' && to === 'kg') return Math.round((price / 1000) * 100) / 100;
    if (from === 'kg' && to === 'ton') return Math.round(price * 1000);
    return null;
  }

  // Validation — uses sanitized values
  const startingPriceNum = parseSafe(startingPrice);
  const minDecrementNum = parseSafe(minDecrement);
  const hasStartingPrice = Number.isFinite(startingPriceNum) && startingPriceNum > 0;
  const hasMinDecrement = Number.isFinite(minDecrementNum) && minDecrementNum > 0;

  let decrementError = '';
  if (minDecrement && !hasMinDecrement) {
    decrementError = 'Enter a valid amount greater than zero';
  } else if (hasStartingPrice && hasMinDecrement && minDecrementNum > startingPriceNum) {
    decrementError = 'Minimum decrement cannot exceed starting price';
  }
  const startingPriceError =
    startingPrice && !hasStartingPrice ? 'Enter a valid amount greater than zero' : '';

  // Restore any prior draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.requirement) setRequirement(d.requirement);
        if (d.duration) setDuration(d.duration);
        if (d.startingPrice) setStartingPrice(d.startingPrice);
        if (d.minDecrement) setMinDecrement(d.minDecrement);
        if (d.supplierMode) setSupplierMode(d.supplierMode);
        if (d.pricingMethod === 'per_unit' || d.pricingMethod === 'total') setPricingMethod(d.pricingMethod);
        if (d.unitOverride) setUnitOverride(d.unitOverride);
      }
    } catch {}
    try {
      localStorage.setItem('lastMode', 'reverse');
    } catch {}
  }, []);

  const supplierCount = supplierMode === 'ai' ? 8 : 0; // illustrative for review screen
  const canNextStep1 = requirement.trim().length >= 6;
  const canNextStep2 = !!duration && !decrementError && !startingPriceError;

  // Infer unit context from requirement text. Two-pass:
  //   1) Explicit unit token in text  → high confidence
  //   2) Category keyword (steel/tiles/cement…) → default unit + alternates
  const unitInference = useMemo(() => {
    const text = requirement.toLowerCase();
    const explicit: Array<{ match: RegExp; label: string }> = [
      { match: /\btons?\b|\bmt\b|\btonnes?\b/, label: 'ton' },
      { match: /\bkgs?\b|\bkilograms?\b/, label: 'kg' },
      { match: /\bpcs?\b|\bpieces?\b|\bunits?\b|\bnos?\b/, label: 'piece' },
      { match: /\blitres?\b|\bliters?\b|\bltrs?\b/, label: 'litre' },
      { match: /\bmetres?\b|\bmeters?\b|\bmtrs?\b/, label: 'metre' },
      { match: /\bbags?\b/, label: 'bag' },
      { match: /\bbox(es)?\b/, label: 'box' },
      { match: /\bdrums?\b/, label: 'drum' },
    ];
    for (const u of explicit) if (u.match.test(text)) {
      // Allowed alternates by category
      if (u.label === 'ton' || u.label === 'kg') return { unit: u.label, allowed: ['ton', 'kg'], confidence: 'high' as const };
      return { unit: u.label, allowed: [u.label], confidence: 'high' as const };
    }
    // Category keywords (no explicit unit)
    const categories: Array<{ match: RegExp; unit: string; allowed: string[] }> = [
      { match: /\b(steel|tmt|rebar|rod|rods|iron)\b/, unit: 'ton', allowed: ['ton', 'kg'] },
      { match: /\b(cement)\b/, unit: 'bag', allowed: ['bag'] },
      { match: /\b(tiles?|bricks?|blocks?)\b/, unit: 'piece', allowed: ['piece'] },
      { match: /\b(pipes?)\b/, unit: 'metre', allowed: ['metre'] },
      { match: /\b(chemicals?|acid|solvent)\b/, unit: 'litre', allowed: ['litre', 'kg'] },
    ];
    for (const c of categories) if (c.match.test(text)) {
      return { unit: c.unit, allowed: c.allowed, confidence: 'medium' as const };
    }
    return { unit: '', allowed: ['ton', 'kg', 'piece', 'bag', 'metre', 'litre'], confidence: 'low' as const };
  }, [requirement]);

  const effectiveUnit = unitOverride || unitInference.unit;
  const unitHint = effectiveUnit; // backward compat for downstream
  const needsUnitSelection = pricingMethod === 'per_unit' && !effectiveUnit;

  // Next valid bid preview — strict guard against stale/invalid state
  const nextValidBid = useMemo(() => {
    if (!hasStartingPrice || !hasMinDecrement) return '';
    if (minDecrementNum > startingPriceNum) return '';
    const next = startingPriceNum - minDecrementNum;
    if (next <= 0) return '';
    return `₹${next.toLocaleString('en-IN')}`;
  }, [hasStartingPrice, hasMinDecrement, startingPriceNum, minDecrementNum]);

  // Quantity inference (for total-order estimate when per-unit pricing)
  const quantityInfo = useMemo(() => {
    const m = requirement.match(/(\d[\d,]*\.?\d*)\s*(tons?|tonnes?|mt|kgs?|pcs?|pieces?|nos?|units?|bags?|boxes?|drums?|metres?|meters?|mtrs?|litres?|liters?)/i);
    if (!m) return null;
    const qty = Number(m[1].replace(/,/g, ''));
    if (!Number.isFinite(qty) || qty <= 0) return null;
    let unit = m[2].toLowerCase();
    if (/tons?|tonnes?|mt/.test(unit)) unit = 'ton';
    else if (/kgs?/.test(unit)) unit = 'kg';
    else if (/pcs?|pieces?|nos?|units?/.test(unit)) unit = 'piece';
    else if (/bags?/.test(unit)) unit = 'bag';
    else if (/boxes?/.test(unit)) unit = 'box';
    else if (/drums?/.test(unit)) unit = 'drum';
    else if (/metres?|meters?|mtrs?/.test(unit)) unit = 'metre';
    else if (/litres?|liters?/.test(unit)) unit = 'litre';
    return { qty, unit };
  }, [requirement]);

  // Total estimate (per-unit pricing only, when quantity inferred + units match)
  const totalEstimate = useMemo(() => {
    if (pricingMethod !== 'per_unit' || !hasStartingPrice || !quantityInfo) return '';
    if (effectiveUnit && quantityInfo.unit !== effectiveUnit) return '';
    const total = quantityInfo.qty * startingPriceNum;
    if (!Number.isFinite(total) || total <= 0) return '';
    return `₹${Math.round(total).toLocaleString('en-IN')}`;
  }, [pricingMethod, hasStartingPrice, startingPriceNum, quantityInfo, effectiveUnit]);

  const stepProgress = useMemo(() => ((step / 3) * 100).toFixed(0), [step]);

  const persistDraft = () => {
    const draft = {
      mode: 'reverse',
      requirement,
      supplierMode,
      duration,
      pricingMethod,
      startingPrice,
      minDecrement,
      unitOverride,
      ts: Date.now(),
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  };

  const handleSwitchMode = () => setShowSwitchConfirm(true);
  const confirmSwitch = () => {
    setShowSwitchConfirm(false);
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    navigate('/choose-procurement-mode');
  };

  const handleLaunch = () => {
    persistDraft();
    trackEvent('reverse_auction_pre_login_launch', { supplierMode, duration });
    if (user) {
      navigate('/buyer/create-reverse-auction');
    } else {
      // Send to login; after success, send back to full setup
      navigate(`/login?redirect=${encodeURIComponent('/buyer/create-reverse-auction')}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img src={procureSaathiLogo} alt="ProcureSaathi" className="h-10 sm:h-14 w-auto object-contain" />
          </button>

          {/* Email quota chip */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            <span>
              <span className="font-semibold text-foreground">Notifications (RFQ alerts only):</span>
              <span className="ml-1.5">2 free/day</span>
              <span className="text-border mx-1.5">•</span>
              <span>₹500 = 200 emails</span>
              <span className="text-border mx-1.5">•</span>
              <span>No expiry</span>
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Mode strip */}
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-gold/40 bg-gradient-to-r from-gold/10 to-transparent px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-gold/15 flex-shrink-0">
              <Gavel className="h-4 w-4 text-gold" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge className="bg-gold text-gold-foreground font-semibold">Mode: Reverse Auction</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Suppliers will compete by lowering price in real time
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSwitchMode}>
            Switch mode
          </Button>
        </div>

        {/* Stepper */}
        <Stepper step={step} />

        {/* Step content */}
        <Card className="p-5 sm:p-7 mt-5 shadow-sm">
          {step === 1 && (
            <StepSuppliers
              supplierMode={supplierMode}
              setSupplierMode={setSupplierMode}
              requirement={requirement}
              setRequirement={setRequirement}
            />
          )}
          {step === 2 && (
            <StepRules
              duration={duration}
              setDuration={setDuration}
              pricingMethod={pricingMethod}
              setPricingMethod={handlePricingMethodChange}
              startingPrice={startingPrice}
              setStartingPrice={handleStartingPriceChange}
              onStartingPriceBlur={handleStartingPriceBlur}
              minDecrement={minDecrement}
              setMinDecrement={handleMinDecrementChange}
              onMinDecrementBlur={handleMinDecrementBlur}
              decrementError={decrementError}
              startingPriceError={startingPriceError}
              unitHint={unitHint}
              nextValidBid={nextValidBid}
              unitOverride={unitOverride}
              setUnitOverride={handleUnitOverrideChange}
              allowedUnits={unitInference.allowed}
              inferredUnit={unitInference.unit}
              inferenceConfidence={unitInference.confidence}
              needsUnitSelection={needsUnitSelection}
              methodSwitchNote={methodSwitchNote}
              unitSwitchNote={unitSwitchNote}
              unitConvertPreview={unitConvertPreview}
              totalEstimate={totalEstimate}
              quantityInfo={quantityInfo}
            />
          )}
          {step === 3 && (
            <StepReview
              supplierMode={supplierMode}
              supplierCount={supplierCount}
              requirement={requirement}
              duration={duration}
              pricingMethod={pricingMethod}
              startingPrice={startingPrice}
              minDecrement={minDecrement}
              unitHint={unitHint}
              totalEstimate={totalEstimate}
              quantityInfo={quantityInfo}
            />
          )}

          {/* Footer nav */}
          <div className="mt-7 flex items-center justify-between gap-3 pt-5 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => {
                if (step === 1) navigate('/choose-procurement-mode');
                else setStep((s) => (s - 1) as 1 | 2);
              }}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              {step === 1 ? 'Back to mode select' : 'Back'}
            </Button>

            {step < 3 ? (
              <Button
                size="lg"
                className="gap-1.5"
                disabled={(step === 1 && !canNextStep1) || (step === 2 && (!canNextStep2 || needsUnitSelection))}
                onClick={() => {
                  persistDraft();
                  setStep((s) => (s + 1) as 2 | 3);
                }}
              >
                {step === 2 && needsUnitSelection ? 'Select unit to continue' : 'Continue'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="lg"
                className="gap-1.5 bg-gold hover:bg-gold/90 text-gold-foreground"
                onClick={handleLaunch}
              >
                <Gavel className="h-4 w-4" />
                Launch Reverse Auction
              </Button>
            )}
          </div>
        </Card>

        {/* Trust micro-line */}
        <p className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-1.5">
          <Clock className="h-3 w-3" />
          Live auction will begin after launch · Suppliers notified instantly
        </p>
      </main>

      {/* Switch mode confirmation */}
      <Dialog open={showSwitchConfirm} onOpenChange={setShowSwitchConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Switch procurement mode?</DialogTitle>
            <DialogDescription>
              Switching will reset your current setup.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowSwitchConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSwitch}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ──────────────────────────  STEPPER  ────────────────────────── */

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const items = [
    { n: 1, label: 'Suppliers' },
    { n: 2, label: 'Auction Rules' },
    { n: 3, label: 'Review & Launch' },
  ];
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {items.map((it, idx) => {
        const active = step === it.n;
        const done = step > it.n;
        return (
          <div key={it.n} className="flex items-center gap-2 sm:gap-3 flex-1">
            <div
              className={cn(
                'flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold border-2 flex-shrink-0 transition-colors',
                done && 'bg-primary text-primary-foreground border-primary',
                active && !done && 'bg-gold text-gold-foreground border-gold',
                !active && !done && 'bg-background text-muted-foreground border-border'
              )}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : it.n}
            </div>
            <span
              className={cn(
                'text-xs sm:text-sm font-medium truncate',
                active ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {it.label}
            </span>
            {idx < items.length - 1 && (
              <div className={cn('flex-1 h-0.5 rounded-full', done ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────  STEP 1  ────────────────────────── */

function StepSuppliers({
  supplierMode, setSupplierMode, requirement, setRequirement,
}: {
  supplierMode: SupplierMode;
  setSupplierMode: (m: SupplierMode) => void;
  requirement: string;
  setRequirement: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Select suppliers for this auction</h2>
        <p className="text-sm text-muted-foreground mt-1">
          We invite suppliers — they compete live to win your order.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SupplierOption
          selected={supplierMode === 'ai'}
          onClick={() => setSupplierMode('ai')}
          icon={Sparkles}
          title="Use AI-matched suppliers"
          recommended
          description="ProcureSaathi picks the best-fit verified suppliers for your category."
        />
        <SupplierOption
          selected={supplierMode === 'manual'}
          onClick={() => setSupplierMode('manual')}
          icon={Users}
          title="Select suppliers manually"
          description="Select from your supplier list after login."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="req" className="text-sm font-semibold">
          What are you procuring?
        </Label>
        <Textarea
          id="req"
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          placeholder="e.g. TMT bars Fe 500D, 25 tons, monthly delivery to Mumbai"
          className="min-h-[90px] resize-none"
        />
        <p className="text-xs text-muted-foreground">
          One line is enough — full specs come after launch.
        </p>
      </div>
    </div>
  );
}

function SupplierOption({
  selected, onClick, icon: Icon, title, description, recommended,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  recommended?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-left p-4 rounded-xl border-2 transition-all',
        selected ? 'border-gold bg-gold/5 shadow-gold/30 shadow-sm' : 'border-border hover:border-primary/40'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={cn('p-2 rounded-lg', selected ? 'bg-gold/15' : 'bg-muted')}>
          <Icon className={cn('h-4 w-4', selected ? 'text-gold' : 'text-foreground')} />
        </div>
        {recommended && (
          <Badge variant="secondary" className="text-[10px]">Recommended</Badge>
        )}
      </div>
      <p className="font-semibold text-sm text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </button>
  );
}

/* ──────────────────────────  STEP 2  ────────────────────────── */

function StepRules({
  duration, setDuration, pricingMethod, setPricingMethod,
  startingPrice, setStartingPrice, minDecrement, setMinDecrement, decrementError,
  unitHint, nextValidBid,
  unitOverride, setUnitOverride, allowedUnits, inferredUnit, inferenceConfidence,
  needsUnitSelection, methodSwitchNote, unitSwitchNote,
}: {
  duration: string;
  setDuration: (v: string) => void;
  pricingMethod: PricingMethod;
  setPricingMethod: (m: PricingMethod) => void;
  startingPrice: string;
  setStartingPrice: (v: string) => void;
  minDecrement: string;
  setMinDecrement: (v: string) => void;
  decrementError: string;
  unitHint: string;
  nextValidBid: string;
  unitOverride: string;
  setUnitOverride: (v: string) => void;
  allowedUnits: string[];
  inferredUnit: string;
  inferenceConfidence: 'high' | 'medium' | 'low';
  needsUnitSelection: boolean;
  methodSwitchNote: boolean;
  unitSwitchNote: boolean;
}) {
  const isPerUnit = pricingMethod === 'per_unit';
  const unitWord = unitHint || 'unit';
  const startLabel = isPerUnit
    ? `Starting Price (per ${unitWord})`
    : 'Starting Price (total order value)';
  const startPlaceholder = isPerUnit ? `e.g. 50,000 per ${unitWord}` : 'e.g. 25,00,000 total';
  const startHelper = startingPrice
    ? 'You control the opening price. Auction begins from this value.'
    : 'Optional — leave blank and suppliers will set the first price.';
  const decLabel = isPerUnit ? `Minimum Decrement (per ${unitWord})` : 'Minimum Decrement (total value)';
  const decPlaceholder = isPerUnit ? '500' : '10,000';
  const decHelper = isPerUnit
    ? `Each new bid must be lower by at least this amount per ${unitWord}.`
    : 'Each new bid must reduce total order value by at least this amount.';
  const pricingBadge = isPerUnit ? `₹ per ${unitWord}` : '₹ total';

  // Unit selector visibility:
  //   - always show when per-unit AND no inferred unit (mandatory)
  //   - show as "change" affordance when inferred but allowedUnits has alternates
  const showMandatoryUnitSelector = isPerUnit && !inferredUnit && !unitOverride;
  const hasAlternates = isPerUnit && inferredUnit && allowedUnits.length > 1;

  // When category is inferred (allowedUnits scoped to category), use that.
  // Otherwise fall back to broader generic list.
  const fallbackUnits = allowedUnits.length > 1 || allowedUnits[0] !== 'ton'
    ? allowedUnits
    : ['ton', 'kg', 'piece', 'bag', 'metre', 'litre'];
  // Actually: when no inference (low confidence), allowedUnits already = full generic list per inference logic.
  // When category inferred, allowedUnits is narrow. So just use allowedUnits directly:
  const mandatorySelectorUnits = allowedUnits;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Set how the auction will run</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Suppliers will place bids lower than the current price during the auction.
        </p>
      </div>

      {/* Pricing method — primary, elevated section */}
      <div className="rounded-xl border-2 border-gold/30 bg-gold/[0.04] p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
              How suppliers will bid
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose how pricing will be compared across all bids.
            </p>
          </div>
          <Badge className="bg-gold text-gold-foreground text-[10px] flex-shrink-0">Required</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <PricingPill
            active={isPerUnit}
            onClick={() => setPricingMethod('per_unit')}
            title="Per Unit Price"
            sub={`₹ per ${unitWord}`}
          />
          <PricingPill
            active={!isPerUnit}
            onClick={() => setPricingMethod('total')}
            title="Total Order Value"
            sub="₹ total"
          />
        </div>

        {methodSwitchNote && (
          <p className="text-[11px] text-primary flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Pricing method changed. Starting price and decrement reset to match.
          </p>
        )}
        {unitSwitchNote && (
          <p className="text-[11px] text-primary flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Unit changed. Pricing reset to maintain consistency.
          </p>
        )}

        {/* Mandatory unit fallback selector (per-unit + no inference) */}
        {showMandatoryUnitSelector && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Select unit for pricing</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Required so all suppliers bid on the same unit. No free text — pick one.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {mandatorySelectorUnits.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnitOverride(u)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                    unitOverride === u
                      ? 'border-gold bg-gold/15 text-foreground'
                      : 'border-border bg-background hover:border-primary/40'
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Soft unit affordance when inferred + alternates exist */}
        {isPerUnit && unitHint && (hasAlternates || unitOverride) && (
          <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                Pricing unit: <span className="font-semibold text-foreground">{unitWord}</span>
                {inferenceConfidence !== 'high' && !unitOverride && (
                  <span className="ml-1 text-[10px] text-muted-foreground">(suggested)</span>
                )}
              </span>
              <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                Locked across all bids
              </Badge>
            </div>
            {hasAlternates && (
              <div className="flex gap-1">
                {allowedUnits.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnitOverride(u === inferredUnit ? '' : u)}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] border transition-colors',
                      unitWord === u
                        ? 'border-gold bg-gold/10 text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Duration</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="w-full sm:w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
              <SelectItem value="240">4 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-semibold">
                {startLabel} <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Badge variant="secondary" className="text-[10px]">
                {pricingBadge}
              </Badge>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
              <Input
                type="number"
                inputMode="numeric"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                placeholder={startPlaceholder}
                className="pl-7"
                disabled={needsUnitSelection}
              />
            </div>
            <p className="text-xs text-muted-foreground">{startHelper}</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-semibold">
                {decLabel} <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Badge variant="secondary" className="text-[10px]">
                {pricingBadge}
              </Badge>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
              <Input
                type="number"
                inputMode="numeric"
                value={minDecrement}
                onChange={(e) => setMinDecrement(e.target.value)}
                placeholder={decPlaceholder}
                className={cn('pl-7', decrementError && 'border-destructive focus-visible:ring-destructive/50')}
                disabled={needsUnitSelection}
              />
            </div>
            {decrementError ? (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {decrementError}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{decHelper}</p>
            )}
          </div>
        </div>

        {/* Visual Next-Valid-Bid box (live feedback) — value-dominant hierarchy */}
        {nextValidBid && !decrementError && (
          <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/8 to-primary/[0.02] p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                  Next valid bid
                </p>
                <p className="text-4xl font-bold text-primary leading-none tracking-tight">
                  {nextValidBid}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {isPerUnit ? `per ${unitWord}` : 'total order value'}
                </p>
              </div>
              <TrendingDown className="h-9 w-9 text-primary/40 flex-shrink-0" />
            </div>

            {/* Mini static auction preview — stacked layout */}
            <div className="mt-4 pt-4 border-t border-primary/15 grid grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Current price
                </p>
                <p className="text-base font-semibold text-foreground">
                  ₹{Number(startingPrice).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-wide text-primary/80 font-semibold">
                  Next bid
                </p>
                <p className="text-base font-bold text-primary">{nextValidBid}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 flex items-start gap-2">
        <TrendingDown className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-foreground/80">
          Pricing applies consistently across bids. If you set price per unit, all bids and decrements follow per unit.
        </p>
      </div>
    </div>
  );
}

function PricingPill({
  active, onClick, title, sub,
}: { active: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-left p-3 rounded-lg border-2 transition-all',
        active ? 'border-gold bg-gold/5' : 'border-border hover:border-primary/40'
      )}
    >
      <p className={cn('text-sm font-semibold', active ? 'text-foreground' : 'text-foreground/80')}>{title}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
    </button>
  );
}


/* ──────────────────────────  STEP 3  ────────────────────────── */

function StepReview({
  supplierMode, supplierCount, requirement, duration, pricingMethod, startingPrice, minDecrement, unitHint,
}: {
  supplierMode: SupplierMode;
  supplierCount: number;
  requirement: string;
  duration: string;
  pricingMethod: PricingMethod;
  startingPrice: string;
  minDecrement: string;
  unitHint: string;
}) {
  const supplierLabel = supplierMode === 'ai'
    ? `AI-matched (~${supplierCount} suppliers)`
    : 'Select from your supplier list (after login)';

  const behaviorLine = pricingMethod === 'per_unit'
    ? 'Suppliers will bid per unit. Total order value will vary with quantity.'
    : 'Suppliers will bid on total order value.';

  const isPerUnit = pricingMethod === 'per_unit';
  const unitWord = unitHint || 'unit';
  const priceSuffix = isPerUnit ? `per ${unitWord}` : '(total order)';
  const decSuffix = isPerUnit ? `per ${unitWord}` : '(total)';

  const formatINR = (v: string, suffix?: string) => {
    if (!v) return '—';
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return `₹${n.toLocaleString('en-IN')}${suffix ? ` ${suffix}` : ''}`;
  };

  const durationLabel = duration === '60' ? '1 hour'
    : duration === '120' ? '2 hours'
    : duration === '240' ? '4 hours'
    : `${duration} minutes`;

  const pricingBadge = (
    <Badge className={cn(
      'text-[10px] font-semibold',
      isPerUnit ? 'bg-gold text-gold-foreground' : 'bg-primary text-primary-foreground'
    )}>
      {isPerUnit ? 'Per Unit' : 'Total Order'}
    </Badge>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Review your auction</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Confirm the setup. You can refine details after launch.
        </p>
      </div>

      <Card className="p-5 bg-muted/30 border-border space-y-3">
        <ReviewRow label="Requirement" value={requirement || '—'} />
        <ReviewRow label="Suppliers" value={supplierLabel} />
        <ReviewRow label="Duration" value={durationLabel} />
        <div className="flex items-start justify-between gap-4 text-sm">
          <span className="text-muted-foreground flex-shrink-0">Pricing method</span>
          <span className="flex items-center gap-2 font-semibold text-foreground text-right">
            {isPerUnit ? 'Per Unit Price' : 'Total Order Value'}
            {pricingBadge}
          </span>
        </div>
        {isPerUnit && unitHint && (
          <ReviewRow label="Unit" value={unitHint} />
        )}
        <ReviewRow label="Starting price" value={formatINR(startingPrice, priceSuffix)} />
        <ReviewRow label="Minimum decrement" value={formatINR(minDecrement, decSuffix)} />
      </Card>

      {/* Behavior interpretation line — closes the gap on what selection means */}
      <div className="rounded-lg border-2 border-primary/25 bg-primary/5 px-3.5 py-3 flex items-start gap-2">
        <TrendingDown className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[11px] uppercase font-semibold tracking-wide text-primary/80">
            Auction behavior
          </p>
          <p className="text-xs text-foreground/85 mt-0.5">{behaviorLine}</p>
        </div>
      </div>

      <div className="rounded-lg border border-gold/30 bg-gold/5 px-3 py-2.5 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
        <p className="text-xs text-foreground/80">
          Auction starts immediately after launch. Suppliers are notified instantly via email & WhatsApp.
        </p>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className="font-semibold text-foreground text-right break-words">{value}</span>
    </div>
  );
}

export default SetupReverseAuction;
