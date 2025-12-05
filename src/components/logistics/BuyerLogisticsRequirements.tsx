import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Calendar, Package, Truck, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

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

interface LogisticsBid {
  id: string;
  transporter_id: string;
  bid_amount: number;
  service_fee: number;
  total_amount: number;
  estimated_transit_days: number;
  terms_and_conditions: string | null;
  status: string;
  created_at: string;
}

interface BuyerLogisticsRequirementsProps {
  userId: string;
}

export const BuyerLogisticsRequirements = ({ userId }: BuyerLogisticsRequirementsProps) => {
  const [requirements, setRequirements] = useState<LogisticsRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequirement, setSelectedRequirement] = useState<LogisticsRequirement | null>(null);
  const [bids, setBids] = useState<LogisticsBid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const { toast } = useToast();

  const fetchRequirements = async () => {
    const { data, error } = await (supabase
      .from('logistics_requirements') as any)
      .select('*')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to load requirements', variant: 'destructive' });
    } else {
      setRequirements(data || []);
    }
    setLoading(false);
  };

  const fetchBids = async (requirementId: string) => {
    setBidsLoading(true);
    const { data, error } = await (supabase
      .from('logistics_bids') as any)
      .select('*')
      .eq('requirement_id', requirementId)
      .order('total_amount', { ascending: true });

    if (!error) {
      setBids(data || []);
    }
    setBidsLoading(false);
  };

  const handleViewBids = (requirement: LogisticsRequirement) => {
    setSelectedRequirement(requirement);
    fetchBids(requirement.id);
  };

  const handleAcceptBid = async (bidId: string) => {
    if (!selectedRequirement) return;

    try {
      // Accept the selected bid
      const { error: bidError } = await (supabase
        .from('logistics_bids') as any)
        .update({ status: 'accepted' })
        .eq('id', bidId);

      if (bidError) throw bidError;

      // Reject other pending bids
      await (supabase
        .from('logistics_bids') as any)
        .update({ status: 'rejected' })
        .eq('requirement_id', selectedRequirement.id)
        .eq('status', 'pending')
        .neq('id', bidId);

      // Close the requirement
      await (supabase
        .from('logistics_requirements') as any)
        .update({ status: 'closed' })
        .eq('id', selectedRequirement.id);

      toast({ title: 'Success', description: 'Bid accepted successfully!' });
      setSelectedRequirement(null);
      fetchRequirements();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [userId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500">Active</Badge>;
      case 'closed': return <Badge variant="secondary">Closed</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            My Logistics Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requirements.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No logistics requirements posted yet.
            </p>
          ) : (
            <div className="space-y-4">
              {requirements.map(req => (
                <Card key={req.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{req.title}</h4>
                          {getStatusBadge(req.status)}
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {req.quantity} {req.unit} • {req.material_type}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {req.pickup_location} → {req.delivery_location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(req.pickup_date), 'PP')}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleViewBids(req)}>
                        View Quotes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequirement} onOpenChange={() => setSelectedRequirement(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quotes for: {selectedRequirement?.title}</DialogTitle>
          </DialogHeader>

          {bidsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : bids.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No quotes received yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Showing lowest quote first. Platform charges 0.25% service fee from transporters.
              </p>
              {bids.map((bid, index) => (
                <Card key={bid.id} className={index === 0 ? 'border-primary' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        {index === 0 && (
                          <Badge className="bg-primary mb-1">Lowest Quote</Badge>
                        )}
                        <p className="text-2xl font-bold">₹{bid.total_amount.toLocaleString()}</p>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          <p>Transit Time: {bid.estimated_transit_days} days</p>
                          <p className="text-xs">Base: ₹{bid.bid_amount.toLocaleString()} + Fee: ₹{bid.service_fee.toLocaleString()}</p>
                        </div>
                        {bid.terms_and_conditions && (
                          <p className="text-xs text-muted-foreground mt-2">{bid.terms_and_conditions}</p>
                        )}
                      </div>
                      {selectedRequirement?.status === 'active' && bid.status === 'pending' && (
                        <Button onClick={() => handleAcceptBid(bid.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept Quote
                        </Button>
                      )}
                      {bid.status === 'accepted' && (
                        <Badge className="bg-green-500">Accepted</Badge>
                      )}
                      {bid.status === 'rejected' && (
                        <Badge variant="destructive">Not Selected</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
