import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Eye, Calendar, MapPin, Package } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

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
  status: 'active' | 'closed' | 'awarded';
  created_at: string;
}

const getTradeTypeLabel = (tradeType: string) => {
  switch (tradeType) {
    case 'import': return 'Import';
    case 'export': return 'Export';
    case 'domestic_india': return 'Domestic India';
    default: return tradeType;
  }
};

interface Bid {
  id: string;
  bid_amount: number;
  service_fee: number;
  total_amount: number;
  delivery_timeline_days: number;
  status: 'pending' | 'accepted' | 'rejected';
  terms_and_conditions: string | null;
  created_at: string;
  supplier_id: string;
  profiles?: {
    company_name: string;
    contact_person: string;
  };
}

interface BuyerRequirementsListProps {
  userId: string;
}

export function BuyerRequirementsList({ userId }: BuyerRequirementsListProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);

  useEffect(() => {
    fetchRequirements();
  }, [userId]);

  const fetchRequirements = async () => {
    try {
      const { data, error } = await supabase
        .from('requirements')
        .select('*')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequirements((data || []) as Requirement[]);
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error fetching requirements:', error);
      toast.error('Failed to load requirements');
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async (requirementId: string) => {
    setBidsLoading(true);
    try {
      // Only fetch the lowest bid (sorted by bid_amount ascending, limit 1)
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('*')
        .eq('requirement_id', requirementId)
        .order('bid_amount', { ascending: true })
        .limit(1);

      if (bidsError) throw bidsError;

      // No need to fetch supplier profiles since we show "ProcureSaathi Solutions Pvt Ltd"
      setBids(bidsData || []);
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error fetching bids:', error);
      toast.error('Failed to load bids');
    } finally {
      setBidsLoading(false);
    }
  };

  const handleViewBids = (requirement: Requirement) => {
    setSelectedRequirement(requirement);
    fetchBids(requirement.id);
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      // Update bid status to accepted
      const { error: bidError } = await supabase
        .from('bids')
        .update({ status: 'accepted' })
        .eq('id', bidId);

      if (bidError) throw bidError;

      // Update requirement status to awarded
      const { error: reqError } = await supabase
        .from('requirements')
        .update({ status: 'awarded' })
        .eq('id', selectedRequirement?.id);

      if (reqError) throw reqError;

      // Reject other pending bids
      await supabase
        .from('bids')
        .update({ status: 'rejected' })
        .eq('requirement_id', selectedRequirement?.id)
        .neq('id', bidId)
        .eq('status', 'pending');

      toast.success('Bid accepted successfully!');
      fetchRequirements();
      if (selectedRequirement) {
        fetchBids(selectedRequirement.id);
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error accepting bid:', error);
      toast.error('Failed to accept bid');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/20 text-success border-success/30">Active</Badge>;
      case 'awarded':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Awarded</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          {requirements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No requirements posted yet. Create your first requirement to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {requirements.map((req) => (
                <div
                  key={req.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium truncate">{req.title}</h4>
                        {getStatusBadge(req.status)}
                        {req.trade_type && (
                          <Badge variant="outline">{getTradeTypeLabel(req.trade_type)}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {req.quantity} {req.unit}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {req.delivery_location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(req.deadline), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewBids(req)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Bids
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bids Dialog */}
      <Dialog open={!!selectedRequirement} onOpenChange={() => setSelectedRequirement(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bids for: {selectedRequirement?.title}</DialogTitle>
          </DialogHeader>

          {bidsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : bids.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bids received yet for this requirement.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Showing lowest bid only</p>
              {bids.map((bid) => (
                <Card key={bid.id} className="border-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">
                            ProcureSaathi Solutions Pvt Ltd
                          </span>
                          {bid.status === 'accepted' && (
                            <Badge className="bg-primary/20 text-primary">Accepted</Badge>
                          )}
                          {bid.status === 'rejected' && (
                            <Badge variant="secondary">Rejected</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Price per Unit:</span>
                            <span className="ml-2 font-bold text-primary">₹{bid.bid_amount.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Delivery:</span>
                            <span className="ml-2">{bid.delivery_timeline_days} days</span>
                          </div>
                        </div>
                        {bid.terms_and_conditions && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <span className="font-medium">Terms:</span> {bid.terms_and_conditions}
                          </p>
                        )}
                      </div>
                      {bid.status === 'pending' && selectedRequirement?.status === 'active' && (
                        <Button size="sm" onClick={() => handleAcceptBid(bid.id)}>
                          Accept Bid
                        </Button>
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
}
