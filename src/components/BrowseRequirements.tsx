import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Calendar, MapPin, IndianRupee, Send, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { maskCompanyName } from '@/lib/utils';

interface Requirement {
  id: string;
  title: string;
  description: string;
  product_category: string;
  trade_type?: 'import' | 'export' | 'domestic_india';
  quantity: number;
  unit: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string;
  delivery_location: string;
  status: string;
  created_at: string;
  buyer_profile?: {
    company_name: string;
  };
}

// Helper function to get service fee rate based on trade type
const getServiceFeeRate = (tradeType: string | undefined) => {
  return tradeType === 'domestic_india' ? 0.005 : 0.01; // 0.5% for domestic, 1% for import/export
};

const getTradeTypeLabel = (tradeType: string) => {
  switch (tradeType) {
    case 'import': return 'Import';
    case 'export': return 'Export';
    case 'domestic_india': return 'Domestic India';
    default: return tradeType;
  }
};

interface LowestBid {
  requirement_id: string;
  lowest_total: number;
}

const bidSchema = z.object({
  bid_amount: z.coerce.number().min(1, 'Bid amount is required'),
  delivery_timeline_days: z.coerce.number().min(1, 'Delivery timeline is required'),
  terms_and_conditions: z.string().optional(),
});

type BidFormData = z.infer<typeof bidSchema>;

interface BrowseRequirementsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const BrowseRequirements = ({ open, onOpenChange, userId }: BrowseRequirementsProps) => {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [lowestBids, setLowestBids] = useState<Record<string, number>>({});
  const [myBids, setMyBids] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [subscription, setSubscription] = useState<{ bids_used_this_month: number; bids_limit: number; id: string } | null>(null);
  const { toast } = useToast();

  const BID_FEE = 500; // Rs.500 per bid after free limit
  const isPaidBid = subscription && subscription.bids_used_this_month >= subscription.bids_limit;

  const form = useForm<BidFormData>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      delivery_timeline_days: 7,
    },
  });

  const fetchRequirements = async () => {
    setLoading(true);
    
    // Fetch active requirements
    const { data: reqData, error: reqError } = await supabase
      .from('requirements')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (reqError) {
      toast({ title: 'Error', description: 'Failed to load requirements', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Fetch buyer profiles for the requirements
    if (reqData && reqData.length > 0) {
      const buyerIds = [...new Set(reqData.map(r => r.buyer_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, company_name')
        .in('id', buyerIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const reqsWithProfiles = reqData.map(req => ({
        ...req,
        buyer_profile: profilesMap.get(req.buyer_id) || undefined
      }));
      
      setRequirements(reqsWithProfiles as Requirement[]);
    } else {
      setRequirements([]);
    }

    // Fetch my existing bids
    const { data: myBidsData } = await supabase
      .from('bids')
      .select('requirement_id')
      .eq('supplier_id', userId);

    if (myBidsData) {
      setMyBids(new Set(myBidsData.map(b => b.requirement_id)));
    }

    // Fetch lowest bids for each requirement using secure RPC function
    if (reqData && reqData.length > 0) {
      const lowestByReq: Record<string, number> = {};
      
      for (const req of reqData) {
        const { data } = await supabase.rpc('get_lowest_bid_for_requirement', { req_id: req.id });
        if (data && data[0]?.lowest_bid_amount) {
          lowestByReq[req.id] = data[0].lowest_bid_amount;
        }
      }
      
      setLowestBids(lowestByReq);
    }

    setLoading(false);
  };

  const fetchSubscription = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('id, bids_used_this_month, bids_limit')
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
    if (!selectedRequirement || !subscription) return;

    setSubmitting(true);
    try {
      const feeRate = getServiceFeeRate(selectedRequirement.trade_type);
      const perUnitRate = data.bid_amount; // Supplier's per-unit bid
      const perUnitWithFee = perUnitRate * (1 + feeRate); // Per-unit rate + service fee (shown to buyer)
      const totalOrderValue = perUnitRate * selectedRequirement.quantity;
      const serviceFee = totalOrderValue * feeRate; // Service fee on total order value
      const totalAmount = totalOrderValue + serviceFee;
      const { error } = await supabase.from('bids').insert({
        requirement_id: selectedRequirement.id,
        supplier_id: userId,
        bid_amount: perUnitWithFee, // Store per-unit rate + fee
        service_fee: serviceFee,
        total_amount: totalAmount,
        delivery_timeline_days: data.delivery_timeline_days,
        terms_and_conditions: data.terms_and_conditions || null,
      });

      if (error) throw error;

      // Update subscription bid count
      await supabase
        .from('subscriptions')
        .update({ bids_used_this_month: subscription.bids_used_this_month + 1 })
        .eq('id', subscription.id);

      const bidCostMsg = isPaidBid ? ` (Bid fee: ₹${BID_FEE})` : '';
      toast({ title: 'Success', description: `Bid submitted successfully!${bidCostMsg}` });
      setSelectedRequirement(null);
      form.reset();
      fetchRequirements();
      fetchSubscription();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const bidAmount = form.watch('bid_amount');
  const quantity = selectedRequirement?.quantity || 0;
  const currentFeeRate = getServiceFeeRate(selectedRequirement?.trade_type);
  const feePercentage = currentFeeRate * 100;
  const totalOrderValue = bidAmount ? bidAmount * quantity : 0;
  const serviceFee = totalOrderValue * currentFeeRate;
  const totalAmount = totalOrderValue + serviceFee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Live Requirements</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : requirements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No active requirements at the moment.</p>
          </div>
        ) : selectedRequirement ? (
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={() => setSelectedRequirement(null)}>← Back to list</Button>
            
            <Card>
              <CardHeader>
                <CardTitle>{selectedRequirement.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge>{selectedRequirement.product_category}</Badge>
                  <Badge variant="outline">{getTradeTypeLabel(selectedRequirement.trade_type)}</Badge>
                  {selectedRequirement.buyer_profile && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {maskCompanyName(selectedRequirement.buyer_profile.company_name)}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>{selectedRequirement.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Quantity:</strong> {selectedRequirement.quantity} {selectedRequirement.unit}</div>
                  <div><strong>Budget:</strong> {selectedRequirement.budget_min && selectedRequirement.budget_max ? `₹${selectedRequirement.budget_min} - ₹${selectedRequirement.budget_max}` : 'Not specified'}</div>
                  <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Deadline: {format(new Date(selectedRequirement.deadline), 'PPP')}</div>
                  <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {selectedRequirement.delivery_location}</div>
                </div>
                
                {lowestBids[selectedRequirement.id] && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Current Lowest Bid: ₹{lowestBids[selectedRequirement.id].toLocaleString()}</p>
                  </div>
                )}

                {myBids.has(selectedRequirement.id) ? (
                  <div className="p-4 bg-primary/10 rounded-lg text-center">
                    <p className="font-medium">You have already submitted a bid for this requirement.</p>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitBid)} className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">Submit Your Bid</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="bid_amount" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Bid Amount (₹) *</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="delivery_timeline_days" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Timeline (days) *</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      
                      {bidAmount > 0 && (
                        <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                          <div className="flex justify-between"><span>Unit Price:</span><span>₹{bidAmount.toLocaleString()}</span></div>
                          <div className="flex justify-between"><span>Quantity:</span><span>{quantity} {selectedRequirement?.unit}</span></div>
                          <div className="flex justify-between border-t pt-1"><span>Order Value:</span><span>₹{totalOrderValue.toLocaleString()}</span></div>
                          <div className="flex justify-between text-muted-foreground"><span>Service Fee ({feePercentage}% of order):</span><span>₹{serviceFee.toLocaleString()}</span></div>
                          <div className="flex justify-between font-medium border-t pt-1"><span>Total to Buyer:</span><span>₹{totalAmount.toLocaleString()}</span></div>
                        </div>
                      )}

                      <FormField control={form.control} name="terms_and_conditions" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terms & Conditions (Optional)</FormLabel>
                          <FormControl><Textarea {...field} rows={2} placeholder="Any specific terms..." /></FormControl>
                        </FormItem>
                      )} />

                      {isPaidBid && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                          <strong>Paid Bid:</strong> You've used all {subscription?.bids_limit} free bids this month. 
                          This bid will cost ₹{BID_FEE}.
                        </div>
                      )}

                      <Button type="submit" disabled={submitting} className="w-full">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        {isPaidBid ? `Submit Bid (₹${BID_FEE})` : 'Submit Bid'}
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
                        <Badge variant="secondary">{req.product_category}</Badge>
                        <Badge variant="outline">{getTradeTypeLabel(req.trade_type)}</Badge>
                        {myBids.has(req.id) && <Badge variant="outline">Bid Submitted</Badge>}
                        {req.buyer_profile && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {maskCompanyName(req.buyer_profile.company_name)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{req.quantity} {req.unit}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{req.delivery_location}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(req.deadline), 'PP')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {lowestBids[req.id] && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Lowest: </span>
                          <span className="font-medium">₹{lowestBids[req.id].toLocaleString()}</span>
                        </p>
                      )}
                      <Button size="sm" className="mt-2">View & Bid</Button>
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
