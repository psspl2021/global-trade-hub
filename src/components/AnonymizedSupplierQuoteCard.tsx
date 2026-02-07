import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, CheckCircle, Clock, 
  MapPin, IndianRupee, Shield,
  ArrowRight, Package, Truck
} from 'lucide-react';

interface PartnerQuoteProps {
  bidId: string;
  requirementId: string;
  // Anonymized data - always visible (partner identity is NEVER revealed)
  bidAmount: number;
  deliveryTimeline: number;
  rating?: number;
  partnerCategory?: string;
  partnerRegion?: string;  // Region only, not city
  isVerified?: boolean;
  createdAt: string;
  rankLabel?: string; // "Top-Ranked", "Runner-up" etc.
  // Callbacks
  onAcceptOffer?: (bidId: string) => void;
}

/**
 * PLATFORM RULE: This component displays offers from ProcureSaathi's fulfillment network.
 * 
 * - Buyer deals with ProcureSaathi ONLY
 * - No supplier identity is ever revealed
 * - Partners are fulfillment agents, not seller endpoints
 * - All negotiations/contracts are with ProcureSaathi
 */
export function AnonymizedSupplierQuoteCard({
  bidId,
  requirementId,
  bidAmount,
  deliveryTimeline,
  rating = 4.5,
  partnerCategory,
  partnerRegion,
  isVerified = true,
  createdAt,
  rankLabel = 'ProcureSaathi Verified Partner',
  onAcceptOffer
}: PartnerQuoteProps) {

  return (
    <Card className="relative overflow-hidden border-primary/20">
      {/* Partner Badge - NEVER shows supplier identity */}
      <div className="absolute top-3 right-3">
        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
          <Shield className="h-3 w-3 mr-1" /> {rankLabel}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          {/* ProcureSaathi Partner Avatar - NOT supplier identity */}
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              ProcureSaathi Partner
              {isVerified && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </CardTitle>

            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              {partnerRegion && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {partnerRegion}
                </span>
              )}
              {rating && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> 
                  {rating.toFixed(1)} Rating
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Offer Details - Always Visible */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Offer Price</p>
            <p className="text-lg font-bold flex items-center text-primary">
              <IndianRupee className="h-4 w-4" />
              {bidAmount.toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Delivery</p>
            <p className="text-lg font-bold flex items-center gap-1">
              <Truck className="h-4 w-4 text-muted-foreground" />
              {deliveryTimeline} days
            </p>
          </div>
        </div>

        {/* Platform Guarantee - Key messaging */}
        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span>Fulfilled by ProcureSaathi verified network</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <Shield className="h-4 w-4" />
              <span>Full commercial protection included</span>
            </div>
          </div>
        </div>

        {/* Buyer anonymity trust line */}
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          🔒 Buyer identity is confidential until order confirmation.
        </p>

        {/* Category Tag */}
        {partnerCategory && (
          <Badge variant="secondary" className="font-normal">
            {partnerCategory}
          </Badge>
        )}

        {/* Accept Offer - Buyer contracts with ProcureSaathi */}
        {onAcceptOffer && (
          <Button 
            className="w-full gap-2"
            onClick={() => onAcceptOffer(bidId)}
          >
            Accept Offer <ArrowRight className="h-4 w-4" />
          </Button>
        )}

        {/* Footer disclaimer - MANDATORY */}
        <p className="text-xs text-center text-muted-foreground">
          Your order is managed end-to-end by ProcureSaathi
        </p>
        
        {/* AI Governance Notice */}
        <div className="text-xs text-center text-muted-foreground border-t pt-2 mt-2">
          <span className="flex items-center justify-center gap-1">
            🔐 AI-verified partner • Supplier identity protected • Platform-managed fulfillment
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * SECURITY NOTICE:
 * This component NEVER receives or displays supplier_id.
 * All data is anonymized at the database level.
 * ps_partner_id is a hash that cannot be reverse-engineered.
 */

// Re-export with original name for backward compatibility
export { AnonymizedSupplierQuoteCard as default };
