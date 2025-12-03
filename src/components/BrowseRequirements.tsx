import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Calendar, MapPin, IndianRupee, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

interface Requirement {
  id: string;
  title: string;
  description: string;
  product_category: string;
  quantity: number;
  unit: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string;
  delivery_location: string;
  status: string;
  created_at: string;
}

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
  const { toast } = useToast();

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

    setRequirements(reqData || []);

    // Fetch my existing bids
    const { data: myBidsData } = await supabase
      .from('bids')
      .select('requirement_id')
      .eq('supplier_id', userId);

    if (myBidsData) {
      setMyBids(new Set(myBidsData.map(b => b.requirement_id)));
    }

    // Fetch lowest bids for each requirement (sealed - only show lowest total)
    if (reqData && reqData.length > 0) {
      const { data: bidsData } = await supabase
        .from('bids')
        .select('requirement_id, total_amount')
        .in('requirement_id', reqData.map(r => r.id));

      if (bidsData) {
        const lowestByReq: Record<string, number> = {};
        bidsData.forEach(bid => {
          if (!lowestByReq[bid.requirement_id] || bid.total_amount < lowestByReq[bid.requirement_id]) {
            lowestByReq[bid.requirement_id] = bid.total_amount;
          }
        });
        setLowestBids(lowestByReq);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (open && userId) {
      fetchRequirements();
    }
  }, [open, userId]);

  const onSubmitBid = async (data: BidFormData) => {
    if (!selectedRequirement) return;

    setSubmitting(true);
    try {
      const serviceFee = data.bid_amount * 0.01; // 1% service fee
      const totalAmount = data.bid_amount + serviceFee;

      const { error } = await supabase.from('bids').insert({
        requirement_id: selectedRequirement.id,
        supplier_id: userId,
        bid_amount: data.bid_amount,
        service_fee: serviceFee,
        total_amount: totalAmount,
        delivery_timeline_days: data.delivery_timeline_days,
        terms_and_conditions: data.terms_and_conditions || null,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Bid submitted successfully!' });
      setSelectedRequirement(null);
      form.reset();
      fetchRequirements();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const bidAmount = form.watch('bid_amount');
  const serviceFee = bidAmount ? bidAmount * 0.01 : 0;
  const totalAmount = bidAmount ? bidAmount + serviceFee : 0;

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
                <Badge>{selectedRequirement.product_category}</Badge>
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
                          <div className="flex justify-between"><span>Your Bid:</span><span>₹{bidAmount.toLocaleString()}</span></div>
                          <div className="flex justify-between text-muted-foreground"><span>Service Fee (1%):</span><span>₹{serviceFee.toLocaleString()}</span></div>
                          <div className="flex justify-between font-medium border-t pt-1"><span>Total to Buyer:</span><span>₹{totalAmount.toLocaleString()}</span></div>
                        </div>
                      )}

                      <FormField control={form.control} name="terms_and_conditions" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terms & Conditions (Optional)</FormLabel>
                          <FormControl><Textarea {...field} rows={2} placeholder="Any specific terms..." /></FormControl>
                        </FormItem>
                      )} />

                      <Button type="submit" disabled={submitting} className="w-full">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        Submit Bid
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
                      <div className="flex gap-2">
                        <Badge variant="secondary">{req.product_category}</Badge>
                        {myBids.has(req.id) && <Badge variant="outline">Bid Submitted</Badge>}
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
