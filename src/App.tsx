import { Suspense, lazy, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import { SEOStaticRenderer } from "@/components/seo/SEOStaticRenderer";
import { isMarketplacePath } from "@/pages/marketplace/UniversalSEORoute";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Categories = lazy(() => import("./pages/Categories"));
const CategoryLanding = lazy(() => import("./pages/CategoryLanding"));
const Browse = lazy(() => import("./pages/Browse"));
const BookTruck = lazy(() => import("./pages/BookTruck"));
const SourceCountry = lazy(() => import("./pages/SourceCountry"));
const Blogs = lazy(() => import("./pages/Blogs"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Requirements = lazy(() => import("./pages/Requirements"));
const PostRFQ = lazy(() => import("./pages/PostRFQ"));
const Seller = lazy(() => import("./pages/Seller"));
const Buyer = lazy(() => import("./pages/Buyer"));
const PrivateLabel = lazy(() => import("./pages/PrivateLabel"));
const NotFound = lazy(() => import("./pages/NotFound"));
const InvoiceGenerator = lazy(() => import("./pages/InvoiceGenerator"));
const AffiliatePortal = lazy(() => import("./pages/AffiliatePortal"));
const AffiliateSignup = lazy(() => import("./pages/AffiliateSignup"));
const Contact = lazy(() => import("./pages/Contact"));
const ProcurementSignalPage = lazy(() => import("./pages/procurement/ProcurementSignalPage"));

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
const ExportCertificationPage = lazy(() => import("./pages/export-certification/ExportCertificationPage"));

// Comparison Pages
const BestB2BPlatformsIndia = lazy(() => import("./pages/comparisons/BestB2BPlatformsIndia"));
const AIProcurementVsTraditional = lazy(() => import("./pages/comparisons/AIProcurementVsTraditional"));
const ManagedVsMarketplace = lazy(() => import("./pages/comparisons/ManagedVsMarketplace"));

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
const ManagementDashboardPage = lazy(() => import("./pages/ManagementDashboard"));
const PurchaserDashboardPage = lazy(() => import("./pages/PurchaserDashboard"));
const AdminAuditPage = lazy(() => import("./pages/AdminAudit"));
const ControlTowerPage = lazy(() => import("./pages/ControlTower"));
// GEO Landing Pages
const GeoUSA = lazy(() => import("./pages/geo/GeoUSA"));
const GeoUK = lazy(() => import("./pages/geo/GeoUK"));
const GeoEurope = lazy(() => import("./pages/geo/GeoEurope"));
const GeoGermany = lazy(() => import("./pages/geo/GeoGermany"));
const GeoSingapore = lazy(() => import("./pages/geo/GeoSingapore"));

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
  
  // Serve static content to bots for SEO pages
  if (isBotUser) {
    const seoRoutes = [
      /^\/buy-/,
      /^\/.+-suppliers$/,
      /^\/categories\//,
      /^\/procurement\//,
      /^\/$/,
    ];
    
    const isSeoPage = seoRoutes.some(pattern => pattern.test(location.pathname));
    
    if (isSeoPage) {
      return <SEOStaticRenderer pathname={location.pathname} />;
    }
  }
  
  // Normal SPA routing for humans
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/category/:categorySlug" element={<CategoryLanding />} />
        <Route path="/category/:categorySlug/:subcategorySlug" element={<CategoryLanding />} />
        <Route path="/browseproducts" element={<Browse />} />
        <Route path="/browse" element={<Navigate to="/browseproducts" replace />} />
        <Route path="/book-truck" element={<BookTruck />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blogs/:slug" element={<BlogPost />} />
        <Route path="/requirements" element={<Requirements />} />
        <Route path="/post-rfq" element={<PostRFQ />} />
        <Route path="/seller" element={<Seller />} />
        <Route path="/buyer" element={<Buyer />} />
        <Route path="/private-label" element={<PrivateLabel />} />
        <Route path="/source/:country" element={<SourceCountry />} />
        <Route path="/invoice-generator" element={<InvoiceGenerator />} />
        <Route path="/affiliate" element={<AffiliatePortal />} />
        <Route path="/affiliate-signup" element={<AffiliateSignup />} />
        <Route path="/procurement/:slug" element={<ProcurementSignalPage />} />
        
        {/* B2B Marketplace Pages - BUY pages handled via catch-all below */}
        
        {/* Governance & Management Routes */}
        <Route path="/management-dashboard" element={<ManagementDashboardPage />} />
        <Route path="/purchaser-dashboard" element={<PurchaserDashboardPage />} />
        <Route path="/admin/audit" element={<AdminAuditPage />} />
        <Route path="/control-tower" element={<ControlTowerPage />} />
        
        {/* CATEGORY HUB pages: /categories/{category-slug} */}
        <Route path="/categories/:slug" element={<MarketplaceCategoryHub />} />
        
        {/* Country-specific signal pages for geo-intelligence */}
        <Route path="/:country/procurement/:slug" element={<ProcurementSignalPage />} />
        
        {/* AEO/GEO How-To & Guide Pages */}
        <Route path="/how-to-post-rfq-online" element={<HowToPostRFQ />} />
        <Route path="/find-verified-b2b-suppliers" element={<FindVerifiedSuppliers />} />
        <Route path="/enterprise-procurement-guide" element={<EnterpriseProcurementGuide />} />
        <Route path="/export-import-sourcing-guide" element={<ExportImportSourcingGuide />} />
        <Route path="/export-certification/:slug" element={<ExportCertificationPage />} />
        <Route path="/ai-b2b-procurement-platform-guide" element={<AIB2BProcurementGuide />} />
        
        {/* Comparison Pages */}
        <Route path="/best-b2b-procurement-platforms-india" element={<BestB2BPlatformsIndia />} />
        <Route path="/ai-procurement-vs-traditional-rfq" element={<AIProcurementVsTraditional />} />
        <Route path="/managed-procurement-vs-b2b-marketplace" element={<ManagedVsMarketplace />} />
        
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
            <GlobalDemandTracker />
            <VisitorTracker />
            <SEMTracker />
            <LanguagePrompt />
            <BotAwareRouter />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
