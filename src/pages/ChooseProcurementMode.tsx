import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, ArrowRight, FileText, Gavel, CheckCircle2, Clock, Users, TrendingDown, Sparkles
} from 'lucide-react';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';
import { useSEO } from '@/hooks/useSEO';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

type Mode = 'forward' | 'reverse';

const ChooseProcurementMode = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('forward'); // forward pre-selected

  useSEO({
    title: 'Choose Procurement Mode — Forward Bids or Reverse Auction | ProcureSaathi',
    description: 'Pick how suppliers respond to your requirement: structured forward bids or live reverse auction. ProcureSaathi guides every procurement.',
    canonical: 'https://procuresaathi.com/choose-procurement-mode',
  });

  const handleContinue = () => {
    trackEvent('procurement_mode_selected', { mode });
    try { localStorage.setItem('lastMode', mode); } catch {}
    if (mode === 'forward') {
      navigate('/post-rfq?mode=forward');
    } else {
      // Pre-login lightweight bridge — full setup happens after login
      navigate('/setup-reverse-auction');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={procureSaathiLogo} alt="ProcureSaathi" className="h-10 sm:h-14 w-auto object-contain" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 sm:py-14 max-w-5xl">
        {/* Heading */}
        <div className="text-center space-y-3 mb-10">
          <Badge variant="secondary" className="mb-2">
            <Sparkles className="h-3 w-3 mr-1" /> Step 1 of 2
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Choose how you want to procure
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Select the method based on your requirement type
          </p>
        </div>

        {/* Two-card selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-8">
          <ModeCard
            selected={mode === 'forward'}
            onSelect={() => setMode('forward')}
            icon={FileText}
            title="Receive Supplier Bids"
            tagline="Suppliers submit structured quotes"
            bestFor="new or custom requirements"
            bullets={[
              { icon: Clock, text: 'No time limit' },
              { icon: Users, text: 'Multiple suppliers respond' },
              { icon: CheckCircle2, text: 'Compare price, delivery, terms' },
            ]}
            badge="Default"
            badgeClass="bg-primary text-primary-foreground"
            accent="primary"
          />
          <ModeCard
            selected={mode === 'reverse'}
            onSelect={() => setMode('reverse')}
            icon={Gavel}
            title="Run Reverse Auction"
            tagline="Suppliers compete by lowering price"
            bestFor="repeat or price-driven procurement"
            bullets={[
              { icon: Clock, text: 'Live, time-based bidding' },
              { icon: TrendingDown, text: 'Price drops in real time' },
              { icon: Users, text: 'Invited suppliers only' },
            ]}
            badge="Live Bidding"
            badgeClass="bg-gold text-gold-foreground"
            accent="gold"
          />
        </div>

        {/* Single primary CTA */}
        <div className="flex justify-center">
          <Button
            size="lg"
            className="h-12 px-10 text-[15px] font-semibold gap-2"
            onClick={handleContinue}
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          You can switch modes at any time before submitting.
        </p>
      </main>
    </div>
  );
};

interface ModeCardProps {
  selected: boolean;
  onSelect: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tagline: string;
  bestFor: string;
  bullets: { icon: React.ComponentType<{ className?: string }>; text: string }[];
  badge: string;
  badgeClass: string;
  accent: 'primary' | 'gold';
}

function ModeCard({ selected, onSelect, icon: Icon, title, tagline, bestFor, bullets, badge, badgeClass, accent }: ModeCardProps) {
  const ringClass = selected
    ? accent === 'gold'
      ? 'border-gold ring-2 ring-gold/30 shadow-gold'
      : 'border-primary ring-2 ring-primary/25 shadow-brand'
    : 'border-border hover:border-primary/40';

  return (
    <Card
      onClick={onSelect}
      className={cn(
        'relative cursor-pointer p-5 sm:p-6 transition-all',
        ringClass,
        selected ? '' : 'hover:shadow-md'
      )}
    >
      {/* badge */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            'p-2.5 rounded-xl shadow-sm',
            accent === 'gold'
              ? 'bg-gradient-to-br from-gold to-[hsl(32_92%_48%)]'
              : 'bg-gradient-to-br from-primary to-primary/80'
          )}
        >
          <Icon className={cn('w-5 h-5', accent === 'gold' ? 'text-gold-foreground' : 'text-primary-foreground')} />
        </div>
        <Badge className={badgeClass}>{badge}</Badge>
      </div>

      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{tagline}</p>

      <p className="text-xs text-muted-foreground mt-3">
        <span className="font-semibold text-foreground">Best for:</span> {bestFor}
      </p>

      <ul className="mt-4 space-y-2">
        {bullets.map((b, i) => {
          const BIcon = b.icon;
          return (
            <li key={i} className="flex items-center gap-2 text-sm text-foreground/85">
              <BIcon className={cn('h-4 w-4 flex-shrink-0', accent === 'gold' ? 'text-gold' : 'text-primary')} />
              {b.text}
            </li>
          );
        })}
      </ul>

      {/* Selection indicator */}
      <div
        className={cn(
          'mt-5 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors',
          selected
            ? accent === 'gold' ? 'text-gold' : 'text-primary'
            : 'text-muted-foreground'
        )}
      >
        {selected ? (
          <>
            <CheckCircle2 className="h-4 w-4" /> Selected
          </>
        ) : (
          <>Click to select</>
        )}
      </div>
    </Card>
  );
}

export default ChooseProcurementMode;
