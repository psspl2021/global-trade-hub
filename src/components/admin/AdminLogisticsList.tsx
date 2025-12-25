import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Truck, Warehouse, FileText } from 'lucide-react';
import { format } from 'date-fns';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

interface Vehicle {
  id: string;
  registration_number: string;
  vehicle_type: string;
  capacity_tons: number | null;
  manufacturer: string | null;
  model: string | null;
  verification_status: string;
  is_available: boolean;
  created_at: string;
  partner: {
    company_name: string;
    email: string;
  } | null;
}

interface WarehouseData {
  id: string;
  name: string;
  city: string;
  state: string;
  warehouse_type: string | null;
  total_area_sqft: number;
  available_area_sqft: number;
  rental_rate_per_sqft: number | null;
  is_active: boolean;
  created_at: string;
  partner: {
    company_name: string;
    email: string;
  } | null;
}

interface LogisticsRequirement {
  id: string;
  title: string;
  material_type: string;
  quantity: number;
  unit: string;
  pickup_location: string;
  delivery_location: string;
  status: string;
  pickup_date: string;
  delivery_deadline: string;
  created_at: string;
  customer: {
    company_name: string;
    email: string;
  } | null;
}

interface AdminLogisticsListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];

export function AdminLogisticsList({ open, onOpenChange }: AdminLogisticsListProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [requirements, setRequirements] = useState<LogisticsRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('vehicles');

  const [vehiclesPage, setVehiclesPage] = useState(1);
  const [vehiclesTotal, setVehiclesTotal] = useState(0);
  const [warehousesPage, setWarehousesPage] = useState(1);
  const [warehousesTotal, setWarehousesTotal] = useState(0);
  const [requirementsPage, setRequirementsPage] = useState(1);
  const [requirementsTotal, setRequirementsTotal] = useState(0);
  const [tabCounts, setTabCounts] = useState({ vehicles: 0, warehouses: 0, requirements: 0 });
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    if (open) {
      fetchTabCounts();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (activeTab === 'vehicles') {
        fetchVehicles();
      } else if (activeTab === 'warehouses') {
        fetchWarehouses();
      } else {
        fetchRequirements();
      }
    }
  }, [open, activeTab, vehiclesPage, warehousesPage, requirementsPage, pageSize]);

  useEffect(() => {
    setVehiclesPage(1);
    setWarehousesPage(1);
    setRequirementsPage(1);
  }, [search, pageSize]);

  const fetchTabCounts = async () => {
    try {
      const [{ count: vCount }, { count: wCount }, { count: rCount }] = await Promise.all([
        supabase.from('vehicles').select('*', { count: 'exact', head: true }),
        supabase.from('warehouses').select('*', { count: 'exact', head: true }),
        supabase.from('logistics_requirements').select('*', { count: 'exact', head: true }),
      ]);
      setTabCounts({ vehicles: vCount || 0, warehouses: wCount || 0, requirements: rCount || 0 });
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const from = (vehiclesPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: vehicleData, count } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!vehicleData) {
        setVehicles([]);
        setVehiclesTotal(0);
        return;
      }

      setVehiclesTotal(count || 0);

      const partnerIds = [...new Set(vehicleData.map(v => v.partner_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, company_name, email')
        .in('id', partnerIds);

      const vehiclesWithPartners: Vehicle[] = vehicleData.map(v => ({
        ...v,
        partner: profiles?.find(p => p.id === v.partner_id) || null,
      }));
      setVehicles(vehiclesWithPartners);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const from = (warehousesPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: warehouseData, count } = await supabase
        .from('warehouses')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!warehouseData) {
        setWarehouses([]);
        setWarehousesTotal(0);
        return;
      }

      setWarehousesTotal(count || 0);

      const partnerIds = [...new Set(warehouseData.map(w => w.partner_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, company_name, email')
        .in('id', partnerIds);

      const warehousesWithPartners: WarehouseData[] = warehouseData.map(w => ({
        ...w,
        partner: profiles?.find(p => p.id === w.partner_id) || null,
      }));
      setWarehouses(warehousesWithPartners);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const from = (requirementsPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: reqData, count } = await supabase
        .from('logistics_requirements')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!reqData) {
        setRequirements([]);
        setRequirementsTotal(0);
        return;
      }

      setRequirementsTotal(count || 0);

      const customerIds = [...new Set(reqData.map(r => r.customer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, company_name, email')
        .in('id', customerIds);

      const reqsWithCustomers: LogisticsRequirement[] = reqData.map(r => ({
        ...r,
        customer: profiles?.find(p => p.id === r.customer_id) || null,
      }));
      setRequirements(reqsWithCustomers);
    } catch (error) {
      console.error('Error fetching requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'outline', label: 'Pending' },
      verified: { variant: 'default', label: 'Verified' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      active: { variant: 'default', label: 'Active' },
      closed: { variant: 'secondary', label: 'Closed' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredVehicles = vehicles.filter(v =>
    search === '' ||
    v.registration_number.toLowerCase().includes(search.toLowerCase()) ||
    v.partner?.company_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredWarehouses = warehouses.filter(w =>
    search === '' ||
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.city.toLowerCase().includes(search.toLowerCase()) ||
    w.partner?.company_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRequirements = requirements.filter(r =>
    search === '' ||
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.pickup_location.toLowerCase().includes(search.toLowerCase()) ||
    r.customer?.company_name.toLowerCase().includes(search.toLowerCase())
  );

  const getCurrentPageData = () => {
    switch (activeTab) {
      case 'vehicles':
        return { page: vehiclesPage, setPage: setVehiclesPage, total: vehiclesTotal };
      case 'warehouses':
        return { page: warehousesPage, setPage: setWarehousesPage, total: warehousesTotal };
      default:
        return { page: requirementsPage, setPage: setRequirementsPage, total: requirementsTotal };
    }
  };

  const { page: currentPage, setPage: setCurrentPage, total: totalCount } = getCurrentPageData();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Logistics Overview
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Vehicles ({tabCounts.vehicles})
            </TabsTrigger>
            <TabsTrigger value="warehouses" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Warehouses ({tabCounts.warehouses})
            </TabsTrigger>
            <TabsTrigger value="requirements" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Requirements ({tabCounts.requirements})
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="vehicles" className="flex-1 overflow-auto mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registration</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Make/Model</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No vehicles found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVehicles.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-mono font-medium">{v.registration_number}</TableCell>
                          <TableCell className="capitalize">{v.vehicle_type.replace('_', ' ')}</TableCell>
                          <TableCell>{v.capacity_tons ? `${v.capacity_tons} tons` : '-'}</TableCell>
                          <TableCell>{v.manufacturer && v.model ? `${v.manufacturer} ${v.model}` : v.manufacturer || '-'}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{v.partner?.company_name || '-'}</div>
                              <div className="text-muted-foreground text-xs">{v.partner?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={v.is_available ? 'default' : 'secondary'}>
                              {v.is_available ? 'Yes' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell>{getVerificationBadge(v.verification_status)}</TableCell>
                          <TableCell>{format(new Date(v.created_at), 'dd MMM yyyy')}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="warehouses" className="flex-1 overflow-auto mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Total Area</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Rate/sqft</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWarehouses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No warehouses found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredWarehouses.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell className="font-medium">{w.name}</TableCell>
                          <TableCell>{w.city}, {w.state}</TableCell>
                          <TableCell className="capitalize">{w.warehouse_type?.replace('_', ' ') || 'General'}</TableCell>
                          <TableCell>{w.total_area_sqft.toLocaleString()} sqft</TableCell>
                          <TableCell>{w.available_area_sqft.toLocaleString()} sqft</TableCell>
                          <TableCell>{w.rental_rate_per_sqft ? `₹${w.rental_rate_per_sqft}` : '-'}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{w.partner?.company_name || '-'}</div>
                              <div className="text-muted-foreground text-xs">{w.partner?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={w.is_active ? 'default' : 'secondary'}>
                              {w.is_active ? 'Yes' : 'No'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="requirements" className="flex-1 overflow-auto mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Pickup</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequirements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No logistics requirements found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequirements.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium max-w-[150px] truncate" title={r.title}>
                            {r.title}
                          </TableCell>
                          <TableCell>{r.material_type}</TableCell>
                          <TableCell>{r.quantity} {r.unit}</TableCell>
                          <TableCell className="text-sm">
                            {r.pickup_location} → {r.delivery_location}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{r.customer?.company_name || '-'}</div>
                              <div className="text-muted-foreground text-xs">{r.customer?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(r.pickup_date), 'dd MMM')}</TableCell>
                          <TableCell>{format(new Date(r.delivery_deadline), 'dd MMM')}</TableCell>
                          <TableCell>{getStatusBadge(r.status)}</TableCell>
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
  );
}
