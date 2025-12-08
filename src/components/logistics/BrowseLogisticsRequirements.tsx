import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Calendar, Package, Send, ArrowRight, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LogisticsRequirement {
  id: string;
  title: string;
  material_type: string;
  material_description: string | null;
  quantity: number;
  unit: string;
  pickup_location: string;
  delivery_location: string;
  pickup_date: string;
  delivery_deadline: string;
  vehicle_type_preference: string | null;
  special_requirements: string | null;
  budget_max: number | null;
  status: string;
  created_at: string;
}

interface Vehicle {
  id: string;
  registration_number: string;
  vehicle_type: string;
  manufacturer: string | null;
  model: string | null;
  capacity_tons: number | null;
}

const PLATFORM_FEE_PER_UNIT = 50; // ₹50 per ton/kg/unit

const bidSchema = z.object({
  rate_per_unit: z.coerce.number().min(0.01, 'Rate per unit is required'),
  estimated_transit_days: z.coerce.number().min(1, 'Transit days required'),
  vehicle_id: z.string().optional(),
  terms_and_conditions: z.string().optional(),
});

type BidFormData = z.infer<typeof bidSchema>;

interface BrowseLogisticsRequirementsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const BrowseLogisticsRequirements = ({ open, onOpenChange, userId }: BrowseLogisticsRequirementsProps) => {
  const [requirements, setRequirements] = useState<LogisticsRequirement[]>([]);
  const [lowestBids, setLowestBids] = useState<Record<string, number>>({});
  const [myBids, setMyBids] = useState<Set<string>>(new Set());
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequirement, setSelectedRequirement] = useState<LogisticsRequirement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [subscription, setSubscription] = useState<{ 
    bids_used_this_month: number; 
    bids_limit: number; 
    id: string;
    premium_bids_balance: number;
  } | null>(null);
  const { toast } = useToast();

  const BID_FEE = 500;
  
  // Priority: premium_bids_balance -> monthly bids -> paid bid
  const hasPremiumBids = subscription && subscription.premium_bids_balance > 0;
  const hasFreeBidsRemaining = subscription && subscription.bids_used_this_month < subscription.bids_limit;
  const isPaidBid = subscription && !hasPremiumBids && !hasFreeBidsRemaining;
  const isUsingPremiumBid = hasPremiumBids;

  const form = useForm<BidFormData>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      estimated_transit_days: 3,
    },
  });

  const fetchRequirements = async () => {
    setLoading(true);
    
    const { data: reqData, error } = await (supabase
      .from('logistics_requirements') as any)
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to load requirements', variant: 'destructive' });
      setLoading(false);
      return;
    }

    setRequirements(reqData || []);

    // Fetch my existing bids
    const { data: myBidsData } = await (supabase
      .from('logistics_bids') as any)
      .select('requirement_id')
      .eq('transporter_id', userId);

    if (myBidsData) {
      setMyBids(new Set(myBidsData.map(b => b.requirement_id)));
    }

    // Fetch lowest bids
    if (reqData && reqData.length > 0) {
      const lowestByReq: Record<string, number> = {};
        for (const req of reqData) {
          const { data } = await (supabase.rpc as any)('get_lowest_logistics_bid', { req_id: req.id });
          if (data && data[0]?.lowest_bid_amount) {
            lowestByReq[req.id] = data[0].lowest_bid_amount;
          }
        }
      setLowestBids(lowestByReq);
    }

    // Fetch transporter's vehicles
    const { data: vehiclesData } = await supabase
      .from('vehicles')
      .select('id, registration_number, vehicle_type, manufacturer, model, capacity_tons')
      .eq('partner_id', userId)
      .eq('is_available', true);

    setVehicles(vehiclesData || []);
    setLoading(false);
  };

  const fetchSubscription = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('id, bids_used_this_month, bids_limit, premium_bids_balance')
      .eq('user_id', userId)
      .maybeSingle();
    setSubscription(data);
  };

  useEffect(() => {
    if (open && userId) {
      fetchRequirements();
      fetchSubscription();
    }
  }, [open, userId]);

  const onSubmitBid = async (data: BidFormData) => {
    if (!selectedRequirement) return;

    setSubmitting(true);
    try {
      const quantity = selectedRequirement.quantity;
      const bidAmount = data.rate_per_unit * quantity;
      // Fixed ₹50 per unit platform fee
      const serviceFee = PLATFORM_FEE_PER_UNIT * quantity;
      const totalAmount = bidAmount + serviceFee;

      const { error } = await (supabase.from('logistics_bids') as any).insert({
        requirement_id: selectedRequirement.id,
        transporter_id: userId,
        bid_amount: bidAmount,
        rate_per_unit: data.rate_per_unit,
        service_fee: serviceFee,
        total_amount: totalAmount,
        estimated_transit_days: data.estimated_transit_days,
        vehicle_id: data.vehicle_id || null,
        terms_and_conditions: data.terms_and_conditions || null,
        is_paid_bid: isPaidBid ? true : false,
      });

      if (error) throw error;

      // Update subscription based on bid type
      if (subscription) {
        if (isUsingPremiumBid) {
          // Deduct from premium balance
          await supabase
            .from('subscriptions')
            .update({ premium_bids_balance: subscription.premium_bids_balance - 1 })
            .eq('id', subscription.id);
        } else if (hasFreeBidsRemaining) {
          // Deduct from monthly bids
          await supabase
            .from('subscriptions')
            .update({ bids_used_this_month: subscription.bids_used_this_month + 1 })
            .eq('id', subscription.id);
        }
        // For paid bids, no subscription update needed
      }

      let bidCostMsg = '';
      if (isUsingPremiumBid) {
        bidCostMsg = ' (Used 1 premium quote)';
      } else if (isPaidBid) {
        bidCostMsg = ` (Bid fee: ₹${BID_FEE})`;
      }
      toast({ title: 'Success', description: `Quote submitted successfully!${bidCostMsg}` });
      setSelectedRequirement(null);
      form.reset();
      fetchRequirements();
      fetchSubscription();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const ratePerUnit = form.watch('rate_per_unit');
  const quantity = selectedRequirement?.quantity || 0;
  const unit = selectedRequirement?.unit || 'units';
  const bidAmount = ratePerUnit ? ratePerUnit * quantity : 0;
  const serviceFee = quantity ? PLATFORM_FEE_PER_UNIT * quantity : 0;
  const totalAmount = bidAmount + serviceFee;

  const getVehicleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      truck: 'Truck', trailer: 'Trailer', tanker: 'Tanker', container_truck: 'Container Truck',
      open_truck: 'Open Truck', closed_container: 'Closed Container', refrigerated: 'Refrigerated', flatbed: 'Flatbed',
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Active Logistics Requirements</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : requirements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No active logistics requirements at the moment.</p>
          </div>
        ) : selectedRequirement ? (
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={() => setSelectedRequirement(null)}>← Back to list</Button>
            
            <Card>
              <CardHeader>
                <CardTitle>{selectedRequirement.title}</CardTitle>
                <Badge>{selectedRequirement.material_type}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedRequirement.material_description && (
                  <p className="text-sm">{selectedRequirement.material_description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Cargo:</strong> {selectedRequirement.quantity} {selectedRequirement.unit}</div>
                  <div><strong>Budget:</strong> {selectedRequirement.budget_max ? `₹${selectedRequirement.budget_max.toLocaleString()}` : 'Not specified'}</div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedRequirement.pickup_location} → {selectedRequirement.delivery_location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Pickup: {format(new Date(selectedRequirement.pickup_date), 'PP')}
                  </div>
                  <div>
                    <strong>Delivery By:</strong> {format(new Date(selectedRequirement.delivery_deadline), 'PP')}
                  </div>
                  {selectedRequirement.vehicle_type_preference && (
                    <div><strong>Vehicle:</strong> {getVehicleTypeLabel(selectedRequirement.vehicle_type_preference)}</div>
                  )}
                </div>

                {selectedRequirement.special_requirements && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <strong>Special Requirements:</strong> {selectedRequirement.special_requirements}
                  </div>
                )}
                
                {lowestBids[selectedRequirement.id] && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Current Lowest Quote: ₹{lowestBids[selectedRequirement.id].toLocaleString()}</p>
                  </div>
                )}

                {myBids.has(selectedRequirement.id) ? (
                  <div className="p-4 bg-primary/10 rounded-lg text-center">
                    <p className="font-medium">You have already submitted a quote for this requirement.</p>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitBid)} className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">Submit Your Quote</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="rate_per_unit" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rate per {selectedRequirement.unit} (₹) *</FormLabel>
                            <FormControl><Input type="number" step="0.01" min="0.01" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="estimated_transit_days" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transit Days *</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      {vehicles.length > 0 && (
                        <FormField control={form.control} name="vehicle_id" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assign Vehicle (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {vehicles.map(v => (
                                  <SelectItem key={v.id} value={v.id}>
                                    {v.registration_number} - {getVehicleTypeLabel(v.vehicle_type)} 
                                    {v.capacity_tons && ` (${v.capacity_tons}T)`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}
                      
                      {ratePerUnit > 0 && (
                        <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Rate:</span>
                            <span>₹{ratePerUnit.toLocaleString()} per {unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Quantity:</span>
                            <span>{quantity} {unit}</span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span>Your Quote:</span>
                            <span>₹{bidAmount.toLocaleString()} ({ratePerUnit.toLocaleString()} × {quantity})</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Platform Fee (₹{PLATFORM_FEE_PER_UNIT}/{unit}):</span>
                            <span>₹{serviceFee.toLocaleString()} ({PLATFORM_FEE_PER_UNIT} × {quantity})</span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-1">
                            <span>Total to Customer:</span>
                            <span>₹{totalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                      <FormField control={form.control} name="terms_and_conditions" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terms & Conditions (Optional)</FormLabel>
                          <FormControl><Textarea {...field} rows={2} placeholder="Any specific terms..." /></FormControl>
                        </FormItem>
                      )} />

                      {isUsingPremiumBid && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                            <strong>Using Premium Quote</strong>
                          </div>
                          <p className="mt-1">Balance after: {(subscription?.premium_bids_balance ?? 1) - 1} quotes</p>
                        </div>
                      )}

                      {isPaidBid && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-400">
                          <strong>Paid Bid:</strong> You've used all {subscription?.bids_limit} free bids this month. 
                          This quote will cost ₹{BID_FEE}.
                        </div>
                      )}

                      <Button type="submit" disabled={submitting} className="w-full">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        {isUsingPremiumBid ? 'Submit Quote (Premium)' : isPaidBid ? `Submit Quote (₹${BID_FEE})` : 'Submit Quote'}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            {requirements.map(req => (
              <Card key={req.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedRequirement(req)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{req.title}</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{req.material_type}</Badge>
                        {myBids.has(req.id) && <Badge variant="outline">Quote Submitted</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {req.quantity} {req.unit}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {req.pickup_location} <ArrowRight className="h-3 w-3" /> {req.delivery_location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(req.pickup_date), 'PP')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {lowestBids[req.id] && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Lowest: </span>
                          <span className="font-medium">₹{lowestBids[req.id].toLocaleString()}</span>
                        </p>
                      )}
                      <Button size="sm" className="mt-2">View & Quote</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
