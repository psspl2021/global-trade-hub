import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, Clock, Truck, Package, CreditCard, Award, Play, Pause, SkipForward } from 'lucide-react';
import { DEMO_AUCTION, DEMO_PO, DEMO_SUPPLIERS, DEMO_TRANSPORTER, DEMO_TIMELINE_STEPS, type DemoBid, type DemoPOStatus } from '@/lib/demo-data';
import { DemoBanner } from './DemoBanner';

interface DemoGuidedFlowProps {
  onReset: () => void;
  onExit: () => void;
}

type DemoPhase = 'auction' | 'po_lifecycle';

const STATUS_ICONS: Record<DemoPOStatus, React.ReactNode> = {
  draft: <Clock className="w-4 h-4" />,
  sent: <Package className="w-4 h-4" />,
  accepted: <Check className="w-4 h-4" />,
  in_transit: <Truck className="w-4 h-4" />,
  delivered: <Package className="w-4 h-4" />,
  payment_done: <CreditCard className="w-4 h-4" />,
  closed: <Award className="w-4 h-4" />,
};

export function DemoGuidedFlow({ onReset, onExit }: DemoGuidedFlowProps) {
  const [phase, setPhase] = useState<DemoPhase>('auction');
  const [bids, setBids] = useState<DemoBid[]>(DEMO_AUCTION.initialBids);
  const [auctionComplete, setAuctionComplete] = useState(false);
  const [poStatus, setPOStatus] = useState<DemoPOStatus>('draft');
  const [autoPlay, setAutoPlay] = useState(false);
  const [bidRound, setBidRound] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Live bid simulation
  useEffect(() => {
    if (phase !== 'auction' || auctionComplete) return;
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
  }, [phase, auctionComplete]);

  // Auto-play PO lifecycle
  useEffect(() => {
    if (phase !== 'po_lifecycle' || !autoPlay) return;
    const currentIdx = DEMO_TIMELINE_STEPS.findIndex(s => s.status === poStatus);
    if (currentIdx < 0) {
      // Start from first step
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

  const handleReset = useCallback(() => {
    setBids(DEMO_AUCTION.initialBids);
    setAuctionComplete(false);
    setPOStatus('draft');
    setAutoPlay(false);
    setBidRound(0);
    setPhase('auction');
    onReset();
  }, [onReset]);

  const advancePO = () => {
    const currentIdx = DEMO_TIMELINE_STEPS.findIndex(s => s.status === poStatus);
    const nextIdx = poStatus === 'draft' ? 0 : currentIdx + 1;
    if (nextIdx < DEMO_TIMELINE_STEPS.length) {
      setPOStatus(DEMO_TIMELINE_STEPS[nextIdx].status);
    }
  };

  const sortedBids = [...bids].sort((a, b) => a.price - b.price);
  const lowestBid = sortedBids[0];
  const allStatuses: DemoPOStatus[] = ['draft', 'sent', 'accepted', 'in_transit', 'delivered', 'payment_done', 'closed'];
  const currentStatusIdx = allStatuses.indexOf(poStatus);
  const progressPct = ((currentStatusIdx) / (allStatuses.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background">
      <DemoBanner onReset={handleReset} onExit={onExit} />

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Phase tabs */}
        <div className="flex gap-2">
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
            onClick={() => { setPhase('po_lifecycle'); }}
            disabled={!auctionComplete}
          >
            📦 PO Lifecycle
          </Button>
        </div>

        {/* ── AUCTION PHASE ── */}
        {phase === 'auction' && (
          <div className="space-y-4">
            <Card>
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
                    <Button size="sm" className="mt-2" onClick={() => setPhase('po_lifecycle')}>
                      Proceed to PO →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Supplier cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DEMO_SUPPLIERS.map(s => (
                <Card key={s.id} className="p-3">
                  <p className="font-semibold text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.city}</p>
                  <p className="text-xs mt-1">{s.badge} — {s.rating}%</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── PO LIFECYCLE PHASE ── */}
        {phase === 'po_lifecycle' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{DEMO_PO.poNumber}</CardTitle>
                  <div className="flex items-center gap-2">
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
                <div className="space-y-2">
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
                          {isCurrent && status === 'in_transit' && (
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
    </div>
  );
}
