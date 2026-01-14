import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, Eye, Star, CheckCircle, Clock, 
  Building, MapPin, IndianRupee, Shield,
  ArrowRight, Unlock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnonymizedSupplierQuoteProps {
  bidId: string;
  requirementId: string;
  supplierId: string;
  // Anonymized data - always visible
  bidAmount: number;
  deliveryTimeline: number;
  rating?: number;
  supplierCategory?: string;
  supplierCity?: string;  // City is visible, not full address
  isVerified?: boolean;
  createdAt: string;
  // Reveal status
  revealStatus: 'locked' | 'requested' | 'paid' | 'revealed';
  revealFee?: number;
  // Revealed data - only visible if revealed
  supplierName?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierCompany?: string;
  // Callbacks
  onRequestReveal?: (bidId: string, supplierId: string) => void;
  onRevealComplete?: () => void;
}

export function AnonymizedSupplierQuoteCard({
  bidId,
  requirementId,
  supplierId,
  bidAmount,
  deliveryTimeline,
  rating = 4.5,
  supplierCategory,
  supplierCity,
  isVerified = true,
  createdAt,
  revealStatus,
  revealFee = 499,
  supplierName,
  supplierPhone,
  supplierEmail,
  supplierCompany,
  onRequestReveal,
  onRevealComplete
}: AnonymizedSupplierQuoteProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const isRevealed = revealStatus === 'revealed';
  const isPending = revealStatus === 'requested' || revealStatus === 'paid';

  const handleRequestReveal = async () => {
    if (onRequestReveal) {
      setIsRequesting(true);
      try {
        await onRequestReveal(bidId, supplierId);
      } finally {
        setIsRequesting(false);
      }
    }
  };

  // Generate anonymized supplier code (first 4 chars of supplier ID)
  const anonymizedCode = `SUP-${supplierId.slice(0, 4).toUpperCase()}`;

  return (
    <Card className={`relative overflow-hidden ${isRevealed ? 'border-green-200 dark:border-green-800' : ''}`}>
      {/* Status Badge */}
      <div className="absolute top-3 right-3">
        {isRevealed ? (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <Unlock className="h-3 w-3 mr-1" /> Contact Revealed
          </Badge>
        ) : isPending ? (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" /> Reveal Pending
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-muted/50">
            <Lock className="h-3 w-3 mr-1" /> Contact Locked
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          {/* Supplier Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            {isRevealed ? (
              <span className="text-lg font-bold text-primary">
                {(supplierName || supplierCompany || 'S').charAt(0)}
              </span>
            ) : (
              <Lock className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              {isRevealed ? (
                <>
                  {supplierCompany || supplierName}
                  {isVerified && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </>
              ) : (
                <>
                  {anonymizedCode}
                  {isVerified && (
                    <Badge variant="outline" className="text-xs ml-1">
                      <Shield className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  )}
                </>
              )}
            </CardTitle>

            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              {supplierCity && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {supplierCity}
                </span>
              )}
              {rating && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> 
                  {rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quote Details - Always Visible */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Quote Amount</p>
            <p className="text-lg font-bold flex items-center text-primary">
              <IndianRupee className="h-4 w-4" />
              {bidAmount.toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Delivery</p>
            <p className="text-lg font-bold">
              {deliveryTimeline} days
            </p>
          </div>
        </div>

        {/* Contact Section */}
        {isRevealed ? (
          // Revealed Contact Info
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-2">
              Supplier Contact Details
            </p>
            <div className="space-y-1.5 text-sm">
              {supplierName && (
                <p><span className="text-muted-foreground">Name:</span> {supplierName}</p>
              )}
              {supplierPhone && (
                <p>
                  <span className="text-muted-foreground">Phone:</span>{' '}
                  <a href={`tel:${supplierPhone}`} className="text-primary hover:underline">
                    {supplierPhone}
                  </a>
                </p>
              )}
              {supplierEmail && (
                <p>
                  <span className="text-muted-foreground">Email:</span>{' '}
                  <a href={`mailto:${supplierEmail}`} className="text-primary hover:underline">
                    {supplierEmail}
                  </a>
                </p>
              )}
            </div>
          </div>
        ) : (
          // Locked Contact - Request Reveal
          <div className="p-3 bg-muted/30 rounded-lg border border-dashed">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {isPending ? 'Reveal in progress...' : 'Contact details hidden'}
                </span>
              </div>
              
              {!isPending && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleRequestReveal}
                  disabled={isRequesting}
                  className="gap-1"
                >
                  {revealFee && revealFee > 0 ? (
                    <>
                      <IndianRupee className="h-3 w-3" />
                      {revealFee} - Reveal
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3 w-3" /> Reveal Contact
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Supplier Category Tag */}
        {supplierCategory && (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="font-normal">
              {supplierCategory}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
