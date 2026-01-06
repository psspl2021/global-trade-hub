import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Trophy, Package, Pencil, Truck, CheckCircle } from 'lucide-react';
import { DispatchQuantityModal } from './DispatchQuantityModal';
import { toast } from 'sonner';

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
  bid_id: string;
  requirement_item_id: string;
  unit_price: number;
  quantity: number;
  total: number;
}

interface Bid {
  id: string;
  supplier_id: string;
  bid_amount: number;
  total_amount: number;
  status: string;
  dispatched_qty: number | null;
  terms_and_conditions: string | null;
  bid_items: BidItem[];
}

interface SupplierProfile {
  id: string;
  company_name: string;
  email: string;
}

interface L1ItemData {
  requirementItem: RequirementItem;
  lowestBidItem: BidItem | null;
  lowestBid: Bid | null;
  lowestSupplier: SupplierProfile | null;
  allBidItems: Array<{
    bidItem: BidItem;
    supplier: SupplierProfile | null;
    bid: Bid;
    isL1: boolean;
  }>;
}

interface LineItemL1ViewProps {
  requirementId: string;
  tradeType?: string;
  showAllSuppliers?: boolean; // For admin view
}

// Constants for buyer-facing display - always show ProcureSaathi as handler
const PLATFORM_SUPPLIER_NAME = 'ProcureSaathi Solutions Pvt Ltd';
const PLATFORM_LOGISTICS_HANDLER = 'ProcureSaathi Solutions Pvt. Ltd.';

export function LineItemL1View({ requirementId, tradeType, showAllSuppliers = false }: LineItemL1ViewProps) {
  const [loading, setLoading] = useState(true);
  const [l1Data, setL1Data] = useState<L1ItemData[]>([]);
  const [requirementDetails, setRequirementDetails] = useState<{
    title: string;
    quantity: number;
    unit: string;
  } | null>(null);
  
  // Dispatch modal state
  const [dispatchModalData, setDispatchModalData] = useState<{
    bidId: string;
    totalQuantity: number;
    unit: string;
    currentDispatchedQty: number | null;
  } | null>(null);
  
  // Edit state
  const [editingBidItem, setEditingBidItem] = useState<{
    bidItem: BidItem;
    supplier: SupplierProfile | null;
    bid: Bid;
    itemName: string;
    unit: string;
  } | null>(null);
  const [editForm, setEditForm] = useState({
    unit_price: 0,
    quantity: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchL1Data();
  }, [requirementId]);

  useEffect(() => {
    if (editingBidItem) {
      setEditForm({
        unit_price: editingBidItem.bidItem.unit_price,
        quantity: editingBidItem.bidItem.quantity,
      });
    }
  }, [editingBidItem]);

  const fetchL1Data = async () => {
    setLoading(true);
    try {
      // Fetch requirement items
      const { data: itemsData, error: itemsError } = await supabase
        .from('requirement_items')
        .select('id, item_name, quantity, unit, category, description')
        .eq('requirement_id', requirementId);

      if (itemsError) throw itemsError;

      let requirementItems = (itemsData || []) as RequirementItem[];

      // Fetch requirement details for fallback
      const { data: reqData } = await supabase
        .from('requirements')
        .select('title, quantity, unit, product_category')
        .eq('id', requirementId)
        .maybeSingle();

      // Store requirement details for dispatch modal
      if (reqData) {
        setRequirementDetails({
          title: reqData.title,
          quantity: reqData.quantity,
          unit: reqData.unit,
        });
      }

      // If no requirement items, create a virtual one from the requirement
      if (requirementItems.length === 0 && reqData) {
        requirementItems = [{
          id: 'main',
          item_name: reqData.title,
          quantity: reqData.quantity,
          unit: reqData.unit,
          category: reqData.product_category,
        }];
      }

      // Fetch all bids with bid_items for this requirement
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select(`
          id,
          supplier_id,
          bid_amount,
          total_amount,
          status,
          dispatched_qty,
          terms_and_conditions,
          bid_items (
            id,
            bid_id,
            requirement_item_id,
            unit_price,
            quantity,
            total
          )
        `)
        .eq('requirement_id', requirementId);

      if (bidsError) throw bidsError;

      const bids = (bidsData || []) as Bid[];

      // Get all supplier IDs and fetch profiles
      const supplierIds = [...new Set(bids.map(b => b.supplier_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, company_name, email')
        .in('id', supplierIds.length > 0 ? supplierIds : ['no-match']);

      const profiles = (profilesData || []) as SupplierProfile[];

      // Calculate L1 for each requirement item
      const l1Results: L1ItemData[] = requirementItems.map(reqItem => {
        // Collect all bid items for this requirement item
        const allBidItemsForItem: Array<{
          bidItem: BidItem;
          supplier: SupplierProfile | null;
          bid: Bid;
          isL1: boolean;
        }> = [];

        bids.forEach(bid => {
          // Try to find a matching bid_item
          let bidItem = bid.bid_items?.find(bi => bi.requirement_item_id === reqItem.id);
          
          // Fallback: If no bid_items exist for this bid, create a virtual bid_item from the bid itself
          // This handles legacy bids that were created before line-item bidding
          if (!bidItem && (!bid.bid_items || bid.bid_items.length === 0)) {
            // bid_amount is rate per unit, so calculate total
            const quantity = reqItem.quantity;
            bidItem = {
              id: `virtual-${bid.id}`,
              bid_id: bid.id,
              requirement_item_id: reqItem.id,
              unit_price: bid.bid_amount,
              quantity: quantity,
              total: bid.bid_amount * quantity,
            };
          }
          
          if (bidItem) {
            const supplier = profiles.find(p => p.id === bid.supplier_id) || null;
            allBidItemsForItem.push({
              bidItem,
              supplier,
              bid,
              isL1: false, // Will be updated below
            });
          }
        });

        // Helper to calculate buyer rate for a bid item
        const calculateBuyerRate = (bidItem: BidItem, bid: Bid, feeRate: number) => {
          const baseRate = bidItem.unit_price;
          const terms = bid.terms_and_conditions || '';
          const transportMatch = terms.match(/Transport:\s*₹?(\d+(?:,\d+)*(?:\.\d+)?)/i);
          const transportPerUnit = transportMatch ? parseFloat(transportMatch[1].replace(/,/g, '')) : 0;
          return (baseRate + transportPerUnit) * (1 + feeRate);
        };
        
        const currentFeeRate = tradeType === 'domestic_india' ? 0.005 : 0.01;

        // For L1 tab: Show all bids (pending, accepted) - not just accepted
        // This allows buyers to see L1 among all submitted bids
        const activeBidItems = allBidItemsForItem.filter(b => 
          b.bid.status === 'accepted' || b.bid.status === 'pending'
        );

        // Sort active bids by calculated buyer rate for this specific item (not bid_amount which is total)
        activeBidItems.sort((a, b) => {
          const rateA = calculateBuyerRate(a.bidItem, a.bid, currentFeeRate);
          const rateB = calculateBuyerRate(b.bidItem, b.bid, currentFeeRate);
          return rateA - rateB;
        });

        // Mark the lowest active bid as L1
        if (activeBidItems.length > 0) {
          activeBidItems[0].isL1 = true;
        }

        // For display, also sort all bid items by calculated buyer rate for this item
        allBidItemsForItem.sort((a, b) => {
          const rateA = calculateBuyerRate(a.bidItem, a.bid, currentFeeRate);
          const rateB = calculateBuyerRate(b.bidItem, b.bid, currentFeeRate);
          return rateA - rateB;
        });

        const lowestBidItemData = activeBidItems[0] || null;

        return {
          requirementItem: reqItem,
          lowestBidItem: lowestBidItemData?.bidItem || null,
          lowestBid: lowestBidItemData?.bid || null,
          lowestSupplier: lowestBidItemData?.supplier || null,
          allBidItems: allBidItemsForItem,
        };
      });

      setL1Data(l1Results);
    } catch (error) {
      console.error('Error fetching L1 data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBidItem = async () => {
    if (!editingBidItem) return;
    setSaving(true);
    try {
      const newTotal = editForm.unit_price * editForm.quantity;
      
      // Update bid_item
      const { error: bidItemError } = await supabase
        .from('bid_items')
        .update({
          unit_price: editForm.unit_price,
          quantity: editForm.quantity,
          total: newTotal,
        })
        .eq('id', editingBidItem.bidItem.id);

      if (bidItemError) throw bidItemError;

      // Recalculate parent bid total
      const { data: allBidItems } = await supabase
        .from('bid_items')
        .select('total')
        .eq('bid_id', editingBidItem.bid.id);

      if (allBidItems) {
        const newBidAmount = allBidItems.reduce((sum, item) => sum + item.total, 0);
        const feeRate = tradeType === 'domestic_india' ? 0.005 : 0.01;
        const serviceFee = newBidAmount * feeRate;
        
        const { error: bidError } = await supabase
          .from('bids')
          .update({
            bid_amount: newBidAmount,
            service_fee: serviceFee,
            total_amount: newBidAmount + serviceFee,
          })
          .eq('id', editingBidItem.bid.id);

        if (bidError) throw bidError;
      }

      toast.success('Bid item updated successfully');
      setEditingBidItem(null);
      fetchL1Data();
    } catch (error: any) {
      console.error('Error updating bid item:', error);
      toast.error(error.message || 'Failed to update bid item');
    } finally {
      setSaving(false);
    }
  };

  const feeRate = tradeType === 'domestic_india' ? 0.005 : 0.01;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (l1Data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No items found for this requirement.
      </p>
    );
  }

  // Customer view: Show L1 supplier for each item
  if (!showAllSuppliers) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span>L1 (Lowest) Supplier Per Item</span>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-medium">Item</TableHead>
                <TableHead className="text-right font-medium">Qty</TableHead>
                <TableHead className="font-medium">L1 Supplier</TableHead>
                <TableHead className="text-right font-medium">L1 Rate</TableHead>
                <TableHead className="text-right font-medium">L1 Amount</TableHead>
                <TableHead className="text-right font-medium">Dispatched</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {l1Data.map((item) => {
                // Get the L1 (lowest) bid item for THIS specific requirement item
                // This finds the actual lowest bid item for this specific item, not just the overall lowest bid
                const l1BidItemData = item.allBidItems.find(b => b.isL1);
                
                // Get raw base rate from THIS item's bid_item.unit_price
                const baseRate = l1BidItemData?.bidItem?.unit_price || 0;
                
                // Parse transport from terms_and_conditions (format: "Transport: ₹5000/Ton")
                const terms = l1BidItemData?.bid?.terms_and_conditions || '';
                const transportMatch = terms.match(/Transport:\s*₹?(\d+(?:,\d+)*(?:\.\d+)?)/i);
                const transportPerUnit = transportMatch ? parseFloat(transportMatch[1].replace(/,/g, '')) : 0;
                
                // Calculate buyer rate: (base + transport) * (1 + feeRate)
                const totalSupplierRate = baseRate + transportPerUnit;
                const buyerRate = totalSupplierRate * (1 + feeRate);
                const buyerTotal = buyerRate * item.requirementItem.quantity;
                
                // Get dispatched qty from the accepted bid
                const acceptedBid = item.allBidItems.find(b => b.bid.status === 'accepted');
                const dispatchedQty = acceptedBid?.bid.dispatched_qty || 0;
                const dispatchedValue = dispatchedQty > 0 ? dispatchedQty * buyerRate : 0;
                
                // Check if we have an L1 bid item for this specific item
                const hasL1 = l1BidItemData !== undefined;

                return (
                  <TableRow key={item.requirementItem.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {item.requirementItem.item_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.requirementItem.quantity} {item.requirementItem.unit}
                    </TableCell>
                    <TableCell>
                      {hasL1 ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Trophy className="h-3 w-3 mr-1" />
                            L1
                          </Badge>
                          <span className="text-sm">{PLATFORM_SUPPLIER_NAME}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No quotes yet</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {hasL1 ? (
                        <span className="font-medium text-success">
                          ₹{buyerRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {hasL1 ? (
                        <span className="text-primary">
                          ₹{buyerTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {dispatchedQty > 0 ? (
                        <div className="text-sm">
                          <div className="font-medium text-success">
                            {dispatchedQty} {item.requirementItem.unit}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ₹{dispatchedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          {(() => {
            // Helper to calculate buyer rate for a specific item's L1 bid
            const getItemL1BuyerRate = (allBidItems: any[]) => {
              const l1BidItemData = allBidItems.find(b => b.isL1);
              if (!l1BidItemData) return 0;
              const baseRate = l1BidItemData.bidItem?.unit_price || 0;
              const terms = l1BidItemData.bid?.terms_and_conditions || '';
              const transportMatch = terms.match(/Transport:\s*₹?(\d+(?:,\d+)*(?:\.\d+)?)/i);
              const transportPerUnit = transportMatch ? parseFloat(transportMatch[1].replace(/,/g, '')) : 0;
              return (baseRate + transportPerUnit) * (1 + feeRate);
            };
            
            const totalL1Amount = l1Data.reduce((sum, item) => {
              const l1BidItemData = item.allBidItems.find(b => b.isL1);
              if (l1BidItemData) {
                const buyerRate = getItemL1BuyerRate(item.allBidItems);
                return sum + (buyerRate * item.requirementItem.quantity);
              }
              return sum;
            }, 0);
            
            const totalDispatchedValue = l1Data.reduce((sum, item) => {
              const acceptedBid = item.allBidItems.find(b => b.bid.status === 'accepted');
              const dispatchedQty = acceptedBid?.bid.dispatched_qty || 0;
              const l1BidItemData = item.allBidItems.find(b => b.isL1);
              if (l1BidItemData && dispatchedQty > 0) {
                const buyerRate = getItemL1BuyerRate(item.allBidItems);
                return sum + dispatchedQty * buyerRate;
              }
              return sum;
            }, 0);
            
            const totalDispatchedQty = l1Data.reduce((sum, item) => {
              const acceptedBid = item.allBidItems.find(b => b.bid.status === 'accepted');
              return sum + (acceptedBid?.bid.dispatched_qty || 0);
            }, 0);
            
            const unit = l1Data[0]?.requirementItem?.unit || 'units';

            return (
              <>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total L1 Amount (all items)</span>
                  <span className="text-lg font-semibold text-primary">
                    ₹{totalL1Amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                
                {totalDispatchedQty > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-muted">
                    <span className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Dispatched Value
                    </span>
                    <div className="text-right">
                      <div className="font-semibold text-success">
                        ₹{totalDispatchedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {totalDispatchedQty} {unit}
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
          
          {/* Logistics Handler - Always shows ProcureSaathi regardless of internal execution mode */}
          {l1Data.some(item => item.lowestBidItem) && (
            <div className="flex items-center gap-3 pt-3 border-t border-muted">
              <Truck className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="text-sm font-medium">Logistics Handler</div>
                <div className="text-sm text-muted-foreground">{PLATFORM_LOGISTICS_HANDLER}</div>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                Logistics Arranged
              </Badge>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin view: Show all suppliers per item with L1 highlighted and edit option
  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span>Line-Item L1 Analysis</span>
        </div>

        {l1Data.map((item) => (
          <div key={item.requirementItem.id} className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{item.requirementItem.item_name}</span>
                  <Badge variant="secondary">{item.requirementItem.category}</Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  Required: {item.requirementItem.quantity} {item.requirementItem.unit}
                </span>
              </div>
            </div>

            {item.allBidItems.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No quotes received for this item
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Supplier</TableHead>
                    <TableHead className="text-right font-medium">Rate/Unit</TableHead>
                    <TableHead className="text-right font-medium">Qty</TableHead>
                    <TableHead className="text-right font-medium">Total</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.allBidItems.map((bidData) => (
                    <TableRow 
                      key={bidData.bidItem.id}
                      className={bidData.isL1 ? 'bg-yellow-50/50' : ''}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {bidData.isL1 && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                              <Trophy className="h-3 w-3 mr-1" />
                              L1
                            </Badge>
                          )}
                          <div>
                            <div className="font-medium">{bidData.supplier?.company_name || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground">{bidData.supplier?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={bidData.isL1 ? 'font-semibold text-success' : ''}>
                          ₹{bidData.bidItem.unit_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {bidData.bidItem.quantity} {item.requirementItem.unit}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{bidData.bidItem.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            bidData.bid.status === 'accepted' ? 'default' :
                            bidData.bid.status === 'rejected' ? 'destructive' : 'outline'
                          }>
                            {bidData.bid.status}
                          </Badge>
                          {bidData.bid.status === 'accepted' && bidData.bid.dispatched_qty && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {bidData.bid.dispatched_qty} dispatched
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingBidItem({
                              ...bidData,
                              itemName: item.requirementItem.item_name,
                              unit: item.requirementItem.unit,
                            })}
                            title="Edit Bid Item"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {bidData.bid.status === 'accepted' && requirementDetails && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDispatchModalData({
                                bidId: bidData.bid.id,
                                totalQuantity: requirementDetails.quantity,
                                unit: requirementDetails.unit,
                                currentDispatchedQty: bidData.bid.dispatched_qty,
                              })}
                              title="Record Dispatch"
                              className="text-primary hover:text-primary"
                            >
                              <Truck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ))}
      </div>

      {/* Edit Bid Item Dialog */}
      <Dialog open={!!editingBidItem} onOpenChange={(open) => !open && setEditingBidItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Bid Item
            </DialogTitle>
          </DialogHeader>

          {editingBidItem && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="font-medium">{editingBidItem.itemName}</p>
                <p className="text-muted-foreground">{editingBidItem.supplier?.company_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unit Price (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.unit_price}
                    onChange={(e) => setEditForm(f => ({ ...f, unit_price: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity ({editingBidItem.unit})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Total:</span>
                  <span className="font-bold">₹{(editForm.unit_price * editForm.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBidItem(null)}>Cancel</Button>
            <Button onClick={handleSaveBidItem} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispatch Quantity Modal */}
      {dispatchModalData && requirementDetails && (
        <DispatchQuantityModal
          open={!!dispatchModalData}
          onOpenChange={(open) => !open && setDispatchModalData(null)}
          bidId={dispatchModalData.bidId}
          requirementId={requirementId}
          requirementTitle={requirementDetails.title}
          totalQuantity={dispatchModalData.totalQuantity}
          unit={dispatchModalData.unit}
          currentDispatchedQty={dispatchModalData.currentDispatchedQty}
          onSuccess={fetchL1Data}
        />
      )}
    </>
  );
}
