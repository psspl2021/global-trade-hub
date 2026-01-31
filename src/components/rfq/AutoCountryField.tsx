/**
 * ============================================================
 * AUTO COUNTRY FIELD
 * ============================================================
 * 
 * Read-only country field for RFQ forms.
 * Country is auto-detected and CANNOT be changed by user.
 * 
 * Priority:
 * 1) SEO detection (from page visit)
 * 2) Demand Grid row (if from grid)
 * 3) Fallback: GLOBAL
 */

import { Badge } from '@/components/ui/badge';
import { Lock, MapPin, Globe } from 'lucide-react';
import { useDemandCapture } from '@/hooks/useDemandCapture';

interface AutoCountryFieldProps {
  /** Override country from external source (e.g., demand grid row) */
  forcedCountry?: string;
  forcedCountryCode?: string;
  /** Show compact version */
  compact?: boolean;
  /** Custom label */
  label?: string;
}

export function AutoCountryField({
  forcedCountry,
  forcedCountryCode,
  compact = false,
  label = 'Destination Country',
}: AutoCountryFieldProps) {
  const { countryName, countryCode, isGeoDetected } = useDemandCapture();
  
  // Use forced country if provided, otherwise use detected
  const displayCountry = forcedCountry || countryName || 'Worldwide';
  const displayCode = forcedCountryCode || countryCode || 'GLOBAL';
  const isGlobal = displayCode === 'GLOBAL' || !displayCode;
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isGlobal ? (
          <Globe className="w-4 h-4 text-muted-foreground" />
        ) : (
          <MapPin className="w-4 h-4 text-primary" />
        )}
        <span className="text-sm font-medium">{displayCountry}</span>
        <Lock className="w-3 h-3 text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        {label}
        <Badge variant="outline" className="text-xs font-normal">
          <Lock className="w-3 h-3 mr-1" />
          Auto-detected
        </Badge>
      </label>
      
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md border border-border">
        {isGlobal ? (
          <Globe className="w-5 h-5 text-muted-foreground" />
        ) : (
          <MapPin className="w-5 h-5 text-primary" />
        )}
        
        <div className="flex-1">
          <p className="font-medium text-foreground">{displayCountry}</p>
          {!isGlobal && (
            <p className="text-xs text-muted-foreground">
              Detected from your location ({displayCode})
            </p>
          )}
        </div>
        
        <Lock className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <p className="text-xs text-muted-foreground">
        Country is auto-detected for accurate demand intelligence.
      </p>
    </div>
  );
}

export default AutoCountryField;
