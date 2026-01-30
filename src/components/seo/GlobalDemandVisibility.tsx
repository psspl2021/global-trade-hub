import { Globe, TrendingUp, Eye, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGeoDetection, getDemandStatus } from '@/hooks/useGeoDetection';

interface GlobalDemandVisibilityProps {
  productName: string;
  categorySlug?: string;
  variant?: 'section' | 'inline' | 'banner';
  className?: string;
}

/**
 * Global Demand Visibility Component
 * 
 * Injects country-aware SEO content on existing pages.
 * - Dynamically mentions user's country (auto-detected)
 * - Shows nearby trading regions
 * - Uses geo-safe phrasing (Detected / Emerging / Monitoring)
 * - Googlebot sees neutral/global content
 * 
 * NO new URLs created. Same canonical, enhanced content.
 */
export function GlobalDemandVisibility({ 
  productName, 
  categorySlug,
  variant = 'section',
  className = ''
}: GlobalDemandVisibilityProps) {
  const geoData = useGeoDetection();
  const demandStatus = getDemandStatus();
  
  // Geo-safe narrative based on detected location
  const getNarrative = () => {
    if (!geoData.isDetected || geoData.countryCode === 'GLOBAL') {
      return `ProcureSaathi observes procurement interest for ${productName} across international markets including ${geoData.nearbyRegions.slice(0, 3).join(', ')}.`;
    }
    
    return `Buyers from ${geoData.countryName} and ${geoData.nearbyRegions[0]} are actively exploring ${productName} sourcing through ProcureSaathi.`;
  };

  const getRegionalContext = () => {
    if (!geoData.isDetected) return null;
    
    return `Available for buyers in ${geoData.countryName} with procurement support across ${geoData.tradingPartners.join(', ')}.`;
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Globe className="h-4 w-4 text-primary flex-shrink-0" />
        <span>
          Serving buyers across <strong>195 countries</strong>
          {geoData.isDetected && geoData.countryCode !== 'GLOBAL' && (
            <> including <strong>{geoData.countryName}</strong></>
          )}
        </span>
        <Badge variant="outline" className="text-xs">{demandStatus}</Badge>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-3 px-4 border-b border-primary/10 ${className}`}>
        <div className="container mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-foreground">
              Global B2B Procurement — {geoData.isDetected && geoData.countryCode !== 'GLOBAL' 
                ? `Available in ${geoData.countryName}` 
                : 'Serving 195 countries'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {geoData.nearbyRegions.slice(0, 3).map((region, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {region}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default: section variant
  return (
    <section className={`py-8 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 ${className}`}>
      <div className="container mx-auto px-4">
        <Card className="max-w-3xl mx-auto border-primary/20">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-primary" />
              <span className="font-semibold">Global Demand Visibility</span>
              <Badge variant="outline" className="text-xs ml-auto">
                {demandStatus}
              </Badge>
            </div>
            
            {/* Narrative */}
            <p className="text-muted-foreground mb-4">
              {getNarrative()}
            </p>
            
            {/* Regional Context */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {geoData.isDetected && geoData.countryCode !== 'GLOBAL' && (
                <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{geoData.countryName}</span>
                </div>
              )}
              {geoData.nearbyRegions.slice(0, 3).map((region, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {region}
                </Badge>
              ))}
            </div>
            
            {/* Trust Signal */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t">
              <Users className="h-4 w-4" />
              <span>Serving buyers and suppliers across 195 countries worldwide</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default GlobalDemandVisibility;
