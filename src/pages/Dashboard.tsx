import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Loader2, Package, Receipt, Truck, Warehouse, FileText, MapPin } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { CreateRequirementForm } from '@/components/CreateRequirementForm';
import { NotificationBell } from '@/components/NotificationBell';
import { BuyerRequirementsList } from '@/components/BuyerRequirementsList';
import { SupplierCatalog } from '@/components/SupplierCatalog';
import { StockManagement } from '@/components/StockManagement';
import { BrowseRequirements } from '@/components/BrowseRequirements';
import { SupplierCRM } from '@/components/crm/SupplierCRM';
import { SupplierAcceptedBids } from '@/components/SupplierAcceptedBids';
import { SupplierMyBids } from '@/components/SupplierMyBids';
import { LiveSupplierStock } from '@/components/LiveSupplierStock';
import { PlatformInvoices } from '@/components/PlatformInvoices';
import { AdminDashboardCards } from '@/components/admin/AdminDashboardCards';
import { AdminInvoiceManagement } from '@/components/admin/AdminInvoiceManagement';
import { VehicleVerification } from '@/components/admin/VehicleVerification';
import { AdminDataExport } from '@/components/admin/AdminDataExport';
import { FleetManagement } from '@/components/logistics/FleetManagement';
import { WarehouseManagement } from '@/components/logistics/WarehouseManagement';
import { LogisticsOnboarding } from '@/components/logistics/LogisticsOnboarding';
import { CreateLogisticsRequirementForm } from '@/components/logistics/CreateLogisticsRequirementForm';
import { BuyerLogisticsRequirements } from '@/components/logistics/BuyerLogisticsRequirements';
import { BrowseLogisticsRequirements } from '@/components/logistics/BrowseLogisticsRequirements';
import { TransporterMyBids } from '@/components/logistics/TransporterMyBids';
import { ActiveShipments } from '@/components/logistics/ActiveShipments';
import { ActiveRoutePlanning } from '@/components/logistics/ActiveRoutePlanning';
import { CustomerShipmentTracking } from '@/components/logistics/CustomerShipmentTracking';
import procureSaathiLogo from '@/assets/procuresaathi-logo.jpg';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user?.id);
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const [showCRM, setShowCRM] = useState(false);
  const [showLiveStock, setShowLiveStock] = useState(false);
  const [showPlatformInvoices, setShowPlatformInvoices] = useState(false);
  const [showAdminInvoices, setShowAdminInvoices] = useState(false);
  const [showVehicleVerification, setShowVehicleVerification] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const [showFleetManagement, setShowFleetManagement] = useState(false);
  const [showWarehouseManagement, setShowWarehouseManagement] = useState(false);
  const [showLogisticsOnboarding, setShowLogisticsOnboarding] = useState(false);
  const [showLogisticsRequirementForm, setShowLogisticsRequirementForm] = useState(false);
  const [showBrowseLogisticsRequirements, setShowBrowseLogisticsRequirements] = useState(false);
  const [showTransporterMyBids, setShowTransporterMyBids] = useState(false);
  const [showActiveShipments, setShowActiveShipments] = useState(false);
  const [showRoutePlanning, setShowRoutePlanning] = useState(false);
  const [showCustomerShipmentTracking, setShowCustomerShipmentTracking] = useState(false);
  const [logisticsRequirementsKey, setLogisticsRequirementsKey] = useState(0);
  const [logisticsAssets, setLogisticsAssets] = useState<{ vehicles: number; warehouses: number } | null>(null);
  const [subscription, setSubscription] = useState<{ bids_used_this_month: number; bids_limit: number } | null>(null);

  const fetchSubscription = async () => {
    if (!user?.id || role !== 'supplier') return;
    const { data } = await supabase
      .from('subscriptions')
      .select('bids_used_this_month, bids_limit')
      .eq('user_id', user.id)
      .maybeSingle();
    setSubscription(data);
  };

  const fetchLogisticsAssets = async () => {
    if (!user?.id || role !== 'logistics_partner') return;
    
    const [vehiclesRes, warehousesRes] = await Promise.all([
      supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('partner_id', user.id),
      supabase.from('warehouses').select('id', { count: 'exact', head: true }).eq('partner_id', user.id),
    ]);
    
    const counts = {
      vehicles: vehiclesRes.count || 0,
      warehouses: warehousesRes.count || 0,
    };
    setLogisticsAssets(counts);
    
    // Show onboarding if no assets registered
    if (counts.vehicles === 0 && counts.warehouses === 0) {
      setShowLogisticsOnboarding(true);
    }
  };

  useEffect(() => {
    if (user?.id && role === 'supplier') {
      fetchSubscription();
    }
    if (user?.id && role === 'logistics_partner') {
      fetchLogisticsAssets();
    }
  }, [user?.id, role]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi Logo" 
              className="h-16 w-auto object-contain"
              width={64}
              height={64}
              loading="eager"
            />
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="outline" onClick={async () => {
              await signOut();
              navigate('/');
            }}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.user_metadata?.contact_person || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            {user?.user_metadata?.company_name} • {role?.toUpperCase()}
          </p>
        </div>

        {role === 'admin' && (
          <>
            <AdminDashboardCards 
              onOpenInvoiceManagement={() => setShowAdminInvoices(true)} 
              onOpenVehicleVerification={() => setShowVehicleVerification(true)}
              onOpenDataExport={() => setShowDataExport(true)}
            />
            <AdminInvoiceManagement open={showAdminInvoices} onOpenChange={setShowAdminInvoices} />
            {user && (
              <VehicleVerification 
                open={showVehicleVerification} 
                onOpenChange={setShowVehicleVerification}
                adminId={user.id}
              />
            )}
            <AdminDataExport open={showDataExport} onOpenChange={setShowDataExport} />
          </>
        )}

        {role === 'buyer' && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle>Post Requirement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a new procurement requirement and get competitive bids
                  </p>
                  <Button className="w-full" onClick={() => setShowRequirementForm(true)}>
                    Create Requirement
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Book Transport
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Post logistics requirement and get competitive quotes
                  </p>
                  <Button className="w-full" onClick={() => setShowLogisticsRequirementForm(true)}>
                    Post Logistics Need
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Browse Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Search supplier products with live stock updates
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setShowLiveStock(true)}>
                    Browse Stock
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Invoices & PO</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create proforma, tax invoices & purchase orders
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setShowCRM(true)}>Open CRM</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Track Shipments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track your logistics shipments in real-time
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setShowCustomerShipmentTracking(true)}>
                    Track Now
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Requirements List with Bid Details */}
            {user && <BuyerRequirementsList key={refreshKey} userId={user.id} />}
            
            {/* Logistics Requirements List */}
            {user && <BuyerLogisticsRequirements key={logisticsRequirementsKey} userId={user.id} />}
            
            {user && (
              <>
                <SupplierCRM open={showCRM} onOpenChange={setShowCRM} userId={user.id} />
                <LiveSupplierStock open={showLiveStock} onOpenChange={setShowLiveStock} />
                <CreateLogisticsRequirementForm 
                  open={showLogisticsRequirementForm} 
                  onOpenChange={setShowLogisticsRequirementForm} 
                  userId={user.id}
                  onSuccess={() => setLogisticsRequirementsKey(k => k + 1)}
                />
                <CustomerShipmentTracking
                  open={showCustomerShipmentTracking}
                  onOpenChange={setShowCustomerShipmentTracking}
                  userId={user.id}
                />
              </>
            )}
          </div>
        )}

        {role === 'logistics_partner' && (
          <div className="space-y-6">
            {/* Asset Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Truck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{logisticsAssets?.vehicles || 0}</p>
                      <p className="text-sm text-muted-foreground">Vehicles</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Warehouse className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{logisticsAssets?.warehouses || 0}</p>
                      <p className="text-sm text-muted-foreground">Warehouses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Fleet Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage your trucks, vehicles and fleet operations
                  </p>
                  <Button className="w-full" onClick={() => setShowFleetManagement(true)}>
                    Manage Fleet
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Warehouse className="h-5 w-5" />
                    Warehouse Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage warehouse inventory and storage spaces
                  </p>
                  <Button className="w-full" onClick={() => setShowWarehouseManagement(true)}>
                    Manage Warehouses
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Documents & Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create LR, invoices and shipping documents
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setShowCRM(true)}>Open CRM</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shipment Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track and update active shipments
                  </p>
                  <Button className="w-full" onClick={() => setShowActiveShipments(true)}>
                    Active Shipments
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Route Planning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Plan and manage delivery routes
                  </p>
                  <Button className="w-full" onClick={() => setShowRoutePlanning(true)}>
                    View Routes
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Browse Transport Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View logistics requirements and submit quotes
                  </p>
                  <Button className="w-full" onClick={() => setShowBrowseLogisticsRequirements(true)}>
                    Browse & Quote
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>My Quotes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View and manage your submitted quotes
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setShowTransporterMyBids(true)}>
                    View Quotes
                  </Button>
                </CardContent>
              </Card>
            </div>

            {user && (
              <>
                <FleetManagement 
                  open={showFleetManagement} 
                  onOpenChange={setShowFleetManagement} 
                  userId={user.id}
                />
                <WarehouseManagement 
                  open={showWarehouseManagement} 
                  onOpenChange={setShowWarehouseManagement} 
                  userId={user.id} 
                />
                <LogisticsOnboarding
                  open={showLogisticsOnboarding}
                  onOpenChange={setShowLogisticsOnboarding}
                  userId={user.id}
                  onComplete={fetchLogisticsAssets}
                />
                <SupplierCRM open={showCRM} onOpenChange={setShowCRM} userId={user.id} />
                <BrowseLogisticsRequirements 
                  open={showBrowseLogisticsRequirements} 
                  onOpenChange={setShowBrowseLogisticsRequirements} 
                  userId={user.id} 
                />
                <TransporterMyBids 
                  open={showTransporterMyBids} 
                  onOpenChange={setShowTransporterMyBids} 
                  userId={user.id} 
                />
                <ActiveShipments
                  open={showActiveShipments}
                  onOpenChange={setShowActiveShipments}
                  userId={user.id}
                />
                <ActiveRoutePlanning
                  open={showRoutePlanning}
                  onOpenChange={setShowRoutePlanning}
                  userId={user.id}
                />
              </>
            )}
          </div>
        )}

        {role === 'supplier' && (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add or update your product catalog
                  </p>
                  <Button className="w-full" onClick={() => setShowCatalog(true)}>Manage Catalog</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stock Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Update inventory and import from Tally/Busy
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setShowStock(true)}>Update Stock</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Browse Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Find active requirements and submit bids
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setShowRequirements(true)}>View Requirements</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Invoices & PO</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create proforma, tax invoices & purchase orders
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setShowCRM(true)}>Open CRM</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">Free Plan (5 free bids)</div>
                  <div className="text-2xl font-bold text-primary mb-2">
                    {subscription?.bids_used_this_month ?? 0}/{subscription?.bids_limit ?? 5}
                  </div>
                  <Progress 
                    value={((subscription?.bids_used_this_month ?? 0) / (subscription?.bids_limit ?? 5)) * 100} 
                    className="mb-2" 
                  />
                  <p className="text-sm text-muted-foreground mb-2">Free bids used</p>
                  {(subscription?.bids_used_this_month ?? 0) >= (subscription?.bids_limit ?? 5) && (
                    <p className="text-sm text-orange-600 font-medium mb-2">
                      Additional bids: ₹500 each
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Platform Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View and pay service fees & subscription invoices
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setShowPlatformInvoices(true)}>
                    View Invoices
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* My Bids Section - Shows all bids with breakdown and re-bid */}
            {user && <SupplierMyBids userId={user.id} />}

            {/* Accepted Bids Section */}
            {user && <SupplierAcceptedBids userId={user.id} />}

            {user && (
              <>
                <SupplierCatalog open={showCatalog} onOpenChange={setShowCatalog} userId={user.id} />
                <StockManagement open={showStock} onOpenChange={setShowStock} userId={user.id} />
                <BrowseRequirements open={showRequirements} onOpenChange={setShowRequirements} userId={user.id} />
                <SupplierCRM open={showCRM} onOpenChange={setShowCRM} userId={user.id} />
                <PlatformInvoices open={showPlatformInvoices} onOpenChange={setShowPlatformInvoices} userId={user.id} />
              </>
            )}
          </>
        )}

        {/* Create Requirement Form */}
        {user && (
          <CreateRequirementForm
            open={showRequirementForm}
            onOpenChange={setShowRequirementForm}
            userId={user.id}
            onSuccess={() => setRefreshKey(k => k + 1)}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
