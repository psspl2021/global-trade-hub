import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useSEO } from '@/hooks/useSEO';
import { usePartnerVerification } from '@/hooks/usePartnerVerification';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Loader2, Package, Receipt, Truck, Warehouse, FileText, MapPin, Star, Check, MessageCircle, Mail, AlertTriangle, ShieldCheck, Clock, XCircle, Settings } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { CreateRequirementForm } from '@/components/CreateRequirementForm';
import { NotificationBell } from '@/components/NotificationBell';
import { BuyerRequirementsList } from '@/components/BuyerRequirementsList';
import { SupplierCatalog } from '@/components/SupplierCatalog';
import { StockManagement } from '@/components/StockManagement';
import { BrowseRequirements } from '@/components/BrowseRequirements';
import { SupplierCRM } from '@/components/crm/SupplierCRM';
import { BuyerCRM } from '@/components/crm/BuyerCRM';
import { SupplierAcceptedBids } from '@/components/SupplierAcceptedBids';
import { SupplierMyBids } from '@/components/SupplierMyBids';
import { LiveSupplierStock } from '@/components/LiveSupplierStock';
import { PlatformInvoices } from '@/components/PlatformInvoices';
import { AdminDashboardCards } from '@/components/admin/AdminDashboardCards';
import { AdminInvoiceManagement } from '@/components/admin/AdminInvoiceManagement';
import { VehicleVerification } from '@/components/admin/VehicleVerification';
import { PartnerDocumentVerification } from '@/components/admin/PartnerDocumentVerification';
import { AdminDataExport } from '@/components/admin/AdminDataExport';
import { AdminUsersList } from '@/components/admin/AdminUsersList';
import { AdminRequirementsList } from '@/components/admin/AdminRequirementsList';
import { AdminBidsList } from '@/components/admin/AdminBidsList';
import { AdminLogisticsList } from '@/components/admin/AdminLogisticsList';
import { LeadsDashboard } from '@/components/admin/LeadsDashboard';
import { PremiumBidsManager } from '@/components/admin/PremiumBidsManager';
import { AdminReferralStats } from '@/components/admin/AdminReferralStats';
import AdminBlogManager from '@/components/admin/AdminBlogManager';
import { SEOTools } from '@/components/admin/SEOTools';
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
import { ReferralSection } from '@/components/ReferralSection';
import { ProfileSettings } from '@/components/ProfileSettings';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user?.id);
  const partnerVerification = usePartnerVerification(role === 'logistics_partner' ? user?.id : undefined);
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
  const [showAdminUsersList, setShowAdminUsersList] = useState(false);
  const [showAdminRequirementsList, setShowAdminRequirementsList] = useState(false);
  const [showAdminBidsList, setShowAdminBidsList] = useState(false);
  const [showAdminLogisticsList, setShowAdminLogisticsList] = useState(false);
  const [showLeadsDashboard, setShowLeadsDashboard] = useState(false);
  const [showPremiumBidsManager, setShowPremiumBidsManager] = useState(false);
  const [showReferralStats, setShowReferralStats] = useState(false);
  const [showBlogManager, setShowBlogManager] = useState(false);
  const [showSEOTools, setShowSEOTools] = useState(false);
  const [showPartnerDocVerification, setShowPartnerDocVerification] = useState(false);
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
  const [subscription, setSubscription] = useState<{ bids_used_this_month: number; bids_limit: number; premium_bids_balance: number } | null>(null);
  const [logisticsSubscription, setLogisticsSubscription] = useState<{ bids_used_this_month: number; bids_limit: number; premium_bids_balance: number } | null>(null);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  // SEO for dashboard
  useSEO({
    title: 'Dashboard | ProcureSaathi',
    description: 'Manage your B2B procurement, track requirements, and connect with verified suppliers on ProcureSaathi dashboard.',
  });

  const fetchSubscription = async () => {
    if (!user?.id || role !== 'supplier') return;
    const { data } = await supabase
      .from('subscriptions')
      .select('bids_used_this_month, bids_limit, premium_bids_balance')
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

  const fetchLogisticsSubscription = async () => {
    if (!user?.id || role !== 'logistics_partner') return;
    const { data } = await supabase
      .from('subscriptions')
      .select('bids_used_this_month, bids_limit, premium_bids_balance')
      .eq('user_id', user.id)
      .maybeSingle();
    setLogisticsSubscription(data);
  };

  useEffect(() => {
    if (user?.id && role === 'supplier') {
      fetchSubscription();
      // Auto-open Product Catalog for suppliers on login
      setShowCatalog(true);
    }
    if (user?.id && role === 'logistics_partner') {
      fetchLogisticsAssets();
      fetchLogisticsSubscription();
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
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi Logo" 
              className="h-10 sm:h-16 w-auto object-contain cursor-pointer"
              width={64}
              height={64}
              loading="eager"
            />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <NotificationBell />
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => setShowProfileSettings(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex" onClick={async () => {
              await signOut();
              navigate('/');
            }}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:hidden" onClick={async () => {
              await signOut();
              navigate('/');
            }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">
            Welcome back, {user?.user_metadata?.contact_person || 'User'}!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {user?.user_metadata?.company_name} • {role?.toUpperCase()}
          </p>
        </div>

        {role === 'admin' && (
          <>
            <AdminDashboardCards 
              onOpenInvoiceManagement={() => setShowAdminInvoices(true)} 
              onOpenVehicleVerification={() => setShowVehicleVerification(true)}
              onOpenDataExport={() => setShowDataExport(true)}
              onOpenUsersList={() => setShowAdminUsersList(true)}
              onOpenRequirementsList={() => setShowAdminRequirementsList(true)}
              onOpenBidsList={() => setShowAdminBidsList(true)}
              onOpenLogisticsList={() => setShowAdminLogisticsList(true)}
              onOpenLeadsDashboard={() => setShowLeadsDashboard(true)}
              onOpenPremiumBidsManager={() => setShowPremiumBidsManager(true)}
              onOpenReferralStats={() => setShowReferralStats(true)}
              onOpenBlogManager={() => setShowBlogManager(true)}
              onOpenSEOTools={() => setShowSEOTools(true)}
              onOpenPartnerDocumentVerification={() => setShowPartnerDocVerification(true)}
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
            <AdminUsersList open={showAdminUsersList} onOpenChange={setShowAdminUsersList} />
            <AdminRequirementsList open={showAdminRequirementsList} onOpenChange={setShowAdminRequirementsList} />
            <AdminBidsList open={showAdminBidsList} onOpenChange={setShowAdminBidsList} />
            <AdminLogisticsList open={showAdminLogisticsList} onOpenChange={setShowAdminLogisticsList} />
            {showLeadsDashboard && (
              <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
                <div className="fixed inset-4 z-50 bg-background border rounded-lg shadow-lg overflow-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Leads Dashboard</h2>
                      <Button variant="outline" onClick={() => setShowLeadsDashboard(false)}>Close</Button>
                    </div>
                    <LeadsDashboard />
                  </div>
                </div>
              </div>
            )}
            <AdminReferralStats open={showReferralStats} onOpenChange={setShowReferralStats} />
            {user && (
              <PremiumBidsManager 
                open={showPremiumBidsManager}
                onOpenChange={setShowPremiumBidsManager}
                adminId={user.id}
              />
            )}
            {showBlogManager && (
              <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
                <div className="fixed inset-4 z-50 bg-background border rounded-lg shadow-lg overflow-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Blog Management</h2>
                      <Button variant="outline" onClick={() => setShowBlogManager(false)}>Close</Button>
                    </div>
                    <AdminBlogManager />
                  </div>
                </div>
              </div>
            )}
            <SEOTools open={showSEOTools} onOpenChange={setShowSEOTools} />
            {user && (
              <PartnerDocumentVerification
                open={showPartnerDocVerification}
                onOpenChange={setShowPartnerDocVerification}
                adminId={user.id}
              />
            )}
          </>
        )}

        {role === 'buyer' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    CRM & Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage inventory, invoices, PO & supplier contacts
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
                <BuyerCRM open={showCRM} onOpenChange={setShowCRM} userId={user.id} />
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
          <div className="space-y-4 sm:space-y-6">
            {/* Verification Status Card */}
            {!partnerVerification.loading && !partnerVerification.isFullyVerified && (
              <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-5 w-5" />
                    Document Verification Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    Your documents need to be verified before you can browse and submit quotes for logistics requirements.
                  </p>
                  
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                    {/* Verified Documents */}
                    {partnerVerification.verifiedDocuments.map((doc) => (
                      <div key={doc} className="flex items-center gap-2 p-2 bg-green-100 dark:bg-green-950/30 rounded-md">
                        <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-700 dark:text-green-400">{doc}</span>
                      </div>
                    ))}
                    
                    {/* Pending Documents */}
                    {partnerVerification.pendingDocuments.map((doc) => (
                      <div key={doc} className="flex items-center gap-2 p-2 bg-amber-100 dark:bg-amber-950/30 rounded-md">
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm text-amber-700 dark:text-amber-400">{doc}</span>
                      </div>
                    ))}
                    
                    {/* Rejected Documents */}
                    {partnerVerification.rejectedDocuments.map((doc) => (
                      <div key={doc.type} className="flex flex-col gap-1 p-2 bg-red-100 dark:bg-red-950/30 rounded-md">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <span className="text-sm font-medium text-red-700 dark:text-red-400">{doc.type}</span>
                        </div>
                        {doc.reason && (
                          <p className="text-xs text-red-600 dark:text-red-400 pl-6">{doc.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button 
                    variant="outline" 
                    className="border-amber-400 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400"
                    onClick={() => setShowLogisticsOnboarding(true)}
                  >
                    Upload Documents
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Verified Status Badge */}
            {!partnerVerification.loading && partnerVerification.isFullyVerified && (
              <Card className="border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">Documents Verified</p>
                      <p className="text-sm text-green-600 dark:text-green-500">You can now browse and submit quotes for logistics requirements.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Asset Summary Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
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

            <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

              <Card className={!partnerVerification.isFullyVerified ? 'opacity-60' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Browse Requirements
                    {!partnerVerification.isFullyVerified && (
                      <Badge variant="outline" className="ml-auto text-amber-600 border-amber-300">
                        Verification Required
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {partnerVerification.isFullyVerified 
                      ? 'View logistics requirements and submit quotes'
                      : 'Complete document verification to access load details'
                    }
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={() => partnerVerification.isFullyVerified 
                      ? setShowBrowseLogisticsRequirements(true) 
                      : setShowLogisticsOnboarding(true)
                    }
                    variant={partnerVerification.isFullyVerified ? 'default' : 'outline'}
                  >
                    {partnerVerification.isFullyVerified ? 'Browse & Quote' : 'Upload Documents First'}
                  </Button>
                </CardContent>
              </Card>

              {/* Subscription Card for Logistics Partners */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {(logisticsSubscription?.premium_bids_balance ?? 0) > 0 && (
                      <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    )}
                    Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Free Monthly Quotes */}
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Free Plan (5 quotes/month)</div>
                    <div className="text-xl font-bold text-primary mb-1">
                      {logisticsSubscription?.bids_used_this_month ?? 0}/{logisticsSubscription?.bids_limit ?? 5}
                    </div>
                    <Progress 
                      value={((logisticsSubscription?.bids_used_this_month ?? 0) / (logisticsSubscription?.bids_limit ?? 5)) * 100} 
                      className="mb-1 h-2" 
                    />
                    <p className="text-xs text-muted-foreground">Monthly quotes used</p>
                  </div>

                  {/* Premium Balance Display */}
                  {(logisticsSubscription?.premium_bids_balance ?? 0) > 0 && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Premium Balance</span>
                      </div>
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {logisticsSubscription?.premium_bids_balance ?? 0} quotes
                      </div>
                      <p className="text-xs text-amber-600/80 dark:text-amber-400/80">Lifetime quotes (never expires)</p>
                    </div>
                  )}

                  {/* Premium Pack Purchase Option */}
                  {(logisticsSubscription?.premium_bids_balance ?? 0) === 0 ? (
                    <div className="p-4 rounded-lg border-2 border-dashed border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-5 w-5 text-amber-500" />
                        <span className="font-bold text-foreground">Buy Premium Pack</span>
                      </div>
                      <div className="text-2xl font-bold text-primary mb-1">₹24,950</div>
                      <p className="text-sm text-muted-foreground mb-3">50 lifetime quotes (₹499/quote)</p>
                      <ul className="text-sm space-y-1 mb-4">
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-4 w-4 text-green-500" /> Never expires - use anytime
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-4 w-4 text-green-500" /> Priority in quote listings
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-4 w-4 text-green-500" /> Dedicated support
                        </li>
                      </ul>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-center mb-2">Contact to Purchase:</p>
                        <a 
                          href="https://wa.me/918368127357?text=Hi, I would like to purchase the Logistics Premium Pack (₹24,950 for 50 lifetime quotes)."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp: +91 8368127357
                        </a>
                        <a 
                          href="mailto:sales@procuresaathi.com?subject=Logistics Premium Pack Purchase Request&body=Hi, I would like to purchase the Logistics Premium Pack (₹24,950 for 50 lifetime quotes)."
                          className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md border border-primary text-primary hover:bg-primary/10 font-medium transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                          sales@procuresaathi.com
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-center mb-2">Buy More Premium Quotes:</p>
                      <a 
                        href="https://wa.me/918368127357?text=Hi, I would like to purchase more premium quotes."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp: +91 8368127357
                      </a>
                      <a 
                        href="mailto:sales@procuresaathi.com?subject=Buy More Premium Quotes&body=Hi, I would like to purchase more premium quotes."
                        className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md border border-primary text-primary hover:bg-primary/10 font-medium transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        sales@procuresaathi.com
                      </a>
                    </div>
                  )}

                  {(logisticsSubscription?.bids_used_this_month ?? 0) >= (logisticsSubscription?.bids_limit ?? 5) && (logisticsSubscription?.premium_bids_balance ?? 0) === 0 && (
                    <p className="text-sm text-orange-600 font-medium">
                      Additional quotes: ₹500 each
                    </p>
                  )}
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

            {/* Referral Section for Logistics Partners */}
            {user && <ReferralSection userId={user.id} role="logistics_partner" />}

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
            <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                  <CardTitle className="flex items-center gap-2">
                    {(subscription?.premium_bids_balance ?? 0) > 0 && (
                      <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    )}
                    Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Free Monthly Bids */}
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Free Plan (5 bids/month)</div>
                    <div className="text-xl font-bold text-primary mb-1">
                      {subscription?.bids_used_this_month ?? 0}/{subscription?.bids_limit ?? 5}
                    </div>
                    <Progress 
                      value={((subscription?.bids_used_this_month ?? 0) / (subscription?.bids_limit ?? 5)) * 100} 
                      className="mb-1 h-2" 
                    />
                    <p className="text-xs text-muted-foreground">Monthly bids used</p>
                  </div>

                  {/* Premium Balance Display */}
                  {(subscription?.premium_bids_balance ?? 0) > 0 && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Premium Balance</span>
                      </div>
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {subscription?.premium_bids_balance ?? 0} bids
                      </div>
                      <p className="text-xs text-amber-600/80 dark:text-amber-400/80">Lifetime bids (never expires)</p>
                    </div>
                  )}

                  {/* Premium Pack Purchase Option */}
                  {(subscription?.premium_bids_balance ?? 0) === 0 ? (
                    <div className="p-4 rounded-lg border-2 border-dashed border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-5 w-5 text-amber-500" />
                        <span className="font-bold text-foreground">Buy Premium Pack</span>
                      </div>
                      <div className="text-2xl font-bold text-primary mb-1">₹24,950</div>
                      <p className="text-sm text-muted-foreground mb-3">50 lifetime bids (₹499/bid)</p>
                      <ul className="text-sm space-y-1 mb-4">
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-4 w-4 text-green-500" /> Never expires - use anytime
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-4 w-4 text-green-500" /> Priority listing in search
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-4 w-4 text-green-500" /> Dedicated support
                        </li>
                      </ul>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-center mb-2">Contact to Purchase:</p>
                        <a 
                          href="https://wa.me/918368127357?text=Hi, I would like to purchase the Premium Pack (₹24,950 for 50 lifetime bids)."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp: +91 8368127357
                        </a>
                        <a 
                          href="mailto:sales@procuresaathi.com?subject=Premium Pack Purchase Request&body=Hi, I would like to purchase the Premium Pack (₹24,950 for 50 lifetime bids)."
                          className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md border border-primary text-primary hover:bg-primary/10 font-medium transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                          sales@procuresaathi.com
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-center mb-2">Buy More Premium Bids:</p>
                      <a 
                        href="https://wa.me/918368127357?text=Hi, I would like to purchase more premium bids."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp: +91 8368127357
                      </a>
                      <a 
                        href="mailto:sales@procuresaathi.com?subject=Buy More Premium Bids&body=Hi, I would like to purchase more premium bids."
                        className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md border border-primary text-primary hover:bg-primary/10 font-medium transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        sales@procuresaathi.com
                      </a>
                    </div>
                  )}

                  {(subscription?.bids_used_this_month ?? 0) >= (subscription?.bids_limit ?? 5) && (subscription?.premium_bids_balance ?? 0) === 0 && (
                    <p className="text-sm text-orange-600 font-medium">
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

            {/* Referral Section for Suppliers */}
            {user && <ReferralSection userId={user.id} role="supplier" />}

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
        
        {user && (
          <ProfileSettings
            open={showProfileSettings}
            onOpenChange={setShowProfileSettings}
            userId={user.id}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
