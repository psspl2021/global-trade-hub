/**
 * ============================================================
 * OPERATIONAL DASHBOARD (/dashboard)
 * ============================================================
 * 
 * ROLES: buyer, buyer_purchaser, purchaser, supplier, logistics_partner
 * 
 * STRICT EXECUTION MODE:
 * - NO admin components
 * - NO control tower
 * - NO governance/revenue/ROI metrics
 * - ONLY execution features (RFQ, quotes, inventory, logistics)
 * 
 * Admin roles are redirected to /admin
 * Management roles are redirected to /management
 * 
 * NEW: Purchaser context selector for multi-purchaser companies
 * NEW: Management view selector for CFO/CEO/HR oversight
 */

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useSEO } from '@/hooks/useSEO';
import { usePartnerVerification } from '@/hooks/usePartnerVerification';
import { useBuyerCompanyContext } from '@/hooks/useBuyerCompanyContext';
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
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';
import { ReferralSection } from '@/components/ReferralSection';
import { ProfileSettings } from '@/components/ProfileSettings';
import { AIRFQGenerator } from '@/components/AIRFQGenerator';
import { ProfileCompletionModal } from '@/components/ProfileCompletionModal';
import { SupplierEmailQuotaCard } from '@/components/SupplierEmailQuotaCard';
import { PremiumPackPurchase } from '@/components/PremiumPackPurchase';
import { SubscriptionInvoices } from '@/components/SubscriptionInvoices';
import { SupplierAIPerformanceCard } from '@/components/SupplierAIPerformanceCard';
import { AIInventoryDiscoveryCard } from '@/components/AIInventoryDiscoveryCard';
import { BuyerDiscoveryHub } from '@/components/BuyerDiscoveryHub';
import { PostRFQAIInventoryModal } from '@/components/PostRFQAIInventoryModal';
import { BuyerDashboardHeader } from '@/components/dashboard/BuyerDashboardHeader';

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
  // Admin state variables removed - admin roles redirect to /admin
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
  const [subscription, setSubscription] = useState<{ bids_used_this_month: number; bids_limit: number; premium_bids_balance: number; is_early_adopter?: boolean; early_adopter_expires_at?: string | null } | null>(null);
  const [logisticsSubscription, setLogisticsSubscription] = useState<{ bids_used_this_month: number; bids_limit: number; premium_bids_balance: number; is_early_adopter?: boolean; early_adopter_expires_at?: string | null } | null>(null);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [aiGeneratedRFQ, setAIGeneratedRFQ] = useState<any>(null);
  const [showPostRFQInventory, setShowPostRFQInventory] = useState(false);
  const [lastRFQData, setLastRFQData] = useState<{ category: string; quantity: number; buyerCity: string | null } | null>(null);
  // SEO for dashboard
  useSEO({
    title: 'Dashboard | ProcureSaathi',
    description: 'Manage your B2B procurement, track requirements, and connect with verified suppliers on ProcureSaathi dashboard.',
  });

  const fetchSubscription = async () => {
    if (!user?.id || role !== 'supplier') return;
    const { data } = await supabase
      .from('subscriptions')
      .select('bids_used_this_month, bids_limit, premium_bids_balance, is_early_adopter, early_adopter_expires_at')
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
      .select('bids_used_this_month, bids_limit, premium_bids_balance, is_early_adopter, early_adopter_expires_at')
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
    // Check for pending RFQ from AI generator (for buyers)
    if (user?.id && role === 'buyer') {
      const pendingRFQ = sessionStorage.getItem('pendingRFQ');
      if (pendingRFQ) {
        try {
          const rfqData = JSON.parse(pendingRFQ);
          setAIGeneratedRFQ(rfqData);
          setShowRequirementForm(true);
          sessionStorage.removeItem('pendingRFQ');
        } catch (e) {
          console.error('Failed to parse pending RFQ:', e);
          sessionStorage.removeItem('pendingRFQ');
        }
      }
    }
  }, [user?.id, role]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
    // Redirect affiliates to their dedicated portal
    if (!authLoading && !roleLoading && role === 'affiliate') {
      navigate('/affiliate');
    }
    // ROLE-BASED DASHBOARD SEPARATION:
    // Redirect management roles (buyer_cfo, buyer_ceo, buyer_manager, cfo, ceo, manager) to /management
    if (!authLoading && !roleLoading && ['cfo', 'buyer_cfo', 'ceo', 'buyer_ceo', 'manager', 'buyer_manager'].includes(role || '')) {
      navigate('/management');
    }
    // Redirect admin roles to /admin
    if (!authLoading && !roleLoading && (role === 'ps_admin' || role === 'admin')) {
      navigate('/admin');
    }
  }, [user, authLoading, roleLoading, role, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if this is a buyer role that should see the new header with dropdowns
  const isBuyerRole = role === 'buyer' || role === 'buyer_purchaser' || role === 'purchaser';

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Completion Modal - blocks until mandatory fields are filled */}
      <ProfileCompletionModal userId={user?.id} onComplete={() => setProfileComplete(true)} />
      
      {/* Buyer Dashboard Header with Context Selectors */}
      {isBuyerRole && (
        <BuyerDashboardHeader onOpenSettings={() => setShowProfileSettings(true)} />
      )}
      
      {/* Standard Header for non-buyer roles */}
      {!isBuyerRole && (
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={procureSaathiLogo} 
                alt="ProcureSaathi Logo" 
                className="h-14 sm:h-20 w-auto object-contain cursor-pointer"
                width={80}
                height={80}
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
      )}

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

        {/* Admin section removed - admin roles redirect to /admin route */}

        {/* Buyer roles: buyer, buyer_purchaser, purchaser - OPERATIONAL DASHBOARD */}
        {(role === 'buyer' || role === 'buyer_purchaser' || role === 'purchaser') && (
          <div className="space-y-4 sm:space-y-6">
            {/* Governance Banner */}
            <div className="bg-sky-600 text-white py-2 px-4 rounded-lg">
              <p className="text-sm text-center font-medium">
                This is an execution dashboard. Savings are tracked by AI. Incentives are declared by management.
              </p>
            </div>
            {/* AI-Powered RFQ Generator - Hero Section */}
            <AIRFQGenerator 
              onRFQGenerated={(rfq) => {
                setAIGeneratedRFQ(rfq);
                setShowRequirementForm(true);
              }}
            />

            {/* Unified Discovery Hub: AI Inventory (LEFT) + Manual RFQ (RIGHT) */}
            {user && (
              <BuyerDiscoveryHub 
                userId={user.id} 
                onOpenManualRFQ={() => setShowRequirementForm(true)}
              />
            )}

            {/* Quick Actions Grid */}
            <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                    Manage inventory, invoices & purchase orders
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

            {/* Referral Section for Buyers */}
            {user && <ReferralSection userId={user.id} role="buyer" />}
            
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
                <PostRFQAIInventoryModal
                  open={showPostRFQInventory}
                  onOpenChange={setShowPostRFQInventory}
                  userId={user.id}
                  rfqCategory={lastRFQData?.category || ''}
                  rfqQuantity={lastRFQData?.quantity || 0}
                  buyerCity={lastRFQData?.buyerCity || null}
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
                  {/* Early Adopter or Free Plan Display */}
                  <div>
                    {logisticsSubscription?.is_early_adopter ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                          <span className="text-base font-bold text-amber-600 dark:text-amber-400">1 Year FREE Premium!</span>
                        </div>
                        <div className="text-xl font-bold text-primary mb-2">
                          Unlimited Quotes
                        </div>
                        <div className="p-3 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-300 dark:border-green-700">
                          <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                            🎉 Early Adopter - First 100 Partners!
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Free subscription ends on: <span className="font-semibold">{logisticsSubscription?.early_adopter_expires_at ? new Date(logisticsSubscription.early_adopter_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '1 year from signup'}</span>
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-muted-foreground mb-1">Free Plan (5 quotes/month)</div>
                        <div className="text-xl font-bold text-primary mb-1">
                          {logisticsSubscription?.bids_used_this_month ?? 0}/{logisticsSubscription?.bids_limit ?? 5}
                        </div>
                        <Progress 
                          value={((logisticsSubscription?.bids_used_this_month ?? 0) / (logisticsSubscription?.bids_limit ?? 5)) * 100} 
                          className="mb-1 h-2" 
                        />
                        <p className="text-xs text-muted-foreground">Monthly quotes used</p>
                      </>
                    )}
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
                  <PremiumPackPurchase
                    userId={user?.id || ''}
                    userEmail={user?.email || ''}
                    userPhone={user?.user_metadata?.phone || ''}
                    userName={user?.user_metadata?.contact_person || user?.user_metadata?.company_name || ''}
                    userType="logistics_partner"
                    hasPremiumBalance={(logisticsSubscription?.premium_bids_balance ?? 0) > 0}
                  />

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
            {/* AI Inventory Performance Card */}
            {user && (
              <div className="mb-4">
                <SupplierAIPerformanceCard userId={user.id} onOpenCatalog={() => setShowCatalog(true)} />
              </div>
            )}

            {/* Subscription Invoices */}
            <div className="mb-4">
              <SubscriptionInvoices />
            </div>

            {/* Compact Grid - All boxes in one view */}
            <div className="grid gap-2 grid-cols-3 lg:grid-cols-3">
              <Card className="p-3">
                <p className="text-sm font-medium">Stock Management</p>
                <Button variant="outline" className="w-full mt-2" size="sm" onClick={() => setShowStock(true)}>Update</Button>
              </Card>

              <Card className="p-3">
                <p className="text-sm font-medium">Requirements</p>
                <Button variant="outline" className="w-full mt-2" size="sm" onClick={() => setShowRequirements(true)}>Browse</Button>
              </Card>

              <Card className="p-3">
                <p className="text-sm font-medium">Invoices & PO</p>
                <Button variant="outline" className="w-full mt-2" size="sm" onClick={() => setShowCRM(true)}>CRM</Button>
              </Card>
            </div>

            {/* Compact cards grid for Subscription, Email, Platform Invoices */}
            <div className="grid gap-2 grid-cols-3 mt-4">
              <Card className="p-3">
                <div className="flex items-center gap-1 mb-1">
                  <Star className="h-3 w-3 text-amber-500" />
                  <p className="text-xs font-medium">Subscription</p>
                </div>
                {subscription?.is_early_adopter && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-1 py-0 mb-1">
                    EARLY ADOPTER
                  </Badge>
                )}
                <p className="text-[10px] text-muted-foreground mb-1">
                  {subscription?.bids_used_this_month ?? 0}/{subscription?.bids_limit ?? 5} bids used
                </p>
                <Progress 
                  value={((subscription?.bids_used_this_month ?? 0) / (subscription?.bids_limit ?? 5)) * 100} 
                  className="h-1 mb-2" 
                />
                <PremiumPackPurchase
                  userId={user?.id || ''}
                  userEmail={user?.email || ''}
                  userPhone={user?.user_metadata?.phone || ''}
                  userName={user?.user_metadata?.contact_person || user?.user_metadata?.company_name || ''}
                  userType="supplier"
                  hasPremiumBalance={(subscription?.premium_bids_balance ?? 0) > 0}
                />
              </Card>

              <SupplierEmailQuotaCard />

              <Card className="p-3">
                <div className="flex items-center gap-1 mb-1">
                  <Receipt className="h-3 w-3" />
                  <p className="text-xs font-medium">Platform Invoices</p>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">WhatsApp: +91 8368127357</p>
                <Button variant="outline" className="w-full" size="sm" onClick={() => setShowPlatformInvoices(true)}>
                  View
                </Button>
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
            onOpenChange={(isOpen) => {
              setShowRequirementForm(isOpen);
              if (!isOpen) setAIGeneratedRFQ(null);
            }}
            userId={user.id}
            onSuccess={(rfqData) => {
              setRefreshKey(k => k + 1);
              setAIGeneratedRFQ(null);
              
              // Trigger AI Inventory modal after RFQ submission
              setLastRFQData({
                category: rfqData.category,
                quantity: rfqData.quantity,
                buyerCity: rfqData.deliveryLocation || null,
              });
              setShowPostRFQInventory(true);
            }}
            prefillData={aiGeneratedRFQ}
            onClearPrefill={() => setAIGeneratedRFQ(null)}
            // Pass signal page attribution from stored RFQ
            source={(aiGeneratedRFQ as any)?.source || 'direct'}
            signalPageId={(aiGeneratedRFQ as any)?.signalPageId}
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
