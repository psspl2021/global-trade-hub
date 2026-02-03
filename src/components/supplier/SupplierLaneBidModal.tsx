/**
 * ============================================================
 * SUPPLIER LANE BIDDING MODAL
 * ============================================================
 * 
 * Modal for suppliers to place bids on high-intent demand lanes.
 * Used in the supplier dashboard when lanes enter auction.
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Gavel, 
  Loader2,
  IndianRupee,
  Trophy,
  Clock,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface LaneAuction {
  id: string;
  category: string;
  country: string;
  intent_threshold: number;
  max_slots: number;
  auction_end_at: string;
}

interface SupplierLaneBidModalProps {
  auction: LaneAuction | null;
  open: boolean;
  onClose: () => void;
  onBidPlaced?: () => void;
}

export function SupplierLaneBidModal({ 
  auction, 
  open, 
  onClose,
  onBidPlaced 
}: SupplierLaneBidModalProps) {
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidTier, setBidTier] = useState<string>('premium');
  const [submitting, setSubmitting] = useState(false);

  const getTimeRemaining = (endAt: string) => {
    const end = new Date(endAt);
    const now = new Date();
    const hours = Math.max(0, Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60)));
    if (hours > 24) {
      return `${Math.floor(hours / 24)} days ${hours % 24} hours`;
    }
    return `${hours} hours`;
  };

  const handleSubmit = async () => {
    if (!user?.id || !auction) {
      toast.error('Please log in to place a bid');
      return;
    }

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('auction_bids')
        .insert({
          auction_id: auction.id,
          supplier_id: user.id,
          bid_amount: amount,
          bid_tier: bidTier
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already placed a bid on this auction');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Bid placed successfully!');
      onBidPlaced?.();
      onClose();
    } catch (err) {
      console.error('[SupplierLaneBidModal] Error:', err);
      toast.error('Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  if (!auction) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Place Bid for Lane Access
          </DialogTitle>
          <DialogDescription>
            Win exclusive access to high-intent demand in this category
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Auction Info */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Category</span>
              <span className="font-medium">{auction.category}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Country</span>
              <span className="font-medium">{auction.country}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Intent Threshold</span>
              <Badge variant="outline" className="border-green-500 text-green-600">
                <Target className="h-3 w-3 mr-1" />
                ≥ {auction.intent_threshold}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available Slots</span>
              <Badge variant="secondary">
                <Trophy className="h-3 w-3 mr-1" />
                Top {auction.max_slots}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Time Remaining</span>
              <Badge variant="outline" className="border-amber-500 text-amber-600">
                <Clock className="h-3 w-3 mr-1" />
                {getTimeRemaining(auction.auction_end_at)}
              </Badge>
            </div>
          </div>

          {/* Bid Amount */}
          <div>
            <Label>Your Bid Amount (₹)</Label>
            <div className="relative mt-1">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Enter bid amount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="pl-9"
                min="1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly subscription fee for exclusive lane access
            </p>
          </div>

          {/* Tier Selection */}
          <div>
            <Label>Access Tier</Label>
            <RadioGroup value={bidTier} onValueChange={setBidTier} className="mt-2">
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="premium" id="premium" />
                <Label htmlFor="premium" className="flex-1 cursor-pointer">
                  <span className="font-medium">Premium</span>
                  <p className="text-xs text-muted-foreground">
                    Access to intent ≥ 4 signals, RFQ alerts, 24h early visibility
                  </p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="exclusive" id="exclusive" />
                <Label htmlFor="exclusive" className="flex-1 cursor-pointer">
                  <span className="font-medium">Exclusive</span>
                  <p className="text-xs text-muted-foreground">
                    All Premium benefits + priority RFQ routing, 72h early access
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Gavel className="h-4 w-4 mr-1" />
            )}
            Place Bid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SupplierLaneBidModal;
