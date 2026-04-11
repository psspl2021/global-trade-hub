import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Clock, Truck, Package, CreditCard, Award, Play, Pause, SkipForward, Volume2, VolumeX, Globe, Eye, Layers } from 'lucide-react';
import { DEMO_AUCTION, DEMO_PO, DEMO_SUPPLIERS, DEMO_TRANSPORTER, DEMO_TIMELINE_STEPS, type DemoBid, type DemoPOStatus } from '@/lib/demo-data';
import { DEMO_NARRATION, poStatusToNarrationStep } from '@/lib/demo-voiceover-script';
import { useDemoVoiceover } from '@/hooks/useDemoVoiceover';
import { DemoBanner } from './DemoBanner';

interface DemoGuidedFlowProps {
  onReset: () => void;
  onExit: () => void;
}

type DemoPhase = 'auction' | 'po_lifecycle';
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

export function DemoGuidedFlow({ onReset, onExit }: DemoGuidedFlowProps) {
  const [showEntryScreen, setShowEntryScreen] = useState(true);
  const [phase, setPhase] = useState<DemoPhase>('auction');
  const [bids, setBids] = useState<DemoBid[]>(DEMO_AUCTION.initialBids);
  const [auctionComplete, setAuctionComplete] = useState(false);
  const [poStatus, setPOStatus] = useState<DemoPOStatus>('draft');
  const [autoPlay, setAutoPlay] = useState(false);
  const [bidRound, setBidRound] = useState(0);
  const [fullDemoRunning, setFullDemoRunning] = useState(false);
  const [highlightSection, setHighlightSection] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const [demoDepth, setDemoDepth] = useState<DemoDepth>('deep');
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const introSpoken = useRef(false);
  const pauseListenerAttached = useRef(false);

  const { speak, stop, speaking, currentStep, voiceEnabled, toggleVoice } = useDemoVoiceover(language);

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
      // Ignore clicks on demo control buttons
      const target = e.target as HTMLElement;
      if (target.closest('[data-demo-controls]')) return;

      setFullDemoRunning(false);
      setAutoPlay(false);
      stop();
    };

    const opts = { once: true, capture: true };
    window.addEventListener('scroll', handleInteraction, opts);
    document.addEventListener('keydown', handleInteraction, opts);

    return () => {
      window.removeEventListener('scroll', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [fullDemoRunning, stop]);

  // Speak intro on mount (once)
  useEffect(() => {
    if (showEntryScreen) return;
    if (!introSpoken.current) {
      introSpoken.current = true;
      const t = setTimeout(() => speak('intro', () => speak('auction_live')), 600);
      return () => clearTimeout(t);
    }
  }, [speak, showEntryScreen]);

  // Highlight sync with narration
  useEffect(() => {
    if (!currentStep) { setHighlightSection(null); return; }
    const map: Record<string, string> = {
      intro: 'auction-card',
      auction_live: 'auction-card',
      auction_complete: 'auction-card',
      savings: 'auction-card',
      po_start: 'po-card',
      po_sent: 'po-timeline',
      po_accepted: 'po-timeline',
      po_in_transit: 'po-timeline',
      po_delivered: 'po-timeline',
      po_payment: 'po-timeline',
      po_closed: 'po-timeline',
      outro: 'po-card',
    };
    setHighlightSection(map[currentStep] || null);
  }, [currentStep]);

  // Live bid simulation
  useEffect(() => {
    if (phase !== 'auction' || auctionComplete || showEntryScreen) return;
    const interval = setInterval(() => {
      setBids(prev =>
        prev.map(b => ({
          ...b,
          price: Math.max(b.price - Math.floor(Math.random() * 800 + 200), 42000),
        }))
      );
      setBidRound(r => {
        const next = r + 1;
        if (next >= 8) {
          setAuctionComplete(true);
          clearInterval(interval);
        }
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [phase, auctionComplete, showEntryScreen]);

  // Narrate auction completion + savings
  useEffect(() => {
    if (auctionComplete) {
      speak('auction_complete', () => {
        // Trigger savings narration after auction_complete ends
        speak('savings');
      });
    }
  }, [auctionComplete, speak]);

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

  // Narrate PO status changes
  useEffect(() => {
    const narrationStep = poStatusToNarrationStep(poStatus);
    if (narrationStep && phase === 'po_lifecycle') {
      speak(narrationStep);
    }
  }, [poStatus, phase, speak]);

  // Narrate outro when PO closes
  useEffect(() => {
    if (poStatus === 'closed' && phase === 'po_lifecycle') {
      const t = setTimeout(() => speak('outro'), 1500);
      return () => clearTimeout(t);
    }
  }, [poStatus, phase, speak]);

  const handleReset = useCallback(() => {
    stop();
    setBids(DEMO_AUCTION.initialBids);
    setAuctionComplete(false);
    setPOStatus('draft');
    setAutoPlay(false);
    setBidRound(0);
    setPhase('auction');
    setFullDemoRunning(false);
    setShowEntryScreen(true);
    introSpoken.current = false;
    onReset();
  }, [onReset, stop]);

  const advancePO = () => {
    const currentIdx = DEMO_TIMELINE_STEPS.findIndex(s => s.status === poStatus);
    const nextIdx = poStatus === 'draft' ? 0 : currentIdx + 1;
    if (nextIdx < DEMO_TIMELINE_STEPS.length) {
      setPOStatus(DEMO_TIMELINE_STEPS[nextIdx].status);
    }
  };

  const startDemo = useCallback((scenario: EntryScenario) => {
    setShowEntryScreen(false);
    if (scenario === 'full') {
      setFullDemoRunning(true);
    }
  }, []);

  // Full demo: auto-switch to PO after auction
  useEffect(() => {
    if (fullDemoRunning && auctionComplete && phase === 'auction') {
      setTimeout(() => {
        setPhase('po_lifecycle');
        setAutoPlay(true);
      }, 2500); // Extra time for savings narration
    }
  }, [fullDemoRunning, auctionComplete, phase]);

  useEffect(() => {
    if (fullDemoRunning && poStatus === 'closed') {
      setFullDemoRunning(false);
    }
  }, [fullDemoRunning, poStatus]);

  const sortedBids = [...bids].sort((a, b) => a.price - b.price);
  const lowestBid = sortedBids[0];
  const allStatuses: DemoPOStatus[] = ['draft', 'sent', 'accepted', 'in_transit', 'delivered', 'payment_done', 'closed'];
  const currentStatusIdx = allStatuses.indexOf(poStatus);
  const progressPct = ((currentStatusIdx) / (allStatuses.length - 1)) * 100;
  const isDeepMode = demoDepth === 'deep';

  const highlightClass = (section: string) =>
    highlightSection === section
      ? 'ring-2 ring-primary/40 shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-shadow duration-500'
      : 'transition-shadow duration-500';

  // ── ENTRY SCREEN ──
  if (showEntryScreen) {
    return (
      <div className="min-h-screen bg-background">
        <DemoBanner onReset={handleReset} onExit={onExit} />
        <div className="max-w-lg mx-auto p-6 pt-12 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Interactive Procurement Simulation</h1>
            <p className="text-sm text-muted-foreground">Choose your walkthrough experience</p>
          </div>

          {/* Language selector on entry */}
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
            <Button
              className="w-full h-16 text-left justify-start gap-4"
              onClick={() => startDemo('full')}
            >
              <Play className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Full Walkthrough (2 min)</p>
                <p className="text-xs text-primary-foreground/70">Auction → PO → Delivery → Payment — fully automated</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-16 text-left justify-start gap-4"
              onClick={() => startDemo('buyer')}
            >
              <Package className="w-5 h-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">Buyer Flow</p>
                <p className="text-xs text-muted-foreground">Create auctions, compare bids, issue POs</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-16 text-left justify-start gap-4"
              onClick={() => startDemo('supplier')}
            >
              <Truck className="w-5 h-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">Supplier Experience</p>
                <p className="text-xs text-muted-foreground">Bid on auctions, accept POs, manage deliveries</p>
              </div>
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
      <DemoBanner onReset={handleReset} onExit={onExit} />

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Phase tabs + controls */}
        <div className="flex items-center gap-2 flex-wrap" data-demo-controls>
          <Button
            variant={phase === 'auction' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPhase('auction')}
          >
            🔨 Live Auction
          </Button>
          <Button
            variant={phase === 'po_lifecycle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPhase('po_lifecycle')}
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

          {/* Voice toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVoice}
            className="gap-1"
            title={voiceEnabled ? 'Mute voiceover' : 'Enable voiceover'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {speaking && <span className="text-xs text-primary animate-pulse">●</span>}
          </Button>

          {!fullDemoRunning && phase === 'auction' && !auctionComplete && (
            <Button
              variant="secondary"
              size="sm"
              className="ml-auto gap-1"
              onClick={() => setFullDemoRunning(true)}
            >
              <Play className="w-3.5 h-3.5" />
              Run Full Demo (2 min)
            </Button>
          )}
        </div>

        {/* Narration subtitle bar */}
        {speaking && currentStep && (
          <div className="bg-muted/60 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground/80 animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-primary mr-2">🎤</span>
            {(() => {
              const entry = DEMO_NARRATION.find(n => n.step === currentStep);
              const text = entry?.text?.[language] || entry?.text?.['en'] || '';
              return text.length > 120 ? text.slice(0, 120) + '…' : text;
            })()}
          </div>
        )}

        {/* ── AUCTION PHASE ── */}
        {phase === 'auction' && (
          <div className="space-y-4">
            <Card id="auction-card" className={highlightClass('auction-card')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{DEMO_AUCTION.title}</CardTitle>
                  <Badge variant={auctionComplete ? 'secondary' : 'default'}>
                    {auctionComplete ? '✅ Completed' : `🔴 LIVE — Round ${bidRound}/8`}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {DEMO_AUCTION.category} • {DEMO_AUCTION.quantity} {DEMO_AUCTION.unit} • {DEMO_AUCTION.currency}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {sortedBids.map((bid, idx) => (
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
                        ₹{bid.price.toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-muted-foreground">per MT</p>
                    </div>
                  </div>
                ))}

                {auctionComplete && (
                  <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20 text-center space-y-2">
                    <p className="text-sm font-semibold text-primary">🏆 Winner: {lowestBid.supplierName}</p>
                    <p className="text-lg font-bold">₹{lowestBid.price.toLocaleString('en-IN')} / MT</p>
                    <p className="text-xs text-muted-foreground">
                      Total: ₹{(lowestBid.price * DEMO_AUCTION.quantity).toLocaleString('en-IN')}
                    </p>
                    {isDeepMode && (
                      <p className="text-xs text-green-600 font-medium">
                        💰 Estimated savings: 8–12% vs manual negotiation
                      </p>
                    )}
                    <Button size="sm" className="mt-2" onClick={() => setPhase('po_lifecycle')}>
                      Proceed to PO →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Supplier cards — only in deep mode */}
            {isDeepMode && (
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
                  <CardTitle className="text-lg">{DEMO_PO.poNumber}</CardTitle>
                  <div className="flex items-center gap-2" data-demo-controls>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAutoPlay(p => !p)}
                      className="h-8 gap-1"
                    >
                      {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {autoPlay ? 'Pause' : 'Auto-Play'}
                    </Button>
                    {!autoPlay && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={advancePO}
                        className="h-8 gap-1"
                        disabled={poStatus === 'closed'}
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        Next Step
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{DEMO_PO.title} • {DEMO_PO.supplierName}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progressPct} className="h-2" />

                {/* Timeline */}
                <div id="po-timeline" className={`space-y-2 ${highlightClass('po-timeline')}`}>
                  {allStatuses.map((status, idx) => {
                    const isCompleted = idx <= currentStatusIdx;
                    const isCurrent = idx === currentStatusIdx;
                    return (
                      <div
                        key={status}
                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                          isCurrent
                            ? 'bg-primary/10 border border-primary/30'
                            : isCompleted
                            ? 'bg-muted/50'
                            : 'opacity-40'
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
                        {isCurrent && (
                          <Badge variant="default" className="text-[10px]">Current</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>

                {poStatus === 'closed' && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 text-center">
                    <p className="font-semibold text-primary">✅ Order Complete — Lifecycle Finished</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Buyer can now create a new PO. Supplier reliability score updated.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Demo watermark */}
      <div className="fixed bottom-2 right-2 text-xs text-muted-foreground/60 pointer-events-none select-none z-50">
        Demo Environment — No Real Transactions
      </div>
    </div>
  );
}
