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

  // When pricing method changes, reset decrement (prevent unit mismatch)
  const handlePricingMethodChange = (m: PricingMethod) => {
    if (m === pricingMethod) return;
    setPricingMethod(m);
    setMinDecrement('');
    setMethodSwitchNote(true);
    window.setTimeout(() => setMethodSwitchNote(false), 4000);
  };

  // Validation
  const startingPriceNum = Number(startingPrice);
  const minDecrementNum = Number(minDecrement);
  const decrementError =
    minDecrement && startingPrice && Number.isFinite(startingPriceNum) && Number.isFinite(minDecrementNum)
      && minDecrementNum > startingPriceNum
        ? 'Minimum decrement cannot exceed starting price'
        : '';

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
  const canNextStep2 = !!duration && !decrementError;

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

  // Next valid bid preview
  const nextValidBid = useMemo(() => {
    if (!startingPrice || !minDecrement) return '';
    const sp = Number(startingPrice);
    const md = Number(minDecrement);
    if (!Number.isFinite(sp) || !Number.isFinite(md) || md <= 0 || md > sp) return '';
    const next = sp - md;
    return `₹${next.toLocaleString('en-IN')}`;
  }, [startingPrice, minDecrement]);

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
              <span className="font-semibold text-foreground">Notifications:</span>
              <span className="ml-1.5">2 free/day</span>
              <span className="text-border mx-1.5">·</span>
              <span>₹500 = 200 emails</span>
              <span className="text-border mx-1.5">·</span>
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
              setStartingPrice={setStartingPrice}
              minDecrement={minDecrement}
              setMinDecrement={setMinDecrement}
              decrementError={decrementError}
              unitHint={unitHint}
              nextValidBid={nextValidBid}
              unitOverride={unitOverride}
              setUnitOverride={setUnitOverride}
              allowedUnits={unitInference.allowed}
              inferredUnit={unitInference.unit}
              inferenceConfidence={unitInference.confidence}
              needsUnitSelection={needsUnitSelection}
              methodSwitchNote={methodSwitchNote}
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
                Continue
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
          description="Choose from your saved supplier list after login."
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
}) {
  const isPerUnit = pricingMethod === 'per_unit';
  const unitWord = unitHint || 'unit';
  const unitFallbackNote = !unitHint;
  const startLabel = isPerUnit
    ? `Starting Price (per ${unitWord})`
    : 'Starting Price (total order value)';
  const startPlaceholder = isPerUnit ? `e.g. 50,000 per ${unitWord}` : 'e.g. 25,00,000 total';
  const startHelper = startingPrice
    ? 'Auction starts from your defined price.'
    : 'Optional — leave blank and the auction will start from supplier bids.';
  const decLabel = isPerUnit ? `Minimum Decrement (per ${unitWord})` : 'Minimum Decrement (total value)';
  const decPlaceholder = isPerUnit ? '500' : '10,000';
  const decHelper = isPerUnit
    ? `Each new bid must be lower by at least this amount per ${unitWord}.`
    : 'Each new bid must reduce total order value by at least this amount.';
  const pricingBadge = isPerUnit ? `₹ per ${unitWord}` : '₹ total';

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
        {isPerUnit && unitFallbackNote && (
          <p className="text-[11px] text-muted-foreground">
            Tip: mention a unit (e.g. ton, piece, kg) in your requirement to lock units across all bids.
          </p>
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
              />
            </div>
            {decrementError ? (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {decrementError}
              </p>
            ) : nextValidBid ? (
              <p className="text-xs text-primary flex items-center gap-1 font-medium">
                <TrendingDown className="h-3 w-3" />
                Next valid bid: {nextValidBid} {isPerUnit ? `per ${unitWord}` : '(total)'}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{decHelper}</p>
            )}
          </div>
        </div>
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
    : 'Manual selection (after login)';

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
        <ReviewRow label="Starting price" value={formatINR(startingPrice, priceSuffix)} />
        <ReviewRow label="Minimum decrement" value={formatINR(minDecrement, decSuffix)} />
      </Card>

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
