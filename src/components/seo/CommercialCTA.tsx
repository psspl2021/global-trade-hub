import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';

interface CommercialCTAProps {
  productName: string;
  recentRFQs?: number;
  onOpenRFQ?: () => void;
}

/**
 * High-intent commercial CTA block.
 * Signals transactional intent to Google for better SERP positioning.
 * Also renders a freshness signal (last updated + live RFQ count).
 */
export default function CommercialCTA({ productName, recentRFQs, onOpenRFQ }: CommercialCTAProps) {
  const productBase = productName.replace(/\s+in\s+India$/i, '');
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <section className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/8 via-primary/4 to-background p-8 md:p-10 space-y-6">
      {/* Freshness signal */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <time dateTime={today.toISOString().split('T')[0]} className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Last updated: {formattedDate}
        </time>
        {recentRFQs && (
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            {recentRFQs}+ recent RFQs for {productBase}
          </span>
        )}
      </div>

      {/* Commercial CTA */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Get Best Price for {productBase}
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
          Start a reverse auction and receive competitive quotes from verified {productBase} suppliers.
          Compare pricing, delivery timelines, and certifications — all managed by ProcureSaathi.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {onOpenRFQ ? (
          <Button size="lg" onClick={onOpenRFQ} className="gap-2 text-lg px-8 py-6">
            Start Reverse Auction <ArrowRight className="h-5 w-5" />
          </Button>
        ) : (
          <Button size="lg" asChild className="gap-2 text-lg px-8 py-6">
            <a href="/buyer">Start Reverse Auction <ArrowRight className="h-5 w-5" /></a>
          </Button>
        )}
        <Button size="lg" variant="outline" asChild className="gap-2 text-lg px-8 py-6">
          <a href="/post-rfq">Submit RFQ Directly <ArrowRight className="h-5 w-5" /></a>
        </Button>
      </div>
    </section>
  );
}
