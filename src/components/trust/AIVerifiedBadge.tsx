/**
 * AI-Verified Badge Component
 * 
 * Displays trust verification status with dynamic styling based on score.
 * Part of ProcureSaathi's Trust Infrastructure system.
 */

import { cn } from '@/lib/utils';

interface AIVerifiedBadgeProps {
  trustScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function AIVerifiedBadge({ 
  trustScore = 95, 
  size = 'md', 
  showLabel = true,
  className 
}: AIVerifiedBadgeProps) {
  const sizeConfig = {
    sm: { width: 48, height: 48, labelClass: 'text-xs' },
    md: { width: 80, height: 80, labelClass: 'text-sm' },
    lg: { width: 120, height: 120, labelClass: 'text-base' },
  };

  const config = sizeConfig[size];
  
  // Dynamic colors based on trust score
  const getColors = () => {
    if (trustScore >= 90) {
      return {
        primary: '#10B981', // Emerald
        secondary: '#064E3B', // Deep green
        sparkle: '#FBBF24', // Gold
        glow: '#10B981',
        label: 'AI Verified',
        labelColor: 'text-emerald-600',
      };
    } else if (trustScore >= 70) {
      return {
        primary: '#F59E0B', // Amber
        secondary: '#78350F', // Deep amber
        sparkle: '#FBBF24',
        glow: '#F59E0B',
        label: 'Verified',
        labelColor: 'text-amber-600',
      };
    } else {
      return {
        primary: '#6B7280', // Gray
        secondary: '#374151', // Deep gray
        sparkle: '#9CA3AF',
        glow: '#6B7280',
        label: 'Pending',
        labelColor: 'text-muted-foreground',
      };
    }
  };

  const colors = getColors();

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative">
        {/* Glow effect for high trust scores */}
        {trustScore >= 90 && (
          <div 
            className="absolute inset-0 animate-pulse-glow rounded-full blur-xl opacity-30"
            style={{ backgroundColor: colors.glow }}
          />
        )}
        
        <svg 
          width={config.width} 
          height={config.height} 
          viewBox="0 0 120 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-lg"
        >
          {/* Radial glow background */}
          <circle 
            cx="60" 
            cy="60" 
            r="50" 
            fill={`url(#paint0_radial_${trustScore})`} 
            fillOpacity="0.2"
          />
          
          {/* Shield shape */}
          <path 
            d="M60 15L25 30V55C25 77.5 40 98.5 60 105C80 98.5 95 77.5 95 55V30L60 15Z" 
            fill={colors.secondary} 
            stroke={colors.primary} 
            strokeWidth="4"
          />
          
          {/* AI Sparkle icon */}
          <path 
            d="M60 35L63.5 46.5L75 50L63.5 53.5L60 65L56.5 53.5L45 50L56.5 46.5L60 35Z" 
            fill={colors.sparkle}
            className={trustScore >= 90 ? 'animate-pulse' : ''}
          />
          
          {/* Checkmark */}
          <path 
            d="M48 78L56 86L72 70" 
            stroke="white" 
            strokeWidth="6" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          
          {/* Gradient definition */}
          <defs>
            <radialGradient 
              id={`paint0_radial_${trustScore}`} 
              cx="0" 
              cy="0" 
              r="1" 
              gradientUnits="userSpaceOnUse" 
              gradientTransform="translate(60 60) rotate(90) scale(50)"
            >
              <stop stopColor={colors.primary}/>
              <stop offset="1" stopColor={colors.primary} stopOpacity="0"/>
            </radialGradient>
          </defs>
        </svg>
      </div>
      
      {showLabel && (
        <span className={cn('font-semibold', config.labelClass, colors.labelColor)}>
          {colors.label}
        </span>
      )}
    </div>
  );
}

export default AIVerifiedBadge;
