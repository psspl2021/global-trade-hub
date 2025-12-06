import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Truck, Warehouse, FileText } from 'lucide-react';
import { format } from 'date-fns';

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

export function AdminLogisticsList({ open, onOpenChange }: AdminLogisticsListProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [requirements, setRequirements] = useState<LogisticsRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('vehicles');

  useEffect(() => {
    if (open) {
      fetchAllData();
    }
  }, [open]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch vehicles
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (vehicleData) {
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
      }

      // Fetch warehouses
      const { data: warehouseData } = await supabase
        .from('warehouses')
        .select('*')
        .order('created_at', { ascending: false });

      if (warehouseData) {
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
      }

      // Fetch logistics requirements
      const { data: reqData } = await supabase
        .from('logistics_requirements')
        .select('*')
        .order('created_at', { ascending: false });

      if (reqData) {
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
      }
    } catch (error) {
      console.error('Error fetching logistics data:', error);
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
              Vehicles ({vehicles.length})
            </TabsTrigger>
            <TabsTrigger value="warehouses" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Warehouses ({warehouses.length})
            </TabsTrigger>
            <TabsTrigger value="requirements" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Requirements ({requirements.length})
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
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
