/**
 * AnonymousBuyerCard (SUPPLIER VIEW)
 * ===================================
 * 
 * CRITICAL ANONYMITY RULES (LOCKED):
 * - Supplier NEVER sees real buyer name
 * - Supplier NEVER sees buyer GST / legal entity
 * - Supplier NEVER sees buyer contact person
 * - Supplier NEVER sees buyer email / phone
 * - Supplier NEVER sees buyer delivery address (until PO)
 * 
 * Supplier sees ONLY:
 * - ProcureSaathi Verified Buyer (ID: PB-XXX)
 * - Category, quantity range, specs
 * - Delivery country / port (not address)
 * - Timeline, payment terms (bucketed)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Shield, 
  Package, 
  MapPin, 
  Calendar, 
  CreditCard,
  Info,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnonymousBuyerProps {
  buyerId: string; // PB-XXX format
  displayName: string; // "ProcureSaathi Verified Buyer (ID: PB-XXX)"
  category: string;
  quantityRange: string;
  specs?: string;
  deliveryRegion: string; // Country or port only, never full address
  timeline: string;
  paymentTerms: string; // Bucketed: "Advance", "LC", "30-60 Days"
  trustScore?: number;
  isVerified?: boolean;
}

export function AnonymousBuyerCard({
  buyerId,
  displayName,
  category,
  quantityRange,
  specs,
  deliveryRegion,
  timeline,
  paymentTerms,
  trustScore = 90,
  isVerified = true,
}: AnonymousBuyerProps) {
  return (
    <TooltipProvider>
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" />
              {displayName}
            </CardTitle>
            {isVerified && (
              <Badge variant="default" className="bg-emerald-600">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          
          {/* Platform Notice */}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              <Building2 className="w-3 h-3 mr-1" />
              Managed by ProcureSaathi
            </Badge>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Buyer identity is protected. All communication and contracts 
                  are managed through ProcureSaathi to ensure fair pricing 
                  and prevent deal leakage.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Trust Score */}
          {trustScore && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Buyer Trust Score</span>
              <span className={cn(
                "text-lg font-bold",
                trustScore >= 80 ? "text-emerald-600" :
                trustScore >= 60 ? "text-amber-600" : "text-red-600"
              )}>
                {trustScore}%
              </span>
            </div>
          )}

          {/* Requirement Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-sm font-medium">{category}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Quantity</p>
                <p className="text-sm font-medium">{quantityRange}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Delivery Region</p>
                <p className="text-sm font-medium">{deliveryRegion}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Timeline</p>
                <p className="text-sm font-medium">{timeline}</p>
              </div>
            </div>
          </div>

          {/* Specs */}
          {specs && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Specifications</p>
              <p className="text-sm">{specs}</p>
            </div>
          )}

          {/* Payment Terms */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Payment:</span>
            <Badge variant="secondary">{paymentTerms}</Badge>
          </div>

          {/* Privacy Notice */}
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Buyer details will be shared only after order confirmation through ProcureSaathi.
            All contracts are between you and ProcureSaathi.
          </p>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default AnonymousBuyerCard;
