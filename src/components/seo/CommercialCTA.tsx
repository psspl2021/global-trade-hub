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
    <section className="rounded-lg border border-primary/30 bg-primary/5 p-5 md:p-6 space-y-4">
      {/* Freshness signal */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
          Get Best Price for {productBase}
        </h2>
        <p className="text-sm text-muted-foreground leading-snug max-w-3xl">
          Start a reverse auction and compare verified {productBase} quotes by price, delivery timeline, and certifications.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {onOpenRFQ ? (
          <Button size="default" onClick={onOpenRFQ} className="gap-2">
            Start Reverse Auction <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="default" asChild className="gap-2">
            <a href="/buyer">Start Reverse Auction <ArrowRight className="h-4 w-4" /></a>
          </Button>
        )}
        <Button size="default" variant="outline" asChild className="gap-2">
          <a href="/post-rfq">Submit RFQ Directly <ArrowRight className="h-4 w-4" /></a>
        </Button>
      </div>
    </section>
  );
}
