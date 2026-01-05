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
import { Loader2, Search, Gavel, Package, Truck, Pencil } from 'lucide-react';
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
  terms_and_conditions: string | null;
  requirement_id: string;
  requirement: {
    title: string;
    product_category: string;
    quantity: number;
    unit: string;
  } | null;
  supplier: {
    company_name: string;
    email: string;
  } | null;
}

interface LogisticsBid {
  id: string;
  bid_amount: number;
  service_fee: number;
  total_amount: number;
  estimated_transit_days: number;
  status: string;
  created_at: string;
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

export function AdminBidsList({ open, onOpenChange }: AdminBidsListProps) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [logisticsBids, setLogisticsBids] = useState<LogisticsBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('supplier');
  
  const [supplierPage, setSupplierPage] = useState(1);
  const [supplierTotal, setSupplierTotal] = useState(0);
  const [logisticsPage, setLogisticsPage] = useState(1);
  const [logisticsTotal, setLogisticsTotal] = useState(0);
  const [tabCounts, setTabCounts] = useState({ supplier: 0, logistics: 0 });
  const [pageSize, setPageSize] = useState(15);

  // Edit state
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [editingLogisticsBid, setEditingLogisticsBid] = useState<LogisticsBid | null>(null);
  const [saving, setSaving] = useState(false);

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
      } else {
        fetchLogisticsBids();
      }
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

  const fetchTabCounts = async () => {
    try {
      const [{ count: sCount }, { count: lCount }] = await Promise.all([
        supabase.from('bids').select('*', { count: 'exact', head: true }),
        supabase.from('logistics_bids').select('*', { count: 'exact', head: true }),
      ]);
      setTabCounts({ supplier: sCount || 0, logistics: lCount || 0 });
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

      const reqIds = [...new Set(supplierBids.map(b => b.requirement_id))];
      const supplierIds = [...new Set(supplierBids.map(b => b.supplier_id))];

      const [reqRes, profRes] = await Promise.all([
        supabase.from('requirements').select('id, title, product_category, quantity, unit').in('id', reqIds),
        supabase.from('profiles').select('id, company_name, email').in('id', supplierIds),
      ]);

      const bidsWithDetails: Bid[] = supplierBids.map(bid => ({
        ...bid,
        requirement: reqRes.data?.find(r => r.id === bid.requirement_id) || null,
        supplier: profRes.data?.find(p => p.id === bid.supplier_id) || null,
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
      const totalAmount = editForm.bid_amount + editForm.service_fee;
      const { error } = await supabase
        .from('bids')
        .update({
          bid_amount: editForm.bid_amount,
          service_fee: editForm.service_fee,
          total_amount: totalAmount,
          delivery_timeline_days: editForm.delivery_timeline_days,
          status: editForm.status as 'pending' | 'accepted' | 'rejected',
          terms_and_conditions: editForm.terms_and_conditions || null,
        })
        .eq('id', editingBid.id);

      if (error) throw error;

      toast.success('Bid updated successfully');
      setEditingBid(null);
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
    return search === '' ||
      bid.requirement?.title.toLowerCase().includes(search.toLowerCase()) ||
      bid.supplier?.company_name.toLowerCase().includes(search.toLowerCase());
  });

  const filteredLogisticsBids = logisticsBids.filter(bid => {
    return search === '' ||
      bid.requirement?.title.toLowerCase().includes(search.toLowerCase()) ||
      bid.transporter?.company_name.toLowerCase().includes(search.toLowerCase());
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

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by requirement or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="supplier" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Supplier Bids ({tabCounts.supplier})
              </TabsTrigger>
              <TabsTrigger value="logistics" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Logistics Bids ({tabCounts.logistics})
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
                        <TableHead>Supplier Amount</TableHead>
                        <TableHead>Buyer Amount</TableHead>
                        <TableHead>Platform Fee</TableHead>
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
                          
                          // Calculate per-unit rate based on taxable value (excluding GST)
                          const taxableValue = parseTaxableFromTerms(bid.terms_and_conditions);
                          const gstAmount = taxableValue > 0 
                            ? bid.supplier_net_price - taxableValue 
                            : bid.supplier_net_price - (bid.supplier_net_price / 1.18);
                          const supplierRatePerUnit = taxableValue > 0 
                            ? taxableValue / qty 
                            : (bid.supplier_net_price / 1.18) / qty; // Fallback: remove 18% GST
                          const ratePerUnit = supplierRatePerUnit * 1.005; // Add 0.5% markup for buyer rate
                          const markupPerUnit = (bid.markup_amount || 0) / qty;
                          
                          // Calculate dispatched values
                          const dispatchedBuyerValue = ratePerUnit * dispatchedQty;
                          const dispatchedSupplierValue = supplierRatePerUnit * dispatchedQty;
                          const dispatchedPlatformFee = markupPerUnit * dispatchedQty;
                          const referrerAmount = dispatchedPlatformFee * 0.2; // 20% referrer share

                          return (
                            <TableRow key={bid.id}>
                              <TableCell className="font-medium max-w-[160px]">
                                <div className="truncate" title={bid.requirement?.title}>
                                  {bid.requirement?.title || '-'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {qty} {unit} • {bid.requirement?.product_category}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium truncate max-w-[120px]">{bid.supplier?.company_name || '-'}</div>
                                  <div className="text-muted-foreground text-xs truncate">{bid.supplier?.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>₹{(taxableValue || bid.supplier_net_price / 1.18).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                  <div className="text-xs text-muted-foreground">₹{supplierRatePerUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })}/{unit}</div>
                                  <div className="text-xs text-blue-600">+GST: ₹{gstAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">₹{bid.buyer_visible_price.toLocaleString()}</div>
                                  <div className="text-xs text-muted-foreground">₹{ratePerUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })}/{unit}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="text-success font-medium">₹{(bid.markup_amount || 0).toLocaleString()}</div>
                                  <div className="text-xs text-muted-foreground">₹{markupPerUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })}/{unit}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {dispatchedQty > 0 ? (
                                  <div className="text-sm space-y-0.5">
                                    <div className="font-medium">{dispatchedQty} {unit}</div>
                                    <div className="text-xs text-muted-foreground">
                                      Buyer: ₹{dispatchedBuyerValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Supplier: ₹{dispatchedSupplierValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-xs text-success">
                                      Fee: ₹{dispatchedPlatformFee.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-xs text-orange-500">
                                      Referrer (20%): ₹{referrerAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </TableCell>
                              <TableCell>{getStatusBadge(bid.status)}</TableCell>
                              <TableCell className="text-xs">{format(new Date(bid.created_at), 'dd MMM yy')}</TableCell>
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
                        <TableHead>Service Fee</TableHead>
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
                        filteredLogisticsBids.map((bid) => (
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
                            <TableCell>₹{bid.bid_amount.toLocaleString()}</TableCell>
                            <TableCell>₹{bid.service_fee.toLocaleString()}</TableCell>
                            <TableCell className="font-medium">₹{bid.total_amount.toLocaleString()}</TableCell>
                            <TableCell>{bid.estimated_transit_days} days</TableCell>
                            <TableCell>{getStatusBadge(bid.status)}</TableCell>
                            <TableCell>{format(new Date(bid.created_at), 'dd MMM yyyy')}</TableCell>
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
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                {totalPages > 1 && (
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Supplier Bid
            </DialogTitle>
          </DialogHeader>

          {editingBid && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="font-medium">{editingBid.requirement?.title}</p>
                <p className="text-muted-foreground">{editingBid.supplier?.company_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bid Amount (₹)</Label>
                  <Input
                    type="number"
                    value={editForm.bid_amount}
                    onChange={(e) => setEditForm(f => ({ ...f, bid_amount: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Service Fee (₹)</Label>
                  <Input
                    type="number"
                    value={editForm.service_fee}
                    onChange={(e) => setEditForm(f => ({ ...f, service_fee: Number(e.target.value) }))}
                  />
                </div>
              </div>

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

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Total Amount:</span>
                  <span className="font-bold">₹{editForm.bid_amount.toLocaleString()}</span>
                </div>
              </div>
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
                  <Label>Service Fee (₹)</Label>
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
