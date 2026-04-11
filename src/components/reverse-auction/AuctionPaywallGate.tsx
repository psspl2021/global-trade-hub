/**
 * Hard Paywall Gate — shown when buyer has no credits/plan and tries to create auction.
 * Converts at moment of intent, not from a pricing page.
 */
import { Shield, Sparkles, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PAYWALL_GATE, EARLY_USER_OFFER, GLOBAL_BUYER_PLAN } from '@/lib/global-positioning';
import { formatPlanPrice } from '@/lib/currency';

interface AuctionPaywallGateProps {
  currency?: string;
  onActivate: () => void;
  onViewDetails: () => void;
}

export function AuctionPaywallGate({ currency = 'INR', onActivate, onViewDetails }: AuctionPaywallGateProps) {
  const planPrice = formatPlanPrice(currency);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-0 overflow-hidden shadow-2xl border-2 border-primary/20">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary-foreground/20">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">{PAYWALL_GATE.headline}</h2>
          </div>
          <p className="text-sm text-primary-foreground/80">{PAYWALL_GATE.body}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Feature checklist */}
          <div className="space-y-2.5">
            {PAYWALL_GATE.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="rounded-xl bg-muted/50 border p-4">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-lg font-bold text-foreground">{planPrice.price}</p>
                {planPrice.note && (
                  <p className="text-xs text-muted-foreground">{planPrice.note}</p>
                )}
              </div>
              <span className="text-xs font-medium text-muted-foreground">{GLOBAL_BUYER_PLAN.duration}</span>
            </div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-2">
              {PAYWALL_GATE.bonus}
            </p>
          </div>

          {/* FOMO urgency */}
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2.5 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium">{EARLY_USER_OFFER.message}</span>
          </div>

          {/* ROI nudge */}
          <p className="text-xs text-muted-foreground text-center italic">
            {GLOBAL_BUYER_PLAN.roi}
          </p>

          {/* CTAs */}
          <div className="flex gap-3">
            <Button onClick={onActivate} className="flex-1 gap-2" size="lg">
              <Sparkles className="w-4 h-4" />
              {PAYWALL_GATE.cta.primary}
            </Button>
            <Button onClick={onViewDetails} variant="outline" size="lg">
              {PAYWALL_GATE.cta.secondary}
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
