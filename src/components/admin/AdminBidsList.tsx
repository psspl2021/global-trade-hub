import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Gavel, Package, Truck } from 'lucide-react';
import { format } from 'date-fns';

interface Bid {
  id: string;
  bid_amount: number;
  service_fee: number;
  total_amount: number;
  delivery_timeline_days: number;
  status: string;
  created_at: string;
  requirement: {
    title: string;
    product_category: string;
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

export function AdminBidsList({ open, onOpenChange }: AdminBidsListProps) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [logisticsBids, setLogisticsBids] = useState<LogisticsBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('supplier');

  useEffect(() => {
    if (open) {
      fetchAllBids();
    }
  }, [open]);

  const fetchAllBids = async () => {
    setLoading(true);
    try {
      // Fetch supplier bids
      const { data: supplierBids } = await supabase
        .from('bids')
        .select('*')
        .order('created_at', { ascending: false });

      if (supplierBids) {
        const reqIds = [...new Set(supplierBids.map(b => b.requirement_id))];
        const supplierIds = [...new Set(supplierBids.map(b => b.supplier_id))];

        const [reqRes, profRes] = await Promise.all([
          supabase.from('requirements').select('id, title, product_category').in('id', reqIds),
          supabase.from('profiles').select('id, company_name, email').in('id', supplierIds),
        ]);

        const bidsWithDetails: Bid[] = supplierBids.map(bid => ({
          ...bid,
          requirement: reqRes.data?.find(r => r.id === bid.requirement_id) || null,
          supplier: profRes.data?.find(p => p.id === bid.supplier_id) || null,
        }));

        setBids(bidsWithDetails);
      }

      // Fetch logistics bids
      const { data: logBids } = await supabase
        .from('logistics_bids')
        .select('*')
        .order('created_at', { ascending: false });

      if (logBids) {
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
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
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

  return (
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
              Supplier Bids ({bids.length})
            </TabsTrigger>
            <TabsTrigger value="logistics" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Logistics Bids ({logisticsBids.length})
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
                      <TableHead>Category</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Bid Amount</TableHead>
                      <TableHead>Service Fee</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
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
                      filteredSupplierBids.map((bid) => (
                        <TableRow key={bid.id}>
                          <TableCell className="font-medium max-w-[180px] truncate" title={bid.requirement?.title}>
                            {bid.requirement?.title || '-'}
                          </TableCell>
                          <TableCell>{bid.requirement?.product_category || '-'}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{bid.supplier?.company_name || '-'}</div>
                              <div className="text-muted-foreground text-xs">{bid.supplier?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>₹{bid.bid_amount.toLocaleString()}</TableCell>
                          <TableCell>₹{bid.service_fee.toLocaleString()}</TableCell>
                          <TableCell className="font-medium">₹{bid.total_amount.toLocaleString()}</TableCell>
                          <TableCell>{bid.delivery_timeline_days} days</TableCell>
                          <TableCell>{getStatusBadge(bid.status)}</TableCell>
                          <TableCell>{format(new Date(bid.created_at), 'dd MMM yyyy')}</TableCell>
                        </TableRow>
                      ))
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogisticsBids.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
