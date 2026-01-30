import { Globe, TrendingUp, Eye, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  getAIDemandRegions, 
  formatRegionText, 
  getDemandNarrative 
} from '@/lib/aiDemandRegionMapping';

interface AIGlobalDemandSignalsProps {
  productName: string;
  categorySlug: string;
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

/**
 * AI Global Demand Signals Component
 * 
 * Displays illustrative AI-detected demand patterns across global regions.
 * NO numbers, NO false claims - uses pattern-based narrative language.
 * 
 * Renders on:
 * - BuyPage.tsx (below hero or before CTA)
 * - SupplierPage.tsx (below EarlyPartnerOffer)
 * - CategoryHub.tsx (after overview section)
 */
export function AIGlobalDemandSignals({ 
  productName, 
  categorySlug,
  variant = 'default',
  className = ''
}: AIGlobalDemandSignalsProps) {
  const regionConfig = getAIDemandRegions(categorySlug);
  const regions = formatRegionText(regionConfig);
  const narrative = getDemandNarrative(productName, categorySlug);

  if (variant === 'minimal') {
    return (
      <div className={`py-4 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Eye className="h-4 w-4 text-primary" />
          <span className="font-medium">AI Global Demand Signals</span>
          <Badge variant="outline" className="text-xs">Illustrative</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {narrative}
        </p>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={`border-primary/10 bg-gradient-to-br from-primary/5 to-transparent ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">AI Global Demand Signals</span>
            <Badge variant="outline" className="text-xs ml-auto">Illustrative</Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            {narrative}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {regionConfig.regions.map((region, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {region.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default (full) variant
  return (
    <section className={`py-12 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 ${className}`}>
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto border-primary/20 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Globe className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">AI Global Demand Signals</CardTitle>
              <Badge variant="outline" className="text-xs">Illustrative</Badge>
            </div>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
              These signals are derived from aggregated buyer behavior, search intent, 
              and procurement patterns across regions.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Narrative */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">
                  Our AI observes recurring procurement interest for <strong>{productName}</strong> across:
                </p>
              </div>
            </div>
            
            {/* Regions Grid */}
            <div className="grid sm:grid-cols-3 gap-4">
              {regionConfig.regions.map((region, i) => (
                <div 
                  key={i} 
                  className="bg-background rounded-lg p-4 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{region.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {region.countries.join(', ')}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center italic">
              These patterns are illustrative and derived from platform-wide procurement signals. 
              Actual demand may vary based on market conditions and buyer requirements.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default AIGlobalDemandSignals;
