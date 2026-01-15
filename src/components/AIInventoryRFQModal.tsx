import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Truck,
  Clock
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

// Calculate smart default quantity based on match strength
const getDefaultQuantity = (availableQty: number, matchStrength: 'high' | 'medium' | 'low'): string => {
  // For high demand items, suggest 70% to improve acceptance
  // For others, suggest reasonable defaults
  if (matchStrength === 'high') {
    const suggested = Math.floor(availableQty * 0.7);
    return Math.max(1, suggested).toString();
  }
  // Default to smaller amount to not scare buyers
  if (availableQty >= 100) return '10';
  if (availableQty >= 10) return Math.floor(availableQty * 0.5).toString();
  return '1';
};

export function AIInventoryRFQModal({ 
  open, 
  onOpenChange, 
  stock,
  userId 
}: AIInventoryRFQModalProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buyerCity, setBuyerCity] = useState('');
  const [quantity, setQuantity] = useState(getDefaultQuantity(stock.availableQuantity, stock.matchStrength));
  const [deliveryTimeline, setDeliveryTimeline] = useState('7_days');
  const [notes, setNotes] = useState('');
  const [hasPendingRFQ, setHasPendingRFQ] = useState(false);
  const [forceSubmitDuplicate, setForceSubmitDuplicate] = useState(false);
  const { toast } = useToast();

  // Expected response time based on match strength
  const responseETA: Record<'high' | 'medium' | 'low', string> = {
    high: 'Within 2–4 hours',
    medium: 'Same day',
    low: '1–2 business days',
  };

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

  // Check for duplicate RFQs and reset form when modal opens
  useEffect(() => {
    if (open) {
      setQuantity(getDefaultQuantity(stock.availableQuantity, stock.matchStrength));
      setDeliveryTimeline('7_days');
      setNotes('');
      setHasPendingRFQ(false);
      setForceSubmitDuplicate(false);

      // Check for existing active RFQ on same product (24h window)
      const checkDuplicateRFQ = async () => {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const { data } = await supabase
          .from('requirements')
          .select('id')
          .eq('buyer_id', userId)
          .eq('rfq_source', 'ai_inventory')
          .eq('source_product_id', stock.id)
          .eq('status', 'active')
          .gte('created_at', twentyFourHoursAgo.toISOString())
          .limit(1);

        if (data && data.length > 0) {
          setHasPendingRFQ(true);
        }
      };

      checkDuplicateRFQ();
    }
  }, [open, stock.availableQuantity, stock.matchStrength, stock.id, userId]);

  // Calculate max allowed quantity based on match strength
  const maxAllowedQty = stock.matchStrength === 'high' 
    ? Math.floor(stock.availableQuantity * 0.7) 
    : stock.availableQuantity;

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

    // Enforce maxAllowedQty for high-demand items
    if (qty > maxAllowedQty) {
      toast({
        title: 'Requested quantity too high',
        description: `Recommended max: ${maxAllowedQty} ${stock.unit} for faster confirmation`,
        variant: 'destructive',
      });
      return;
    }

    if (!buyerCity.trim()) {
      toast({
        title: 'Delivery city required',
        description: 'Please update your city in profile settings',
        variant: 'destructive',
      });
      return;
    }

    // Block duplicate submissions unless explicitly confirmed
    if (hasPendingRFQ && !forceSubmitDuplicate) {
      toast({
        title: 'Duplicate request blocked',
        description: 'Please confirm you want to submit another request for this product',
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
        status: 'active' as const,
        // Let backend determine trade_type based on locations
        trade_type: null,
        // Use auto mode - AI will select best supplier from matched inventory
        selection_mode: 'auto',
        rfq_source: 'ai_inventory',
        source_product_id: stock.id,
        source_metadata: {
          version: 'ai_inventory_rfq_v1',
          visibility: 'anonymous',
          match_strength: stock.matchStrength,
          available_quantity: stock.availableQuantity,
          requested_timeline: deliveryTimeline,
          buyer_city: buyerCity,
          ui_entry: 'browse_products',
          inventory_visibility: 'verified',
        },
      };

      const { error } = await supabase
        .from('requirements')
        .insert(insertData as any);

      if (error) throw error;

      toast({
        title: 'Quote request submitted!',
        description: 'ProcureSaathi will source from our verified fulfilment pool and respond shortly.',
      });

      onOpenChange(false);
      
      // Redirect to My RFQs for conversion
      navigate('/dashboard?tab=requirements');
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
            Request Quote from ProcureSaathi
          </DialogTitle>
          <DialogDescription>
            Request pricing for verified available stock from our fulfilment pool.
            ProcureSaathi handles sourcing, pricing, and delivery.
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
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {stock.unit} • Max recommended: {maxAllowedQty} {stock.unit}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Delivery City</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="city"
                    value={buyerCity}
                    disabled
                    className="bg-muted"
                    placeholder="Set in profile"
                  />
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-xs px-2"
                    onClick={() => navigate('/dashboard?tab=profile')}
                  >
                    Change
                  </Button>
                </div>
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

          {/* Duplicate RFQ Warning with confirmation */}
          {hasPendingRFQ && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
              <p className="text-sm text-yellow-800">
                You already have an open quote request for this product from the last 24 hours.
              </p>
              <label className="flex items-center gap-2 text-sm text-yellow-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceSubmitDuplicate}
                  onChange={(e) => setForceSubmitDuplicate(e.target.checked)}
                  className="rounded border-yellow-400"
                />
                Submit anyway (may result in duplicate quotes)
              </label>
            </div>
          )}

          {/* Trust & Disclosure - Managed Fulfilment Model */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              ProcureSaathi Guarantee
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-green-500">✓</span>
                <span>All-inclusive pricing — no hidden charges</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-green-500">✓</span>
                <span>Fulfilment by ProcureSaathi verified partners</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-green-500">✓</span>
                <span>ProcureSaathi handles disputes, delivery & quality</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4" />
                <span>Logistics quoted separately based on location</span>
              </div>
            </div>
            <div className="pt-2 border-t border-dashed">
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <Clock className="h-4 w-4" />
                <span>Expected response: {responseETA[stock.matchStrength]}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || (hasPendingRFQ && !forceSubmitDuplicate)}
          >
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
