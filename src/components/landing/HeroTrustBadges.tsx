import { CheckCircle } from 'lucide-react';

export const HeroTrustBadges = () => {
  const badges = [
    { text: 'GST Verified', color: 'text-success' },
    { text: 'FIEO Certified', color: 'text-primary' },
    { text: '1000+ Suppliers', color: 'text-warning' },
    { text: 'AI-Powered Matching', color: 'text-primary' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
      {badges.map((badge) => (
        <div 
          key={badge.text}
          className="flex items-center gap-1.5 sm:gap-2"
        >
          <div className={`w-2 h-2 rounded-full bg-success animate-pulse`} />
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">
            {badge.text}
          </span>
        </div>
      ))}
    </div>
  );
};
