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
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 backdrop-blur-sm border border-white/20 shadow-lg hover:bg-white hover:border-gold/40 hover:shadow-gold transition-all duration-300 cursor-default group animate-slide-up"
          style={{ animationDelay: `${250 + i * 80}ms` }}
        >
          <badge.icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" strokeWidth={2.5} />
          <span className="text-xs sm:text-sm text-foreground font-semibold">
            {badge.text}
          </span>
        </div>
      ))}
    </div>
  );
};
