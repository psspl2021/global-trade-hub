import { Shield, FileCheck, Sparkles, Package } from 'lucide-react';

export const HeroTrustBadges = () => {
  const badges = [
    { text: 'Verified Suppliers', icon: Shield },
    { text: 'GST & Compliance Ready', icon: FileCheck },
    { text: 'AI Demand Intelligence', icon: Sparkles },
    { text: 'Managed Fulfilment', icon: Package },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
      {badges.map((badge) => (
        <div 
          key={badge.text}
          className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-card/50 border border-border/50"
        >
          <badge.icon className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">
            {badge.text}
          </span>
        </div>
      ))}
    </div>
  );
};
