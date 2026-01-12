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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Trophy, Package, Pencil, Truck, CheckCircle, Award, AlertTriangle } from 'lucide-react';
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
  // Award workflow fields
  award_type?: string | null;
  award_justification?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
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
  
  // Award workflow state
  const [awarding, setAwarding] = useState(false);
  const [awardJustification, setAwardJustification] = useState('');
  const [showAwardConfirm, setShowAwardConfirm] = useState(false);

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
          award_type,
          award_justification,
          approved_by,
          approved_at,
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

  // Admin view: Side-by-side supplier comparison table
  // Helper to get buyer rate for a bid item
  const getBuyerRate = (bidItem: BidItem | undefined, bid: Bid | undefined) => {
    if (!bidItem || !bid) return null;
    const baseRate = bidItem.unit_price;
    const terms = bid.terms_and_conditions || '';
    const transportMatch = terms.match(/Transport:\s*₹?(\d+(?:,\d+)*(?:\.\d+)?)/i);
    const transportPerUnit = transportMatch ? parseFloat(transportMatch[1].replace(/,/g, '')) : 0;
    return (baseRate + transportPerUnit) * (1 + feeRate);
  };

  // Collect all unique suppliers across all items
  const allSuppliers = new Map<string, { supplier: SupplierProfile | null; bid: Bid }>();
  l1Data.forEach(item => {
    item.allBidItems.forEach(bidData => {
      if (!allSuppliers.has(bidData.bid.supplier_id)) {
        allSuppliers.set(bidData.bid.supplier_id, { 
          supplier: bidData.supplier, 
          bid: bidData.bid 
        });
      }
    });
  });

  // Calculate totals per supplier FIRST (before creating sorted array)
  const supplierTotals = new Map<string, number>();
  allSuppliers.forEach((_, supplierId) => {
    let total = 0;
    l1Data.forEach(item => {
      const bidData = item.allBidItems.find(b => b.bid.supplier_id === supplierId);
      if (bidData) {
        const rate = getBuyerRate(bidData.bidItem, bidData.bid);
        if (rate !== null) {
          total += rate * item.requirementItem.quantity;
        }
      }
    });
    supplierTotals.set(supplierId, total);
  });

  // Sort suppliers by total amount (lowest first = L1 first)
  const suppliersArray = Array.from(allSuppliers.entries()).sort((a, b) => {
    const totalA = supplierTotals.get(a[0]) || Infinity;
    const totalB = supplierTotals.get(b[0]) || Infinity;
    return totalA - totalB;
  });

  // Find overall L1 supplier (lowest total) - will be first in sorted array
  let overallL1SupplierId: string | null = null;
  let lowestTotal = Infinity;
  supplierTotals.forEach((total, supplierId) => {
    if (total > 0 && total < lowestTotal) {
      lowestTotal = total;
      overallL1SupplierId = supplierId;
    }
  });

  /**
   * AWARD WORKFLOW LOGIC:
   * - Coverage = % of requirement items quoted by L1 supplier
   * - FULL L1 (100% coverage) → Auto-award allowed
   * - PARTIAL L1 (<100% coverage) → Mandatory justification required
   * - Award can ONLY be initiated from this Comparison tab (single source of truth)
   */
  
  // Calculate L1 supplier coverage
  const totalRequirementItems = l1Data.length;
  const l1QuotedItems = overallL1SupplierId 
    ? l1Data.filter(item => item.allBidItems.some(b => b.bid.supplier_id === overallL1SupplierId)).length 
    : 0;
  const l1CoveragePercent = totalRequirementItems > 0 
    ? Math.round((l1QuotedItems / totalRequirementItems) * 100) 
    : 0;
  const isFullL1 = l1CoveragePercent === 100;
  const isPartialL1 = l1CoveragePercent > 0 && l1CoveragePercent < 100;
  
  // Check if L1 bid is already awarded
  const l1SupplierBid = overallL1SupplierId ? allSuppliers.get(overallL1SupplierId)?.bid : null;
  const isAlreadyAwarded = l1SupplierBid?.status === 'accepted';
  
  // Award handler
  const handleAwardL1 = async (awardType: 'FULL' | 'PARTIAL') => {
    if (!overallL1SupplierId || !l1SupplierBid) {
      toast.error('No L1 supplier found');
      return;
    }
    
    if (awardType === 'PARTIAL' && !awardJustification.trim()) {
      toast.error('Justification is mandatory for partial L1 award');
      return;
    }
    
    setAwarding(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Update bid status to accepted with award metadata
      const { error: bidError } = await supabase
        .from('bids')
        .update({
          status: 'accepted',
          award_type: awardType,
          award_justification: awardType === 'PARTIAL' ? awardJustification : null,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', l1SupplierBid.id);
      
      if (bidError) throw bidError;
      
      // Create immutable audit log
      const { error: auditError } = await supabase
        .from('award_audit_logs')
        .insert({
          bid_id: l1SupplierBid.id,
          requirement_id: requirementId,
          action: 'L1_AWARDED',
          award_type: awardType,
          coverage_percentage: l1CoveragePercent,
          metadata: {
            supplier_id: overallL1SupplierId,
            supplier_name: allSuppliers.get(overallL1SupplierId)?.supplier?.company_name,
            total_value: lowestTotal,
            items_quoted: l1QuotedItems,
            total_items: totalRequirementItems,
            justification: awardType === 'PARTIAL' ? awardJustification : null,
          },
          created_by: user.id,
        });
      
      if (auditError) {
        console.error('Audit log error:', auditError);
        // Don't fail the award for audit log issues
      }
      
      toast.success(`L1 Award successful (${awardType})`);
      setShowAwardConfirm(false);
      setAwardJustification('');
      fetchL1Data(); // Refresh data
    } catch (error: any) {
      console.error('Award error:', error);
      toast.error(error.message || 'Failed to award L1');
    } finally {
      setAwarding(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span>Supplier Rate Comparison</span>
        </div>

        {suppliersArray.length === 0 ? (
          <div className="border rounded-lg p-6 text-center text-muted-foreground">
            No bids received yet
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold min-w-[180px] sticky left-0 bg-muted/50 z-10">
                    Size & Grade
                  </TableHead>
                  <TableHead className="text-center font-semibold min-w-[80px]">Qty</TableHead>
                  {suppliersArray.map(([supplierId, data], idx) => (
                    <TableHead 
                      key={supplierId} 
                      className={`text-center font-semibold min-w-[120px] ${
                        supplierId === overallL1SupplierId ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {supplierId === overallL1SupplierId && (
                          <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                            <Trophy className="h-3 w-3 mr-1" />
                            Overall L1
                          </Badge>
                        )}
                        <span className="text-xs truncate max-w-[100px]" title={data.supplier?.company_name || 'Unknown'}>
                          Supplier {idx + 1}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-semibold min-w-[100px] bg-yellow-50">
                    <div className="flex flex-col items-center">
                      <Trophy className="h-4 w-4 text-yellow-600 mb-1" />
                      <span>L1 Rate</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {l1Data.map((item) => {
                  // Find L1 bid item for this specific item
                  const l1BidData = item.allBidItems.find(b => b.isL1);
                  const l1Rate = l1BidData ? getBuyerRate(l1BidData.bidItem, l1BidData.bid) : null;

                  return (
                    <TableRow key={item.requirementItem.id}>
                      <TableCell className="font-medium sticky left-0 bg-background z-10">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{item.requirementItem.item_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{item.requirementItem.quantity}</span>
                        <span className="text-xs text-muted-foreground ml-1">{item.requirementItem.unit}</span>
                      </TableCell>
                      {suppliersArray.map(([supplierId]) => {
                        const bidData = item.allBidItems.find(b => b.bid.supplier_id === supplierId);
                        const rate = bidData ? getBuyerRate(bidData.bidItem, bidData.bid) : null;
                        const isL1ForItem = bidData?.isL1 || false;

                        return (
                          <TableCell 
                            key={supplierId} 
                            className={`text-center ${
                              isL1ForItem ? 'bg-yellow-50 font-semibold' : ''
                            } ${supplierId === overallL1SupplierId ? 'bg-green-50/50' : ''}`}
                          >
                            {rate !== null ? (
                              <div className="flex flex-col items-center">
                                <span className={isL1ForItem ? 'text-yellow-700' : ''}>
                                  ₹{rate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </span>
                                {isL1ForItem && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 mt-1 bg-yellow-100 text-yellow-700 border-yellow-300">
                                    L1
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center bg-yellow-50 font-semibold">
                        {l1Rate !== null ? (
                          <span className="text-yellow-700">
                            ₹{l1Rate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Total Row */}
                <TableRow className="bg-muted/30 font-semibold border-t-2">
                  <TableCell className="sticky left-0 bg-muted/30 z-10">
                    <span className="font-bold">TOTAL VALUE</span>
                  </TableCell>
                  <TableCell></TableCell>
                  {suppliersArray.map(([supplierId]) => {
                    const total = supplierTotals.get(supplierId) || 0;
                    const isOverallL1 = supplierId === overallL1SupplierId;
                    
                    return (
                      <TableCell 
                        key={supplierId} 
                        className={`text-center ${isOverallL1 ? 'bg-green-100' : ''}`}
                      >
                        <div className="flex flex-col items-center">
                          <span className={isOverallL1 ? 'text-green-700 font-bold' : ''}>
                            ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                          {isOverallL1 && (
                            <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0 mt-1">
                              LOWEST
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center bg-yellow-100">
                    <span className="text-yellow-700 font-bold">
                      ₹{l1Data.reduce((sum, item) => {
                        const l1BidData = item.allBidItems.find(b => b.isL1);
                        const rate = l1BidData ? getBuyerRate(l1BidData.bidItem, l1BidData.bid) : null;
                        return sum + (rate !== null ? rate * item.requirementItem.quantity : 0);
                      }, 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* Overall L1 Supplier Summary with Award Actions */}
        {overallL1SupplierId && (
          <div className={`border rounded-lg p-4 ${isAlreadyAwarded ? 'bg-green-100 border-green-300' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${isAlreadyAwarded ? 'bg-green-200' : 'bg-green-100'}`}>
                {isAlreadyAwarded ? (
                  <CheckCircle className="h-5 w-5 text-green-700" />
                ) : (
                  <Trophy className="h-5 w-5 text-green-700" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-green-800">
                  {isAlreadyAwarded ? 'Awarded L1 Supplier' : 'Overall L1 Supplier'}
                </div>
                <div className="text-lg font-bold text-green-900">
                  {allSuppliers.get(overallL1SupplierId)?.supplier?.company_name || 'Unknown'}
                </div>
                <div className="text-xs text-green-700">
                  {allSuppliers.get(overallL1SupplierId)?.supplier?.email}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-green-700">Total Value</div>
                <div className="text-xl font-bold text-green-800">
                  ₹{lowestTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            
            {/* Coverage & Award Status */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-white/50 rounded-lg">
              <div className="flex-1">
                <div className="text-sm font-medium text-green-800">Coverage</div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${isFullL1 ? 'text-green-700' : 'text-amber-600'}`}>
                    {l1CoveragePercent}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({l1QuotedItems}/{totalRequirementItems} items)
                  </span>
                  {isFullL1 && (
                    <Badge className="bg-green-600 text-white">FULL</Badge>
                  )}
                  {isPartialL1 && (
                    <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      PARTIAL
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Award Status or Action */}
              {isAlreadyAwarded ? (
                <div className="text-right">
                  <Badge className="bg-green-600 text-white text-sm px-3 py-1">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    AWARDED
                  </Badge>
                  {l1SupplierBid?.award_type && (
                    <div className="text-xs text-green-700 mt-1">
                      Type: {l1SupplierBid.award_type}
                    </div>
                  )}
                </div>
              ) : showAllSuppliers && (
                <div className="flex gap-2">
                  {isFullL1 && (
                    <Button 
                      onClick={() => handleAwardL1('FULL')}
                      disabled={awarding}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {awarding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Award className="h-4 w-4 mr-2" />
                      Award L1 (Full)
                    </Button>
                  )}
                  {isPartialL1 && (
                    <Button 
                      onClick={() => setShowAwardConfirm(true)}
                      disabled={awarding}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Award L1 (Partial)
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Justification display for already awarded partial */}
            {isAlreadyAwarded && l1SupplierBid?.award_type === 'PARTIAL' && l1SupplierBid?.award_justification && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-sm font-medium text-amber-800 mb-1">Award Justification</div>
                <div className="text-sm text-amber-700">{l1SupplierBid.award_justification}</div>
              </div>
            )}
          </div>
        )}

        {/* Supplier Legend */}
        {suppliersArray.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="text-sm font-medium mb-3">Supplier Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {suppliersArray.map(([supplierId, data], idx) => (
                <div 
                  key={supplierId} 
                  className={`flex items-center gap-3 p-2 rounded-lg border ${
                    supplierId === overallL1SupplierId ? 'bg-green-50 border-green-200' : 'bg-background'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    supplierId === overallL1SupplierId 
                      ? 'bg-green-600 text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{data.supplier?.company_name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground truncate">{data.supplier?.email}</div>
                  </div>
                  {supplierId === overallL1SupplierId && (
                    <Trophy className="h-4 w-4 text-green-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
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
      
      {/* Partial L1 Award Confirmation Dialog */}
      <Dialog open={showAwardConfirm} onOpenChange={setShowAwardConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              Partial L1 Award - Justification Required
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="text-sm font-medium text-amber-800 mb-2">Warning</div>
              <p className="text-sm text-amber-700">
                This supplier has only quoted <strong>{l1CoveragePercent}%</strong> of the requirement 
                ({l1QuotedItems} of {totalRequirementItems} items). 
                A mandatory justification is required for partial L1 awards.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="justification" className="text-sm font-medium">
                Justification <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="justification"
                placeholder="e.g., Urgent delivery timeline, balance items to be procured separately..."
                value={awardJustification}
                onChange={(e) => setAwardJustification(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                This will be recorded in the audit log for compliance purposes.
              </p>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <div className="font-medium mb-1">L1 Supplier</div>
              <div>{allSuppliers.get(overallL1SupplierId || '')?.supplier?.company_name}</div>
              <div className="text-muted-foreground">
                Value: ₹{lowestTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAwardConfirm(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleAwardL1('PARTIAL')}
              disabled={awarding || !awardJustification.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {awarding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Award className="h-4 w-4 mr-2" />
              Confirm Partial Award
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
