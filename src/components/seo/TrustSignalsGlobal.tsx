import { useState, useEffect } from 'react';
import { Globe, Shield, Users, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getRotatingCountryMentions } from '@/hooks/useGeoDetection';

interface TrustSignalsGlobalProps {
  variant?: 'banner' | 'inline' | 'footer';
  showRotatingCountries?: boolean;
  className?: string;
}

/**
 * Global Trust Signals Component
 * 
 * Displays "Serving buyers across 195 countries" with optional
 * rotating country mentions (non-link, safe for SEO).
 * 
 * Cached by country group, not per country to preserve performance.
 */
export function TrustSignalsGlobal({ 
  variant = 'inline',
  showRotatingCountries = true,
  className = ''
}: TrustSignalsGlobalProps) {
  const [rotatingCountries, setRotatingCountries] = useState<string[]>([]);
  
  useEffect(() => {
    // Rotate countries every 10 seconds for dynamic display
    const updateCountries = () => {
      setRotatingCountries(getRotatingCountryMentions(5));
    };
    
    updateCountries();
    const interval = setInterval(updateCountries, 10000);
    
    return () => clearInterval(interval);
  }, []);

  if (variant === 'banner') {
    return (
      <div className={`bg-muted/50 py-4 border-y ${className}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <span className="font-semibold">Serving buyers across 195 countries</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Verified Supplier Network</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Managed Procurement</span>
            </div>
          </div>
          
          {showRotatingCountries && rotatingCountries.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">Active in:</span>
              {rotatingCountries.map((country, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {country}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={`py-6 border-t ${className}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4 text-primary" />
              <span>ProcureSaathi serves B2B buyers and suppliers across <strong>195 countries</strong></span>
            </div>
            
            {showRotatingCountries && rotatingCountries.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {rotatingCountries.slice(0, 3).map((country, i) => (
                  <span key={i} className="text-xs text-muted-foreground">
                    {country}{i < 2 ? ' · ' : ''}
                  </span>
                ))}
                <span className="text-xs text-muted-foreground">& more</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Inline variant (default)
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
      <span className="text-sm text-muted-foreground">
        Trusted by buyers across <strong className="text-foreground">195 countries</strong>
      </span>
    </div>
  );
}

export default TrustSignalsGlobal;
