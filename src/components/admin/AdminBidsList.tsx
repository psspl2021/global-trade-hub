import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Search, Gavel, Package, Truck, Pencil, Trophy } from 'lucide-react';
import { LineItemL1View } from '@/components/LineItemL1View';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

interface BidItem {
  id: string;
  bid_id: string;
  requirement_item_id: string;
  unit_price: number;
  quantity: number;
  total: number;
  item_name?: string;
  unit?: string;
}

interface Bid {
  id: string;
  bid_amount: number;
  service_fee: number;
  total_amount: number;
  buyer_visible_price: number;
  supplier_net_price: number;
  markup_amount: number;
  dispatched_qty: number | null;
  delivery_timeline_days: number;
  status: string;
  created_at: string;
  awarded_at: string | null;
  rejected_at: string | null;
  closed_at: string | null;
  terms_and_conditions: string | null;
  requirement_id: string;
  // Commission lock fields (frozen on award)
  awarded_commission_pct: number | null;
  awarded_commission_value: number | null;
  requirement: {
    title: string;
    product_category: string;
    quantity: number;
    unit: string;
    trade_type?: string;
  } | null;
  supplier: {
    company_name: string;
    email: string;
  } | null;
  bid_items?: BidItem[];
}

interface LogisticsBid {
  id: string;
  bid_amount: number;
  service_fee: number;
  total_amount: number;
  estimated_transit_days: number;
  status: string;
  created_at: string;
  awarded_at: string | null;
  rejected_at: string | null;
  closed_at: string | null;
  terms_and_conditions: string | null;
  rate_per_unit: number | null;
  requirement_id: string;
  requirement: {
    title: string;
    material_type: string;
    pickup_location: string;
    delivery_location: string;
  } | null;
  transporter: {
    company_name: string;
    email: string;
  } | null;
}

interface AdminBidsListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];

// Helper to parse taxable value from terms_and_conditions
const parseTaxableFromTerms = (terms: string | null): number => {
  if (!terms) return 0;
  const match = terms.match(/Taxable Value:\s*₹?([\d,]+(?:\.\d+)?)/);
  return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
};

// Helper to parse line items from terms_and_conditions
interface ParsedItem {
  item_name: string;
  unit_price: number;
  quantity: number;
  unit: string;
  total: number;
}

const parseItemsFromTerms = (terms: string | null): ParsedItem[] => {
  if (!terms) return [];
  
  const items: ParsedItem[] = [];
  // Pattern: --- Item N: ItemName ---\nRate: ₹XXXXX/Unit\nQuantity: XX Unit\n...Line Total: ₹XX,XXX
  const itemPattern = /--- Item \d+: (.+?) ---[\s\S]*?Rate: ₹?([\d,]+(?:\.\d+)?)\/([\w]+)[\s\S]*?Quantity: ([\d,.]+)\s*(\w+)?[\s\S]*?Line Total: ₹?([\d,]+(?:\.\d+)?)/g;
  
  let match;
  while ((match = itemPattern.exec(terms)) !== null) {
    const name = match[1].trim();
    const rate = parseFloat(match[2].replace(/,/g, ''));
    const unit = match[3] || 'unit';
    const qty = parseFloat(match[4].replace(/,/g, ''));
    const lineTotal = parseFloat(match[6].replace(/,/g, ''));
    
    items.push({
      item_name: name,
      unit_price: rate,
      quantity: qty,
      unit: unit,
      total: lineTotal,
    });
  }
  
  return items;
};

// Helper to get profit percentage based on trade type
// Domestic (India) = 0.5%, Export/Import = 2%
const getProfitPercentage = (tradeType?: string | null): number => {
  if (!tradeType) return 0.005; // Default to domestic
  const type = tradeType.toLowerCase();
  if (type === 'export' || type === 'import') {
    return 0.02; // 2% for export/import
  }
  return 0.005; // 0.5% for domestic
};

export function AdminBidsList({ open, onOpenChange }: AdminBidsListProps) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [logisticsBids, setLogisticsBids] = useState<LogisticsBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('comparison');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [supplierPage, setSupplierPage] = useState(1);
  const [supplierTotal, setSupplierTotal] = useState(0);
  const [logisticsPage, setLogisticsPage] = useState(1);
  const [logisticsTotal, setLogisticsTotal] = useState(0);
  const [tabCounts, setTabCounts] = useState({ supplier: 0, logistics: 0, comparison: 0 });
  const [pageSize, setPageSize] = useState(15);
  
  // Comparison tab state
  const [requirements, setRequirements] = useState<Array<{ id: string; title: string; product_category: string; trade_type?: string }>>([]);
  
  // Helper to get display date based on status
  const getDisplayDate = (bid: Bid | LogisticsBid): { date: string; label: string } => {
    if (bid.status === 'accepted' && bid.awarded_at) {
      return { date: bid.awarded_at, label: 'Awarded' };
    } else if (bid.status === 'rejected' && bid.rejected_at) {
      return { date: bid.rejected_at, label: 'Rejected' };
    } else if ((bid.status === 'closed' || bid.status === 'expired') && bid.closed_at) {
      return { date: bid.closed_at, label: bid.status === 'expired' ? 'Expired' : 'Closed' };
    }
    return { date: bid.created_at, label: 'Created' };
  };
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);

  // Edit state
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [editingLogisticsBid, setEditingLogisticsBid] = useState<LogisticsBid | null>(null);
  const [saving, setSaving] = useState(false);
  const [bidItems, setBidItems] = useState<BidItem[]>([]);
  const [loadingBidItems, setLoadingBidItems] = useState(false);

  // Edit form state for supplier bids
  const [editForm, setEditForm] = useState({
    bid_amount: 0,
    service_fee: 0,
    delivery_timeline_days: 0,
    status: 'pending',
    terms_and_conditions: '',
  });

  // Edit form state for logistics bids
  const [editLogisticsForm, setEditLogisticsForm] = useState({
    bid_amount: 0,
    service_fee: 0,
    rate_per_unit: 0,
    estimated_transit_days: 0,
    status: 'pending',
    terms_and_conditions: '',
  });

  useEffect(() => {
    if (open) {
      fetchTabCounts();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (activeTab === 'supplier') {
        fetchSupplierBids();
      } else if (activeTab === 'logistics') {
        fetchLogisticsBids();
      }
      // Comparison tab doesn't need separate fetch - uses LineItemL1View
    }
  }, [open, activeTab, supplierPage, logisticsPage, pageSize]);

  useEffect(() => {
    setSupplierPage(1);
    setLogisticsPage(1);
  }, [search, pageSize]);

  useEffect(() => {
    if (editingBid) {
      setEditForm({
        bid_amount: editingBid.bid_amount,
        service_fee: editingBid.service_fee,
        delivery_timeline_days: editingBid.delivery_timeline_days,
        status: editingBid.status,
        terms_and_conditions: editingBid.terms_and_conditions || '',
      });
      // Fetch bid items when editing a bid
      fetchBidItems(editingBid.id);
    } else {
      setBidItems([]);
    }
  }, [editingBid]);

  useEffect(() => {
    if (editingLogisticsBid) {
      setEditLogisticsForm({
        bid_amount: editingLogisticsBid.bid_amount,
        service_fee: editingLogisticsBid.service_fee,
        rate_per_unit: editingLogisticsBid.rate_per_unit || 0,
        estimated_transit_days: editingLogisticsBid.estimated_transit_days,
        status: editingLogisticsBid.status,
        terms_and_conditions: editingLogisticsBid.terms_and_conditions || '',
      });
    }
  }, [editingLogisticsBid]);

  const fetchBidItems = async (bidId: string) => {
    setLoadingBidItems(true);
    try {
      // Get bid items with their requirement item details
      const { data: items, error } = await supabase
        .from('bid_items')
        .select('id, bid_id, requirement_item_id, unit_price, quantity, total')
        .eq('bid_id', bidId);

      if (error) throw error;

      if (items && items.length > 0) {
        // Fetch requirement items for names
        const reqItemIds = items.map(i => i.requirement_item_id);
        const { data: reqItems } = await supabase
          .from('requirement_items')
          .select('id, item_name, unit')
          .in('id', reqItemIds);

        const itemsWithNames: BidItem[] = items.map(item => {
          const reqItem = reqItems?.find(ri => ri.id === item.requirement_item_id);
          return {
            ...item,
            item_name: reqItem?.item_name || 'Unknown Item',
            unit: reqItem?.unit || 'unit',
          };
        });

        setBidItems(itemsWithNames);
      } else {
        setBidItems([]);
      }
    } catch (error) {
      console.error('Error fetching bid items:', error);
      setBidItems([]);
    } finally {
      setLoadingBidItems(false);
    }
  };

  const fetchTabCounts = async () => {
    try {
      const [{ count: sCount }, { count: lCount }, { data: reqs }] = await Promise.all([
        supabase.from('bids').select('*', { count: 'exact', head: true }),
        supabase.from('logistics_bids').select('*', { count: 'exact', head: true }),
        supabase.from('requirements').select('id, title, product_category, trade_type').order('created_at', { ascending: false }).limit(50),
      ]);
      setTabCounts({ supplier: sCount || 0, logistics: lCount || 0, comparison: reqs?.length || 0 });
      if (reqs) {
        setRequirements(reqs);
        if (reqs.length > 0 && !selectedRequirementId) {
          setSelectedRequirementId(reqs[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const fetchSupplierBids = async () => {
    setLoading(true);
    try {
      const from = (supplierPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: supplierBids, count } = await supabase
        .from('bids')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!supplierBids) {
        setBids([]);
        setSupplierTotal(0);
        return;
      }

      setSupplierTotal(count || 0);

      const bidIds = supplierBids.map(b => b.id);
      const reqIds = [...new Set(supplierBids.map(b => b.requirement_id))];
      const supplierIds = [...new Set(supplierBids.map(b => b.supplier_id))];

      const [reqRes, profRes, bidItemsRes] = await Promise.all([
        supabase.from('requirements').select('id, title, product_category, quantity, unit, trade_type').in('id', reqIds),
        supabase.from('profiles').select('id, company_name, email').in('id', supplierIds),
        supabase.from('bid_items').select('id, bid_id, requirement_item_id, unit_price, quantity, total').in('bid_id', bidIds),
      ]);

      const bidsWithDetails: Bid[] = supplierBids.map(bid => ({
        ...bid,
        requirement: reqRes.data?.find(r => r.id === bid.requirement_id) || null,
        supplier: profRes.data?.find(p => p.id === bid.supplier_id) || null,
        bid_items: bidItemsRes.data?.filter(item => item.bid_id === bid.id) || [],
      }));

      setBids(bidsWithDetails);
    } catch (error) {
      console.error('Error fetching supplier bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogisticsBids = async () => {
    setLoading(true);
    try {
      const from = (logisticsPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: logBids, count } = await supabase
        .from('logistics_bids')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!logBids) {
        setLogisticsBids([]);
        setLogisticsTotal(0);
        return;
      }

      setLogisticsTotal(count || 0);

      const reqIds = [...new Set(logBids.map(b => b.requirement_id))];
      const transporterIds = [...new Set(logBids.map(b => b.transporter_id))];

      const [reqRes, profRes] = await Promise.all([
        supabase.from('logistics_requirements').select('id, title, material_type, pickup_location, delivery_location').in('id', reqIds),
        supabase.from('profiles').select('id, company_name, email').in('id', transporterIds),
      ]);

      const logBidsWithDetails: LogisticsBid[] = logBids.map(bid => ({
        ...bid,
        requirement: reqRes.data?.find(r => r.id === bid.requirement_id) || null,
        transporter: profRes.data?.find(p => p.id === bid.transporter_id) || null,
      }));

      setLogisticsBids(logBidsWithDetails);
    } catch (error) {
      console.error('Error fetching logistics bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSupplierBid = async () => {
    if (!editingBid) return;
    setSaving(true);
    try {
      /**
       * IMPORTANT L1 SAFETY NOTE:
       * supplier_net_price stored here is NOT used for L1 comparison.
       * L1 is ALWAYS calculated dynamically from bid_items using LineItemL1View
       * with comparable-scope logic (only common line items are compared).
       * 
       * This stored value is for:
       * - Display purposes in admin tables
       * - Fallback when bid_items don't exist
       * - Historical audit reference
       */

      let workingBidItems = [...bidItems];
      
      // AUTO-CREATE bid_items from parsed terms if they don't exist
      // This fixes legacy bids that only have terms_and_conditions
      if (workingBidItems.length === 0) {
        const parsedItems = parseItemsFromTerms(editForm.terms_and_conditions);
        
        if (parsedItems.length > 0) {
          // First, get or create a requirement_item for this bid
          // Check if requirement_items exist for this requirement
          const { data: existingReqItems } = await supabase
            .from('requirement_items')
            .select('id, item_name')
            .eq('requirement_id', editingBid.requirement_id);
          
          // Map parsed items to requirement_items (create if needed)
          for (const parsed of parsedItems) {
            // Find matching requirement_item or use first one
            let reqItemId = existingReqItems?.[0]?.id;
            
            // Try to match by item name
            const matchingReqItem = existingReqItems?.find(
              ri => ri.item_name.toLowerCase().includes(parsed.item_name.toLowerCase()) ||
                    parsed.item_name.toLowerCase().includes(ri.item_name.toLowerCase())
            );
            if (matchingReqItem) {
              reqItemId = matchingReqItem.id;
            }
            
            // If no requirement_items exist, create one from the requirement
            if (!reqItemId && editingBid.requirement) {
              const { data: newReqItem, error: reqItemError } = await supabase
                .from('requirement_items')
                .insert({
                  requirement_id: editingBid.requirement_id,
                  item_name: parsed.item_name || editingBid.requirement.title,
                  quantity: parsed.quantity,
                  unit: parsed.unit || editingBid.requirement.unit || 'Tons',
                  category: editingBid.requirement.product_category || 'Other',
                })
                .select('id')
                .single();
              
              if (reqItemError) {
                console.error('Error creating requirement_item:', reqItemError);
                throw new Error('Failed to create requirement item for bid');
              }
              reqItemId = newReqItem.id;
            }
            
            if (reqItemId) {
              // Create bid_item
              const { data: newBidItem, error: bidItemError } = await supabase
                .from('bid_items')
                .insert({
                  bid_id: editingBid.id,
                  requirement_item_id: reqItemId,
                  unit_price: parsed.unit_price,
                  supplier_unit_price: parsed.unit_price,
                  quantity: parsed.quantity,
                  total: parsed.total,
                })
                .select('*')
                .single();
              
              if (bidItemError) {
                console.error('Error creating bid_item:', bidItemError);
                throw new Error('Failed to create bid item');
              }
              
              workingBidItems.push(newBidItem);
            }
          }
          
          toast.info(`Created ${workingBidItems.length} bid items from parsed terms`);
        } else {
          // No parsed items and no bid_items - cannot save due to trigger constraint
          throw new Error('Cannot save bid without line items. Please ensure Terms & Conditions contains properly formatted item details.');
        }
      }

      // Get the current bid items with recalculated totals
      const updatedBidItems = workingBidItems.map(item => ({
        ...item,
        total: item.unit_price * item.quantity, // Ensure total is recalculated
      }));

      // Update bid items (only existing ones, new ones were just created)
      for (const item of updatedBidItems) {
        if (bidItems.some(bi => bi.id === item.id)) {
          const { error: itemError } = await supabase
            .from('bid_items')
            .update({
              unit_price: item.unit_price,
              total: item.total,
            })
            .eq('id', item.id);
          
          if (itemError) throw itemError;
        }
      }

      // Calculate supplier_net_price from the SAME updated items
      // This is what the supplier quoted (sum of unit_price × quantity)
      const supplierNetPrice = updatedBidItems.reduce((sum, item) => sum + item.total, 0);

      // Calculate profit based on trade type: 0.5% domestic, 2% export/import
      const markupRate = getProfitPercentage(editingBid.requirement?.trade_type);
      const markupAmount = Math.round(supplierNetPrice * markupRate);
      const buyerVisiblePrice = supplierNetPrice + markupAmount;
      
      // bid_amount = buyer visible total (includes markup)
      const bidAmount = buyerVisiblePrice;
      const totalAmount = buyerVisiblePrice;

      console.log('Saving bid with values:', {
        bidItems: updatedBidItems.map(i => ({ id: i.id, unit_price: i.unit_price, total: i.total })),
        supplierNetPrice,
        markupRate: `${markupRate * 100}%`,
        tradeType: editingBid.requirement?.trade_type || 'domestic',
        markupAmount,
        buyerVisiblePrice,
      });

      const { error } = await supabase
        .from('bids')
        .update({
          bid_amount: bidAmount,
          supplier_net_price: supplierNetPrice,
          buyer_visible_price: buyerVisiblePrice,
          markup_amount: markupAmount,
          markup_percentage: markupRate * 100,
          service_fee: 0, // No fee deducted from supplier
          total_amount: totalAmount,
          delivery_timeline_days: editForm.delivery_timeline_days,
          status: editForm.status as 'pending' | 'accepted' | 'rejected',
          terms_and_conditions: editForm.terms_and_conditions || null,
        })
        .eq('id', editingBid.id);

      if (error) throw error;

      toast.success('Bid updated successfully');
      setEditingBid(null);
      setBidItems([]); // Reset bid items state
      fetchSupplierBids();
      fetchTabCounts();
    } catch (error: any) {
      console.error('Error updating bid:', error);
      toast.error(error.message || 'Failed to update bid');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLogisticsBid = async () => {
    if (!editingLogisticsBid) return;
    setSaving(true);
    try {
      const totalAmount = editLogisticsForm.bid_amount + editLogisticsForm.service_fee;
      const { error } = await supabase
        .from('logistics_bids')
        .update({
          bid_amount: editLogisticsForm.bid_amount,
          service_fee: editLogisticsForm.service_fee,
          total_amount: totalAmount,
          rate_per_unit: editLogisticsForm.rate_per_unit || null,
          estimated_transit_days: editLogisticsForm.estimated_transit_days,
          status: editLogisticsForm.status as 'pending' | 'accepted' | 'rejected',
          terms_and_conditions: editLogisticsForm.terms_and_conditions || null,
        })
        .eq('id', editingLogisticsBid.id);

      if (error) throw error;

      toast.success('Logistics bid updated successfully');
      setEditingLogisticsBid(null);
      fetchLogisticsBids();
      fetchTabCounts();
    } catch (error: any) {
      console.error('Error updating logistics bid:', error);
      toast.error(error.message || 'Failed to update logistics bid');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'outline', label: 'Pending' },
      accepted: { variant: 'default', label: 'Accepted' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredSupplierBids = bids.filter(bid => {
    const matchesSearch = search === '' ||
      bid.requirement?.title.toLowerCase().includes(search.toLowerCase()) ||
      bid.supplier?.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bid.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredLogisticsBids = logisticsBids.filter(bid => {
    const matchesSearch = search === '' ||
      bid.requirement?.title.toLowerCase().includes(search.toLowerCase()) ||
      bid.transporter?.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bid.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const currentPage = activeTab === 'supplier' ? supplierPage : logisticsPage;
  const setCurrentPage = activeTab === 'supplier' ? setSupplierPage : setLogisticsPage;
  const totalCount = activeTab === 'supplier' ? supplierTotal : logisticsTotal;
  const totalPages = Math.ceil(totalCount / pageSize);

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, 'ellipsis', currentPage, 'ellipsis', totalPages);
      }
    }
    return pages;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              All Bids
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by requirement or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted (Awarded)</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="supplier" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Supplier Bids ({tabCounts.supplier})
              </TabsTrigger>
              <TabsTrigger value="logistics" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Logistics Bids ({tabCounts.logistics})
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                L1 Comparison ({tabCounts.comparison})
              </TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <TabsContent value="supplier" className="flex-1 overflow-auto mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requirement</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Supplier Total</TableHead>
                        <TableHead>Bidded Amount</TableHead>
                        <TableHead>Profit</TableHead>
                        <TableHead>Dispatched</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSupplierBids.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No bids found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSupplierBids.map((bid) => {
                          const qty = bid.requirement?.quantity || 1;
                          const unit = bid.requirement?.unit || 'unit';
                          const dispatchedQty = bid.dispatched_qty || 0;
                          
                          // Calculate from bid_items if available (correct calculation)
                          // Supplier Total = sum of (unit_price × quantity) for all line items
                          // Profit = based on trade type: 0.5% domestic, 2% export/import
                          const hasBidItems = bid.bid_items && bid.bid_items.length > 0;
                          const profitPct = getProfitPercentage(bid.requirement?.trade_type);
                          
                          let supplierTotal: number;
                          let profitTotal: number;
                          
                          if (hasBidItems) {
                            // Calculate from bid_items - use unit_price × quantity (not item.total which may be stored incorrectly)
                            supplierTotal = bid.bid_items!.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
                            // Profit based on trade type
                            profitTotal = bid.bid_items!.reduce((sum, item) => {
                              const profitPerUnit = Math.round(item.unit_price * profitPct);
                              return sum + (profitPerUnit * item.quantity);
                            }, 0);
                          } else {
                            // Fallback: try parsing from terms_and_conditions
                            const parsedItems = parseItemsFromTerms(bid.terms_and_conditions);
                            if (parsedItems.length > 0) {
                              supplierTotal = parsedItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
                              profitTotal = parsedItems.reduce((sum, item) => {
                                const profitPerUnit = Math.round(item.unit_price * profitPct);
                                return sum + (profitPerUnit * item.quantity);
                              }, 0);
                            } else {
                              // Final fallback to database values
                              supplierTotal = bid.supplier_net_price || bid.bid_amount || 0;
                              profitTotal = bid.markup_amount || Math.round(supplierTotal * profitPct);
                            }
                          }
                          
                          const buyerTotal = supplierTotal + profitTotal;
                          
                          // Calculate dispatched values proportionally
                          const dispatchRatio = dispatchedQty / qty;
                          const dispatchedSupplierValue = supplierTotal * dispatchRatio;
                          const dispatchedProfit = profitTotal * dispatchRatio;
                          const dispatchedBuyerValue = buyerTotal * dispatchRatio;
                          const referrerAmount = dispatchedProfit * 0.2; // 20% referrer share

                          /**
                           * L1 RULE:
                           * - L1 is calculated ONLY on common line items (comparable scope)
                           * - Supplier totals are NOT used for L1 determination
                           * - Supplier tab NEVER decides L1 - it's for visibility/editing/dispatch only
                           * - Comparison tab (LineItemL1View) is the SINGLE SOURCE OF TRUTH for L1
                           */

                          return (
                            <TableRow key={bid.id}>
                              <TableCell className="font-medium max-w-[160px]">
                                <div className="truncate" title={bid.requirement?.title}>
                                  {bid.requirement?.title || '-'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {qty.toFixed(2)} {unit} • {bid.requirement?.product_category}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium truncate max-w-[120px]">
                                    {bid.supplier?.company_name || '-'}
                                    {/* L1 badge intentionally removed.
                                        L1 is calculated only in Comparison tab
                                        using line-item comparable logic (LineItemL1View) */}
                                  </div>
                                  <div className="text-muted-foreground text-xs truncate">{bid.supplier?.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">₹{Math.round(supplierTotal).toLocaleString()}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">₹{Math.round(buyerTotal).toLocaleString()}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="text-success font-medium">₹{profitTotal.toLocaleString()}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {dispatchedQty > 0 ? (
                                  <div className="text-sm space-y-0.5">
                                    <div className="font-medium">{dispatchedQty.toFixed(2)} {unit}</div>
                                    <div className="text-xs text-muted-foreground">
                                      Buyer: ₹{dispatchedBuyerValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Supplier: ₹{dispatchedSupplierValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-xs text-success">
                                      Profit: ₹{dispatchedProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-xs text-orange-500">
                                      Referrer (20%): ₹{referrerAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {getStatusBadge(bid.status)}
                                  {/* Commission Lock Display - Read-only for accepted bids */}
                                  {bid.status === 'accepted' && bid.awarded_commission_pct !== null && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      <span className="text-orange-600 font-medium">
                                        🔒 {bid.awarded_commission_pct}% (₹{Math.round(bid.awarded_commission_value || 0).toLocaleString()})
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs">
                                <div>
                                  <div>{format(new Date(getDisplayDate(bid).date), 'dd MMM yy')}</div>
                                  <div className="text-muted-foreground">{getDisplayDate(bid).label}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingBid(bid)}
                                  title="Edit Bid"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="logistics" className="flex-1 overflow-auto mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requirement</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Transporter</TableHead>
                        <TableHead>Bid Amount</TableHead>
                        <TableHead>Profit</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Transit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogisticsBids.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                            No logistics bids found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogisticsBids.map((bid) => {
                          const bidExclGst = bid.bid_amount / 1.18;
                          const bidGst = bid.bid_amount - bidExclGst;
                          const serviceFeeExclGst = bid.service_fee / 1.18;
                          const totalExclGst = bid.total_amount / 1.18;
                          const totalGst = bid.total_amount - totalExclGst;
                          
                          return (
                            <TableRow key={bid.id}>
                              <TableCell className="font-medium max-w-[150px] truncate" title={bid.requirement?.title}>
                                {bid.requirement?.title || '-'}
                              </TableCell>
                              <TableCell className="text-sm">
                                {bid.requirement ? (
                                  <span>{bid.requirement.pickup_location} → {bid.requirement.delivery_location}</span>
                                ) : '-'}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{bid.transporter?.company_name || '-'}</div>
                                  <div className="text-muted-foreground text-xs">{bid.transporter?.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">₹{bid.bid_amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="text-success">₹{bid.service_fee.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">₹{bid.total_amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                </div>
                              </TableCell>
                              <TableCell>{bid.estimated_transit_days} days</TableCell>
                              <TableCell>{getStatusBadge(bid.status)}</TableCell>
                              <TableCell className="text-xs">
                                <div>
                                  <div>{format(new Date(getDisplayDate(bid).date), 'dd MMM yy')}</div>
                                  <div className="text-muted-foreground">{getDisplayDate(bid).label}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingLogisticsBid(bid)}
                                  title="Edit Bid"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="comparison" className="flex-1 overflow-auto mt-4">
                  <div className="space-y-4">
                    {/* Requirement Selector */}
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                      <Label className="text-sm font-medium whitespace-nowrap">Select Requirement:</Label>
                      <Select 
                        value={selectedRequirementId || ''} 
                        onValueChange={setSelectedRequirementId}
                      >
                        <SelectTrigger className="w-full max-w-md">
                          <SelectValue placeholder="Choose a requirement..." />
                        </SelectTrigger>
                        <SelectContent>
                          {requirements.map(req => (
                            <SelectItem key={req.id} value={req.id}>
                              <span className="truncate">{req.title}</span>
                              <Badge variant="outline" className="ml-2 text-xs">{req.product_category}</Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* L1 Comparison View */}
                    {selectedRequirementId ? (
                      <LineItemL1View 
                        requirementId={selectedRequirementId} 
                        tradeType={requirements.find(r => r.id === selectedRequirementId)?.trade_type}
                        showAllSuppliers={true}
                      />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        Select a requirement to view L1 comparison
                      </div>
                    )}
                  </div>
                </TabsContent>

                {totalPages > 1 && activeTab !== 'comparison' && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                      </p>
                      <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAGE_SIZE_OPTIONS.map(size => (
                            <SelectItem key={size} value={size.toString()}>{size} / page</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {getPageNumbers().map((page, idx) =>
                          page === 'ellipsis' ? (
                            <PaginationItem key={`ellipsis-${idx}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        )}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Bid Dialog */}
      <Dialog open={!!editingBid} onOpenChange={(open) => !open && setEditingBid(null)}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Supplier Bid
            </DialogTitle>
          </DialogHeader>

          {editingBid && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="font-medium">{editingBid.requirement?.title}</p>
                <p className="text-muted-foreground">{editingBid.supplier?.company_name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Trade Type: <span className="font-medium">{editingBid.requirement?.trade_type || 'Domestic'}</span>
                  {' • '}Profit: <span className="font-medium text-success">{editingBid.requirement?.trade_type?.toLowerCase() === 'export' || editingBid.requirement?.trade_type?.toLowerCase() === 'import' ? '2%' : '0.5%'}</span>
                </p>
              </div>

              {/* Line Items Section */}
              {loadingBidItems ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading line items...</span>
                </div>
              ) : (() => {
                // Get profit percentage based on trade type
                const profitPct = getProfitPercentage(editingBid.requirement?.trade_type);
                
                // Try to use bid_items, fallback to parsing from terms_and_conditions
                const displayItems = bidItems.length > 0 
                  ? bidItems 
                  : parseItemsFromTerms(editForm.terms_and_conditions).map((pi, idx) => ({
                      id: `parsed-${idx}`,
                      bid_id: editingBid.id,
                      requirement_item_id: '',
                      unit_price: pi.unit_price,
                      quantity: pi.quantity,
                      total: pi.total,
                      item_name: pi.item_name,
                      unit: pi.unit,
                    }));
                
                const isParsed = bidItems.length === 0 && displayItems.length > 0;
                
                return displayItems.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Line Items ({displayItems.length} items)
                      {isParsed && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                          ⚠️ Parsed view only – create bid items to edit
                        </Badge>
                      )}
                    </Label>
                    {isParsed && (
                      <p className="text-xs text-destructive">
                        These items are parsed from Terms & Conditions. Editing is disabled. 
                        To enable editing, the supplier must submit via the bid form to create proper bid_items.
                      </p>
                    )}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted sticky top-0 z-10">
                            <tr>
                              <th className="text-xs py-2 px-2 text-left font-medium bg-muted">Item</th>
                              <th className="text-xs py-2 px-2 text-right font-medium bg-muted">Rate (₹)</th>
                              <th className="text-xs py-2 px-2 text-right font-medium bg-muted">Qty</th>
                              <th className="text-xs py-2 px-2 text-right font-medium bg-muted">Supplier Total (₹)</th>
                              <th className="text-xs py-2 px-2 text-right font-medium bg-muted">Profit/Ton (₹)</th>
                              <th className="text-xs py-2 px-2 text-right font-medium bg-muted">Bid Amt/Unit (₹)</th>
                              <th className="text-xs py-2 px-2 text-right font-medium bg-muted">Profit Total (₹)</th>
                              <th className="text-xs py-2 px-2 text-right font-medium bg-muted">Buyer Amt (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayItems.map((item, idx) => {
                              const profitPerUnit = Math.round(item.unit_price * profitPct); // profit per unit based on trade type
                              const supplierTotal = item.unit_price * item.quantity; // Rate × Qty
                              const profitTotal = profitPerUnit * item.quantity; // Profit × Qty
                              const bidAmountPerUnit = item.unit_price + profitPerUnit; // Rate + Profit per unit
                              const buyerTotal = bidAmountPerUnit * item.quantity; // Buyer visible total
                              return (
                                <tr key={item.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                  <td className="text-xs py-2 px-2 max-w-[120px]">
                                    <span className="line-clamp-2" title={item.item_name}>
                                      {item.item_name}
                                    </span>
                                  </td>
                                  <td className="text-xs py-2 px-2 text-right">
                                    {isParsed ? (
                                      <span>₹{item.unit_price.toLocaleString()}</span>
                                    ) : (
                                      <Input
                                        type="number"
                                        className="w-20 h-7 text-xs text-right ml-auto"
                                        value={item.unit_price}
                                        onChange={(e) => {
                                          const newPrice = Number(e.target.value) || 0;
                                          setBidItems(prev => prev.map(bi => 
                                            bi.id === item.id 
                                              ? { ...bi, unit_price: newPrice, total: newPrice * bi.quantity }
                                              : bi
                                          ));
                                        }}
                                      />
                                    )}
                                  </td>
                                  <td className="text-xs py-2 px-2 text-right whitespace-nowrap">
                                    {item.quantity}
                                  </td>
                                  <td className="text-xs py-2 px-2 text-right whitespace-nowrap">
                                    ₹{Math.round(supplierTotal).toLocaleString()}
                                  </td>
                                  <td className="text-xs py-2 px-2 text-right whitespace-nowrap text-muted-foreground">
                                    ₹{profitPerUnit.toLocaleString()}
                                  </td>
                                  <td className="text-xs py-2 px-2 text-right whitespace-nowrap font-medium text-primary">
                                    ₹{bidAmountPerUnit.toLocaleString()}
                                  </td>
                                  <td className="text-xs py-2 px-2 text-right whitespace-nowrap text-success">
                                    ₹{Math.round(profitTotal).toLocaleString()}
                                  </td>
                                  <td className="text-xs py-2 px-2 text-right font-medium whitespace-nowrap">
                                    ₹{Math.round(buyerTotal).toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-muted/50 font-medium border-t">
                            <tr>
                              <td colSpan={3} className="text-xs py-2 px-2 text-right">
                                Totals:
                              </td>
                              <td className="text-xs py-2 px-2 text-right">
                                ₹{Math.round(displayItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)).toLocaleString()}
                              </td>
                              <td className="text-xs py-2 px-2 text-right text-muted-foreground">
                                -
                              </td>
                              <td className="text-xs py-2 px-2 text-right text-muted-foreground">
                                -
                              </td>
                              <td className="text-xs py-2 px-2 text-right text-success">
                                ₹{Math.round(displayItems.reduce((sum, item) => sum + (Math.round(item.unit_price * profitPct) * item.quantity), 0)).toLocaleString()}
                              </td>
                              <td className="text-xs py-2 px-2 text-right font-bold">
                                ₹{Math.round(displayItems.reduce((sum, item) => {
                                  const profitPerUnit = Math.round(item.unit_price * profitPct);
                                  const bidAmtPerUnit = item.unit_price + profitPerUnit;
                                  return sum + (bidAmtPerUnit * item.quantity);
                                }, 0)).toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/30 p-3 rounded-lg text-sm text-muted-foreground text-center">
                    No line items found for this bid
                  </div>
                );
              })()}

              {(() => {
                // Get profit percentage based on trade type
                const profitPct = getProfitPercentage(editingBid.requirement?.trade_type);
                
                // Get display items (bid_items or parsed from terms)
                const displayItems = bidItems.length > 0 
                  ? bidItems 
                  : parseItemsFromTerms(editForm.terms_and_conditions);
                const hasItems = displayItems.length > 0;
                
                const supplierTotalCalc = hasItems
                  ? Math.round(displayItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0))
                  : editForm.bid_amount;
                
                const profitCalc = hasItems
                  ? Math.round(displayItems.reduce((sum, item) => sum + (Math.round(item.unit_price * profitPct) * item.quantity), 0))
                  : editForm.service_fee;
                
                const buyerAmtCalc = hasItems
                  ? Math.round(displayItems.reduce((sum, item) => {
                      const profitPerUnit = Math.round(item.unit_price * profitPct);
                      const buyerAmtPerUnit = item.unit_price + profitPerUnit;
                      return sum + (buyerAmtPerUnit * item.quantity);
                    }, 0))
                  : (editForm.bid_amount + editForm.service_fee);
                
                return (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Supplier Total (₹)</Label>
                      <Input
                        type="number"
                        value={supplierTotalCalc}
                        onChange={(e) => setEditForm(f => ({ ...f, bid_amount: Number(e.target.value) }))}
                        readOnly={hasItems}
                        className={hasItems ? "bg-muted" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bidded Amount (₹)</Label>
                      <Input
                        type="number"
                        value={buyerAmtCalc}
                        readOnly
                        className="bg-muted font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Profit (₹)</Label>
                      <Input
                        type="number"
                        value={profitCalc}
                        onChange={(e) => setEditForm(f => ({ ...f, service_fee: Number(e.target.value) }))}
                        readOnly={hasItems}
                        className={hasItems ? "bg-muted" : ""}
                      />
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Delivery Timeline (days)</Label>
                  <Input
                    type="number"
                    value={editForm.delivery_timeline_days}
                    onChange={(e) => setEditForm(f => ({ ...f, delivery_timeline_days: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={editForm.terms_and_conditions}
                  onChange={(e) => setEditForm(f => ({ ...f, terms_and_conditions: e.target.value }))}
                  rows={3}
                />
              </div>

              {(() => {
                const displayItems = bidItems.length > 0 
                  ? bidItems 
                  : parseItemsFromTerms(editForm.terms_and_conditions);
                const supplierTotalFinal = displayItems.length > 0
                  ? Math.round(displayItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0))
                  : editForm.bid_amount;
                
                return (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Supplier Total:</span>
                      <span className="font-bold">
                        ₹{supplierTotalFinal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBid(null)}>Cancel</Button>
            <Button onClick={handleSaveSupplierBid} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Logistics Bid Dialog */}
      <Dialog open={!!editingLogisticsBid} onOpenChange={(open) => !open && setEditingLogisticsBid(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Logistics Bid
            </DialogTitle>
          </DialogHeader>

          {editingLogisticsBid && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="font-medium">{editingLogisticsBid.requirement?.title}</p>
                <p className="text-muted-foreground">
                  {editingLogisticsBid.requirement?.pickup_location} → {editingLogisticsBid.requirement?.delivery_location}
                </p>
                <p className="text-muted-foreground">{editingLogisticsBid.transporter?.company_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bid Amount (₹)</Label>
                  <Input
                    type="number"
                    value={editLogisticsForm.bid_amount}
                    onChange={(e) => setEditLogisticsForm(f => ({ ...f, bid_amount: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Profit (₹)</Label>
                  <Input
                    type="number"
                    value={editLogisticsForm.service_fee}
                    onChange={(e) => setEditLogisticsForm(f => ({ ...f, service_fee: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rate Per Unit (₹)</Label>
                  <Input
                    type="number"
                    value={editLogisticsForm.rate_per_unit}
                    onChange={(e) => setEditLogisticsForm(f => ({ ...f, rate_per_unit: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Transit Days</Label>
                  <Input
                    type="number"
                    value={editLogisticsForm.estimated_transit_days}
                    onChange={(e) => setEditLogisticsForm(f => ({ ...f, estimated_transit_days: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editLogisticsForm.status} onValueChange={(v) => setEditLogisticsForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={editLogisticsForm.terms_and_conditions}
                  onChange={(e) => setEditLogisticsForm(f => ({ ...f, terms_and_conditions: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Total Amount:</span>
                  <span className="font-bold">₹{(editLogisticsForm.bid_amount + editLogisticsForm.service_fee).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLogisticsBid(null)}>Cancel</Button>
            <Button onClick={handleSaveLogisticsBid} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
