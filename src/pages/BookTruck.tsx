// Rebuild: 2025-12-07T18:25:00Z - Added loading skeletons
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Truck, Warehouse, Search, MapPin, ArrowLeft, 
  Package, Fuel, CheckCircle, Route, Ship, Plane, Train
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import procureSaathiLogo from '@/assets/procuresaathi-logo.jpg';
import { globalLocations, regions } from '@/data/globalLocations';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CurrencySelectorCompact } from '@/components/logistics/CurrencySelectorCompact';

// Vehicle Card Skeleton
const VehicleCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-5 w-20" />
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-4 w-16" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-28" />
        </div>
      </div>
      <Skeleton className="h-10 w-full mt-4" />
    </CardContent>
  </Card>
);

// Warehouse Card Skeleton
const WarehouseCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-6 w-44" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="h-4 w-28" />
      <div className="flex gap-1">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-10 w-full mt-4" />
    </CardContent>
  </Card>
);

interface Vehicle {
  id: string;
  vehicle_type: string;
  registration_number: string;
  manufacturer: string | null;
  model: string | null;
  capacity_tons: number | null;
  capacity_volume_cbm: number | null;
  fuel_type: string | null;
  current_location: string | null;
  is_available: boolean;
  verification_status: string;
  routes: { origin: string; destination: string }[] | null;
}

interface WarehouseData {
  id: string;
  name: string;
  warehouse_type: string | null;
  address: string;
  city: string;
  state: string;
  country?: string | null;
  total_area_sqft: number;
  available_area_sqft: number;
  rental_rate_per_sqft: number | null;
  facilities: Record<string, boolean> | null;
  contact_person: string | null;
  contact_phone: string | null;
}

// Road Freight
const roadVehicleTypes: Record<string, string> = {
  truck: 'Truck',
  trailer: 'Trailer',
  tanker: 'Tanker',
  container_truck: 'Container Truck',
  mini_truck: 'Mini Truck',
  pickup: 'Pickup',
  tempo: 'Tempo',
  lpv: 'LPV',
};

// Sea Freight
const seaFreightTypes: Record<string, string> = {
  fcl_20ft: '20ft FCL Container',
  fcl_40ft: '40ft FCL Container',
  fcl_40hc: '40ft HC Container',
  lcl: 'LCL (Less than Container)',
  bulk_carrier: 'Bulk Carrier',
  roro: 'RoRo (Roll-on/Roll-off)',
  breakbulk: 'Break Bulk',
};

// Air Freight
const airFreightTypes: Record<string, string> = {
  air_cargo: 'Air Cargo',
  express_air: 'Express Air Courier',
  charter_cargo: 'Charter Cargo',
};

// Rail Freight
const railFreightTypes: Record<string, string> = {
  rail_container: 'Rail Container',
  rail_wagon: 'Rail Wagon',
  rail_tanker: 'Rail Tanker',
};

const allVehicleTypes = { ...roadVehicleTypes, ...seaFreightTypes, ...airFreightTypes, ...railFreightTypes };

const warehouseTypeLabels: Record<string, string> = {
  dry_storage: 'Dry Storage',
  cold_storage: 'Cold Storage',
  bonded: 'Bonded Warehouse',
  open_yard: 'Open Yard',
  hazmat: 'Hazmat Storage',
  general: 'General',
};

const BookTruck = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();
  const [availableRoutes, setAvailableRoutes] = useState<{ origin: string; destination: string }[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('All Regions');

  // SEO
  useSEO({
    title: 'Book Trucks & Warehouses Worldwide | ProcureSaathi Global Logistics',
    description: 'Find verified logistics partners for transportation and warehousing worldwide. Sea freight, air cargo, road transport, and rail freight across 150+ global hubs.',
    canonical: 'https://procuresaathi.com/book-truck',
    keywords: 'global logistics, international freight, sea freight, air cargo, truck booking, warehouse rental, FCL LCL shipping, container shipping'
  });
  
  // Filter inputs
  const [fromLocation, setFromLocation] = useState('all');
  const [toLocation, setToLocation] = useState('all');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
  const [warehouseTypeFilter, setWarehouseTypeFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  
  // Applied filters (only update on search click)
  const [appliedFilters, setAppliedFilters] = useState({
    from: 'all',
    to: 'all',
    route: 'all',
    vehicleType: 'all',
    warehouseType: 'all'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, warehousesRes] = await Promise.all([
        (supabase.from('vehicles') as any)
          .select('*')
          .eq('is_available', true)
          .eq('verification_status', 'verified'),
        supabase.from('warehouses').select('*').eq('is_active', true)
      ]);

      if (vehiclesRes.data) {
        setVehicles(vehiclesRes.data);
        // Extract unique routes from all vehicles
        const allRoutes = vehiclesRes.data.flatMap((v: Vehicle) => v.routes || []);
        const uniqueRoutes = allRoutes.filter((route: { origin: string; destination: string }, index: number, self: { origin: string; destination: string }[]) =>
          self.findIndex(r => r.origin === route.origin && r.destination === route.destination) === index
        );
        setAvailableRoutes(uniqueRoutes);
      }
      if (warehousesRes.data) setWarehouses(warehousesRes.data as WarehouseData[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setAppliedFilters({
      from: fromLocation,
      to: toLocation,
      route: routeFilter,
      vehicleType: vehicleTypeFilter,
      warehouseType: warehouseTypeFilter
    });
  };

  const filteredVehicles = vehicles.filter(v => {
    // From location - match vehicle's current location
    const matchesFrom = appliedFilters.from === 'all' || 
      v.current_location?.toLowerCase().includes(appliedFilters.from.toLowerCase());
    
    // To location - match routes that go to this destination
    const matchesTo = appliedFilters.to === 'all' || 
      v.routes?.some(r => r.destination.toLowerCase().includes(appliedFilters.to.toLowerCase()));
    
    const matchesType = appliedFilters.vehicleType === 'all' || v.vehicle_type === appliedFilters.vehicleType;
    
    // Route filter - match exact origin|destination pair
    let matchesRoute = true;
    if (appliedFilters.route !== 'all') {
      const [origin, destination] = appliedFilters.route.split('|');
      matchesRoute = v.routes?.some(r => r.origin === origin && r.destination === destination) || false;
    }
    
    return matchesFrom && matchesTo && matchesType && matchesRoute;
  });

  const filteredWarehouses = warehouses.filter(w => {
    // Match warehouses in either From or To location
    const matchesLocation = (appliedFilters.from === 'all' && appliedFilters.to === 'all') ||
      w.city.toLowerCase().includes(appliedFilters.from.toLowerCase()) ||
      w.city.toLowerCase().includes(appliedFilters.to.toLowerCase()) ||
      (appliedFilters.from !== 'all' && w.city.toLowerCase().includes(appliedFilters.from.toLowerCase())) ||
      (appliedFilters.to !== 'all' && w.city.toLowerCase().includes(appliedFilters.to.toLowerCase()));
    const matchesType = appliedFilters.warehouseType === 'all' || w.warehouse_type === appliedFilters.warehouseType;
    return matchesLocation && matchesType;
  });

  const formatRoutes = (routes: { origin: string; destination: string }[] | null) => {
    if (!routes || routes.length === 0) return null;
    return routes.slice(0, 2).map((r, i) => (
      <Badge key={i} variant="secondary" className="text-xs">
        {r.origin} → {r.destination}
      </Badge>
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi Logo" 
              className="h-12 w-auto object-contain cursor-pointer"
              onClick={() => navigate('/')}
            />
          </div>
          <div className="flex items-center gap-4">
            <CurrencySelectorCompact showBadge={false} />
            <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
            <Button onClick={() => navigate('/signup?role=logistics_partner')}>
              Register as Logistics Partner
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-primary">Global</span> Logistics & Warehousing
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find verified logistics partners for transportation and warehousing worldwide. 
            Sea freight, air cargo, road transport, and rail freight across 150+ global hubs.
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            {/* Region Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              {regions.map((region) => (
                <Badge
                  key={region}
                  variant={selectedRegion === region ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedRegion(region)}
                >
                  {region}
                </Badge>
              ))}
            </div>
            
            <div className="grid md:grid-cols-6 gap-4">
              <Select value={fromLocation} onValueChange={setFromLocation}>
                <SelectTrigger className="h-12">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="From" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-background z-50 max-h-60">
                  <SelectItem value="all">Any Origin</SelectItem>
                  {globalLocations
                    .filter(loc => selectedRegion === 'All Regions' || loc.region === selectedRegion)
                    .map((loc) => (
                    <SelectItem key={`from-${loc.city}-${loc.country}`} value={loc.city}>
                      {loc.city}, {loc.country} {loc.isPort ? '⚓' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={toLocation} onValueChange={setToLocation}>
                <SelectTrigger className="h-12">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <SelectValue placeholder="To" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-background z-50 max-h-60">
                  <SelectItem value="all">Any Destination</SelectItem>
                  {globalLocations
                    .filter(loc => selectedRegion === 'All Regions' || loc.region === selectedRegion)
                    .map((loc) => (
                    <SelectItem key={`to-${loc.city}-${loc.country}`} value={loc.city}>
                      {loc.city}, {loc.country} {loc.isPort ? '⚓' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={routeFilter} onValueChange={setRouteFilter}>
                <SelectTrigger className="h-12">
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select Route" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">All Routes</SelectItem>
                  {availableRoutes.map((route, i) => (
                    <SelectItem key={i} value={`${route.origin}|${route.destination}`}>
                      {route.origin} → {route.destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Freight Type" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50 max-h-80">
                  <SelectItem value="all">All Freight Types</SelectItem>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Truck className="h-3 w-3" /> Road Freight
                  </div>
                  {Object.entries(roadVehicleTypes).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1 mt-2">
                    <Ship className="h-3 w-3" /> Sea Freight
                  </div>
                  {Object.entries(seaFreightTypes).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1 mt-2">
                    <Plane className="h-3 w-3" /> Air Freight
                  </div>
                  {Object.entries(airFreightTypes).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1 mt-2">
                    <Train className="h-3 w-3" /> Rail Freight
                  </div>
                  {Object.entries(railFreightTypes).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={warehouseTypeFilter} onValueChange={setWarehouseTypeFilter}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Warehouse Type" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">All Warehouse Types</SelectItem>
                  {Object.entries(warehouseTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="h-12" onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Vehicles and Warehouses */}
        <Tabs defaultValue="vehicles" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Vehicles ({filteredVehicles.length})
            </TabsTrigger>
            <TabsTrigger value="warehouses" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Warehouses ({filteredWarehouses.length})
            </TabsTrigger>
          </TabsList>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles">
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <VehicleCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredVehicles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No vehicles available</h3>
                  <p className="text-muted-foreground mb-4">
                    {fromLocation !== 'all' || toLocation !== 'all' || vehicleTypeFilter !== 'all' || routeFilter !== 'all'
                      ? 'Try adjusting your filters' 
                      : 'Check back later for available vehicles'}
                  </p>
                  <Button variant="outline" onClick={() => navigate('/signup?role=logistics_partner')}>
                    Register as Logistics Partner
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVehicles.map((vehicle) => (
                  <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {allVehicleTypes[vehicle.vehicle_type] || vehicle.vehicle_type}
                          </Badge>
                          <CardTitle className="text-lg">
                            {vehicle.manufacturer} {vehicle.model}
                          </CardTitle>
                        </div>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Truck className="h-4 w-4" />
                        <span>{vehicle.registration_number}</span>
                      </div>
                      {vehicle.capacity_tons && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span>{vehicle.capacity_tons} Tons capacity</span>
                        </div>
                      )}
                      {vehicle.capacity_volume_cbm && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span>{vehicle.capacity_volume_cbm} CBM volume</span>
                        </div>
                      )}
                      {vehicle.fuel_type && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Fuel className="h-4 w-4" />
                          <span className="capitalize">{vehicle.fuel_type}</span>
                        </div>
                      )}
                      {vehicle.current_location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{vehicle.current_location}</span>
                        </div>
                      )}
                      {/* Routes */}
                      {vehicle.routes && vehicle.routes.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Route className="h-4 w-4" />
                            <span>Routes:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {formatRoutes(vehicle.routes)}
                            {vehicle.routes.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{vehicle.routes.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      <Button 
                        className="w-full mt-4" 
                        onClick={() => navigate('/signup?role=buyer')}
                      >
                        Request Quote
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Warehouses Tab */}
          <TabsContent value="warehouses">
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <WarehouseCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredWarehouses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No warehouses available</h3>
                  <p className="text-muted-foreground mb-4">
                    {fromLocation !== 'all' || toLocation !== 'all' || warehouseTypeFilter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'Check back later for available warehouses'}
                  </p>
                  <Button variant="outline" onClick={() => navigate('/signup?role=logistics_partner')}>
                    Register as Logistics Partner
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWarehouses.map((warehouse) => (
                  <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {warehouseTypeLabels[warehouse.warehouse_type || 'general']}
                          </Badge>
                          <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                        </div>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{warehouse.city}, {warehouse.state}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Warehouse className="h-4 w-4" />
                        <span>{warehouse.available_area_sqft.toLocaleString()} sq.ft available</span>
                      </div>
                      {warehouse.rental_rate_per_sqft && (
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          {formatPrice(warehouse.rental_rate_per_sqft)}/sq.ft/month
                        </div>
                      )}
                      {warehouse.facilities && (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(warehouse.facilities)
                            .filter(([_, enabled]) => enabled)
                            .slice(0, 3)
                            .map(([facility]) => (
                              <Badge key={facility} variant="secondary" className="text-xs capitalize">
                                {facility.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                        </div>
                      )}
                      <Button 
                        className="w-full mt-4" 
                        onClick={() => navigate('/signup?role=buyer')}
                      >
                        Request Quote
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <section className="mt-16 text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-12">
              <Truck className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Are you a Logistics Partner?</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Register your fleet and warehouses on ProcureSaathi. 
                Connect with businesses across India and grow your logistics business.
              </p>
              <Button size="lg" onClick={() => navigate('/signup?role=logistics_partner')}>
                Register as Logistics Partner
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default BookTruck;