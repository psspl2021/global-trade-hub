import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Truck, MapPin, Calendar, ArrowRight, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

interface LogisticsBid {
  id: string;
  requirement_id: string;
  bid_amount: number;
  service_fee: number;
  total_amount: number;
  estimated_transit_days: number;
  status: string;
  created_at: string;
  logistics_requirement: {
    title: string;
    material_type: string;
    quantity: number;
    unit: string;
    pickup_location: string;
    delivery_location: string;
    pickup_date: string;
    delivery_deadline: string;
    status: string;
  };
}

interface LowestBid {
  requirement_id: string;
  lowest_amount: number;
}

interface TransporterMyBidsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const SERVICE_FEE_RATE = 0.0025;

export const TransporterMyBids = ({ open, onOpenChange, userId }: TransporterMyBidsProps) => {
  const [bids, setBids] = useState<LogisticsBid[]>([]);
  const [lowestBids, setLowestBids] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingBid, setEditingBid] = useState<LogisticsBid | null>(null);
  const [newBidAmount, setNewBidAmount] = useState('');
  const [newTransitDays, setNewTransitDays] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchBids = async () => {
    setLoading(true);
    
    const { data, error } = await (supabase
      .from('logistics_bids') as any)
      .select(`
        *,
        logistics_requirement:logistics_requirements(
          title, material_type, quantity, unit, 
          pickup_location, delivery_location, pickup_date, delivery_deadline, status
        )
      `)
      .eq('transporter_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to load bids', variant: 'destructive' });
    } else {
      const bidsData = data as LogisticsBid[];
      setBids(bidsData || []);
      
      // Fetch lowest bids for each requirement
      if (bidsData && bidsData.length > 0) {
        const lowestByReq: Record<string, number> = {};
        const uniqueReqIds = [...new Set(bidsData.map(b => b.requirement_id))];
        
        for (const reqId of uniqueReqIds) {
          const { data: lowestData } = await (supabase.rpc as any)('get_lowest_logistics_bid', { req_id: reqId });
          if (lowestData && lowestData[0]?.lowest_bid_amount) {
            lowestByReq[reqId] = lowestData[0].lowest_bid_amount;
          }
        }
        setLowestBids(lowestByReq);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && userId) {
      fetchBids();
    }
  }, [open, userId]);

  const handleRebid = (bid: LogisticsBid) => {
    setEditingBid(bid);
    setNewBidAmount(bid.bid_amount.toString());
    setNewTransitDays(bid.estimated_transit_days.toString());
  };

  const submitRebid = async () => {
    if (!editingBid || !newBidAmount) return;

    setSubmitting(true);
    try {
      const bidAmount = parseFloat(newBidAmount);
      const transitDays = parseInt(newTransitDays) || editingBid.estimated_transit_days;
      const serviceFee = bidAmount * SERVICE_FEE_RATE;
      const totalAmount = bidAmount + serviceFee;

      const { error } = await (supabase
        .from('logistics_bids') as any)
        .update({
          bid_amount: bidAmount,
          service_fee: serviceFee,
          total_amount: totalAmount,
          estimated_transit_days: transitDays,
        })
        .eq('id', editingBid.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Quote updated successfully!' });
      setEditingBid(null);
      fetchBids();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline">Pending</Badge>;
      case 'accepted': return <Badge className="bg-green-500">Accepted</Badge>;
      case 'rejected': return <Badge variant="destructive">Not Selected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            My Logistics Quotes
          </DialogTitle>
        </DialogHeader>

        {bids.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No quotes submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bids.map(bid => (
              <Card key={bid.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{bid.logistics_requirement?.title}</h4>
                        {getStatusBadge(bid.status)}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>{bid.logistics_requirement?.quantity} {bid.logistics_requirement?.unit}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {bid.logistics_requirement?.pickup_location} 
                          <ArrowRight className="h-3 w-3" /> 
                          {bid.logistics_requirement?.delivery_location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {bid.logistics_requirement?.pickup_date && format(new Date(bid.logistics_requirement.pickup_date), 'PP')}
                        </span>
                      </div>

                      <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Your Quote:</span>
                          <span>₹{bid.bid_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Platform Fee (0.25%):</span>
                          <span>₹{bid.service_fee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-1">
                          <span>Total to Customer:</span>
                          <span>₹{bid.total_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transit Time:</span>
                          <span>{bid.estimated_transit_days} days</span>
                        </div>
                      </div>

                      {bid.status === 'pending' && lowestBids[bid.requirement_id] && (
                        <div className="text-sm">
                          {bid.total_amount === lowestBids[bid.requirement_id] ? (
                            <Badge className="bg-primary">You have the lowest quote!</Badge>
                          ) : (
                            <span className="text-muted-foreground">
                              Lowest quote: ₹{lowestBids[bid.requirement_id].toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {bid.status === 'pending' && bid.logistics_requirement?.status === 'active' && (
                      <Button variant="outline" size="sm" onClick={() => handleRebid(bid)}>
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Bid Dialog */}
        <Dialog open={!!editingBid} onOpenChange={() => setEditingBid(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Quote</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">New Quote Amount (₹)</label>
                <Input
                  type="number"
                  value={newBidAmount}
                  onChange={(e) => setNewBidAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Transit Days</label>
                <Input
                  type="number"
                  value={newTransitDays}
                  onChange={(e) => setNewTransitDays(e.target.value)}
                />
              </div>
              
              {newBidAmount && (
                <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>New Quote:</span>
                    <span>₹{parseFloat(newBidAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Platform Fee (0.25%):</span>
                    <span>₹{(parseFloat(newBidAmount) * SERVICE_FEE_RATE).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total to Customer:</span>
                    <span>₹{(parseFloat(newBidAmount) * (1 + SERVICE_FEE_RATE)).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingBid(null)}>Cancel</Button>
                <Button onClick={submitRebid} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Update Quote
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
