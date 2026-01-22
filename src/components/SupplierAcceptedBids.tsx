import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Calendar, MapPin, Package, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DispatchQuantityModal } from './DispatchQuantityModal';

interface AcceptedBid {
  id: string;
  bid_amount: number;
  supplier_net_price: number | null;
  service_fee: number;
  total_amount: number;
  delivery_timeline_days: number;
  created_at: string;
  dispatched_qty?: number | null;
  requirements: {
    id: string;
    title: string;
    quantity: number;
    unit: string;
    delivery_location: string;
    deadline: string;
    product_category: string;
    status: string;
  };
}

interface SupplierAcceptedBidsProps {
  userId: string;
}

export function SupplierAcceptedBids({ userId }: SupplierAcceptedBidsProps) {
  const [acceptedBids, setAcceptedBids] = useState<AcceptedBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [dispatchModalData, setDispatchModalData] = useState<{
    bidId: string;
    requirementId: string;
    requirementTitle: string;
    totalQuantity: number;
    unit: string;
    currentDispatchedQty?: number | null;
  } | null>(null);

  useEffect(() => {
    fetchAcceptedBids();
  }, [userId]);

  const fetchAcceptedBids = async () => {
    try {
      /**
       * SECURITY: Accepted bids query - Hard masked architecture
       * --------------------------------------------------------
       * - Filtered by supplier_id AND status='accepted'
       * - Does NOT expose buyer contact info
       * - Buyer identity remains confidential even after award
       * - ProcureSaathi manages all communication
       */
      const { data, error } = await supabase
        .from('bids')
        .select(`
          id,
          bid_amount,
          supplier_net_price,
          service_fee,
          total_amount,
          delivery_timeline_days,
          created_at,
          dispatched_qty,
          requirements (
            id,
            title,
            quantity,
            unit,
            delivery_location,
            deadline,
            product_category,
            status
          )
        `)
        .eq('supplier_id', userId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAcceptedBids(data || []);
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error fetching accepted bids:', error);
      toast.error('Failed to load accepted bids');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Accepted Bids
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pagination
  const totalItems = acceptedBids.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedBids = acceptedBids.slice(startIndex, endIndex);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-success" />
          Accepted Bids ({acceptedBids.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {acceptedBids.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No accepted bids yet. Keep bidding on requirements!
          </p>
        ) : (
          <div className="space-y-4">
            {paginatedBids.map((bid) => (
              <div
                key={bid.id}
                className="p-4 border rounded-lg bg-success/5 border-success/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-medium">{bid.requirements?.title}</h4>
                      <Badge className="bg-success/20 text-success border-success/30">
                        Accepted
                      </Badge>
                      {bid.requirements?.status === 'closed' && (
                        <Badge variant="secondary">Closed</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {bid.requirements?.quantity} {bid.requirements?.unit}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {bid.requirements?.delivery_location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Deadline: {bid.requirements?.deadline ? format(new Date(bid.requirements.deadline), 'MMM d, yyyy') : 'N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Your Rate:</span>
                        <span className="ml-2 font-medium">
                          ₹{((bid.supplier_net_price || bid.bid_amount) / (bid.requirements?.quantity || 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}/{bid.requirements?.unit || 'unit'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Value:</span>
                        <span className="ml-2 font-bold text-primary">
                          ₹{(bid.supplier_net_price || bid.bid_amount).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Delivery:</span>
                        <span className="ml-2">{bid.delivery_timeline_days} days</span>
                      </div>
                    </div>

                    {/* Dispatch section */}
                    {bid.requirements?.status === 'awarded' && (
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-success/20">
                        <div className="text-sm">
                          {bid.dispatched_qty ? (
                            <div className="space-y-1">
                              <span className="text-success flex items-center gap-1">
                                <Truck className="h-4 w-4" />
                                Dispatched: {bid.dispatched_qty.toLocaleString('en-IN')} {bid.requirements.unit}
                              </span>
                              <span className="text-muted-foreground block ml-5">
                                Your Earnings: ₹{(((bid.supplier_net_price || bid.bid_amount) / bid.requirements.quantity) * bid.dispatched_qty).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not yet dispatched</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDispatchModalData({
                            bidId: bid.id,
                            requirementId: bid.requirements.id,
                            requirementTitle: bid.requirements.title,
                            totalQuantity: bid.requirements.quantity,
                            unit: bid.requirements.unit,
                            currentDispatchedQty: bid.dispatched_qty,
                          })}
                        >
                          <Truck className="h-4 w-4 mr-1" />
                          {bid.dispatched_qty ? 'Update Dispatch' : 'Record Dispatch'}
                        </Button>
                      </div>
                    )}

                    {/* Closed dispatch info */}
                    {bid.requirements?.status === 'closed' && bid.dispatched_qty && (
                      <div className="pt-3 mt-3 border-t border-success/20">
                        <div className="space-y-1">
                          <span className="text-sm text-success flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Completed: {bid.dispatched_qty.toLocaleString('en-IN')} {bid.requirements.unit} dispatched
                          </span>
                          <span className="text-sm text-muted-foreground ml-5">
                            Your Earnings: ₹{(((bid.supplier_net_price || bid.bid_amount) / bid.requirements.quantity) * bid.dispatched_qty).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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

      {/* Dispatch Quantity Modal */}
      {dispatchModalData && (
        <DispatchQuantityModal
          open={!!dispatchModalData}
          onOpenChange={(open) => !open && setDispatchModalData(null)}
          bidId={dispatchModalData.bidId}
          requirementId={dispatchModalData.requirementId}
          requirementTitle={dispatchModalData.requirementTitle}
          totalQuantity={dispatchModalData.totalQuantity}
          unit={dispatchModalData.unit}
          currentDispatchedQty={dispatchModalData.currentDispatchedQty}
          onSuccess={fetchAcceptedBids}
        />
      )}
    </Card>
  );
}
