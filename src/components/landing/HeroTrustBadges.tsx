import { Shield, FileCheck, Sparkles, Package } from 'lucide-react';

export const HeroTrustBadges = () => {
  const badges = [
    { text: 'Verified Suppliers', icon: Shield },
    { text: 'GST & Compliance Ready', icon: FileCheck },
    { text: 'AI Demand Intelligence', icon: Sparkles },
    { text: 'Managed Fulfilment', icon: Package },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
      {badges.map((badge, i) => (
        <div 
          key={badge.text}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 backdrop-blur-sm border border-border/40 hover:bg-card/80 hover:border-primary/30 transition-all duration-300 cursor-default group animate-slide-up"
          style={{ animationDelay: `${250 + i * 80}ms` }}
        >
          <badge.icon className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xs sm:text-sm text-muted-foreground font-medium group-hover:text-foreground transition-colors">
            {badge.text}
          </span>
        </div>
      ))}
    </div>
  );
};
