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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Eye, Calendar, MapPin, Package, Edit2, Trophy, ListOrdered, User, Truck, MoreVertical, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { EditRequirementForm } from './EditRequirementForm';
import { LineItemL1View } from './LineItemL1View';
import { useUserRole } from '@/hooks/useUserRole';
import { DispatchQuantityModal } from './DispatchQuantityModal';

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
  status: 'active' | 'closed' | 'awarded' | 'expired';
  created_at: string;
  customer_name?: string | null;
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
  buyer_visible_price?: number; // New field - what buyer sees
  service_fee: number;
  total_amount: number;
  delivery_timeline_days: number;
  status: 'pending' | 'accepted' | 'rejected';
  terms_and_conditions: string | null;
  created_at: string;
  supplier_id: string;
  bid_items?: BidItem[];
  logistics_execution_mode?: string; // Backend-controlled, hidden from buyer
  dispatched_qty?: number | null;
}

// Constants for buyer-facing display - always show ProcureSaathi as handler
const PLATFORM_SUPPLIER_NAME = 'ProcureSaathi Solutions Pvt Ltd';
const PLATFORM_LOGISTICS_HANDLER = 'ProcureSaathi Solutions Pvt. Ltd.';
const PLATFORM_LOGISTICS_CONTACT = 'logistics@procuresaathi.com';

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
  const { role } = useUserRole(userId);
  const [statusFilter, setStatusFilter] = useState<string>('all');
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

      // Fetch all bids with bid_items to find the one with lowest TOTAL value (not just lowest per-unit rate)
      const { data: allBidsData, error: bidsError } = await supabase
        .from('bids')
        .select(`
          id,
          bid_amount,
          buyer_visible_price,
          service_fee,
          total_amount,
          delivery_timeline_days,
          status,
          terms_and_conditions,
          created_at,
          supplier_id,
          dispatched_qty,
          bid_items (
            id,
            requirement_item_id,
            unit_price,
            quantity,
            total
          )
        `)
        .eq('requirement_id', requirementId);

      if (bidsError) throw bidsError;
      
      // Calculate buyer total for each bid and find the one with lowest total value
      const feeRate = selectedRequirement?.trade_type === 'domestic_india' ? 0.005 : 0.01;
      const bidsWithTotals = (allBidsData || []).map(bid => {
        const terms = bid.terms_and_conditions || '';
        const transportMatch = terms.match(/Transport:\s*₹?(\d+(?:,\d+)*(?:\.\d+)?)/i);
        const transportPerUnit = transportMatch ? parseFloat(transportMatch[1].replace(/,/g, '')) : 0;
        
        let totalBuyerValue = 0;
        if (bid.bid_items && bid.bid_items.length > 0) {
          totalBuyerValue = bid.bid_items.reduce((sum, item) => {
            const itemBaseRate = item.unit_price;
            const totalSupplierRate = itemBaseRate + transportPerUnit;
            const buyerRate = totalSupplierRate * (1 + feeRate);
            return sum + (buyerRate * item.quantity);
          }, 0);
        } else if (bid.buyer_visible_price) {
          totalBuyerValue = bid.buyer_visible_price;
        }
        
        return { ...bid, calculatedBuyerTotal: totalBuyerValue };
      });
      
      // Sort by calculated total buyer value (ascending) and take the lowest
      bidsWithTotals.sort((a, b) => a.calculatedBuyerTotal - b.calculatedBuyerTotal);
      const lowestOverallBid = bidsWithTotals.length > 0 ? [bidsWithTotals[0]] : [];
      
      setBids(lowestOverallBid as Bid[]);
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
      case 'expired':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Expired</Badge>;
      case 'closed':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Awarded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter requirements based on status
  const filteredRequirements = requirements.filter(req => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'awarded') return req.status === 'awarded' || req.status === 'closed';
    return req.status === statusFilter;
  });

  // Pagination
  const totalItems = filteredRequirements.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedRequirements = filteredRequirements.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>My Requirements</CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="awarded">Awarded</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequirements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {requirements.length === 0 
                ? 'No requirements posted yet. Create your first requirement to get started!'
                : 'No requirements match the selected filter.'
              }
            </p>
          ) : (
            <div className="space-y-3">
              {paginatedRequirements.map((req) => (
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
                      {/* Customer Name - Only visible for admin */}
                      {role === 'admin' && req.customer_name && (
                        <div className="flex items-center gap-1 text-sm text-primary mb-1">
                          <User className="h-3 w-3" />
                          <span className="font-medium">Customer: {req.customer_name}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {Number(req.quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })} {req.unit}
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
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewBids(req)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Bids
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                          {(req.status === 'active' || req.status === 'expired') && (
                            <DropdownMenuItem onClick={() => setEditingRequirement(req)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit Requirement
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleViewBids(req)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
      </Card>

      {/* Bids Dialog */}
      <Dialog open={!!selectedRequirement} onOpenChange={() => setSelectedRequirement(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bids for: {selectedRequirement?.title}</DialogTitle>
          </DialogHeader>

          {bidsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="l1-view" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="l1-view" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  L1 Per Item
                </TabsTrigger>
                <TabsTrigger value="lowest-bid" className="flex items-center gap-2">
                  <ListOrdered className="h-4 w-4" />
                  Lowest Overall Bid
                </TabsTrigger>
              </TabsList>

              <TabsContent value="l1-view" className="mt-4">
                {selectedRequirement && (
                  <LineItemL1View 
                    requirementId={selectedRequirement.id} 
                    tradeType={selectedRequirement.trade_type}
                    showAllSuppliers={false}
                  />
                )}
              </TabsContent>

              <TabsContent value="lowest-bid" className="mt-4">
                {bids.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No bids received yet for this requirement.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Showing lowest overall bid</p>
                    {bids.map((bid) => (
                      <Card key={bid.id} className="border-primary/50">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{PLATFORM_SUPPLIER_NAME}</span>
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

                          {/* Logistics Handler - Always shows ProcureSaathi regardless of internal execution mode */}
                          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-muted">
                            <Truck className="h-5 w-5 text-primary" />
                            <div className="flex-1">
                              <div className="text-sm font-medium">Logistics Handler</div>
                              <div className="text-sm text-muted-foreground">{PLATFORM_LOGISTICS_HANDLER}</div>
                            </div>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                              {bid.status === 'accepted' ? 'Logistics Arranged' : 'Pending Confirmation'}
                            </Badge>
                          </div>

                          {/* Bid Items Table - Show breakdown for all bids */}
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
                                  {bid.bid_items && bid.bid_items.length > 0 ? (
                                    // Use actual bid_items when available - each item has its own rate
                                    bid.bid_items.map((item) => {
                                      // Parse transport from terms_and_conditions
                                      const terms = bid.terms_and_conditions || '';
                                      const transportMatch = terms.match(/Transport:\s*₹?(\d+(?:,\d+)*(?:\.\d+)?)/i);
                                      const transportPerUnit = transportMatch ? parseFloat(transportMatch[1].replace(/,/g, '')) : 0;
                                      
                                      // Calculate buyer rate for THIS specific item
                                      // Each item uses its OWN unit_price from bid_items
                                      const feeRate = selectedRequirement?.trade_type === 'domestic_india' ? 0.005 : 0.01;
                                      const itemBaseRate = item.unit_price; // This is the item-specific rate
                                      const totalSupplierRate = itemBaseRate + transportPerUnit;
                                      const buyerRate = totalSupplierRate * (1 + feeRate);
                                      const buyerTotal = buyerRate * item.quantity;
                                      
                                      return (
                                        <TableRow key={item.id}>
                                          <TableCell className="font-medium">
                                            {getItemName(item.requirement_item_id)}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {item.quantity} {getItemUnit(item.requirement_item_id)}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            ₹{buyerRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                          </TableCell>
                                          <TableCell className="text-right font-medium">
                                            ₹{buyerTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })
                                  ) : (
                                    // Fallback: Create virtual item from requirement data when bid_items is empty
                                    (() => {
                                      const terms = bid.terms_and_conditions || '';
                                      const transportMatch = terms.match(/Transport:\s*₹?(\d+(?:,\d+)*(?:\.\d+)?)/i);
                                      const transportPerUnit = transportMatch ? parseFloat(transportMatch[1].replace(/,/g, '')) : 0;
                                      const feeRate = selectedRequirement?.trade_type === 'domestic_india' ? 0.005 : 0.01;
                                      
                                      // Use buyer_visible_price if available, otherwise calculate from bid_amount
                                      // buyer_visible_price already includes transport + markup
                                      const quantity = selectedRequirement?.quantity || 0;
                                      let buyerRate: number;
                                      
                                      if (bid.buyer_visible_price && quantity > 0) {
                                        // buyer_visible_price is the total, so divide by quantity for rate
                                        buyerRate = bid.buyer_visible_price / quantity;
                                      } else {
                                        // Fallback: bid_amount is rate per unit from supplier
                                        const supplierBaseRate = bid.bid_amount / quantity; // bid_amount might be total
                                        const totalSupplierRate = supplierBaseRate + transportPerUnit;
                                        buyerRate = totalSupplierRate * (1 + feeRate);
                                      }
                                      
                                      const buyerTotal = buyerRate * quantity;
                                      
                                      return (
                                        <TableRow>
                                          <TableCell className="font-medium">
                                            {selectedRequirement?.title || 'Item'}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {Math.round(quantity * 100) / 100} {selectedRequirement?.unit || 'units'}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            ₹{buyerRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                          </TableCell>
                                          <TableCell className="text-right font-medium">
                                            ₹{buyerTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })()
                                  )}
                                </TableBody>
                              </Table>
                            </div>

                            <div className="bg-muted/30 rounded-lg p-4">
                              {(() => {
                                // Calculate total with transport + markup for each item
                                const terms = bid.terms_and_conditions || '';
                                const transportMatch = terms.match(/Transport:\s*₹?(\d+(?:,\d+)*(?:\.\d+)?)/i);
                                const transportPerUnit = transportMatch ? parseFloat(transportMatch[1].replace(/,/g, '')) : 0;
                                const feeRate = selectedRequirement?.trade_type === 'domestic_india' ? 0.005 : 0.01;
                                
                                let totalBuyerAmount = 0;
                                
                                if (bid.bid_items && bid.bid_items.length > 0) {
                                  // Sum each item's buyer total using its own unit_price
                                  totalBuyerAmount = bid.bid_items.reduce((sum, item) => {
                                    const itemBaseRate = item.unit_price;
                                    const totalSupplierRate = itemBaseRate + transportPerUnit;
                                    const buyerRate = totalSupplierRate * (1 + feeRate);
                                    return sum + (buyerRate * item.quantity);
                                  }, 0);
                                } else {
                                  // Fallback calculation - use buyer_visible_price if available
                                  const quantity = selectedRequirement?.quantity || 0;
                                  if (bid.buyer_visible_price) {
                                    totalBuyerAmount = bid.buyer_visible_price;
                                  } else if (quantity > 0) {
                                    const supplierBaseRate = bid.bid_amount / quantity;
                                    const totalSupplierRate = supplierBaseRate + transportPerUnit;
                                    const buyerRate = totalSupplierRate * (1 + feeRate);
                                    totalBuyerAmount = buyerRate * quantity;
                                  }
                                }
                                
                                // Add GST (18%)
                                const totalWithGst = totalBuyerAmount * 1.18;
                                
                                return (
                                  <div className="flex justify-between font-semibold">
                                    <span>Total Amount</span>
                                    <span className="text-primary">₹{totalWithGst.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {bid.terms_and_conditions && (
                            <div className="text-sm">
                              <span className="font-medium text-muted-foreground">Terms:</span>
                              <p className="mt-1 text-foreground whitespace-pre-line">
                                {/* Filter out supplier pricing details and additional charges from terms */}
                                {bid.terms_and_conditions
                                  .split('\n')
                                  .filter(line => {
                                    const lowerLine = line.toLowerCase();
                                    // Filter out lines containing pricing info and additional charges (already in rate)
                                    return !lowerLine.includes('rate:') &&
                                           !lowerLine.includes('rate per unit') &&
                                           !lowerLine.includes('line total') &&
                                           !lowerLine.includes('subtotal') &&
                                           !lowerLine.includes('taxable value') &&
                                           !lowerLine.includes('total gst') &&
                                           !lowerLine.includes('grand total') &&
                                           !lowerLine.includes('service fee') &&
                                           !lowerLine.includes('platform fee') &&
                                           !lowerLine.includes('additional charges') &&
                                           !lowerLine.includes('transport:') &&
                                           !lowerLine.includes('- transport');
                                  })
                                  .join('\n')
                                  .trim() || 'Standard terms apply'}
                              </p>
                            </div>
                          )}

                          {bid.status === 'pending' && selectedRequirement?.status === 'active' && (
                            <div className="flex justify-end">
                              <Button onClick={() => handleAcceptBid(bid.id)}>
                                Accept Bid
                              </Button>
                            </div>
                          )}

                          {/* Dispatch button for awarded requirements */}
                          {bid.status === 'accepted' && selectedRequirement?.status === 'awarded' && (
                            <div className="flex items-center justify-between pt-3 border-t">
                              <div className="text-sm">
                                {bid.dispatched_qty ? (
                                  <div className="space-y-1">
                                    <span className="text-success block">
                                      Dispatched: {bid.dispatched_qty.toLocaleString('en-IN')} {selectedRequirement.unit}
                                    </span>
                                    <span className="text-muted-foreground block">
                                      Value: ₹{((bid.buyer_visible_price / selectedRequirement.quantity) * bid.dispatched_qty).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Not yet dispatched</span>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => setDispatchModalData({
                                  bidId: bid.id,
                                  requirementId: selectedRequirement.id,
                                  requirementTitle: selectedRequirement.title,
                                  totalQuantity: selectedRequirement.quantity,
                                  unit: selectedRequirement.unit,
                                  currentDispatchedQty: bid.dispatched_qty,
                                })}
                              >
                                <Truck className="h-4 w-4 mr-1" />
                                {bid.dispatched_qty ? 'Update Dispatch' : 'Record Dispatch'}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
          onSuccess={() => {
            fetchRequirements();
            if (selectedRequirement) {
              fetchBids(selectedRequirement.id);
            }
          }}
        />
      )}
    </>
  );
}