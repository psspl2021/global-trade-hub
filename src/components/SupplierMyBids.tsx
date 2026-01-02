import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingDown, TrendingUp, Edit2, Check, X, Truck } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Bid {
  id: string;
  bid_amount: number;
  supplier_net_price?: number; // New field - what supplier sees
  buyer_visible_price?: number; // New field - hidden from supplier
  service_fee: number;
  total_amount: number;
  delivery_timeline_days: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  requirement_id: string;
  dispatched_qty?: number | null;
  requirement: {
    id: string;
    title: string;
    product_category: string;
    trade_type: 'import' | 'export' | 'domestic_india';
    quantity: number;
    unit: string;
    delivery_location: string;
    deadline: string;
  };
}

// Helper function to get markup rate based on trade type
// Supplier sees their net price - no fee is deducted from them
const getMarkupRate = (tradeType: string | undefined) => {
  return tradeType === 'domestic_india' ? 0.005 : 0.025; // 0.5% domestic, 2.5% cross-border
};

// Legacy function alias
const getServiceFeeRate = (tradeType: string | undefined) => getMarkupRate(tradeType);

interface LowestBid {
  requirement_id: string;
  lowest_bid_amount: number;
}

interface SupplierMyBidsProps {
  userId: string;
}

export const SupplierMyBids = ({ userId }: SupplierMyBidsProps) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [lowestBids, setLowestBids] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [rebidAmount, setRebidAmount] = useState('');
  const [rebidDelivery, setRebidDelivery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dispatchedQty, setDispatchedQty] = useState<Record<string, string>>({});
  const [savingDispatch, setSavingDispatch] = useState<string | null>(null);

  const fetchBids = async () => {
    setLoading(true);
    try {
      // Fetch supplier's bids with requirement details - only fetch supplier_net_price (not markup/buyer price)
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select(`
          id,
          bid_amount,
          supplier_net_price,
          service_fee,
          total_amount,
          delivery_timeline_days,
          status,
          created_at,
          requirement_id,
          dispatched_qty,
          requirements (
            id,
            title,
            product_category,
            trade_type,
            quantity,
            unit,
            delivery_location,
            deadline
          )
        `)
        .eq('supplier_id', userId)
        .order('created_at', { ascending: false });

      if (bidsError) throw bidsError;

      const formattedBids = bidsData?.map((bid: any) => ({
        ...bid,
        requirement: bid.requirements,
      })) || [];

      setBids(formattedBids);

      // Fetch lowest bids for each requirement using secure RPC function
      const requirementIds = [...new Set(formattedBids.map(b => b.requirement_id))];
      
      if (requirementIds.length > 0) {
        const lowestBidsMap: Record<string, number> = {};
        
        for (const reqId of requirementIds) {
          const { data } = await supabase.rpc('get_lowest_bid_for_requirement', { req_id: reqId });
          if (data && data[0]?.lowest_bid_amount) {
            lowestBidsMap[reqId] = data[0].lowest_bid_amount;
          }
        }
        
        setLowestBids(lowestBidsMap);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching bids:', error);
      toast.error('Failed to load your bids');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchBids();
    }
  }, [userId]);

  const calculateBreakdown = (bid: Bid) => {
    // Supplier sees only their net price - no markup/fee visibility
    // Use supplier_net_price if available, otherwise fallback to legacy calculation
    const quantity = bid.requirement?.quantity || 1;
    
    // supplier_net_price is the total amount the supplier quoted
    const supplierNetPrice = bid.supplier_net_price || bid.total_amount;
    const perUnitRate = supplierNetPrice / quantity;
    
    return {
      perUnitRate,
      quantity,
      totalOrderValue: supplierNetPrice,
      grandTotal: supplierNetPrice, // Supplier sees their net price as grand total
    };
  };

  const handleRebid = (bid: Bid) => {
    const breakdown = calculateBreakdown(bid);
    setEditingBid(bid);
    setRebidAmount(breakdown.perUnitRate.toFixed(2));
    setRebidDelivery(bid.delivery_timeline_days.toString());
  };

  const submitRebid = async () => {
    if (!editingBid) return;
    
    const newPerUnitRate = parseFloat(rebidAmount);
    if (isNaN(newPerUnitRate) || newPerUnitRate <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    const newDelivery = parseInt(rebidDelivery);
    if (isNaN(newDelivery) || newDelivery <= 0) {
      toast.error('Please enter a valid delivery timeline');
      return;
    }

    setSubmitting(true);
    try {
      const quantity = editingBid.requirement?.quantity || 1;
      const markupRate = getMarkupRate(editingBid.requirement?.trade_type);
      const markupPercentage = markupRate * 100;
      
      // supplier_net_price = per unit rate * quantity (supplier's total quote)
      const supplierNetPrice = newPerUnitRate * quantity;
      
      // Calculate markup for buyer-visible price
      const markupAmount = supplierNetPrice * markupRate;
      const buyerVisiblePrice = supplierNetPrice + markupAmount;
      
      // bid_amount = buyer-visible per-unit rate for L1 comparison
      const bidAmountPerUnit = newPerUnitRate * (1 + markupRate);

      const { error } = await supabase
        .from('bids')
        .update({
          bid_amount: bidAmountPerUnit,
          supplier_net_price: supplierNetPrice,
          buyer_visible_price: buyerVisiblePrice,
          markup_percentage: markupPercentage,
          markup_amount: markupAmount,
          service_fee: 0, // No fee deducted from supplier
          total_amount: buyerVisiblePrice,
          delivery_timeline_days: newDelivery,
        })
        .eq('id', editingBid.id)
        .eq('supplier_id', userId);

      if (error) throw error;

      toast.success('Bid updated successfully!');
      setEditingBid(null);
      fetchBids();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating bid:', error);
      toast.error('Failed to update bid');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispatchedQtyChange = (bidId: string, value: string) => {
    setDispatchedQty(prev => ({ ...prev, [bidId]: value }));
  };

  const saveDispatchedQty = async (bidId: string) => {
    const qty = parseFloat(dispatchedQty[bidId] || '');
    if (isNaN(qty) || qty < 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setSavingDispatch(bidId);
    try {
      const { error } = await supabase
        .from('bids')
        .update({ dispatched_qty: qty })
        .eq('id', bidId)
        .eq('supplier_id', userId);

      if (error) throw error;

      toast.success('Dispatched quantity saved!');
      fetchBids();
    } catch (error) {
      console.error('Error saving dispatched qty:', error);
      toast.error('Failed to save dispatched quantity');
    } finally {
      setSavingDispatch(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="py-8 text-center text-muted-foreground">
          You haven't submitted any bids yet. Browse requirements to start bidding!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">My Bids</h2>
      <div className="grid gap-4">
        {bids.map((bid) => {
          const breakdown = calculateBreakdown(bid);
          const lowestBid = lowestBids[bid.requirement_id];
          const isLowest = lowestBid && bid.bid_amount <= lowestBid;
          const difference = lowestBid ? bid.bid_amount - lowestBid : 0;

          return (
            <Card key={bid.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{bid.requirement?.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {bid.requirement?.product_category} • {bid.requirement?.quantity} {bid.requirement?.unit}
                    </p>
                  </div>
                  {getStatusBadge(bid.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bid Breakdown - Supplier sees only their quoted price, no fees/markup shown */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-sm">Your Bid Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Your Per-Unit Rate:</span>
                      <p className="font-medium">₹{breakdown.perUnitRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <p className="font-medium">{breakdown.quantity} {bid.requirement?.unit}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Order Value:</span>
                      <p className="font-bold text-primary">₹{breakdown.totalOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Delivery Timeline:</span>
                      <p className="font-medium">{bid.delivery_timeline_days} days</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                    <p>Platform fee: ₹0 (No deductions from your quoted price)</p>
                  </div>
                </div>

                {/* Lowest Bid Comparison - Only for pending bids */}
                {bid.status === 'pending' && lowestBid && (
                  <div className={`rounded-lg p-4 ${isLowest ? 'bg-green-500/10 border border-green-500/30' : 'bg-orange-500/10 border border-orange-500/30'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isLowest ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-600">You have the lowest bid!</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          <span className="font-semibold text-orange-600">Lower bid exists</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Current Lowest Bid:</span>
                      <span className="ml-2 font-bold">₹{lowestBid.toLocaleString(undefined, { maximumFractionDigits: 2 })} per {bid.requirement?.unit}</span>
                      {!isLowest && (
                        <p className="text-orange-600 mt-1">
                          Your bid is ₹{difference.toLocaleString(undefined, { maximumFractionDigits: 2 })} higher
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Re-bid Button for pending bids */}
                {bid.status === 'pending' && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleRebid(bid)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Update Bid
                  </Button>
                )}

                {/* Status Messages */}
                {bid.status === 'accepted' && (
                  <div className="space-y-4">
                    <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-600">Congratulations! Your bid was accepted.</span>
                      </div>
                    </div>
                    
                    {/* Dispatched Quantity Input */}
                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Truck className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-600">Dispatch Details</span>
                      </div>
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <Label htmlFor={`dispatch-${bid.id}`} className="text-sm text-muted-foreground">
                            Dispatched Quantity ({bid.requirement?.unit})
                          </Label>
                          <Input
                            id={`dispatch-${bid.id}`}
                            type="number"
                            placeholder={`Ordered: ${bid.requirement?.quantity}`}
                            value={dispatchedQty[bid.id] ?? (bid.dispatched_qty?.toString() || '')}
                            onChange={(e) => handleDispatchedQtyChange(bid.id, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => saveDispatchedQty(bid.id)}
                          disabled={savingDispatch === bid.id}
                        >
                          {savingDispatch === bid.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Save'
                          )}
                        </Button>
                      </div>
                      {bid.dispatched_qty && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Last saved: {bid.dispatched_qty} {bid.requirement?.unit}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {bid.status === 'rejected' && (
                  <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                    <div className="flex items-center gap-2">
                      <X className="h-5 w-5 text-red-600" />
                      <span className="font-semibold text-red-600">This bid was not selected.</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Re-bid Dialog */}
      <Dialog open={!!editingBid} onOpenChange={() => setEditingBid(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Your Bid</DialogTitle>
          </DialogHeader>
          {editingBid && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p><strong>Requirement:</strong> {editingBid.requirement?.title}</p>
                <p><strong>Quantity:</strong> {editingBid.requirement?.quantity} {editingBid.requirement?.unit}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rebid-amount">Your Per-Unit Rate (₹)</Label>
                <Input
                  id="rebid-amount"
                  type="number"
                  value={rebidAmount}
                  onChange={(e) => setRebidAmount(e.target.value)}
                  placeholder="Enter per-unit rate"
                />
                {rebidAmount && editingBid && (
                  <p className="text-sm text-muted-foreground">
                    Total Order Value: ₹{(parseFloat(rebidAmount) * (editingBid.requirement?.quantity || 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    <span className="ml-1 text-xs">(No platform fee deducted from your quote)</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rebid-delivery">Delivery Timeline (days)</Label>
                <Input
                  id="rebid-delivery"
                  type="number"
                  value={rebidDelivery}
                  onChange={(e) => setRebidDelivery(e.target.value)}
                  placeholder="Enter delivery days"
                />
              </div>

              {/* Live Preview */}
              {rebidAmount && editingBid && (() => {
                const rate = parseFloat(rebidAmount);
                const quantity = editingBid.requirement?.quantity || 1;
                const totalOrderValue = rate * quantity;
                return (
                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <h4 className="font-semibold mb-2">New Bid Preview</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Your Rate:</span>
                      <p className="font-medium">₹{rate.toLocaleString()} per {editingBid.requirement?.unit}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <p className="font-medium">{quantity} {editingBid.requirement?.unit}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Total Order Value:</span>
                      <p className="font-bold text-primary">₹{totalOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="col-span-2 text-xs text-muted-foreground">
                      Platform fee: ₹0 (No deductions from your quote)
                    </div>
                  </div>
                </div>
              );
              })()}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setEditingBid(null)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={submitRebid}
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Bid
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
