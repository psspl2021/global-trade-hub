import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSEO, injectStructuredData, getBreadcrumbSchema } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Truck, Warehouse, Search, MapPin, ArrowLeft, 
  Package, Fuel, CheckCircle, Route, FileText, Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import procureSaathiLogo from '@/assets/procuresaathi-logo.jpg';
import { indianLocations } from '@/data/indianLocations';
import { format } from 'date-fns';

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
  total_area_sqft: number;
  available_area_sqft: number;
  rental_rate_per_sqft: number | null;
  facilities: Record<string, boolean> | null;
  contact_person: string | null;
  contact_phone: string | null;
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
}

const vehicleTypeLabels: Record<string, string> = {
  truck: 'Truck',
  trailer: 'Trailer',
  tanker: 'Tanker',
  container_truck: 'Container Truck',
  mini_truck: 'Mini Truck',
  pickup: 'Pickup',
  tempo: 'Tempo',
  lpv: 'LPV',
};

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
  const [requirements, setRequirements] = useState<LogisticsRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableRoutes, setAvailableRoutes] = useState<{ origin: string; destination: string }[]>([]);

  // SEO
  useSEO({
    title: 'Book Trucks & Warehouses India | ProcureSaathi Logistics',
    description: 'Find verified logistics partners for transportation and warehousing across India. Get instant quotes from verified truck owners and warehouse operators. Book now!',
    canonical: 'https://procuresaathi.com/book-truck',
    keywords: 'truck booking India, warehouse rental, logistics partners, freight transport, cargo services, truck hire, warehouse space, logistics marketplace'
  });

  // Inject structured data for SEO
  useEffect(() => {
    injectStructuredData(getBreadcrumbSchema([
      { name: 'Home', url: 'https://procuresaathi.com' },
      { name: 'Book Truck & Warehouse', url: 'https://procuresaathi.com/book-truck' }
    ]), 'booktruck-breadcrumb-schema');

    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "ProcureSaathi Logistics Marketplace",
      "description": "Find verified trucks and warehouses across India. Get instant quotes from verified logistics partners.",
      "serviceType": "Logistics Services",
      "provider": {
        "@type": "Organization",
        "name": "ProcureSaathi"
      },
      "areaServed": {
        "@type": "Country",
        "name": "India"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Logistics Services",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Truck Booking"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Warehouse Rental"
            }
          }
        ]
      }
    }, 'booktruck-service-schema');
  }, []);
  
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
      const [vehiclesRes, warehousesRes, requirementsRes] = await Promise.all([
        (supabase.from('vehicles') as any)
          .select('*')
          .eq('is_available', true)
          .eq('verification_status', 'verified'),
        supabase.from('warehouses').select('*').eq('is_active', true),
        supabase.from('logistics_requirements')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
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
      if (requirementsRes.data) setRequirements(requirementsRes.data as LogisticsRequirement[]);
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

  const filteredRequirements = requirements.filter(r => {
    const matchesFrom = appliedFilters.from === 'all' || 
      r.pickup_location.toLowerCase().includes(appliedFilters.from.toLowerCase());
    const matchesTo = appliedFilters.to === 'all' || 
      r.delivery_location.toLowerCase().includes(appliedFilters.to.toLowerCase());
    return matchesFrom && matchesTo;
  });

  const formatRoutes = (routes: { origin: string; destination: string }[] | null) => {
    if (!routes || routes.length === 0) return null;
    return routes.slice(0, 2).map((r, i) => (
      <Badge key={i} variant="secondary" className="text-xs">
        {r.origin} → {r.destination}
      </Badge>
    ));
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
            Book <span className="text-primary">Trucks</span> & <span className="text-primary">Warehouses</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find verified logistics partners for your transportation and warehousing needs. 
            Get instant quotes and book services across India.
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
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
                  {indianLocations.map((loc) => (
                    <SelectItem key={`from-${loc.city}-${loc.state}`} value={loc.city}>
                      {loc.city}, {loc.state}
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
                  {indianLocations.map((loc) => (
                    <SelectItem key={`to-${loc.city}-${loc.state}`} value={loc.city}>
                      {loc.city}, {loc.state}
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
                  <SelectValue placeholder="Vehicle Type" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">All Vehicle Types</SelectItem>
                  {Object.entries(vehicleTypeLabels).map(([value, label]) => (
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

        {/* Tabs for Vehicles, Warehouses and Requirements */}
        <Tabs defaultValue="vehicles" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3">
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Vehicles ({filteredVehicles.length})
            </TabsTrigger>
            <TabsTrigger value="warehouses" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Warehouses ({filteredWarehouses.length})
            </TabsTrigger>
            <TabsTrigger value="requirements" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Requirements ({filteredRequirements.length})
            </TabsTrigger>
          </TabsList>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles">
            {loading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="mt-4 text-muted-foreground">Loading vehicles...</p>
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
                            {vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type}
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
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="mt-4 text-muted-foreground">Loading warehouses...</p>
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
                          ₹{warehouse.rental_rate_per_sqft}/sq.ft/month
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

          {/* Requirements Tab */}
          <TabsContent value="requirements">
            {loading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="mt-4 text-muted-foreground">Loading requirements...</p>
              </div>
            ) : filteredRequirements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No logistics requirements available</h3>
                  <p className="text-muted-foreground mb-4">
                    {fromLocation !== 'all' || toLocation !== 'all'
                      ? 'Try adjusting your filters' 
                      : 'Check back later for logistics requirements'}
                  </p>
                  <Button variant="outline" onClick={() => navigate('/signup?role=buyer')}>
                    Post a Logistics Requirement
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRequirements.map((req) => (
                  <Card key={req.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className="mb-2 capitalize">
                            {req.material_type}
                          </Badge>
                          <CardTitle className="text-lg line-clamp-2">{req.title}</CardTitle>
                        </div>
                        {getStatusBadge(req.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">From:</span>
                        <span className="truncate">{req.pickup_location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="font-medium">To:</span>
                        <span className="truncate">{req.delivery_location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>{req.quantity} {req.unit}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Pickup: {format(new Date(req.pickup_date), 'dd MMM yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Deadline: {format(new Date(req.delivery_deadline), 'dd MMM yyyy')}</span>
                      </div>
                      <Button 
                        className="w-full mt-4" 
                        onClick={() => navigate('/signup?role=logistics_partner')}
                      >
                        Submit Quote
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