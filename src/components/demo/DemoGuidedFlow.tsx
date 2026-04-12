import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Check, Clock, Truck, Package, CreditCard, Award, Play,
  SkipForward, Globe, Eye, Layers, Rocket, Zap, Bot,
  FileText, Users, Mail, Send, RotateCcw, TrendingDown
} from 'lucide-react';
import { DEMO_AUCTION, DEMO_PO, DEMO_SUPPLIERS, DEMO_TRANSPORTER, DEMO_TIMELINE_STEPS, type DemoBid, type DemoPOStatus } from '@/lib/demo-data';
import { DemoBanner } from './DemoBanner';
import { DemoSavingsGraph } from './DemoSavingsGraph';

interface DemoGuidedFlowProps {
  onReset: () => void;
  onExit: () => void;
}

type DemoPhase = 'rfq' | 'invite' | 'auction' | 'po_lifecycle';
type DemoDepth = 'sales' | 'deep';
type EntryScenario = 'buyer' | 'supplier' | 'full';

const STATUS_ICONS: Record<DemoPOStatus, React.ReactNode> = {
  draft: <Clock className="w-4 h-4" />,
  sent: <Package className="w-4 h-4" />,
  accepted: <Check className="w-4 h-4" />,
  in_transit: <Truck className="w-4 h-4" />,
  delivered: <Package className="w-4 h-4" />,
  payment_done: <CreditCard className="w-4 h-4" />,
  closed: <Award className="w-4 h-4" />,
};

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिंदी' },
  { value: 'ar', label: 'العربية' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'zh', label: '中文' },
];

const BASELINE_PRICE = 52000;

const DEMO_SKUS = [
  { id: 'sku-1', name: 'TMT Fe500 — 12mm', qty: 200, unit: 'MT', basePrice: 52000 },
  { id: 'sku-2', name: 'TMT Fe500 — 16mm', qty: 180, unit: 'MT', basePrice: 51500 },
  { id: 'sku-3', name: 'TMT Fe500 — 20mm', qty: 120, unit: 'MT', basePrice: 51000 },
];

const calcTotalOrderValue = (unitPrice: number) =>
  DEMO_SKUS.reduce((sum, sku) => sum + sku.qty * Math.round(unitPrice * (sku.basePrice / BASELINE_PRICE)), 0);

const BASELINE_TOTAL = calcTotalOrderValue(BASELINE_PRICE);

const DEMO_RFQ = {
  id: 'RFQ-2026-001',
  buyerName: 'ABC Infra Pvt Ltd',
  buyerContact: 'Rajesh Kumar',
  location: 'Gurgaon, Haryana',
  deliveryDays: 7,
  paymentTerms: '30 days credit',
  category: 'Metals — Ferrous',
  subCategory: 'TMT Steel Bars',
};

const DEMO_INVITE_EMAILS = [
  { name: 'Tata Steel Trading', email: 'procurement@tatasteel.in', sent: false },
  { name: 'JSW Steel Trading', email: 'bids@jswsteel.in', sent: false },
  { name: 'SAIL Distribution', email: 'quotes@sail.in', sent: false },
];

const PHASE_STEPS: { phase: DemoPhase; label: string; number: number }[] = [
  { phase: 'rfq', label: 'Create RFQ', number: 1 },
  { phase: 'invite', label: 'Invite Suppliers', number: 2 },
  { phase: 'auction', label: 'Run Auction', number: 3 },
  { phase: 'po_lifecycle', label: 'Save Cost', number: 4 },
];

// ── Step Indicator ──
function DemoStepIndicator({ currentPhase, auctionComplete }: { currentPhase: DemoPhase; auctionComplete: boolean }) {
  const currentIdx = PHASE_STEPS.findIndex(s => s.phase === currentPhase);
  return (
    <div className="flex items-center gap-1 w-full overflow-x-auto py-2">
      {PHASE_STEPS.map((step, idx) => {
        const isActive = idx === currentIdx;
        const isCompleted = idx < currentIdx || (currentPhase === 'po_lifecycle' && idx <= currentIdx);
        return (
          <div key={step.phase} className="flex items-center gap-1 flex-1 min-w-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              isActive ? 'bg-primary text-primary-foreground shadow-sm' :
              isCompleted ? 'bg-primary/15 text-primary' :
              'bg-muted text-muted-foreground'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isCompleted && !isActive ? 'bg-primary text-primary-foreground' : 
                isActive ? 'bg-primary-foreground text-primary' : 'bg-muted-foreground/20'
              }`}>
                {isCompleted && !isActive ? '✓' : step.number}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {idx < PHASE_STEPS.length - 1 && (
              <div className={`h-px flex-1 min-w-2 ${isCompleted ? 'bg-primary/40' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Animated Savings Counter ──
function AnimatedSavingsCounter({ targetSavings, targetPercent }: { targetSavings: number; targetPercent: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    let frame: number;
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(eased * targetSavings));
      setDisplayPct(Math.round(eased * targetPercent * 10) / 10);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [targetSavings, targetPercent]);

  return (
    <div className="flex items-center gap-3">
      <div className="text-2xl font-bold text-green-600 tabular-nums">
        💰 ₹{displayValue.toLocaleString('en-IN')}
      </div>
      <Badge variant="secondary" className="text-green-700 bg-green-100 text-sm">
        {displayPct}% saved
      </Badge>
    </div>
  );
}

// ── AI RFQ Animation Step ──
function DemoRFQStep({ onComplete, scenario }: { onComplete: () => void; scenario: EntryScenario }) {
  const [aiStage, setAiStage] = useState(0);
  const [filledFields, setFilledFields] = useState(0);
  const aiStages = [
    '💬 "Requirement: 500 MT TMT Steel Bars (Fe500), sizes 12mm, 16mm, 20mm — delivery to Gurgaon within 7 days"',
    '🔍 Parsing requirement…',
    '🧩 Structuring into SKU line items…',
    '🤖 Optimizing supplier selection…',
  ];
  const fields = [
    { label: 'Product', value: DEMO_RFQ.subCategory },
    { label: 'Category', value: DEMO_RFQ.category },
    { label: 'Buyer', value: `${DEMO_RFQ.buyerContact} — ${DEMO_RFQ.buyerName}` },
    { label: 'Location', value: DEMO_RFQ.location },
    { label: 'Delivery', value: `${DEMO_RFQ.deliveryDays} days` },
    { label: 'Payment Terms', value: DEMO_RFQ.paymentTerms },
  ];

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setAiStage(1), 1200));
    timers.push(setTimeout(() => setAiStage(2), 2400));
    timers.push(setTimeout(() => setAiStage(3), 3600));
    timers.push(setTimeout(() => setAiStage(4), 4800));
    fields.forEach((_, i) => {
      timers.push(setTimeout(() => setFilledFields(i + 1), 4800 + 600 * (i + 1)));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  const showFields = aiStage >= 4;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">AI RFQ Generation</CardTitle>
          <Badge variant="outline" className="text-xs">{DEMO_RFQ.id}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {scenario === 'supplier'
            ? 'Buyer has submitted a structured requirement — you receive this enquiry:'
            : 'Enter your requirement in plain text — AI structures it automatically'}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-1.5">
          {aiStages.map((text, i) => (
            <p key={i} className={`text-sm font-mono transition-all duration-300 ${
              i < aiStage ? 'text-muted-foreground' : i === aiStage ? 'text-foreground animate-pulse' : 'opacity-0 h-0 overflow-hidden'
            }`}>
              {i < aiStage ? '✅ ' : ''}{text}
            </p>
          ))}
        </div>

        {showFields && (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {fields.map((f, i) => (
              <div
                key={f.label}
                className={`flex items-center gap-3 p-2 rounded border transition-all duration-300 ${
                  i < filledFields ? 'border-primary/30 bg-primary/5' : 'border-border opacity-40'
                }`}
              >
                <span className="text-xs text-muted-foreground w-24 shrink-0">{f.label}</span>
                <span className={`text-sm font-medium transition-opacity ${i < filledFields ? 'opacity-100' : 'opacity-0'}`}>
                  {f.value}
                </span>
                {i < filledFields && <Check className="w-3.5 h-3.5 text-green-600 ml-auto" />}
              </div>
            ))}
          </div>
        )}

        {filledFields >= fields.length && (
          <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-xs font-semibold text-muted-foreground">📦 SKU Breakdown (Auto-generated)</p>
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-4 gap-px bg-border text-xs font-medium text-muted-foreground">
                <div className="bg-muted p-2">Item</div>
                <div className="bg-muted p-2 text-right">Qty</div>
                <div className="bg-muted p-2 text-right">Unit</div>
                <div className="bg-muted p-2 text-right">Est. Price</div>
              </div>
              {DEMO_SKUS.map(sku => (
                <div key={sku.id} className="grid grid-cols-4 gap-px bg-border text-sm">
                  <div className="bg-background p-2">{sku.name}</div>
                  <div className="bg-background p-2 text-right tabular-nums">{sku.qty}</div>
                  <div className="bg-background p-2 text-right">{sku.unit}</div>
                  <div className="bg-background p-2 text-right tabular-nums">₹{sku.basePrice.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filledFields >= fields.length && (
          <Button className="w-full mt-3 gap-2" onClick={onComplete}>
            <Mail className="w-4 h-4" />
            {scenario === 'supplier' ? 'View Auction Invite →' : 'Invite Suppliers →'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Supplier Invite Step ──
function DemoInviteStep({ onComplete, scenario }: { onComplete: () => void; scenario: EntryScenario }) {
  const [sentEmails, setSentEmails] = useState<boolean[]>(DEMO_INVITE_EMAILS.map(() => false));
  const [allSent, setAllSent] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    DEMO_INVITE_EMAILS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setSentEmails(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 800 * (i + 1)));
    });
    timers.push(setTimeout(() => {
      setAllSent(true);
      setShowPreview(true);
    }, 800 * (DEMO_INVITE_EMAILS.length + 1)));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Invite Suppliers</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          {scenario === 'supplier'
            ? 'You received this private auction invitation from a verified buyer:'
            : 'Sending structured, private invitations to your trusted supplier network'}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {DEMO_INVITE_EMAILS.map((inv, i) => (
            <div
              key={inv.email}
              className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-500 ${
                sentEmails[i] ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' : 'border-border'
              }`}
            >
              <Mail className={`w-4 h-4 shrink-0 transition-colors ${sentEmails[i] ? 'text-green-600' : 'text-muted-foreground'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{inv.name}</p>
                <p className="text-xs text-muted-foreground truncate">{inv.email}</p>
              </div>
              {sentEmails[i] ? (
                <Badge variant="secondary" className="text-green-700 bg-green-100 text-xs shrink-0">
                  ✅ Sent
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground animate-pulse">Sending…</span>
              )}
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground/60 mt-1.5">
            Sent via auctions@procuresaathi.com • Tracked • Delivered
          </p>
        </div>

        {showPreview && (
          <div className="mt-3 p-4 bg-muted/30 rounded-lg border border-border space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-xs font-semibold text-muted-foreground">📧 Email Preview</p>
            <div className="bg-background rounded-lg p-3 border border-border space-y-1.5">
              <p className="text-xs text-muted-foreground">From: ProcureSaathi &lt;auctions@procuresaathi.com&gt;</p>
              <p className="text-xs text-muted-foreground">Subject: <span className="font-semibold text-foreground">Private Auction Invite — TMT Steel Bars (500 MT)</span></p>
              <hr className="my-2 border-border" />
              <p className="text-sm text-foreground">
                You've been invited to a <strong>private reverse auction</strong> by <strong>{DEMO_RFQ.buyerName}</strong>.
              </p>
              <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                <p>📦 Product: TMT Fe500 — 12mm, 16mm, 20mm</p>
                <p>📍 Delivery: {DEMO_RFQ.location} ({DEMO_RFQ.deliveryDays} days)</p>
                <p>💳 Terms: {DEMO_RFQ.paymentTerms}</p>
              </div>
              <div className="mt-2 p-2 bg-primary/5 rounded text-xs text-primary font-medium text-center">
                [ Accept Invite & Place Bid → ]
              </div>
            </div>
          </div>
        )}

        {allSent && (
          <Button className="w-full mt-3 gap-2" onClick={onComplete}>
            <Zap className="w-4 h-4" />
            Start Live Auction →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Supplier Auction View ──
function SupplierAuctionView({
  bids,
  auctionComplete,
  bidRound,
  onReduceBid,
}: {
  bids: DemoBid[];
  auctionComplete: boolean;
  bidRound: number;
  onReduceBid: () => void;
}) {
  const sortedBids = [...bids].sort((a, b) => a.price - b.price);
  const myBid = bids.find(b => b.supplierId === 'demo-sup-2');
  const myRank = sortedBids.findIndex(b => b.supplierId === 'demo-sup-2') + 1;
  const l1Price = sortedBids[0]?.price || 0;
  const myTotal = myBid ? calcTotalOrderValue(myBid.price) : 0;
  const l1Total = calcTotalOrderValue(l1Price);
  const gapToL1 = myTotal - l1Total;

  return (
    <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Supplier View — Your Bidding Console</CardTitle>
          </div>
          <Badge variant={auctionComplete ? 'secondary' : 'default'}>
            {auctionComplete ? '✅ Ended' : `🔴 LIVE — Round ${bidRound}/8`}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">You are: JSW Steel Trading (Bellary)</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rank strip */}
        <div className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/40">
          <div className={`text-2xl font-bold ${myRank === 1 ? 'text-green-600' : myRank === 2 ? 'text-amber-600' : 'text-destructive'}`}>
            #{myRank}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Your Rank: {myRank === 1 ? 'L1 🏆' : myRank === 2 ? 'L2' : 'L3'}</p>
            <p className="text-xs text-muted-foreground">
              Your Total: ₹{myTotal.toLocaleString('en-IN')}
              {myRank > 1 && ` • Gap to L1: ₹${gapToL1.toLocaleString('en-IN')}`}
            </p>
          </div>
          {myRank > 1 && !auctionComplete && (
            <div className="text-xs text-destructive font-medium animate-pulse">
              ⚠️ You are about to lose this order
            </div>
          )}
          {!auctionComplete && myRank > 1 && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1" onClick={onReduceBid}>
              <Zap className="w-3.5 h-3.5" />
              Become L1
            </Button>
          )}
        </div>

        {/* SKU-level pricing — always derived from bid */}
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-5 gap-px bg-border text-xs font-medium text-muted-foreground">
            <div className="bg-muted p-2">SKU</div>
            <div className="bg-muted p-2 text-right">Qty</div>
            <div className="bg-muted p-2 text-right">Your Rate</div>
            <div className="bg-muted p-2 text-right">Your Total</div>
            <div className="bg-muted p-2 text-right">L1 Total</div>
          </div>
          {DEMO_SKUS.map(sku => {
            const mySkuPrice = myBid ? Math.round(myBid.price * (sku.basePrice / BASELINE_PRICE)) : sku.basePrice;
            const l1SkuPrice = Math.round(l1Price * (sku.basePrice / BASELINE_PRICE));
            return (
              <div key={sku.id} className="grid grid-cols-5 gap-px bg-border text-sm">
                <div className="bg-background p-2">{sku.name}</div>
                <div className="bg-background p-2 text-right tabular-nums">{sku.qty}</div>
                <div className="bg-background p-2 text-right tabular-nums">₹{mySkuPrice.toLocaleString('en-IN')}</div>
                <div className="bg-background p-2 text-right tabular-nums font-medium">₹{(mySkuPrice * sku.qty).toLocaleString('en-IN')}</div>
                <div className="bg-background p-2 text-right tabular-nums text-primary">₹{(l1SkuPrice * sku.qty).toLocaleString('en-IN')}</div>
              </div>
            );
          })}
        </div>

        {/* Suggested next bid */}
        {!auctionComplete && myRank > 1 && (
          <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded border border-border">
            🤖 Suggested total bid: <span className="font-semibold text-foreground">₹{calcTotalOrderValue(l1Price - 50).toLocaleString('en-IN')}</span>
            <span className="ml-1 text-muted-foreground/70">— beat L1 by ₹50/MT</span>
          </div>
        )}

        {/* Leaderboard */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">📊 Live Leaderboard</p>
          {sortedBids.map((bid, idx) => (
            <div
              key={bid.supplierId}
              className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                bid.supplierId === 'demo-sup-2'
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/40'
                  : idx === 0
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>
                <span className="text-sm font-medium">
                  {bid.supplierId === 'demo-sup-2' ? `${bid.supplierName} (You)` : bid.supplierName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold tabular-nums">₹{calcTotalOrderValue(bid.price).toLocaleString('en-IN')}</span>
                <p className="text-[10px] text-muted-foreground">₹{bid.price.toLocaleString('en-IN')}/MT</p>
              </div>
            </div>
          ))}
        </div>

        {auctionComplete && myRank === 1 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center dark:bg-green-950/30 dark:border-green-800">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">🏆 You won! Purchase Order incoming.</p>
          </div>
        )}
        {auctionComplete && myRank > 1 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center dark:bg-amber-950/30 dark:border-amber-800">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              You finished #{myRank}. Improve your next bid strategy.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Buyer Auction View ──
function BuyerAuctionView({
  bids,
  auctionComplete,
  bidRound,
  onProceedToPO,
}: {
  bids: DemoBid[];
  auctionComplete: boolean;
  bidRound: number;
  onProceedToPO: () => void;
}) {
  const sortedBids = [...bids].sort((a, b) => a.price - b.price);
  const lowestBid = sortedBids[0];
  const totalSaved = BASELINE_TOTAL - calcTotalOrderValue(lowestBid.price);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{DEMO_AUCTION.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {DEMO_RFQ.id} • {DEMO_RFQ.buyerName} • {DEMO_RFQ.location}
            </p>
          </div>
          <Badge variant={auctionComplete ? 'secondary' : 'default'}>
            {auctionComplete ? '✅ Completed' : `🔴 LIVE — Round ${bidRound}/8`}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {DEMO_AUCTION.category} • {DEMO_AUCTION.quantity} {DEMO_AUCTION.unit} • {DEMO_AUCTION.currency}
        </p>
        <p className="text-xs text-muted-foreground">
          You invited {sortedBids.length} verified suppliers • Auction controlled by you
        </p>
        {!auctionComplete && (
          <p className="text-xs text-green-600">↓ Prices improving in real-time</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Psychological trigger */}
        <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
          Same suppliers. Different outcome — because of competition.
        </p>

        {sortedBids.map((bid, idx) => {
          const bidTotal = calcTotalOrderValue(bid.price);
          return (
            <div
              key={bid.supplierId}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                idx === 0 ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                <div>
                  <p className="font-medium text-sm">{bid.supplierName}</p>
                  <p className="text-xs text-muted-foreground">{bid.badge}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-lg tabular-nums ${idx === 0 ? 'text-primary' : 'text-foreground'}`}>
                  ₹{bidTotal.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-muted-foreground">₹{bid.price.toLocaleString('en-IN')}/MT</p>
              </div>
            </div>
          );
        })}

        {auctionComplete && (
          <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20 text-center space-y-3">
            <p className="text-2xl font-bold text-green-600">
              ₹{totalSaved.toLocaleString('en-IN')} saved in 90 seconds
            </p>
            <p className="text-sm font-medium text-muted-foreground">
              Same suppliers. Different outcome — because of competition.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              <span>🏆 Winner: {lowestBid.supplierName}</span>
              <span>•</span>
              <span>₹{calcTotalOrderValue(lowestBid.price).toLocaleString('en-IN')} total</span>
              <span>•</span>
              <span>{sortedBids.length} suppliers • 8 rounds</span>
            </div>
            <Button size="sm" className="mt-2" onClick={onProceedToPO}>
              Proceed to PO →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════
// ═══ MAIN COMPONENT ═══
// ════════════════════════════════════
export function DemoGuidedFlow({ onReset, onExit }: DemoGuidedFlowProps) {
  const navigate = useNavigate();
  const [showEntryScreen, setShowEntryScreen] = useState(true);
  const [scenario, setScenario] = useState<EntryScenario>('full');
  const [phase, setPhase] = useState<DemoPhase>('rfq');
  const [bids, setBids] = useState<DemoBid[]>(DEMO_AUCTION.initialBids);
  const [auctionComplete, setAuctionComplete] = useState(false);
  const [poStatus, setPOStatus] = useState<DemoPOStatus>('draft');
  const [autoPlay, setAutoPlay] = useState(false);
  const [bidRound, setBidRound] = useState(0);
  const [fullDemoRunning, setFullDemoRunning] = useState(false);
  const [highlightSection, setHighlightSection] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const [demoDepth, setDemoDepth] = useState<DemoDepth>('deep');
  const [showCTA, setShowCTA] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [activeSuppliers, setActiveSuppliers] = useState<typeof DEMO_SUPPLIERS>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const pauseListenerAttached = useRef(false);
  const isTransitioningRef = useRef(false);
  const previousPhaseRef = useRef<DemoPhase | null>(null);
  const skipPhaseNarrationRef = useRef<DemoPhase | null>(null);

  // ── Auto-scroll to highlighted section ──
  useEffect(() => {
    if (highlightSection) {
      const el = document.getElementById(highlightSection);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightSection]);

  // ── Pause on user interaction during full demo ──
  useEffect(() => {
    if (!fullDemoRunning) {
      pauseListenerAttached.current = false;
      return;
    }
    if (pauseListenerAttached.current) return;
    pauseListenerAttached.current = true;

    const handleInteraction = (e: Event) => {
      const target = e.target as Element | null;
      if (target && typeof target.closest === 'function' && target.closest('[data-demo-controls]')) return;
      setFullDemoRunning(false);
      setAutoPlay(false);
    };

    const opts = { once: true, capture: true };
    window.addEventListener('scroll', handleInteraction, opts);
    document.addEventListener('keydown', handleInteraction, opts);

    return () => {
      window.removeEventListener('scroll', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [fullDemoRunning]);

  useEffect(() => {
    if (showEntryScreen) {
      previousPhaseRef.current = null;
      skipPhaseNarrationRef.current = null;
    }
  }, [showEntryScreen]);

  // ── Track phase changes ──
  useEffect(() => {
    if (showEntryScreen) return;

    if (skipPhaseNarrationRef.current === phase) {
      previousPhaseRef.current = phase;
      skipPhaseNarrationRef.current = null;
      return;
    }

    const previousPhase = previousPhaseRef.current;
    if (previousPhase === phase) return;
    previousPhaseRef.current = phase;
  }, [phase, poStatus, showEntryScreen]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'auction' || auctionComplete || showEntryScreen) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setAuctionComplete(true); clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, auctionComplete, showEntryScreen]);

  // Supplier join animation
  useEffect(() => {
    if (phase !== 'auction' || showEntryScreen) return;
    setActiveSuppliers([]);
    const timers = DEMO_SUPPLIERS.map((s, i) =>
      setTimeout(() => setActiveSuppliers(prev => [...prev, s]), i * 1200)
    );
    return () => timers.forEach(clearTimeout);
  }, [phase, showEntryScreen]);

  // ── Live bid simulation with per-supplier aggression ──
  useEffect(() => {
    if (phase !== 'auction' || auctionComplete || showEntryScreen) return;

    const aggressionMap: Record<string, { minDrop: number; maxDrop: number; floor: number }> = {
      'demo-sup-1': { minDrop: 80, maxDrop: 200, floor: BASELINE_PRICE - 800 },
      'demo-sup-2': { minDrop: 40, maxDrop: 150, floor: BASELINE_PRICE - 550 },
      'demo-sup-3': { minDrop: 30, maxDrop: 120, floor: BASELINE_PRICE - 350 },
    };

    const interval = setInterval(() => {
      setBids(prev =>
        prev.map(b => {
          const config = aggressionMap[b.supplierId] || { minDrop: 50, maxDrop: 150, floor: BASELINE_PRICE - 500 };
          const drop = Math.floor(Math.random() * (config.maxDrop - config.minDrop) + config.minDrop);
          return { ...b, price: Math.max(b.price - drop, config.floor) };
        })
      );
      setBidRound(r => {
        const next = r + 1;
        if (next >= 8) { setAuctionComplete(true); clearInterval(interval); }
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [phase, auctionComplete, showEntryScreen]);

  // Auction complete handler
  useEffect(() => {
    if (auctionComplete && phase === 'auction') {
      // Auction completed
    }
  }, [auctionComplete, phase]);

  // Auto-play PO lifecycle
  useEffect(() => {
    if (phase !== 'po_lifecycle' || !autoPlay) return;
    const currentIdx = DEMO_TIMELINE_STEPS.findIndex(s => s.status === poStatus);
    if (currentIdx < 0) {
      const firstStep = DEMO_TIMELINE_STEPS[0];
      timerRef.current = setTimeout(() => setPOStatus(firstStep.status), firstStep.delayMs);
    } else if (currentIdx < DEMO_TIMELINE_STEPS.length - 1) {
      const nextStep = DEMO_TIMELINE_STEPS[currentIdx + 1];
      timerRef.current = setTimeout(() => setPOStatus(nextStep.status), nextStep.delayMs);
    } else {
      setAutoPlay(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, autoPlay, poStatus]);

  // Show CTA on PO close
  useEffect(() => {
    if (poStatus === 'closed' && phase === 'po_lifecycle') {
      const t = setTimeout(() => {
        setShowCTA(true);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [poStatus, phase]);

  const handleReset = useCallback(() => {
    setBids(DEMO_AUCTION.initialBids);
    setAuctionComplete(false);
    setPOStatus('draft');
    setAutoPlay(false);
    setBidRound(0);
    setPhase('rfq');
    setFullDemoRunning(false);
    setShowEntryScreen(true);
    setShowCTA(false);
    setTimeLeft(120);
    setActiveSuppliers([]);
    onReset();
  }, [onReset]);

  const handleExit = useCallback(() => {
    onExit();
  }, [onExit]);

  const advancePO = useCallback(() => {
    setPOStatus(currentStatus => {
      const currentIdx = DEMO_TIMELINE_STEPS.findIndex(s => s.status === currentStatus);
      const nextIdx = currentStatus === 'draft' ? 0 : currentIdx + 1;
      return nextIdx < DEMO_TIMELINE_STEPS.length ? DEMO_TIMELINE_STEPS[nextIdx].status : currentStatus;
    });
  }, []);

  const goToPhase = useCallback((nextPhase: DemoPhase) => {
    setHighlightSection(null);
    setPhase(nextPhase);
  }, []);

  // ── PURE NAVIGATION — no voice dependency ──
  const goToNextPhase = useCallback(() => {
    setHighlightSection(null);
    setPhase(prev => {
      if (prev === 'rfq') return 'invite';
      if (prev === 'invite') return 'auction';
      if (prev === 'auction') return auctionComplete ? 'po_lifecycle' : prev;
      if (prev === 'po_lifecycle') {
        advancePO();
        return prev;
      }
      return prev;
    });
  }, [advancePO, auctionComplete]);

  const handleManualPhaseChange = useCallback((nextPhase: DemoPhase) => {
    setFullDemoRunning(false);
    setAutoPlay(false);
    goToPhase(nextPhase);
  }, [goToPhase]);

  // ── SPAM-PROTECTED NEXT STEP ──
  const handleNextStep = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setFullDemoRunning(false);
    setAutoPlay(false);
    
    goToNextPhase();
    setTimeout(() => { isTransitioningRef.current = false; }, 300);
  }, [goToNextPhase]);

  const resetCurrentStep = useCallback(() => {
    setFullDemoRunning(false);
    setAutoPlay(false);
    setHighlightSection(null);
    if (phase === 'auction' || phase === 'invite') {
      setBids(DEMO_AUCTION.initialBids);
      setAuctionComplete(false);
      setBidRound(0);
      setTimeLeft(120);
      setActiveSuppliers([]);
    }
    if (phase === 'po_lifecycle') {
      setPOStatus('draft');
      setShowCTA(false);
    }
  }, [phase]);

  const startDemo = useCallback((s: EntryScenario) => {
    setScenario(s);
    setShowEntryScreen(false);
    setHighlightSection(null);
    previousPhaseRef.current = null;
    skipPhaseNarrationRef.current = 'rfq';
    setPhase('rfq');
    setAutoPlay(false);
    setFullDemoRunning(s === 'full');
  }, []);

  // Full demo: auto-advance
  useEffect(() => {
    if (!fullDemoRunning) return;
    if (phase === 'rfq') {
      const t = setTimeout(() => goToPhase('invite'), 8000);
      return () => clearTimeout(t);
    }
    if (phase === 'invite') {
      const t = setTimeout(() => goToPhase('auction'), 5000);
      return () => clearTimeout(t);
    }
  }, [fullDemoRunning, goToPhase, phase]);

  useEffect(() => {
    if (!(fullDemoRunning && auctionComplete && phase === 'auction')) return;
    const t = setTimeout(() => { goToPhase('po_lifecycle'); setAutoPlay(true); }, 2500);
    return () => clearTimeout(t);
  }, [fullDemoRunning, auctionComplete, goToPhase, phase]);

  useEffect(() => {
    if (fullDemoRunning && poStatus === 'closed') setFullDemoRunning(false);
  }, [fullDemoRunning, poStatus]);

  const sortedBids = [...bids].sort((a, b) => a.price - b.price);
  const lowestBid = sortedBids[0];
  const allStatuses: DemoPOStatus[] = ['draft', 'sent', 'accepted', 'in_transit', 'delivered', 'payment_done', 'closed'];
  const currentStatusIdx = allStatuses.indexOf(poStatus);
  const progressPct = ((currentStatusIdx) / (allStatuses.length - 1)) * 100;
  const isDeepMode = demoDepth === 'deep';

  const l1Total = calcTotalOrderValue(lowestBid.price);
  const totalSavings = BASELINE_TOTAL - l1Total;
  const savingsPercent = ((totalSavings / BASELINE_TOTAL) * 100);
  const savingsPerMT = BASELINE_PRICE - lowestBid.price;

  const canGoNext =
    phase === 'rfq' ||
    phase === 'invite' ||
    (phase === 'auction' && auctionComplete) ||
    (phase === 'po_lifecycle' && poStatus !== 'closed');

  const highlightClass = (section: string) =>
    highlightSection === section
      ? 'ring-2 ring-primary/40 shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-shadow duration-500'
      : 'transition-shadow duration-500';

  const getLiveCommentary = () => {
    if (phase === 'rfq') return "Enter requirement → RFQ is created automatically";
    if (phase === 'invite') return "Private invitations sent → Only your suppliers participate";
    if (phase === 'auction' && !auctionComplete) return "Live competition in progress → Prices are dropping in real-time";
    if (phase === 'auction' && auctionComplete) return "Same suppliers. Better price. Driven by competition.";
    if (phase === 'po_lifecycle' && poStatus !== 'closed') return "Execution tracking → Every step is controlled and recorded";
    if (phase === 'po_lifecycle' && poStatus === 'closed') return "Procurement lifecycle completed → Fully tracked and optimized";
    return "";
  };

  if (showEntryScreen) {
    return (
      <div className="min-h-screen bg-background">
        <DemoBanner onReset={handleReset} onExit={handleExit} />
        <div className="max-w-lg mx-auto p-6 pt-12 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Interactive Procurement Simulation</h1>
            <p className="text-sm text-muted-foreground">Choose your walkthrough experience</p>
          </div>

          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-36 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Button className="w-full h-16 text-left justify-start gap-4" onClick={() => startDemo('full')}>
              <Play className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Full Walkthrough (2 min)</p>
                <p className="text-xs text-primary-foreground/70">AI RFQ → Invite → Auction → PO → Delivery → Payment</p>
              </div>
            </Button>

            <Button variant="outline" className="w-full h-16 text-left justify-start gap-4" onClick={() => startDemo('buyer')}>
              <Package className="w-5 h-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">Buyer Flow</p>
                <p className="text-xs text-muted-foreground">Create RFQ, invite suppliers, run auction, issue POs, track savings</p>
              </div>
            </Button>

            <Button variant="outline" className="w-full h-16 text-left justify-start gap-4" onClick={() => startDemo('supplier')}>
              <Truck className="w-5 h-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">Supplier Experience</p>
                <p className="text-xs text-muted-foreground">Receive invite, bid on auction, see L1/L2 leaderboard, accept PO</p>
              </div>
            </Button>
          </div>

          {/* Urgency CTA on entry */}
          <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-center space-y-2">
            <p className="text-sm font-medium text-destructive">
              No competition = higher prices. Run auctions to reduce cost instantly.
            </p>
            <Button size="sm" className="gap-1.5" onClick={() => navigate('/buyer/create-reverse-auction')}>
              <TrendingDown className="w-4 h-4" />
              Run Your First Auction
            </Button>
          </div>
        </div>

        <div className="fixed bottom-2 right-2 text-xs text-muted-foreground/60 pointer-events-none select-none z-50">
          Demo Environment — No Real Transactions
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DemoBanner onReset={handleReset} onExit={handleExit} />

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* ── Step Indicator ── */}
        <DemoStepIndicator currentPhase={phase} auctionComplete={auctionComplete} />

        {/* ── Live Commentary Bar ── */}
        {getLiveCommentary() && (
          <div className="bg-foreground text-background px-4 py-2.5 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
            ⚡ {getLiveCommentary()}
          </div>
        )}

        {/* ── Positioning Statement ── */}
        <div className="px-3 py-2 rounded-lg bg-muted/40 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            You don't negotiate prices here. You create competition — and the system tracks your savings automatically.
          </p>
        </div>

        {/* Phase tabs + controls */}
        <div className="flex items-center gap-2 flex-wrap" data-demo-controls>
          <Button variant={phase === 'rfq' ? 'default' : 'outline'} size="sm" onClick={() => handleManualPhaseChange('rfq')}>
            🤖 RFQ
          </Button>
          <Button variant={phase === 'invite' ? 'default' : 'outline'} size="sm" onClick={() => handleManualPhaseChange('invite')}>
            📧 Invite
          </Button>
          <Button variant={phase === 'auction' ? 'default' : 'outline'} size="sm" onClick={() => handleManualPhaseChange('auction')}>
            🔨 Auction
          </Button>
          <Button
            variant={phase === 'po_lifecycle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleManualPhaseChange('po_lifecycle')}
            disabled={!auctionComplete}
          >
            📦 PO Lifecycle
          </Button>

          {/* Language selector */}
          <div className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Demo depth toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDemoDepth(d => d === 'sales' ? 'deep' : 'sales')}
            className="gap-1"
            title={isDeepMode ? 'Switch to Sales view' : 'Switch to Deep view'}
          >
            {isDeepMode ? <Layers className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-xs">{isDeepMode ? 'Deep' : 'Sales'}</span>
          </Button>

          {/* Auto-play & Next Step */}
          {!fullDemoRunning && (
            <div className="flex items-center gap-1 ml-auto" data-demo-controls>
              <Button
                variant="outline" size="sm"
                className="h-8 gap-1 active:scale-95 transition"
                onClick={() => { setFullDemoRunning(true); setAutoPlay(true); }}
              >
                <Play className="w-3.5 h-3.5" />
                Auto-Play
              </Button>
              <Button
                variant="outline" size="sm"
                className="h-8 gap-1 active:scale-95 transition"
                disabled={!canGoNext}
                onClick={handleNextStep}
              >
                <SkipForward className="w-3.5 h-3.5" />
                Next Step
              </Button>
              <Button
                variant="ghost" size="sm"
                className="h-8 gap-1 active:scale-95 transition text-muted-foreground"
                onClick={resetCurrentStep}
                title="Reset current phase without restarting the whole demo"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Step
              </Button>
            </div>
          )}
          {fullDemoRunning && (
            <Button
              variant="secondary" size="sm"
              className="ml-auto gap-1 active:scale-95 transition"
              data-demo-controls
              onClick={() => { setFullDemoRunning(false); setAutoPlay(false); }}
            >
              Stop Auto-Play
            </Button>
          )}
        </div>

        {/* ── RFQ PHASE ── */}
        {phase === 'rfq' && (
          <div id="rfq-card" className={`space-y-4 ${highlightClass('rfq-card')}`}>
            {/* Business Problem Opener */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
              <p className="font-semibold text-destructive text-sm">Why most companies overpay in procurement</p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• Limited supplier competition on each order</li>
                <li>• Manual negotiation with no price transparency</li>
                <li>• No real-time benchmarking against market rates</li>
                <li>• No auditable trail of pricing decisions</li>
              </ul>
              <p className="mt-3 text-sm font-semibold text-destructive">
                Result → 8–15% higher procurement cost annually
              </p>
            </div>
            <DemoRFQStep scenario={scenario} onComplete={handleNextStep} />
          </div>
        )}

        {/* ── INVITE PHASE ── */}
        {phase === 'invite' && (
          <div id="invite-card" className={`space-y-4 ${highlightClass('invite-card')}`}>
            <DemoInviteStep scenario={scenario} onComplete={handleNextStep} />
          </div>
        )}

        {/* ── AUCTION PHASE ── */}
        {phase === 'auction' && (
          <div className="space-y-4">
            {/* Countdown timer */}
            {!auctionComplete && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium tabular-nums">
                    ⏱ {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')} remaining
                  </span>
                </div>
                <div className="text-xs text-muted-foreground italic">
                  This is not a marketplace. This is your private supplier network competing for your order.
                </div>
              </div>
            )}

            {/* Supplier join notifications */}
            {activeSuppliers.length > 0 && activeSuppliers.length < DEMO_SUPPLIERS.length && (
              <div className="text-sm text-primary animate-in fade-in slide-in-from-top-2 duration-300">
                ✅ {activeSuppliers[activeSuppliers.length - 1].name} joined the auction
              </div>
            )}

            {/* Auction punch line */}
            {!auctionComplete && bidRound > 1 && (
              <div className="text-center text-base font-semibold text-green-600 dark:text-green-400 animate-pulse">
                Live bidding in action — prices decreasing with each round
              </div>
            )}

            {/* Dual view for full mode, role-specific for buyer/supplier */}
            {scenario === 'supplier' ? (
              <SupplierAuctionView
                bids={bids}
                auctionComplete={auctionComplete}
                bidRound={bidRound}
                onReduceBid={() => setBids(prev => prev.map(b =>
                  b.supplierId === 'demo-sup-2' ? { ...b, price: Math.max(b.price - 100, BASELINE_PRICE - 800) } : b
                ))}
              />
            ) : scenario === 'buyer' ? (
              <div id="auction-card" className={highlightClass('auction-card')}>
                <BuyerAuctionView
                  bids={bids}
                  auctionComplete={auctionComplete}
                  bidRound={bidRound}
                  onProceedToPO={() => handleManualPhaseChange('po_lifecycle')}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div id="auction-card" className={highlightClass('auction-card')}>
                  <BuyerAuctionView
                    bids={bids}
                    auctionComplete={auctionComplete}
                    bidRound={bidRound}
                    onProceedToPO={() => handleManualPhaseChange('po_lifecycle')}
                  />
                </div>
                <SupplierAuctionView
                  bids={bids}
                  auctionComplete={auctionComplete}
                  bidRound={bidRound}
                  onReduceBid={() => setBids(prev => prev.map(b =>
                    b.supplierId === 'demo-sup-2' ? { ...b, price: Math.max(b.price - 100, BASELINE_PRICE - 800) } : b
                  ))}
                />
              </div>
            )}

            {/* Savings Card + ROI Block */}
            {auctionComplete && (
              <Card id="savings-card" className={`border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800 ${highlightClass('savings-card')}`}>
                <CardContent className="pt-6 space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">💰 Immediate savings: this auction</p>
                  <AnimatedSavingsCounter targetSavings={totalSavings} targetPercent={savingsPercent} />
                  <p className="text-xs text-muted-foreground">
                    Baseline: ₹{BASELINE_PRICE.toLocaleString('en-IN')}/MT → Won at ₹{lowestBid.price.toLocaleString('en-IN')}/MT
                    {' '}• Saved ₹{savingsPerMT.toLocaleString('en-IN')}/MT × {DEMO_AUCTION.quantity} MT
                  </p>

                  {/* Enterprise ROI Block */}
                  <div className="p-4 bg-green-100/60 dark:bg-green-950/40 rounded-xl border border-green-300 dark:border-green-700 space-y-2">
                    <p className="text-base font-semibold text-green-800 dark:text-green-300">Business Impact — Annualized</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Per Order</p>
                        <p className="text-sm font-bold text-foreground tabular-nums">₹{totalSavings.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Per MT</p>
                        <p className="text-sm font-bold text-foreground tabular-nums">₹{savingsPerMT.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Annual Impact (Typical mid-size company procurement spend)</p>
                        <p className="text-lg font-extrabold text-green-700 dark:text-green-400 tabular-nums">₹{(savingsPerMT * 12000).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      Based on real procurement patterns across metals, cement, and construction categories
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                      Savings achieved within minutes of running a single auction
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                      Consistent savings come from process, not one-time negotiation
                    </p>
                  </div>

                  <p className="text-sm text-destructive/80 mt-2">
                    ⚠️ Without competition, this order would have cost ₹{totalSavings.toLocaleString('en-IN')} more
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Supplier cards — deep mode */}
            {isDeepMode && scenario !== 'supplier' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DEMO_SUPPLIERS.map(s => (
                  <Card key={s.id} className="p-3">
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.city}</p>
                    <p className="text-xs mt-1">{s.badge} — {s.rating}%</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PO LIFECYCLE PHASE ── */}
        {phase === 'po_lifecycle' && (
          <div className="space-y-4">
            <Card id="po-card" className={highlightClass('po-card')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{DEMO_PO.poNumber}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {DEMO_RFQ.buyerName} • {DEMO_RFQ.location} • Delivery: {DEMO_RFQ.deliveryDays} days
                    </p>
                  </div>
                  <Badge variant={poStatus === 'closed' ? 'secondary' : 'default'}>
                    {poStatus === 'closed' ? '✅ Closed' : `📦 ${poStatus.replace('_', ' ').toUpperCase()}`}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{DEMO_PO.title} • {DEMO_PO.supplierName}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progressPct} className="h-2" />

                <div id="po-timeline" className={`space-y-2 ${highlightClass('po-timeline')}`}>
                  {allStatuses.map((status, idx) => {
                    const isCompleted = idx <= currentStatusIdx;
                    const isCurrent = idx === currentStatusIdx;
                    return (
                      <div
                        key={status}
                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                          isCurrent ? 'bg-primary/10 border border-primary/30'
                            : isCompleted ? 'bg-muted/50' : 'opacity-40'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {isCompleted ? <Check className="w-4 h-4" /> : STATUS_ICONS[status]}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </p>
                          {isCurrent && status === 'in_transit' && isDeepMode && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              🚛 {DEMO_TRANSPORTER.vehicle} • {DEMO_TRANSPORTER.name} • {DEMO_TRANSPORTER.driver}
                            </p>
                          )}
                        </div>
                        {isCurrent && <Badge variant="default" className="text-[10px]">Current</Badge>}
                      </div>
                    );
                  })}
                </div>

            {poStatus === 'closed' && !showCTA && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 text-center">
                    <p className="font-semibold text-primary">✅ Order Complete — Lifecycle Finished</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Buyer can now create a new PO. Supplier reliability score updated.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── PROCUREMENT COMMAND CENTER CARDS ── */}
            {currentStatusIdx >= 1 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="space-y-1 px-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Procurement Operating System — Live Control</p>
                    <Badge variant="outline" className="text-[10px]">LIVE</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">This is your procurement operating system — not just an auction tool.</p>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary font-medium">
                  Every action is controlled, recorded, and fully auditable — no step can be skipped or manipulated.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* 📦 Order Execution Control */}
                  <div className={`p-4 rounded-xl border bg-card shadow-sm transition-all duration-500 ${
                    ['in_transit', 'delivered'].includes(poStatus) ? 'ring-1 ring-primary/20 border-primary/30' : ''
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">Order Execution Control</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {poStatus === 'draft' || poStatus === 'sent' ? 'Awaiting supplier acceptance' :
                       poStatus === 'accepted' ? 'Order confirmed • Dispatch pending' :
                       poStatus === 'in_transit' ? 'Shipment in transit • ETA 2 days' :
                       poStatus === 'delivered' ? '✅ Goods delivered • QC pending' :
                       '✅ Order fulfilled & verified'}
                    </p>
                    <div className={`mt-2 text-xs font-medium ${
                      currentStatusIdx >= 3 ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {currentStatusIdx >= 3 ? 'Live tracked via transporter' : 'Pending dispatch'}
                    </div>
                  </div>

                  {/* 🚚 Live Logistics Visibility */}
                  <div className={`p-4 rounded-xl border bg-card shadow-sm transition-all duration-500 ${
                    poStatus === 'in_transit' ? 'ring-1 ring-amber-200 border-amber-300' : ''
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                        <Truck className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">Live Logistics Visibility</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Truck: {DEMO_TRANSPORTER.vehicle}</p>
                    <p className="text-xs text-muted-foreground">Driver: {DEMO_TRANSPORTER.driver}</p>
                    <div className="mt-2 text-xs font-medium text-primary">
                      {poStatus === 'in_transit' ? '📍 GPS Tracking Active' : 'GPS Enabled Tracking'}
                    </div>
                  </div>

                  {/* 💰 Payment Discipline Enforcement */}
                  <div className={`p-4 rounded-xl border bg-card shadow-sm transition-all duration-500 ${
                    poStatus === 'payment_done' ? 'ring-1 ring-green-200 border-green-300' : ''
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">Payment Discipline Enforcement</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Terms: 30 Days Credit</p>
                    <div className={`mt-2 text-xs font-medium ${
                      poStatus === 'payment_done' || poStatus === 'closed' ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {poStatus === 'payment_done' || poStatus === 'closed' ? '✅ Payment Confirmed' : '⏳ Payment Pending'}
                    </div>
                  </div>

                  {/* 🏭 Supplier Performance Engine */}
                  <div className="p-4 rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">Supplier Performance Engine</span>
                    </div>
                    <p className="text-xs text-muted-foreground">3 Active • 12 Verified • 2 Blacklisted</p>
                    <div className="mt-2 text-xs font-medium text-green-600">
                      {poStatus === 'closed' ? '⭐ Reliability Score Updated' : 'Scores updating post-delivery'}
                    </div>
                  </div>

                  {/* 📊 Savings Intelligence */}
                  <DemoSavingsGraph
                    baselinePrice={BASELINE_PRICE}
                    finalPrice={BASELINE_PRICE - (totalSavings / 500)}
                  />

                  {/* 🧾 Audit & Compliance Layer */}
                  <div className="p-4 rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">Audit & Compliance Layer</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Every action logged • Tamper-proof • Export-ready</p>
                    <div className="mt-2 text-xs font-medium text-green-600">
                      ERP Sync Enabled
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trust line */}
            <p className="text-xs text-muted-foreground text-center">
              No new suppliers added — only your existing, approved suppliers competing.
            </p>



            {/* Psychological killer before CTA */}
            {showCTA && (
              <div className="text-center text-sm text-muted-foreground mt-4 leading-relaxed">
                Same suppliers.<br/>
                Same requirement.<br/>
                <span className="font-semibold text-foreground">
                  The only difference is — competition.
                </span>
              </div>
            )}

            {/* CTA EXIT HOOK */}
            {showCTA && (
              <div id="cta-card" className={`rounded-xl bg-foreground text-background p-6 text-center space-y-4 ${highlightClass('cta-card')}`}>
                <p className="text-xl font-semibold">
                  You are not reducing cost by negotiation.
                </p>
                <p className="text-lg">
                  You are reducing cost by creating competition.
                </p>
                <p className="text-sm text-background/60">
                  Companies using structured procurement systems typically save 10–15% annually.
                </p>
                <p className="text-lg font-bold text-green-400 tabular-nums">
                  Your estimated annual saving: ₹{(savingsPerMT * 12000).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-background/50 mt-3">
                  No change in your supplier network. No disruption to your current process.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button
                    size="lg"
                    className="bg-background text-foreground hover:bg-background/90 gap-2"
                    onClick={() => navigate('/buyer/create-reverse-auction')}
                  >
                    <Zap className="w-4 h-4" />
                    Run Your First Auction
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-background/30 text-background hover:bg-background/10"
                    onClick={() => navigate('/buyer?buy_plan=true')}
                  >
                    Activate 6-Month Plan
                  </Button>
                </div>
                <p className="text-xs text-background/40 italic">
                  This is your private procurement engine — not a public marketplace.
                </p>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-background/50 hover:text-background/80">
                  ↻ Replay Simulation
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-2 right-2 text-xs text-muted-foreground/60 pointer-events-none select-none z-50">
        Demo Environment — No Real Transactions
      </div>
    </div>
  );
}
