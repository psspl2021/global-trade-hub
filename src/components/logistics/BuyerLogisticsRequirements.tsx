import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Calendar, Package, Truck, CheckCircle, Filter, ChevronLeft, ChevronRight, MoreVertical, XCircle, RotateCcw, Clock, Eye } from 'lucide-react';
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
  buyer_closure_status?: 'open' | 'closed';
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

// Canonical effective state resolver - matches DB function
type EffectiveState = 'active' | 'expired_soft' | 'closed' | 'awarded' | 'expired' | 'cancelled';

const getEffectiveState = (req: LogisticsRequirement): EffectiveState => {
  // Buyer explicitly closed → always closed
  if (req.buyer_closure_status === 'closed') {
    return 'closed';
  }
  // Awarded (status = 'closed' in old logic means awarded)
  if (req.status === 'closed') {
    return 'awarded';
  }
  // Expired but buyer still open → soft-expired (can re-open)
  if (req.status === 'expired' && req.buyer_closure_status === 'open') {
    return 'expired_soft';
  }
  // Active + buyer open → tradable
  if (req.status === 'active' && req.buyer_closure_status === 'open') {
    return 'active';
  }
  return req.status as EffectiveState;
};

interface BuyerLogisticsRequirementsProps {
  userId: string;
}

export const BuyerLogisticsRequirements = ({ userId }: BuyerLogisticsRequirementsProps) => {
  const [requirements, setRequirements] = useState<LogisticsRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequirement, setSelectedRequirement] = useState<LogisticsRequirement | null>(null);
  const [bids, setBids] = useState<LogisticsBid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const { toast } = useToast();

  // Re-open / Extend deadline modal state
  const [reopenDeadlineModal, setReopenDeadlineModal] = useState<{
    requirementId: string;
    action: 'reopen' | 'extend';
  } | null>(null);
  const [newDeadline, setNewDeadline] = useState('');

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

    // Check effective state before accepting
    const effectiveState = getEffectiveState(selectedRequirement);
    if (effectiveState !== 'active') {
      toast({ 
        title: 'Cannot Accept Quote', 
        description: effectiveState === 'expired_soft' 
          ? 'This requirement has expired. Please extend the deadline or re-open it first.'
          : 'This requirement is closed. Please re-open it first.',
        variant: 'destructive' 
      });
      return;
    }

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

      // Award the requirement (set status to closed, but NOT buyer_closure_status)
      await (supabase
        .from('logistics_requirements') as any)
        .update({ status: 'closed' })
        .eq('id', selectedRequirement.id);

      toast({ 
        title: 'Order Completed!', 
        description: 'Thank you for doing business with ProcureSaathi. The transporter has been notified and will contact you shortly.',
      });
      setSelectedRequirement(null);
      fetchRequirements();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Close requirement - sets buyer_closure_status to 'closed'
  const handleCloseRequirement = async (requirementId: string) => {
    try {
      const { error } = await (supabase
        .from('logistics_requirements') as any)
        .update({ buyer_closure_status: 'closed' })
        .eq('id', requirementId);

      if (error) throw error;
      
      toast({ title: 'Success', description: 'Load closed successfully' });
      fetchRequirements();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Re-open requirement - sets buyer_closure_status to 'open' and status to 'active'
  const handleReopenRequirement = async (requirementId: string, deadline: string) => {
    try {
      const { error } = await (supabase
        .from('logistics_requirements') as any)
        .update({
          buyer_closure_status: 'open',
          status: 'active',
          delivery_deadline: deadline,
        })
        .eq('id', requirementId);

      if (error) throw error;
      
      toast({ title: 'Success', description: 'Load re-opened successfully!' });
      fetchRequirements();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Extend deadline
  const handleExtendDeadline = async (requirementId: string, deadline: string) => {
    try {
      const { error } = await (supabase
        .from('logistics_requirements') as any)
        .update({
          delivery_deadline: deadline,
          status: 'active',
        })
        .eq('id', requirementId);

      if (error) throw error;
      
      toast({ title: 'Success', description: 'Deadline extended successfully!' });
      fetchRequirements();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [userId]);

  // Get effective state badge
  const getEffectiveStateBadge = (req: LogisticsRequirement) => {
    const effectiveState = getEffectiveState(req);
    
    switch (effectiveState) {
      case 'active':
        return <Badge className="bg-success/20 text-success border-success/30">🟢 Active</Badge>;
      case 'expired_soft':
        return <Badge className="bg-warning/20 text-warning border-warning/30">🟡 Expired — Extend or Close</Badge>;
      case 'closed':
        return <Badge className="bg-muted text-muted-foreground border-muted-foreground/30">⚫ Closed</Badge>;
      case 'awarded':
        return <Badge className="bg-primary/20 text-primary border-primary/30">🟣 Awarded</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{effectiveState}</Badge>;
    }
  };

  // Filter and paginate
  const filteredRequirements = requirements.filter(req => {
    if (statusFilter === 'all') return true;
    const effectiveState = getEffectiveState(req);
    if (statusFilter === 'awarded') return effectiveState === 'awarded';
    if (statusFilter === 'active') return effectiveState === 'active';
    if (statusFilter === 'expired') return effectiveState === 'expired_soft';
    if (statusFilter === 'closed') return effectiveState === 'closed';
    return req.status === statusFilter;
  });

  const totalItems = filteredRequirements.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedRequirements = filteredRequirements.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            My Logistics Requirements
          </CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-background">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="awarded">Awarded</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequirements.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {requirements.length === 0 
                ? 'No logistics requirements posted yet.'
                : 'No requirements match the selected filter.'}
            </p>
          ) : (
            <div className="space-y-4">
              {paginatedRequirements.map(req => (
                <Card key={req.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">{req.title}</h4>
                          {getEffectiveStateBadge(req)}
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
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewBids(req)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Quotes
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                            <DropdownMenuItem onClick={() => handleViewBids(req)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            
                            {/* Close - available when active */}
                            {getEffectiveState(req) === 'active' && (
                              <DropdownMenuItem 
                                onClick={() => handleCloseRequirement(req.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Close Load
                              </DropdownMenuItem>
                            )}
                            
                            {/* Re-open - available when expired_soft or closed */}
                            {(getEffectiveState(req) === 'expired_soft' || getEffectiveState(req) === 'closed') && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setReopenDeadlineModal({ requirementId: req.id, action: 'reopen' });
                                  setNewDeadline('');
                                }}
                                className="text-success focus:text-success"
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Re-open Load
                              </DropdownMenuItem>
                            )}
                            
                            {/* Extend Deadline - available when active or expired_soft */}
                            {(getEffectiveState(req) === 'active' || getEffectiveState(req) === 'expired_soft') && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setReopenDeadlineModal({ requirementId: req.id, action: 'extend' });
                                  setNewDeadline('');
                                }}
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                Extend Deadline
                              </DropdownMenuItem>
                            )}
                            
                            {/* Close Permanently - available when expired_soft */}
                            {getEffectiveState(req) === 'expired_soft' && (
                              <DropdownMenuItem 
                                onClick={() => handleCloseRequirement(req.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Close Permanently
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{endIndex} of {totalItems}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bids Dialog */}
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
                      {/* Accept quote only when load is active */}
                      {selectedRequirement && getEffectiveState(selectedRequirement) === 'active' && bid.status === 'pending' && (
                        <Button onClick={() => handleAcceptBid(bid.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept Quote
                        </Button>
                      )}
                      {/* Show message when expired_soft */}
                      {selectedRequirement && getEffectiveState(selectedRequirement) === 'expired_soft' && bid.status === 'pending' && (
                        <div className="text-right">
                          <p className="text-xs text-warning mb-1">Load expired</p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setReopenDeadlineModal({ requirementId: selectedRequirement.id, action: 'extend' });
                              setNewDeadline('');
                            }}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Extend to Accept
                          </Button>
                        </div>
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

      {/* Re-open / Extend Deadline Modal */}
      <Dialog 
        open={!!reopenDeadlineModal} 
        onOpenChange={(open) => !open && setReopenDeadlineModal(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {reopenDeadlineModal?.action === 'reopen' ? 'Re-open Load' : 'Extend Deadline'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-deadline">New Delivery Deadline</Label>
              <Input
                id="new-deadline"
                type="date"
                value={newDeadline}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {reopenDeadlineModal?.action === 'reopen' 
                  ? 'Select a new deadline to re-activate this load for bidding.'
                  : 'Extend the deadline to give transporters more time to quote.'}
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setReopenDeadlineModal(null)}
              >
                Cancel
              </Button>
              <Button
                disabled={!newDeadline}
                onClick={() => {
                  if (!reopenDeadlineModal || !newDeadline) return;
                  if (reopenDeadlineModal.action === 'reopen') {
                    handleReopenRequirement(reopenDeadlineModal.requirementId, newDeadline);
                  } else {
                    handleExtendDeadline(reopenDeadlineModal.requirementId, newDeadline);
                  }
                  setReopenDeadlineModal(null);
                }}
              >
                {reopenDeadlineModal?.action === 'reopen' ? 'Re-open Load' : 'Extend Deadline'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};