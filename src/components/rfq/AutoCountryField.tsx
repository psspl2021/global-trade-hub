/**
 * ============================================================
 * AUTO COUNTRY FIELD (READ-ONLY)
 * ============================================================
 * 
 * Read-only country field for RFQ forms.
 * Country is auto-detected and CANNOT be changed by user.
 * 
 * Priority:
 * 1) SEO detection (from page visit)
 * 2) Demand Grid row (if from grid)
 * 3) Fallback: GLOBAL
 * 
 * RULE: User CANNOT modify country
 */

import { Badge } from '@/components/ui/badge';
import { Lock, Info } from 'lucide-react';
import { useDemandCapture } from '@/hooks/useDemandCapture';
import { useEffect, useState } from 'react';
import { getCountryFlag, getCountryName, isValidCountryCode } from '@/data/countryMaster';

interface SEOContext {
  pageType: string;
  categorySlug: string;
  subcategorySlug?: string;
  productSlug?: string;
  countryCode: string;
  countryName: string;
  timestamp: string;
}

interface AutoCountryFieldProps {
  /** Override country from external source (e.g., demand grid row) */
  forcedCountry?: string;
  forcedCountryCode?: string;
  /** Show compact version */
  compact?: boolean;
  /** Custom label */
  label?: string;
  /** Callback with detected country code for form submission */
  onCountryDetected?: (countryCode: string, countryName: string) => void;
}

export function AutoCountryField({
  forcedCountry,
  forcedCountryCode,
  compact = false,
  label = 'Destination Country',
  onCountryDetected,
}: AutoCountryFieldProps) {
  const { countryName: geoCountryName, countryCode: geoCountryCode, isGeoDetected } = useDemandCapture();
  const [seoContext, setSeoContext] = useState<SEOContext | null>(null);
  
  // Load SEO context from sessionStorage (set by SEODemandSensor)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('ps_seo_context');
      if (stored) {
        setSeoContext(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);
  
  // Priority: forced > SEO context > geo detection > GLOBAL
  const displayCountry = forcedCountry || seoContext?.countryName || geoCountryName || 'Worldwide';
  const displayCode = forcedCountryCode || seoContext?.countryCode || geoCountryCode || 'GLOBAL';
  const isGlobal = displayCode === 'GLOBAL' || !displayCode;
  
  // Notify parent when country is detected
  useEffect(() => {
    if (isGeoDetected && onCountryDetected && displayCode) {
      onCountryDetected(displayCode, displayCountry);
    }
  }, [isGeoDetected, displayCode, displayCountry, onCountryDetected]);
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isGlobal ? (
          <span className="text-lg">{getCountryFlag('GLOBAL')}</span>
        ) : (
          <span className="text-lg">{getCountryFlag(displayCode)}</span>
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
        <span className="text-2xl">{isGlobal ? getCountryFlag('GLOBAL') : getCountryFlag(displayCode)}</span>
        
        <div className="flex-1">
          <p className="font-medium text-foreground">{displayCountry}</p>
          {!isGlobal && isValidCountryCode(displayCode) && (
            <p className="text-xs text-muted-foreground">
              Detected from your location ({displayCode})
            </p>
          )}
        </div>
        
        <Lock className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <span>
          Country is auto-detected for accurate demand intelligence. 
          This ensures your RFQ reaches the right suppliers.
        </span>
      </div>
    </div>
  );
}

/**
 * Get SEO context from session storage
 * Use this in form submission to link RFQ to source page
 */
export function getSEOContext(): SEOContext | null {
  try {
    const stored = sessionStorage.getItem('ps_seo_context');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Get auto-detected country for RFQ form
 * Priority: SEO context > geo detection > GLOBAL
 * Uses countryMaster for validation
 */
export function getAutoDetectedCountry(): { code: string; name: string } {
  const seoContext = getSEOContext();
  
  if (seoContext?.countryCode && seoContext.countryCode !== 'GLOBAL' && isValidCountryCode(seoContext.countryCode)) {
    return { code: seoContext.countryCode, name: getCountryName(seoContext.countryCode) };
  }
  
  // Try geo data from session storage
  try {
    const geoData = sessionStorage.getItem('ps_geo_data');
    if (geoData) {
      const parsed = JSON.parse(geoData);
      if (parsed.countryCode && parsed.countryCode !== 'GLOBAL' && isValidCountryCode(parsed.countryCode)) {
        return { code: parsed.countryCode, name: getCountryName(parsed.countryCode) };
      }
    }
  } catch {
    // Ignore parse errors
  }
  
  return { code: 'GLOBAL', name: 'Worldwide' };
}

export default AutoCountryField;
