import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  Package, 
  Shield, 
  MapPin, 
  Calendar,
  TrendingUp,
  Minus,
  TrendingDown,
  Info,
  Truck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIInventoryRFQModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: {
    id: string;
    productName: string;
    category: string;
    availableQuantity: number;
    unit: string;
    matchStrength: 'high' | 'medium' | 'low';
  };
  userId: string;
}

const getMatchStrengthConfig = (strength: 'high' | 'medium' | 'low') => {
  const configs = {
    high: {
      label: 'High Demand',
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: TrendingUp,
    },
    medium: {
      label: 'Medium Demand',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      icon: Minus,
    },
    low: {
      label: 'Available',
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: TrendingDown,
    },
  };
  return configs[strength];
};

export function AIInventoryRFQModal({ 
  open, 
  onOpenChange, 
  stock,
  userId 
}: AIInventoryRFQModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buyerCity, setBuyerCity] = useState('');
  const [quantity, setQuantity] = useState(stock.availableQuantity.toString());
  const [deliveryTimeline, setDeliveryTimeline] = useState('7_days');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  // Fetch buyer's city from profile
  useEffect(() => {
    const fetchBuyerCity = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('city')
        .eq('id', userId)
        .single();
      
      if (data?.city) {
        setBuyerCity(data.city);
      }
    };
    
    if (open && userId) {
      fetchBuyerCity();
    }
  }, [open, userId]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setQuantity(Math.min(stock.availableQuantity, stock.availableQuantity).toString());
      setDeliveryTimeline('7_days');
      setNotes('');
    }
  }, [open, stock.availableQuantity]);

  const handleSubmit = async () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: 'Invalid quantity',
        description: 'Please enter a valid quantity',
        variant: 'destructive',
      });
      return;
    }

    if (qty > stock.availableQuantity) {
      toast({
        title: 'Quantity exceeds available stock',
        description: `Maximum available: ${stock.availableQuantity} ${stock.unit}`,
        variant: 'destructive',
      });
      return;
    }

    if (!buyerCity.trim()) {
      toast({
        title: 'Delivery city required',
        description: 'Please enter your delivery city',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate deadline based on timeline
      const now = new Date();
      let deadlineDays = 7;
      if (deliveryTimeline === 'immediate') deadlineDays = 3;
      else if (deliveryTimeline === '14_days') deadlineDays = 14;
      else if (deliveryTimeline === '30_days') deadlineDays = 30;
      
      const deadline = new Date(now.getTime() + deadlineDays * 24 * 60 * 60 * 1000);

      // Create the RFQ - cast to any to handle new columns not yet in types
      const insertData = {
        buyer_id: userId,
        title: `Request for ${stock.productName}`,
        product_category: stock.category,
        description: `AI-matched request for verified available stock.\n\nProduct: ${stock.productName}\nCategory: ${stock.category}\nRequested Quantity: ${qty} ${stock.unit}\n\n${notes ? `Additional Notes: ${notes}` : ''}`,
        quantity: qty,
        unit: stock.unit,
        delivery_location: buyerCity,
        deadline: deadline.toISOString(),
        status: 'open' as const,
        trade_type: 'domestic_india',
        selection_mode: 'auto',
        rfq_source: 'ai_inventory',
        source_product_id: stock.id,
        source_metadata: {
          version: 'ai_inventory_rfq_v1',
          visibility: 'anonymous',
          match_strength: stock.matchStrength,
          available_quantity: stock.availableQuantity,
          requested_timeline: deliveryTimeline,
        },
      };

      const { error } = await supabase
        .from('requirements')
        .insert(insertData as any);

      if (error) throw error;

      toast({
        title: 'Quote request submitted!',
        description: 'Verified suppliers will be notified. You\'ll receive quotes shortly.',
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('RFQ creation error:', error);
      toast({
        title: 'Failed to submit request',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const matchConfig = getMatchStrengthConfig(stock.matchStrength);
  const MatchIcon = matchConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Request Quote
          </DialogTitle>
          <DialogDescription>
            Request pricing from verified suppliers with available stock.
            Supplier identities remain confidential.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pre-filled Product Info (Read-only) */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{stock.productName}</p>
                <p className="text-sm text-muted-foreground">{stock.category}</p>
              </div>
              <Badge variant="outline" className={matchConfig.color}>
                <MatchIcon className="h-3 w-3 mr-1" />
                {matchConfig.label}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>{stock.availableQuantity} {stock.unit} available</span>
              </div>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <Shield className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>
          </div>

          {/* Buyer Inputs */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity Required</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min={1}
                  max={stock.availableQuantity}
                  placeholder={`Max: ${stock.availableQuantity}`}
                />
                <p className="text-xs text-muted-foreground">
                  {stock.unit}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Delivery City</Label>
                <Input
                  id="city"
                  value={buyerCity}
                  onChange={(e) => setBuyerCity(e.target.value)}
                  placeholder="Enter city"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline">Delivery Timeline</Label>
              <Select value={deliveryTimeline} onValueChange={setDeliveryTimeline}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate (within 3 days)</SelectItem>
                  <SelectItem value="7_days">Within 7 days</SelectItem>
                  <SelectItem value="14_days">Within 14 days</SelectItem>
                  <SelectItem value="30_days">Within 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific requirements, specifications, or questions..."
                rows={3}
              />
            </div>
          </div>

          {/* Trust & Disclosure */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Supplier identities remain anonymous until order confirmation</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Truck className="h-3 w-3" />
              <span>Logistics charged separately. Platform service charges included where applicable.</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Quote Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
