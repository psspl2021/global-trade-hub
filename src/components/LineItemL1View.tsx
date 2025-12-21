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
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Package } from 'lucide-react';

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

export function LineItemL1View({ requirementId, tradeType, showAllSuppliers = false }: LineItemL1ViewProps) {
  const [loading, setLoading] = useState(true);
  const [l1Data, setL1Data] = useState<L1ItemData[]>([]);

  useEffect(() => {
    fetchL1Data();
  }, [requirementId]);

  const fetchL1Data = async () => {
    setLoading(true);
    try {
      // Fetch requirement items
      const { data: itemsData, error: itemsError } = await supabase
        .from('requirement_items')
        .select('id, item_name, quantity, unit, category, description')
        .eq('requirement_id', requirementId);

      if (itemsError) throw itemsError;

      const requirementItems = (itemsData || []) as RequirementItem[];

      // Fetch all bids with bid_items for this requirement
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select(`
          id,
          supplier_id,
          bid_amount,
          total_amount,
          status,
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
        .in('id', supplierIds);

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
          const bidItem = bid.bid_items?.find(bi => bi.requirement_item_id === reqItem.id);
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

        // Sort by unit price (ascending) to find L1
        allBidItemsForItem.sort((a, b) => a.bidItem.unit_price - b.bidItem.unit_price);

        // Mark the lowest as L1
        if (allBidItemsForItem.length > 0) {
          allBidItemsForItem[0].isL1 = true;
        }

        const lowestBidItemData = allBidItemsForItem[0] || null;

        return {
          requirementItem: reqItem,
          lowestBidItem: lowestBidItemData?.bidItem || null,
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {l1Data.map((item) => {
                const inclusiveRate = item.lowestBidItem 
                  ? item.lowestBidItem.unit_price * (1 + feeRate) 
                  : 0;
                const inclusiveTotal = item.lowestBidItem 
                  ? item.lowestBidItem.total * (1 + feeRate) 
                  : 0;

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
                      {item.lowestSupplier ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Trophy className="h-3 w-3 mr-1" />
                            L1
                          </Badge>
                          <span className="text-sm">ProcureSaathi Solutions Pvt Ltd</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No quotes yet</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.lowestBidItem ? (
                        <span className="font-medium text-success">
                          ₹{inclusiveRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.lowestBidItem ? (
                        <span className="text-primary">
                          ₹{inclusiveTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total L1 Amount (all items)</span>
            <span className="text-lg font-semibold text-primary">
              ₹{l1Data.reduce((sum, item) => {
                if (item.lowestBidItem) {
                  return sum + item.lowestBidItem.total * (1 + feeRate);
                }
                return sum;
              }, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Admin view: Show all suppliers per item with L1 highlighted
  return (
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
                      <Badge variant={
                        bidData.bid.status === 'accepted' ? 'default' :
                        bidData.bid.status === 'rejected' ? 'destructive' : 'outline'
                      }>
                        {bidData.bid.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      ))}
    </div>
  );
}
