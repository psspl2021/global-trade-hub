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

import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useSEO } from '@/hooks/useSEO';
import { usePartnerVerification } from '@/hooks/usePartnerVerification';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Loader2, Package, Receipt, Truck, Warehouse, FileText, MapPin, Star, Check, MessageCircle, Mail, AlertTriangle, ShieldCheck, Clock, XCircle, Settings, Home, Gavel, ArrowLeft, ShoppingCart, BarChart3, Users, Wallet } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationBell } from '@/components/NotificationBell';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';
import { BuyerDashboardHeader } from '@/components/dashboard/BuyerDashboardHeader';
import { useBuyerCompanyContext } from '@/hooks/useBuyerCompanyContext';

// Lazy: heavy components not needed for first paint of dashboard shell
const BuyerRequirementsList = lazy(() => import('@/components/BuyerRequirementsList').then(m => ({ default: m.BuyerRequirementsList })));
const ProfileCompletionModal = lazy(() => import('@/components/ProfileCompletionModal').then(m => ({ default: m.ProfileCompletionModal })));
const BuyerActionCards = lazy(() => import('@/components/dashboard/BuyerActionCards').then(m => ({ default: m.BuyerActionCards })));
const AIRFQGenerator = lazy(() => import('@/components/AIRFQGenerator').then(m => ({ default: m.AIRFQGenerator })));
const BuyerDiscoveryHub = lazy(() => import('@/components/BuyerDiscoveryHub').then(m => ({ default: m.BuyerDiscoveryHub })));

// Lazy-loaded sub-views (only fetched when the user opens them)
const SupplierCatalog = lazy(() => import('@/components/SupplierCatalog').then(m => ({ default: m.SupplierCatalog })));
const StockManagement = lazy(() => import('@/components/StockManagement').then(m => ({ default: m.StockManagement })));
const BrowseRequirements = lazy(() => import('@/components/BrowseRequirements').then(m => ({ default: m.BrowseRequirements })));
const SupplierCRM = lazy(() => import('@/components/crm/SupplierCRM').then(m => ({ default: m.SupplierCRM })));
const BuyerCRM = lazy(() => import('@/components/crm/BuyerCRM').then(m => ({ default: m.BuyerCRM })));
const SupplierAcceptedBids = lazy(() => import('@/components/SupplierAcceptedBids').then(m => ({ default: m.SupplierAcceptedBids })));
const SupplierMyBids = lazy(() => import('@/components/SupplierMyBids').then(m => ({ default: m.SupplierMyBids })));
const LiveSupplierStock = lazy(() => import('@/components/LiveSupplierStock').then(m => ({ default: m.LiveSupplierStock })));
const PlatformInvoices = lazy(() => import('@/components/PlatformInvoices').then(m => ({ default: m.PlatformInvoices })));
const FleetManagement = lazy(() => import('@/components/logistics/FleetManagement').then(m => ({ default: m.FleetManagement })));
const WarehouseManagement = lazy(() => import('@/components/logistics/WarehouseManagement').then(m => ({ default: m.WarehouseManagement })));
const LogisticsOnboarding = lazy(() => import('@/components/logistics/LogisticsOnboarding').then(m => ({ default: m.LogisticsOnboarding })));
const CreateLogisticsRequirementForm = lazy(() => import('@/components/logistics/CreateLogisticsRequirementForm').then(m => ({ default: m.CreateLogisticsRequirementForm })));
const BuyerLogisticsRequirements = lazy(() => import('@/components/logistics/BuyerLogisticsRequirements').then(m => ({ default: m.BuyerLogisticsRequirements })));
const BrowseLogisticsRequirements = lazy(() => import('@/components/logistics/BrowseLogisticsRequirements').then(m => ({ default: m.BrowseLogisticsRequirements })));
const TransporterMyBids = lazy(() => import('@/components/logistics/TransporterMyBids').then(m => ({ default: m.TransporterMyBids })));
const ActiveShipments = lazy(() => import('@/components/logistics/ActiveShipments').then(m => ({ default: m.ActiveShipments })));
const ActiveRoutePlanning = lazy(() => import('@/components/logistics/ActiveRoutePlanning').then(m => ({ default: m.ActiveRoutePlanning })));
const CustomerShipmentTracking = lazy(() => import('@/components/logistics/CustomerShipmentTracking').then(m => ({ default: m.CustomerShipmentTracking })));
const ReferralSection = lazy(() => import('@/components/ReferralSection').then(m => ({ default: m.ReferralSection })));
const ProfileSettings = lazy(() => import('@/components/ProfileSettings').then(m => ({ default: m.ProfileSettings })));
const SupplierEmailQuotaCard = lazy(() => import('@/components/SupplierEmailQuotaCard').then(m => ({ default: m.SupplierEmailQuotaCard })));
const PremiumPackPurchase = lazy(() => import('@/components/PremiumPackPurchase').then(m => ({ default: m.PremiumPackPurchase })));
const SubscriptionInvoices = lazy(() => import('@/components/SubscriptionInvoices').then(m => ({ default: m.SubscriptionInvoices })));
const SupplierAIPerformanceCard = lazy(() => import('@/components/SupplierAIPerformanceCard').then(m => ({ default: m.SupplierAIPerformanceCard })));
const AIInventoryDiscoveryCard = lazy(() => import('@/components/AIInventoryDiscoveryCard').then(m => ({ default: m.AIInventoryDiscoveryCard })));
const PostRFQAIInventoryModal = lazy(() => import('@/components/PostRFQAIInventoryModal').then(m => ({ default: m.PostRFQAIInventoryModal })));
const ReverseAuctionDashboard = lazy(() => import('@/components/reverse-auction/ReverseAuctionDashboard').then(m => ({ default: m.ReverseAuctionDashboard })));
const ForwardRFQCenter = lazy(() => import('@/components/forward-rfq/ForwardRFQCenter').then(m => ({ default: m.ForwardRFQCenter })));
const CreateRequirementForm = lazy(() => import('@/components/CreateRequirementForm').then(m => ({ default: m.CreateRequirementForm })));
const CFOFinancialDashboard = lazy(() => import('@/components/governance/CFOFinancialDashboard').then(m => ({ default: m.CFOFinancialDashboard })));
const CompanyIntelligenceRouter = lazy(() => import('@/components/governance/intelligence').then(m => ({ default: m.CompanyIntelligenceRouter })));

const ROLE_DEFAULT_MANAGEMENT_VIEW: Partial<Record<string, 'cfo' | 'ceo' | 'hr' | 'manager'>> = {
  cfo: 'cfo',
  buyer_cfo: 'cfo',
  ceo: 'ceo',
  buyer_ceo: 'ceo',
  hr: 'hr',
  buyer_hr: 'hr',
  manager: 'manager',
  buyer_manager: 'manager',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user?.id);
  const { selectedPurchaser } = useBuyerCompanyContext();
  const partnerVerification = usePartnerVerification(role === 'logistics_partner' ? user?.id : undefined);
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  
  // Management view state — synced via custom event from BuyerDashboardHeader's ManagementViewSelector
  const [activeManagementView, setActiveManagementView] = useState<'cfo' | 'ceo' | 'hr' | 'manager' | null>(() => {
    return (localStorage.getItem('ps_management_view') as any) || null;
  });
  
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setActiveManagementView(detail?.view || null);
    };
    window.addEventListener('ps-management-view-change', handler);
    return () => window.removeEventListener('ps-management-view-change', handler);
  }, []);

  // Derive sub-view state from URL search params so it survives refresh
  const activeView = searchParams.get('view') || '';
  const showForwardRFQ = activeView === 'forward-rfq';
  const showReverseAuction = activeView === 'reverse-auction';
  const showSupplierForwardBids = activeView === 'supplier-forward-bids';
  const showSupplierReverseBids = activeView === 'supplier-reverse-bids';

  const setShowForwardRFQ = (show: boolean) => {
    setSearchParams(show ? { view: 'forward-rfq' } : {}, { replace: true });
  };
  const setShowReverseAuction = (show: boolean) => {
    setSearchParams(show ? { view: 'reverse-auction' } : {}, { replace: true });
  };
  const setShowSupplierForwardBids = (show: boolean) => {
    setSearchParams(show ? { view: 'supplier-forward-bids' } : {}, { replace: true });
  };
  const setShowSupplierReverseBids = (show: boolean) => {
    setSearchParams(show ? { view: 'supplier-reverse-bids' } : {}, { replace: true });
  };
  const showSupplierSubscription = activeView === 'supplier-subscription';
  const setShowSupplierSubscription = (show: boolean) => {
    setSearchParams(show ? { view: 'supplier-subscription' } : {}, { replace: true });
  };
  const showSupplierReferral = activeView === 'supplier-referral';
  const setShowSupplierReferral = (show: boolean) => {
    setSearchParams(show ? { view: 'supplier-referral' } : {}, { replace: true });
  };
  const showSupplierAIPerformance = activeView === 'supplier-ai-performance';
  const setShowSupplierAIPerformance = (show: boolean) => {
    setSearchParams(show ? { view: 'supplier-ai-performance' } : {}, { replace: true });
  };
  const showBuyerReferral = activeView === 'buyer-referral';
  const setShowBuyerReferral = (show: boolean) => {
    setSearchParams(show ? { view: 'buyer-referral' } : {}, { replace: true });
  };
  const showBookTransport = activeView === 'book-transport';
  const setShowBookTransport = (show: boolean) => {
    setSearchParams(show ? { view: 'book-transport' } : {}, { replace: true });
  };
  const showFinancials = activeView === 'financials';
  const setShowFinancials = (show: boolean) => {
    setSearchParams(show ? { view: 'financials' } : {}, { replace: true });
  };
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
    const initializeSupplierDashboard = async () => {
      if (!user?.id || role !== 'supplier') return;

      await fetchSubscription();

      const { count, error } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('supplier_id', user.id);

      if (!error && (count ?? 0) === 0) {
        setShowCatalog(true);
      }
    };

    if (user?.id && role === 'supplier') {
      initializeSupplierDashboard();
    }
    if (user?.id && role === 'logistics_partner') {
      fetchLogisticsAssets();
      fetchLogisticsSubscription();
    }
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
    // Redirect admin roles to /admin
    if (!authLoading && !roleLoading && (role === 'ps_admin' || role === 'admin')) {
      navigate('/admin');
    }
  }, [user, authLoading, roleLoading, role, navigate]);

  useEffect(() => {
    if (authLoading || roleLoading) return;

    const defaultManagementView = role ? ROLE_DEFAULT_MANAGEMENT_VIEW[role] : null;
    if (!defaultManagementView) return;

    setActiveManagementView((current) => current ?? defaultManagementView);

    if (typeof window !== 'undefined' && !localStorage.getItem('ps_management_view')) {
      localStorage.setItem('ps_management_view', defaultManagementView);
      window.dispatchEvent(new CustomEvent('ps-management-view-change', { detail: { view: defaultManagementView } }));
    }
  }, [authLoading, roleLoading, role]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if this is a buyer role that should see the new header with dropdowns
  // Includes all buyer roles and management roles that can access buyer dashboard
  const BUYER_DASHBOARD_ROLES = [
    'buyer', 'buyer_purchaser', 'purchaser',
    'buyer_cfo', 'buyer_ceo', 'buyer_hr', 'buyer_manager',
    'cfo', 'ceo', 'hr', 'manager'
  ];
  const isBuyerRole = role ? BUYER_DASHBOARD_ROLES.includes(role) : false;

  const SuspenseFallback = (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  return (
    <Suspense fallback={SuspenseFallback}>
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
              <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => navigate('/')}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 sm:hidden" onClick={() => navigate('/')}>
                <Home className="h-4 w-4" />
              </Button>
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
        {/* Welcome + context — adapts to management view */}
        {isBuyerRole && activeManagementView ? (
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
              <span className="font-medium text-foreground/80">
                {activeManagementView === 'cfo' ? 'CFO View' :
                 activeManagementView === 'ceo' ? 'CEO View' :
                 activeManagementView === 'hr' ? 'HR View' :
                 activeManagementView === 'vp' ? 'VP View' :
                 activeManagementView === 'purchase_head' ? 'Head of Procurement View' :
                 'Manager View'}
              </span>
            </p>
            <h1 className="text-xl sm:text-2xl font-bold mb-0.5">
              {activeManagementView === 'cfo' ? 'Financial Overview' :
               activeManagementView === 'ceo' ? 'Executive Summary' :
               activeManagementView === 'hr' ? 'Team & HR Insights' :
               activeManagementView === 'vp' ? 'Procurement Leadership Overview' :
               activeManagementView === 'purchase_head' ? 'Procurement Governance & Approvals' :
               'Operations Overview'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeManagementView === 'cfo' ? 'Payables, savings verification & financial analytics' :
               activeManagementView === 'ceo' ? 'Company KPIs, performance & strategic insights' :
               activeManagementView === 'hr' ? 'Team performance, incentive tracking & HR metrics' :
               activeManagementView === 'vp' ? 'Cross-category strategy, supplier relationships & spend leadership' :
               activeManagementView === 'purchase_head' ? 'Approval queues, category control & policy enforcement' :
               'Procurement execution, team activity & operational monitoring'}
            </p>
          </div>
        ) : isBuyerRole ? (
          <div className="mb-3 sm:mb-8">
            <h1 className="text-base sm:text-3xl font-bold mb-0.5 sm:mb-2 leading-tight">
              Welcome back, {selectedPurchaser?.display_name || user?.user_metadata?.contact_person || 'User'}!
            </h1>
            <p className="text-xs sm:text-base text-muted-foreground truncate">
              {user?.user_metadata?.company_name} • {role?.toUpperCase()}
            </p>
          </div>
        ) : (
          <div className="mb-3 sm:mb-8">
            <h1 className="text-base sm:text-3xl font-bold mb-0.5 sm:mb-2 leading-tight">
              Welcome back, {user?.user_metadata?.contact_person || 'User'}!
            </h1>
            <p className="text-xs sm:text-base text-muted-foreground truncate">
              {user?.user_metadata?.company_name} • {role?.toUpperCase()}
            </p>
          </div>
        )}

        {/* Admin section removed - admin roles redirect to /admin route */}

        {/* Management View content — backend-scoped, no duplicate access gates */}
        {isBuyerRole && activeManagementView && (
          <div className="space-y-6">
            {activeManagementView === 'cfo' && <CFOFinancialDashboard />}
            {activeManagementView === 'ceo' && (
              <>
                <div className="flex justify-end">
                  <Link
                    to="/governance/ceo"
                    onMouseEnter={() => {
                      // Prefetch CEO chunks on hover for instant navigation
                      import("./governance/ceo/CEOControlLayout");
                      import("./governance/ceo/CEOOverview");
                    }}
                    className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition"
                  >
                    Open CEO Control Layer →
                  </Link>
                </div>
                <CompanyIntelligenceRouter forcedView="CEO" hideViewSelector />
              </>
            )}
            {activeManagementView === 'hr' && (
              <CompanyIntelligenceRouter forcedView="HR" hideViewSelector />
            )}
            {activeManagementView === 'manager' && (
              <CompanyIntelligenceRouter forcedView="MANAGER" hideViewSelector />
            )}
          </div>
        )}

        {/* Buyer EXECUTION dashboard — only when NO management view is active */}
        {isBuyerRole && !activeManagementView && (
           <div className="space-y-4 sm:space-y-6">
            {/* Governance Banner */}
            <div className="bg-sky-600 text-white py-1.5 sm:py-2 px-3 sm:px-4 rounded-md sm:rounded-lg">
              <p className="text-[11px] sm:text-sm text-center font-medium leading-snug">
                <span className="sm:hidden">Execution dashboard • Savings tracked by AI</span>
                <span className="hidden sm:inline">This is an execution dashboard. Savings are tracked by AI. Incentives are declared by management.</span>
              </p>
            </div>

            {/* Forward RFQ Center (full sub-page) */}
            {showForwardRFQ ? (
              <ForwardRFQCenter
                userId={user!.id}
                refreshKey={refreshKey}
                onBack={() => setShowForwardRFQ(false)}
                onOpenManualRFQ={() => setShowRequirementForm(true)}
                onRFQGenerated={(rfq) => {
                  setAIGeneratedRFQ(rfq);
                  setShowRequirementForm(true);
                }}
              />
             ) : showReverseAuction ? (
               <div className="space-y-4">
                 <Button variant="ghost" size="sm" onClick={() => setShowReverseAuction(false)} className="gap-2">
                   <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                 </Button>
                 <ReverseAuctionDashboard isSupplier={false} />
               </div>
             ) : showBuyerReferral ? (
               /* ── Sub-View: Buyer Refer & Earn ── */
               <div className="space-y-4">
                 <Button variant="ghost" size="sm" onClick={() => setShowBuyerReferral(false)} className="gap-2">
                   <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                 </Button>
                 <div className="flex items-center gap-3 mb-2">
                   <div className="p-2.5 rounded-[0.625rem] bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
                     <MessageCircle className="w-5 h-5 text-white" />
                   </div>
                   <div>
                     <h2 className="text-lg font-bold text-foreground">Refer & Earn</h2>
                     <p className="text-xs text-muted-foreground">Share, refer buyers, and earn commissions</p>
                   </div>
                 </div>
                 {user && <ReferralSection userId={user.id} role="buyer" />}
                </div>
             ) : showBookTransport ? (
               /* ── Sub-View: Book Transport Hub ── */
               <div className="space-y-4">
                 <Button variant="ghost" size="sm" onClick={() => setShowBookTransport(false)} className="gap-2">
                   <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                 </Button>
                 <div className="flex items-center gap-3 mb-2">
                   <div className="p-2.5 rounded-[0.625rem] bg-gradient-to-br from-orange-500 to-amber-600 shadow-md">
                     <Truck className="w-5 h-5 text-white" />
                   </div>
                   <div>
                     <h2 className="text-lg font-bold text-foreground">Book Transport</h2>
                     <p className="text-xs text-muted-foreground">Manage logistics requirements & track shipments</p>
                   </div>
                 </div>

                 {/* Action Row: Post Logistics + Track Shipments */}
                 <div className="grid grid-cols-2 gap-3">
                   <Card
                     variant="interactive"
                     className="p-3 group hover:shadow-md transition-all cursor-pointer"
                     onClick={() => setShowLogisticsRequirementForm(true)}
                   >
                     <div className="flex items-center gap-2.5">
                       <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-sm">
                         <Truck className="w-3.5 h-3.5 text-white" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-semibold text-foreground">Post Logistics Need</p>
                         <p className="text-[10px] text-muted-foreground">Create transport requirement</p>
                       </div>
                     </div>
                   </Card>

                   <Card
                     variant="interactive"
                     className="p-3 group hover:shadow-md transition-all cursor-pointer"
                     onClick={() => setShowCustomerShipmentTracking(true)}
                   >
                     <div className="flex items-center gap-2.5">
                       <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 shadow-sm">
                         <MapPin className="w-3.5 h-3.5 text-white" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-semibold text-foreground">Track Shipments</p>
                         <p className="text-[10px] text-muted-foreground">Real-time logistics tracking</p>
                       </div>
                     </div>
                   </Card>
                 </div>

                 {/* My Logistics Requirements */}
                 {user && <BuyerLogisticsRequirements key={logisticsRequirementsKey} userId={user.id} />}
               </div>
             ) : showFinancials ? (
               /* ── Sub-View: CFO Financial Dashboard ── */
               <div className="space-y-4">
                 <Button variant="ghost" size="sm" onClick={() => setShowFinancials(false)} className="gap-2">
                   <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                 </Button>
                 <CFOFinancialDashboard />
               </div>
             ) : (
               <>
                {/* ── Section: Quick Actions ── */}
                <div className="space-y-1.5 mb-6">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</h2>
                  <div className="grid gap-2.5 grid-cols-3">
                    <Card variant="interactive" className="p-3 group hover:border-primary/30 transition-all" onClick={() => setShowForwardRFQ(true)}>
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-xs font-medium text-foreground">Post RFQ</p>
                      </div>
                    </Card>
                    <Card variant="interactive" className="p-3 group hover:border-primary/30 transition-all" onClick={() => setShowLiveStock(true)}>
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-xs font-medium text-foreground">Browse Products</p>
                      </div>
                    </Card>
                    <Card variant="interactive" className="p-3 group hover:border-primary/30 transition-all" onClick={() => setShowBookTransport(true)}>
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Truck className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-xs font-medium text-foreground">Book Transport</p>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* ── Section: Procurement Hub ── */}
                <div className="space-y-1.5 mb-6">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Procurement Hub</h2>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <Card variant="interactive" className="p-4 group hover:shadow-md transition-all border-l-4 border-l-primary" onClick={() => setShowForwardRFQ(true)}>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm">
                          <FileText className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">Forward RFQ</p>
                          <p className="text-[11px] text-muted-foreground">Post requirements & receive quotes</p>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-primary transition-colors" />
                      </div>
                    </Card>

                    <Card variant="interactive" className="p-4 group hover:shadow-md transition-all border-l-4 border-l-amber-500" onClick={() => setShowReverseAuction(true)}>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-sm">
                          <Gavel className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">Reverse Auction</p>
                          <p className="text-[11px] text-muted-foreground">Run live auctions & maximize savings</p>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-amber-500 transition-colors" />
                      </div>
                    </Card>
                   </div>
                 </div>

                {/* ── Section: Tools & Insights ── */}
                <div className="space-y-1.5 mb-6">
                   <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tools & Insights</h2>
                   <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                     <Card variant="interactive" className="p-4 group hover:shadow-md transition-all" onClick={() => setShowCRM(true)}>
                       <div className="flex items-center gap-3">
                         <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-sm">
                           <BarChart3 className="w-4 h-4 text-white" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-semibold text-foreground">CRM & Inventory</p>
                           <p className="text-[11px] text-muted-foreground">Invoices & purchase orders</p>
                         </div>
                         <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-sky-500 transition-colors" />
                       </div>
                     </Card>

                     {/* CFO Financial Dashboard — only for management roles */}
                     {role && ['cfo', 'buyer_cfo', 'ceo', 'buyer_ceo', 'buyer_manager', 'manager'].includes(role) && (
                       <Card variant="interactive" className="p-4 group hover:shadow-md transition-all border-l-4 border-l-violet-500" onClick={() => setShowFinancials(true)}>
                         <div className="flex items-center gap-3">
                           <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
                             <Wallet className="w-4 h-4 text-white" />
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-semibold text-foreground">CFO Dashboard</p>
                             <p className="text-[11px] text-muted-foreground">Financial intelligence & decision engine</p>
                           </div>
                           <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-violet-500 transition-colors" />
                         </div>
                       </Card>
                     )}
                   </div>
                </div>

                {/* ── Section: Grow Your Network ── */}
                <div className="space-y-1.5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grow Your Network</h2>
                  <Card variant="interactive" className="p-4 group hover:shadow-md transition-all border border-emerald-200 dark:border-emerald-800/40 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/20" onClick={() => setShowBuyerReferral(true)}>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-sm">
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">Refer & Earn</p>
                        <p className="text-[11px] text-muted-foreground">Earn free bids & 20% commission on every referral order</p>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </Card>
                </div>
               </>
             )}
            
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
            {showSupplierForwardBids ? (
              /* ── Sub-View: Forward Bids ── */
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setShowSupplierForwardBids(false)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-[0.625rem] bg-gradient-to-br from-primary to-primary/80 shadow-md">
                    <FileText className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">My Forward Bids</h2>
                    <p className="text-xs text-muted-foreground">All your submitted bids & accepted quotes</p>
                  </div>
                </div>
                {user && (
                  <div className="space-y-4">
                    <SupplierMyBids userId={user.id} />
                    <SupplierAcceptedBids userId={user.id} />
                  </div>
                )}
              </div>
            ) : showSupplierReverseBids ? (
              /* ── Sub-View: Reverse Auction Bids ── */
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setShowSupplierReverseBids(false)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Button>
                <ReverseAuctionDashboard isSupplier={true} />
              </div>
            ) : showSupplierSubscription ? (
              /* ── Sub-View: Subscription Plan ── */
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setShowSupplierSubscription(false)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-[0.625rem] bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Forward Bids Plan</h2>
                    <p className="text-xs text-muted-foreground">Manage your forward bid quota and premium packs</p>
                  </div>
                </div>

                {/* Current Plan Status */}
                <Card className="p-4">
                  <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Current Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-3">
                    {subscription?.is_early_adopter && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-0.5">
                        🚀 EARLY ADOPTER
                      </Badge>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Monthly Forward Bids</span>
                      <span className="font-semibold">{subscription?.bids_used_this_month ?? 0} / {subscription?.bids_limit ?? 5} used</span>
                    </div>
                    <Progress 
                      value={((subscription?.bids_used_this_month ?? 0) / (subscription?.bids_limit ?? 5)) * 100} 
                      className="h-2" 
                    />
                    {(subscription?.premium_bids_balance ?? 0) > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Premium Bids Balance</span>
                        <Badge variant="secondary" className="font-semibold">{subscription?.premium_bids_balance} bids</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Premium Pack Purchase */}
                <Card className="p-4">
                  <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      Premium Bids Pack
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pack</span>
                        <span className="font-medium">50 Lifetime Bids</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Base Price</span>
                        <span>₹24,950</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">GST (18%)</span>
                        <span>₹4,491</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Platform Fee (1.95%)</span>
                        <span>₹574</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between text-sm font-bold">
                        <span>Total</span>
                        <span>₹30,015</span>
                      </div>
                    </div>
                    <PremiumPackPurchase
                      userId={user?.id || ''}
                      userEmail={user?.email || ''}
                      userPhone={user?.user_metadata?.phone || ''}
                      userName={user?.user_metadata?.contact_person || user?.user_metadata?.company_name || ''}
                      userType="supplier"
                      hasPremiumBalance={(subscription?.premium_bids_balance ?? 0) > 0}
                    />
                  </CardContent>
                </Card>

                {/* Subscription Invoices */}
                <SubscriptionInvoices />
              </div>
            ) : showSupplierReferral ? (
              /* ── Sub-View: Refer & Earn ── */
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setShowSupplierReferral(false)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-[0.625rem] bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Refer & Earn</h2>
                    <p className="text-xs text-muted-foreground">Share, refer suppliers, and earn commissions</p>
                  </div>
                </div>
                {user && <ReferralSection userId={user.id} role="supplier" />}
              </div>
            ) : showSupplierAIPerformance ? (
              /* ── Sub-View: AI Performance ── */
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setShowSupplierAIPerformance(false)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Button>
                {user && <SupplierAIPerformanceCard userId={user.id} onOpenCatalog={() => setShowCatalog(true)} />}
              </div>
            ) : (
              /* ── Normal Supplier Dashboard ── */
              <>
                {/* ── Section: Quick Actions ── */}
                <div className="space-y-1.5 mb-6">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</h2>
                  <div className="grid gap-2.5 grid-cols-3">
                    <Card variant="interactive" className="p-3 group hover:border-primary/30 transition-all" onClick={() => setShowCatalog(true)}>
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-xs font-medium text-foreground">Product Catalog</p>
                      </div>
                    </Card>
                    <Card variant="interactive" className="p-3 group hover:border-primary/30 transition-all" onClick={() => setShowStock(true)}>
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Warehouse className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-xs font-medium text-foreground">Stock Mgmt</p>
                      </div>
                    </Card>
                    <Card variant="interactive" className="p-3 group hover:border-primary/30 transition-all" onClick={() => setShowRequirements(true)}>
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-xs font-medium text-foreground">Browse RFQs</p>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* ── Section: Procurement Hub ── */}
                <div className="space-y-1.5 mb-6">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Procurement Hub</h2>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                    <Card variant="interactive" className="p-4 group hover:shadow-md transition-all border-l-4 border-l-primary" onClick={() => setShowSupplierForwardBids(true)}>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm">
                          <FileText className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">Forward Bids</p>
                          <p className="text-[11px] text-muted-foreground">Quotes & accepted orders</p>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-primary transition-colors" />
                      </div>
                    </Card>

                    <Card variant="interactive" className="p-4 group hover:shadow-md transition-all border-l-4 border-l-amber-500" onClick={() => setShowSupplierReverseBids(true)}>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-sm">
                          <Gavel className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">Reverse Auctions</p>
                          <p className="text-[11px] text-muted-foreground">Live auction participation</p>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-amber-500 transition-colors" />
                      </div>
                    </Card>

                    <Card variant="interactive" className="p-4 group hover:shadow-md transition-all border-l-4 border-l-orange-500" onClick={() => setShowSupplierSubscription(true)}>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm">
                          <Star className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">Forward Bids Plan</p>
                          <p className="text-[11px] text-muted-foreground">
                            {subscription?.bids_used_this_month ?? 0}/{subscription?.bids_limit ?? 5} forward bids used
                          </p>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-orange-500 transition-colors" />
                      </div>
                    </Card>
                  </div>
                </div>

                {/* ── Section: Tools & Insights ── */}
                <div className="space-y-1.5 mb-6">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tools & Insights</h2>
                  <div className="grid gap-3 grid-cols-2">
                    <Card variant="interactive" className="p-4 group hover:shadow-md transition-all" onClick={() => setShowSupplierAIPerformance(true)}>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                          <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">AI Performance</p>
                          <p className="text-[11px] text-muted-foreground">Trust score & insights</p>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </Card>

                    <Card variant="interactive" className="p-4 group hover:shadow-md transition-all" onClick={() => setShowCRM(true)}>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 shadow-sm">
                          <Receipt className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">Invoices & CRM</p>
                          <p className="text-[11px] text-muted-foreground">PO & supplier records</p>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </Card>

                    <SupplierEmailQuotaCard />

                    <Card variant="interactive" className="p-4 group hover:shadow-md transition-all" onClick={() => setShowPlatformInvoices(true)}>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
                          <Receipt className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">Platform Invoices</p>
                          <p className="text-[11px] text-muted-foreground">Billing & receipts</p>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-violet-500 transition-colors" />
                      </div>
                    </Card>
                  </div>
                </div>

                {/* ── Section: Grow Your Business ── */}
                <div className="space-y-1.5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grow Your Business</h2>
                  <Card variant="interactive" className="p-4 group hover:shadow-md transition-all border border-emerald-200 dark:border-emerald-800/40 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/20" onClick={() => setShowSupplierReferral(true)}>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-sm">
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">Refer & Earn</p>
                        <p className="text-[11px] text-muted-foreground">Earn free bids & 20% commission on every referral order</p>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </Card>
                </div>
              </>
            )}

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
    </Suspense>
  );
};

export default Dashboard;
