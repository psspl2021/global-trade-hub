/**
 * Hybrid Procurement Mode Selector
 * Allows buyers to choose between RFQ, Reverse Auction, or Negotiated Deal
 */
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Gavel, MessageCircle, ArrowRight } from 'lucide-react';

const PROCUREMENT_MODES = [
  {
    id: 'rfq',
    label: 'Sealed RFQ',
    description: 'Anonymous sealed bidding — AI ranks suppliers by price & trust score. Best for new suppliers.',
    icon: FileText,
    badge: 'Default',
    badgeClass: 'bg-primary text-primary-foreground',
    route: '/dashboard',
    tab: 'rfq',
  },
  {
    id: 'reverse_auction',
    label: 'Reverse Auction',
    description: 'Live price discovery — invited suppliers bid down in real-time. Best for commodities.',
    icon: Gavel,
    badge: 'Live Bidding',
    badgeClass: 'bg-amber-600 text-white',
    route: '/dashboard',
    tab: 'auctions',
  },
  {
    id: 'negotiated',
    label: 'Negotiated Deal',
    description: 'Direct 1-on-1 negotiation with a known supplier. Best for long-term contracts.',
    icon: MessageCircle,
    badge: 'Coming Soon',
    badgeClass: 'bg-muted text-muted-foreground',
    route: null,
    tab: null,
  },
];

interface ProcurementModeSelectorProps {
  onSelect?: (mode: string) => void;
}

export function ProcurementModeSelector({ onSelect }: ProcurementModeSelectorProps) {
  const navigate = useNavigate();

  const handleSelect = (mode: typeof PROCUREMENT_MODES[0]) => {
    if (!mode.route) return;
    onSelect?.(mode.id);
    if (mode.tab) {
      navigate(`${mode.route}?tab=${mode.tab}`);
    } else {
      navigate(mode.route);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {PROCUREMENT_MODES.map((mode) => {
        const Icon = mode.icon;
        const disabled = !mode.route;
        return (
          <Card
            key={mode.id}
            className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/40 ${
              disabled ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            onClick={() => !disabled && handleSelect(mode)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <Badge className={mode.badgeClass}>{mode.badge}</Badge>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{mode.label}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{mode.description}</p>
              {!disabled && (
                <div className="flex items-center gap-1 mt-3 text-xs text-primary font-medium">
                  Get started <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
