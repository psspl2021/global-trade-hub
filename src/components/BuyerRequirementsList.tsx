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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Eye, Calendar, MapPin, Package, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { EditRequirementForm } from './EditRequirementForm';

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

interface RequirementItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  category: string;
  description?: string;
}

interface BidItem {
  id: string;
  requirement_item_id: string;
  unit_price: number;
  quantity: number;
  total: number;
}

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
  bid_items?: BidItem[];
}

const getTradeTypeLabel = (tradeType: string) => {
  switch (tradeType) {
    case 'import': return 'Import';
    case 'export': return 'Export';
    case 'domestic_india': return 'Domestic India';
    default: return tradeType;
  }
};

interface BuyerRequirementsListProps {
  userId: string;
}

export function BuyerRequirementsList({ userId }: BuyerRequirementsListProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [requirementItems, setRequirementItems] = useState<RequirementItem[]>([]);

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
      // Fetch requirement items
      const { data: itemsData, error: itemsError } = await supabase
        .from('requirement_items')
        .select('id, item_name, quantity, unit, category, description')
        .eq('requirement_id', requirementId);

      if (itemsError) throw itemsError;
      setRequirementItems((itemsData || []) as RequirementItem[]);

      // Fetch the lowest bid with bid_items
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select(`
          id,
          bid_amount,
          service_fee,
          total_amount,
          delivery_timeline_days,
          status,
          terms_and_conditions,
          created_at,
          supplier_id,
          bid_items (
            id,
            requirement_item_id,
            unit_price,
            quantity,
            total
          )
        `)
        .eq('requirement_id', requirementId)
        .order('bid_amount', { ascending: true })
        .limit(1);

      if (bidsError) throw bidsError;
      setBids((bidsData || []) as Bid[]);
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
      const { error: bidError } = await supabase
        .from('bids')
        .update({ status: 'accepted' })
        .eq('id', bidId);

      if (bidError) throw bidError;

      const { error: reqError } = await supabase
        .from('requirements')
        .update({ status: 'awarded' })
        .eq('id', selectedRequirement?.id);

      if (reqError) throw reqError;

      await supabase
        .from('bids')
        .update({ status: 'rejected' })
        .eq('requirement_id', selectedRequirement?.id)
        .neq('id', bidId)
        .eq('status', 'pending');

      toast.success('Order completed successfully! Thank you for doing business with ProcureSaathi.', {
        duration: 5000,
        description: 'The supplier has been notified and will contact you shortly.',
      });
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

  const getItemName = (requirementItemId: string) => {
    const item = requirementItems.find(i => i.id === requirementItemId);
    return item?.item_name || 'Unknown Item';
  };

  const getItemUnit = (requirementItemId: string) => {
    const item = requirementItems.find(i => i.id === requirementItemId);
    return item?.unit || 'units';
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
                    <div className="flex gap-2">
                      {req.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingRequirement(req)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bids Dialog */}
      <Dialog open={!!selectedRequirement} onOpenChange={() => setSelectedRequirement(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
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
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">ProcureSaathi Solutions Pvt Ltd</span>
                        {bid.status === 'accepted' && (
                          <Badge className="bg-primary/20 text-primary">Accepted</Badge>
                        )}
                        {bid.status === 'rejected' && (
                          <Badge variant="secondary">Rejected</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Delivery: <span className="font-medium text-foreground">{bid.delivery_timeline_days} days</span>
                      </div>
                    </div>

                    {/* Bid Items Table */}
                    {bid.bid_items && bid.bid_items.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Item Breakdown
                        </h4>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="font-medium">Item</TableHead>
                                <TableHead className="text-right font-medium">Qty</TableHead>
                                <TableHead className="text-right font-medium">Rate</TableHead>
                                <TableHead className="text-right font-medium">Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {bid.bid_items.map((item) => {
                                // Calculate service fee inclusive prices (0.5% for domestic, 1% for import/export)
                                const feeRate = selectedRequirement?.trade_type === 'domestic_india' ? 0.005 : 0.01;
                                const inclusiveRate = item.unit_price * (1 + feeRate);
                                const inclusiveTotal = item.total * (1 + feeRate);
                                
                                return (
                                  <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                      {getItemName(item.requirement_item_id)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {item.quantity} {getItemUnit(item.requirement_item_id)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      ₹{inclusiveRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      ₹{inclusiveTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Total Amount Only */}
                        <div className="bg-muted/30 rounded-lg p-4">
                          <div className="flex justify-between font-semibold">
                            <span>Total Amount</span>
                            <span className="text-primary">₹{bid.total_amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Fallback for bids without itemized breakdown
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex justify-between font-semibold">
                          <span>Total Amount</span>
                          <span className="text-primary">₹{bid.total_amount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {bid.terms_and_conditions && (
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Terms:</span>
                        <p className="mt-1 text-foreground">{bid.terms_and_conditions}</p>
                      </div>
                    )}

                    {bid.status === 'pending' && selectedRequirement?.status === 'active' && (
                      <div className="flex justify-end">
                        <Button onClick={() => handleAcceptBid(bid.id)}>
                          Accept Bid
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Requirement Dialog */}
      {editingRequirement && (
        <EditRequirementForm
          open={!!editingRequirement}
          onOpenChange={(open) => !open && setEditingRequirement(null)}
          requirement={editingRequirement}
          onSuccess={() => {
            setEditingRequirement(null);
            fetchRequirements();
          }}
        />
      )}
    </>
  );
}