import { Suspense, lazy, useMemo } from "react";
import { useSEOHead } from "@/hooks/useSEOHead";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AIChatBox } from "@/components/AIChatBox";
import { GlobalSEOTools } from "@/components/admin/GlobalSEOTools";
import GlobalSEO from "@/components/GlobalSEO";
import ErrorBoundary from "@/components/ErrorBoundary";
import { VisitorTracker } from "@/components/VisitorTracker";
import { SEMTracker } from "@/components/SEMTracker";
import { GlobalDemandTracker } from "@/components/GlobalDemandTracker";
import { LanguagePrompt } from "@/components/landing/LanguagePrompt";
import { isBot } from "@/utils/isBot";
// PERF: Lazy — pulls in 342 KB demandProducts + 94 KB signalPages, only
// needed when serving bots. Keeping it static added ~1.5s to landing FCP.
const SEOStaticRenderer = lazy(() =>
  import("@/components/seo/SEOStaticRenderer").then((m) => ({ default: m.SEOStaticRenderer }))
);
import { isMarketplacePath } from "@/pages/marketplace/UniversalSEORoute";
import { StickyRFQCTA } from "@/components/conversion/StickyRFQCTA";
import LayoutGate from "@/components/LayoutGate";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CostSavingsPage = lazy(() => import("./pages/CostSavingsPage"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const Categories = lazy(() => import("./pages/Categories"));
const CategoryLanding = lazy(() => import("./pages/CategoryLanding"));
const Browse = lazy(() => import("./pages/Browse"));
const Terms = lazy(() => import("./pages/Terms"));
const BookTruck = lazy(() => import("./pages/BookTruck"));
const SourceCountry = lazy(() => import("./pages/SourceCountry"));
const GlobalSourcingPage = lazy(() => import("./pages/GlobalSourcingPage"));
const Blogs = lazy(() => import("./pages/Blogs"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Requirements = lazy(() => import("./pages/Requirements"));
const RFQDetail = lazy(() => import("./pages/RFQDetail"));
const PostRFQ = lazy(() => import("./pages/PostRFQ"));
const Seller = lazy(() => import("./pages/Seller"));
const Buyer = lazy(() => import("./pages/Buyer"));
const PrivateLabel = lazy(() => import("./pages/PrivateLabel"));
const NotFound = lazy(() => import("./pages/NotFound"));
const InvoiceGenerator = lazy(() => import("./pages/InvoiceGenerator"));
const AffiliatePortal = lazy(() => import("./pages/AffiliatePortal"));
const AffiliateSignup = lazy(() => import("./pages/AffiliateSignup"));
const EarnWithProcureSaathi = lazy(() => import("./pages/EarnWithProcureSaathi"));
const Contact = lazy(() => import("./pages/Contact"));
const InviteAccept = lazy(() => import("./pages/InviteAccept"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ProcurementSignalPage = lazy(() => import("./pages/procurement/ProcurementSignalPage"));
const IntelligenceActionPage = lazy(() => import("./pages/governance/IntelligenceActionPage"));
const GlobalPlanCheckoutPage = lazy(() => import("./pages/checkout/GlobalPlanCheckoutPage"));
const CheckoutReturnPage = lazy(() => import("./pages/checkout/CheckoutReturnPage"));


// Hub & Spoke Directory Pages
const ExplorePage = lazy(() => import("./pages/explore/ExplorePage"));
const ExploreCountryPage = lazy(() => import("./pages/explore/ExploreCountryPage"));

const DemandIndex = lazy(() => import("./pages/explore/DemandIndex"));
const DemandAuthorityPage = lazy(() => import("./pages/explore/DemandAuthorityPage"));
const IndustriesPage = lazy(() => import("./pages/explore/IndustriesPage"));

// High-Intent SEO Solution Pages
const SolutionsIndex = lazy(() => import("./pages/solutions/SolutionsIndex"));
const SolutionPage = lazy(() => import("./pages/solutions/SolutionPage"));

// Marketplace Pages - Universal SEO Route Handler
const MarketplaceBuyPage = lazy(() => import("./pages/marketplace/BuyPage"));
const MarketplaceSupplierPage = lazy(() => import("./pages/marketplace/SupplierPage"));
const MarketplaceCategoryHub = lazy(() => import("./pages/marketplace/CategoryHub"));
const UniversalSlugResolver = lazy(() => import("./pages/marketplace/UniversalSlugResolver"));

// AEO/GEO How-To & Guide Pages
const HowToPostRFQ = lazy(() => import("./pages/guides/HowToPostRFQ"));
const FindVerifiedSuppliers = lazy(() => import("./pages/guides/FindVerifiedSuppliers"));
const EnterpriseProcurementGuide = lazy(() => import("./pages/guides/EnterpriseProcurementGuide"));
const ExportImportSourcingGuide = lazy(() => import("./pages/guides/ExportImportSourcingGuide"));
const AIB2BProcurementGuide = lazy(() => import("./pages/guides/AIB2BProcurementGuide"));
const ProcurementGuidePage = lazy(() => import("./pages/guides/ProcurementGuidePage"));
const ExportCertificationPage = lazy(() => import("./pages/export-certification/ExportCertificationPage"));

// Comparison Pages
const BestB2BPlatformsIndia = lazy(() => import("./pages/comparisons/BestB2BPlatformsIndia"));

// SEO Comparison & Use-Case Templates
const ComparisonPage = lazy(() => import("./pages/seo/ComparisonPage"));
const UseCasePage = lazy(() => import("./pages/seo/UseCasePage"));
const SteelComparisonsHub = lazy(() => import("./pages/seo/SteelComparisonsHub"));
const IndustrialUseCasesHub = lazy(() => import("./pages/seo/IndustrialUseCasesHub"));
const CountryComparisonPage = lazy(() => import("./pages/seo/CountryComparisonPage"));
const TransactionalImportPage = lazy(() => import("./pages/seo/TransactionalImportPage"));
const AIProcurementVsTraditional = lazy(() => import("./pages/comparisons/AIProcurementVsTraditional"));
const ManagedVsMarketplace = lazy(() => import("./pages/comparisons/ManagedVsMarketplace"));
const ReverseAuctionSEOPage = lazy(() => import("./pages/ReverseAuctionSEOPage"));
const ReverseAuction = lazy(() => import("./pages/ReverseAuction"));
const CreateReverseAuctionPage = lazy(() => import("./pages/CreateReverseAuctionPage"));
const TransporterPage = lazy(() => import("./pages/TransporterPage"));
const BusinessCreditPage = lazy(() => import("./pages/BusinessCredit"));

// Industry Use-Case Pages
const ProcurementForSteelManufacturers = lazy(() => import("./pages/industries/ProcurementForSteelManufacturers"));
const ProcurementForChemicalBuyers = lazy(() => import("./pages/industries/ProcurementForChemicalBuyers"));
const ProcurementForConstruction = lazy(() => import("./pages/industries/ProcurementForConstruction"));
const AIHelpsMSMEs = lazy(() => import("./pages/industries/AIHelpsMSMEs"));

// Founder & Case Study Pages
const FounderPage = lazy(() => import("./pages/FounderPage"));
const CaseStudyProcurementCost = lazy(() => import("./pages/case-studies/CaseStudyProcurementCost"));
const CaseStudyExportSourcing = lazy(() => import("./pages/case-studies/CaseStudyExportSourcing"));
const CaseStudyGlobalSteel = lazy(() => import("./pages/case-studies/CaseStudyGlobalSteel"));
const CaseStudyGlobalPulsesSpices = lazy(() => import("./pages/case-studies/CaseStudyGlobalPulsesSpices"));
const CaseStudyMiddleEastFood = lazy(() => import("./pages/case-studies/CaseStudyMiddleEastFood"));
const CustomerStories = lazy(() => import("./pages/CustomerStories"));

// Governance & Management Pages
const PurchaserExecutionDashboard = lazy(() => import("./pages/governance/PurchaserExecutionDashboard"));
const ManagementExecutiveDashboard = lazy(() => import("./pages/governance/ManagementExecutiveDashboard"));
const AdminAuditDashboard = lazy(() => import("./pages/governance/AdminAuditDashboard"));
const ControlTowerPage = lazy(() => import("./pages/ControlTower"));
const PurchaserLeaderboardPage = lazy(() => import("./pages/governance/management/PurchaserLeaderboardPage"));
// CEO Control Layer
const CEOControlLayout = lazy(() => import("./pages/governance/ceo/CEOControlLayout"));
const CEOOverview = lazy(() => import("./pages/governance/ceo/CEOOverview"));
const CEOPurchaseOrders = lazy(() => import("./pages/governance/ceo/CEOPurchaseOrders"));
const CEOAuctions = lazy(() => import("./pages/governance/ceo/CEOAuctions"));
const CEORFQs = lazy(() => import("./pages/governance/ceo/CEORFQs"));
const CEOAuditLog = lazy(() => import("./pages/governance/ceo/CEOAuditLog"));
const ManagerAcknowledgementsPage = lazy(() => import("./pages/governance/manager/ManagerAcknowledgementsPage"));
const EnterpriseControlCenterPage = lazy(() => import("./pages/EnterpriseControlCenter"));
const AdminSEOMonitor = lazy(() => import("./pages/AdminSEOMonitor"));
const SeoRevenueDashboard = lazy(() => import("./pages/admin/SeoRevenueDashboard"));
const RevenueDashboard = lazy(() => import("./pages/admin/RevenueDashboard"));
const AdminIntelligenceDashboard = lazy(() => import("./pages/admin/AdminIntelligenceDashboard"));
const SEODashboard = lazy(() => import("./pages/admin/SEODashboard"));
const DemandGapsPanel = lazy(() => import("./pages/admin/DemandGapsPanel"));
const FxRatesAdmin = lazy(() => import("./pages/admin/FxRatesAdmin"));

// GEO Landing Pages
const GeoUSA = lazy(() => import("./pages/geo/GeoUSA"));
const GeoUK = lazy(() => import("./pages/geo/GeoUK"));
const GeoEurope = lazy(() => import("./pages/geo/GeoEurope"));
const GeoGermany = lazy(() => import("./pages/geo/GeoGermany"));
const GeoSingapore = lazy(() => import("./pages/geo/GeoSingapore"));

// Redirect /categories/:slug → /category/:slug
const CategoriesRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/category/${slug}`} replace />;
};

// Import route resolver — checks if slug is a transactional corridor or country comparison
const ImportRouteResolver = () => {
  const { slug } = useParams();
  // Transactional import pages use "-from-" pattern
  if (slug?.includes("-from-")) {
    return <TransactionalImportPage />;
  }
  return <CountryComparisonPage />;
};

// Strategic countries that keep standalone /source/:country pages
// Expanded to include all countries GSC is actively crawling
const STRATEGIC_COUNTRIES = new Set([
  "china", "uae", "germany", "usa", "japan",
  "south-korea", "saudi-arabia", "vietnam", "indonesia", "italy",
  "switzerland", "netherlands", "colombia", "south-africa", "brazil",
  "france", "thailand", "norway", "bahrain", "ireland", "ukraine",
  "ghana", "romania", "egypt", "belgium", "chile", "mexico", "peru",
  "oman", "bangladesh", "ethiopia", "nigeria", "uganda",
]);

// Non-strategic /source/:country → render GlobalSourcingPage with noindex
// (Client-side redirects fail GSC validation; serving content with noindex is safer)
const SourceCountryGate = () => {
  const { country } = useParams();
  if (!country || !STRATEGIC_COUNTRIES.has(country.toLowerCase())) {
    return <GlobalSourcingPage />;
  }
  return <SourceCountry />;
};

// Simple loading fallback
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const queryClient = new QueryClient();

// Bot-aware router component that serves static content to crawlers
const BotAwareRouter = () => {
  const location = useLocation();
  const isBotUser = useMemo(() => isBot(), []);
  
  // Global SEO head management (canonical, robots, OG)
  useSEOHead();
  
  // Serve static content to bots for SEO pages
  if (isBotUser) {
    const seoRoutes = [
      /^\/buy-/,
      /^\/.+-suppliers$/,
      /^\/category\//,
      /^\/procurement\//,
      /^\/demand\//,
      /^\/solutions\//,
      /^\/source\//,
      /^\/browse/,
      /^\/blogs/,
      /^\/post-rfq$/,
      /^\/seller$/,
      /^\/private-label$/,
      /^\/find-verified-b2b-suppliers$/,
      /^\/ai-procurement-vs-traditional-rfq$/,
      /^\/ai-b2b-procurement-platform-guide$/,
      /^\/ar\//,
      /^\/import\//,
      /^\/rfq\//,
      /^\/$/,
    ];
    
    const isSeoPage = seoRoutes.some(pattern => pattern.test(location.pathname));
    
    if (isSeoPage) {
      return (
        <Suspense fallback={null}>
          <SEOStaticRenderer pathname={location.pathname} />
        </Suspense>
      );
    }
  }
  
  // Normal SPA routing for humans
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/invite/:id" element={<InviteAccept />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/category/:categorySlug" element={<CategoryLanding />} />
        <Route path="/category/:categorySlug/:subcategorySlug" element={<CategoryLanding />} />
        <Route path="/browseproducts" element={<Browse />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/book-truck" element={<BookTruck />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blogs/:slug" element={<BlogPost />} />
        <Route path="/requirements" element={<Requirements />} />
        <Route path="/rfq/:id" element={<RFQDetail />} />
        <Route path="/post-rfq" element={<PostRFQ />} />
        <Route path="/seller" element={<Seller />} />
        <Route path="/buyer" element={<Buyer />} />
        <Route path="/buyer/create-reverse-auction" element={<CreateReverseAuctionPage />} />
        <Route path="/private-label" element={<PrivateLabel />} />
        <Route path="/source/:country" element={<SourceCountryGate />} />
        <Route path="/global-sourcing-countries" element={<GlobalSourcingPage />} />
        <Route path="/invoice-generator" element={<InvoiceGenerator />} />
        <Route path="/affiliate" element={<AffiliatePortal />} />
        <Route path="/affiliate-signup" element={<AffiliateSignup />} />
        <Route path="/earn-with-procuresaathi" element={<EarnWithProcureSaathi />} />
        <Route path="/procurement/:slug" element={<ProcurementSignalPage />} />
        <Route path="/checkout/global-plan" element={<GlobalPlanCheckoutPage />} />
        <Route path="/checkout/return" element={<CheckoutReturnPage />} />
        
        {/* Hub & Spoke Directory Routes */}
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/explore/:region/:country" element={<ExploreCountryPage />} />
        <Route path="/demand" element={<DemandIndex />} />
        <Route path="/demand/:slug" element={<DemandAuthorityPage />} />
        <Route path="/industries" element={<IndustriesPage />} />
        <Route path="/industries/:industry" element={<IndustriesPage />} />
        <Route path="/industries/:industry/:subIndustry" element={<IndustriesPage />} />
        
        {/* High-Intent SEO Solution Pages */}
        <Route path="/solutions" element={<SolutionsIndex />} />
        <Route path="/solutions/:slug" element={<SolutionPage />} />
        
        {/* Role-Based Dashboard Routes - STRICT SEPARATION */}
        {/* Purchaser Dashboard: buyer_purchaser, purchaser, buyer */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/cost-savings" element={<CostSavingsPage />} />
        <Route path="/governance/intelligence/action/:actionType" element={<IntelligenceActionPage />} />

        {/* CEO Control Layer */}
        <Route path="/governance/ceo" element={<CEOControlLayout />}>
          <Route index element={<CEOOverview />} />
          <Route path="purchase-orders" element={<CEOPurchaseOrders />} />
          <Route path="auctions" element={<CEOAuctions />} />
          <Route path="rfq" element={<CEORFQs />} />
          <Route path="audit-log" element={<CEOAuditLog />} />
        </Route>

        {/* Manager Acknowledgements queue */}
        <Route
          path="/governance/manager/acknowledgements"
          element={<ManagerAcknowledgementsPage />}
        />
        
        {/* Legacy management route now resolves into the unified dashboard */}
        <Route path="/management" element={<Navigate to="/dashboard" replace />} />

        {/* Phase 2: Management → Leaderboard (capability-gated inside the page) */}
        <Route path="/management/leaderboard" element={<PurchaserLeaderboardPage />} />
        
        {/* Admin Audit Dashboard: ps_admin, admin */}
        <Route path="/admin" element={<AdminAuditDashboard />} />
        <Route path="/admin/fx-rates" element={<FxRatesAdmin />} />
        
        
        {/* Control Tower: management + admin only */}
        <Route path="/control-tower" element={<ControlTowerPage />} />
        
        {/* Enterprise Control Center: admin only */}
        <Route path="/enterprise" element={<EnterpriseControlCenterPage />} />
        
        {/* Transporter Dashboard */}
        <Route path="/transporter" element={<TransporterPage />} />
        
        {/* Legacy admin sub-routes - redirect to main admin dashboard */}
        <Route path="/admin/seo-monitor" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/seo-revenue" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/revenue" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/seo-intelligence" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/seo-dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/demand-gaps" element={<Navigate to="/admin" replace />} />
        
        {/* Legacy routes - redirect to new structure */}
        <Route path="/management-dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/purchaser-dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/admin/audit" element={<Navigate to="/admin" replace />} />
        
        {/* /buy-* → /demand/* 301 consolidation */}
        <Route path="/buy-metals-ferrous-steel-iron" element={<Navigate to="/demand/ms-plates-india" replace />} />
        <Route path="/buy-metals-ferrous" element={<Navigate to="/demand/hr-coil-india" replace />} />
        <Route path="/buy-metals-non-ferrous" element={<Navigate to="/demand/aluminium-ingots-india" replace />} />
        <Route path="/buy-energy-power" element={<Navigate to="/demand/structural-steel-india" replace />} />
        <Route path="/buy-industrial-supplies" element={<Navigate to="/demand/ms-pipes-india" replace />} />
        <Route path="/buy-polymers" element={<Navigate to="/demand/pp-granules-india" replace />} />
        <Route path="/buy-hardware-tools" element={<Navigate to="/demand/hand-tools-india" replace />} />
        <Route path="/buy-pipes-tubes" element={<Navigate to="/demand/ms-pipes-india" replace />} />
        <Route path="/buy-chemicals" element={<Navigate to="/demand/caustic-soda-india" replace />} />
        <Route path="/buy-electrical-equipment" element={<Navigate to="/demand/copper-wire-india" replace />} />
        <Route path="/buy-food-beverages" element={<Navigate to="/demand/rice-basmati-india" replace />} />
        <Route path="/buy-packaging" element={<Navigate to="/demand/corrugated-boxes-india" replace />} />
        <Route path="/buy-petroleum" element={<Navigate to="/demand/bulk-diesel-india" replace />} />
        <Route path="/buy-textiles" element={<Navigate to="/demand/cotton-yarn-india" replace />} />
        <Route path="/buy-chemicals-raw-materials" element={<Navigate to="/demand/caustic-soda-india" replace />} />
        <Route path="/buy-pharmaceuticals-drugs" element={<Navigate to="/demand/pharma-api-india" replace />} />
        
        {/* /categories/{slug} → redirect to /category/{slug} (canonical normalization) */}
        <Route path="/categories/:slug" element={<CategoriesRedirect />} />
        
        {/* Country-specific signal pages for geo-intelligence */}
        <Route path="/:country/procurement/:slug" element={<ProcurementSignalPage />} />
        <Route path="/ar/procurement/:slug" element={<ProcurementSignalPage />} />
        
        {/* Steel Comparison & Use-Case SEO Pages */}
        <Route path="/steel-comparisons" element={<SteelComparisonsHub />} />
        <Route path="/compare/:slug" element={<ComparisonPage />} />
        <Route path="/industrial-use-cases" element={<IndustrialUseCasesHub />} />
        <Route path="/use-case/:slug" element={<UseCasePage />} />
        <Route path="/import/:slug" element={<ImportRouteResolver />} />
        
        {/* AEO/GEO How-To & Guide Pages */}
        <Route path="/how-to-post-rfq-online" element={<HowToPostRFQ />} />
        <Route path="/find-verified-b2b-suppliers" element={<FindVerifiedSuppliers />} />
        <Route path="/enterprise-procurement-guide" element={<EnterpriseProcurementGuide />} />
        <Route path="/export-import-sourcing-guide" element={<ExportImportSourcingGuide />} />
        <Route path="/export-certification/:slug" element={<ExportCertificationPage />} />
        <Route path="/ai-b2b-procurement-platform-guide" element={<AIB2BProcurementGuide />} />
        <Route path="/guides/:slug" element={<ProcurementGuidePage />} />
        
        {/* Comparison Pages */}
        <Route path="/best-b2b-procurement-platforms-india" element={<BestB2BPlatformsIndia />} />
        <Route path="/ai-procurement-vs-traditional-rfq" element={<AIProcurementVsTraditional />} />
        <Route path="/managed-procurement-vs-b2b-marketplace" element={<ManagedVsMarketplace />} />
        <Route path="/reverse-auction-procurement" element={<ReverseAuctionSEOPage />} />
        <Route path="/reverse-auction" element={<ReverseAuction />} />
        <Route path="/business-credit" element={<BusinessCreditPage />} />
        
        {/* Industry Use-Case Pages */}
        <Route path="/procurement-for-steel-manufacturers" element={<ProcurementForSteelManufacturers />} />
        <Route path="/procurement-for-chemical-buyers" element={<ProcurementForChemicalBuyers />} />
        <Route path="/procurement-for-construction-companies" element={<ProcurementForConstruction />} />
        <Route path="/ai-helps-msmes-enterprise-supply-chains" element={<AIHelpsMSMEs />} />
        
        {/* Founder & Case Study Pages */}
        <Route path="/founder" element={<FounderPage />} />
        <Route path="/team" element={<FounderPage />} />
        <Route path="/case-study-procurement-cost-reduction" element={<CaseStudyProcurementCost />} />
        <Route path="/case-study-export-sourcing" element={<CaseStudyExportSourcing />} />
        <Route path="/case-study-global-steel-procurement" element={<CaseStudyGlobalSteel />} />
        <Route path="/case-study-global-pulses-spices-sourcing" element={<CaseStudyGlobalPulsesSpices />} />
        <Route path="/case-study-middle-east-pulses-spices-import" element={<CaseStudyMiddleEastFood />} />
        <Route path="/customer-stories" element={<CustomerStories />} />
        <Route path="/testimonials" element={<CustomerStories />} />
        
        {/* GEO Landing Pages */}
        <Route path="/usa/ai-b2b-procurement" element={<GeoUSA />} />
        <Route path="/uk/ai-b2b-procurement" element={<GeoUK />} />
        <Route path="/europe/ai-b2b-procurement" element={<GeoEurope />} />
        <Route path="/germany/ai-b2b-procurement" element={<GeoGermany />} />
        <Route path="/singapore/ai-b2b-procurement" element={<GeoSingapore />} />
        
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        
        {/* Universal catch-all for marketplace pages */}
        <Route path="/:slug" element={<UniversalSlugResolver />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AIChatBox />
          <GlobalSEOTools />
          <GlobalSEO />
          <BrowserRouter>
            <LayoutGate>
              <GlobalDemandTracker />
              <VisitorTracker />
              <SEMTracker />
              <LanguagePrompt />
              <BotAwareRouter />
              <StickyRFQCTA />
            </LayoutGate>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
