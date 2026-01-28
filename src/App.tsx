import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AIChatBox } from "@/components/AIChatBox";
import { GlobalSEOTools } from "@/components/admin/GlobalSEOTools";
import GlobalSEO from "@/components/GlobalSEO";
import ErrorBoundary from "@/components/ErrorBoundary";
import { VisitorTracker } from "@/components/VisitorTracker";
import { SEMTracker } from "@/components/SEMTracker";

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

// AEO/GEO How-To & Guide Pages
const HowToPostRFQ = lazy(() => import("./pages/guides/HowToPostRFQ"));
const FindVerifiedSuppliers = lazy(() => import("./pages/guides/FindVerifiedSuppliers"));
const EnterpriseProcurementGuide = lazy(() => import("./pages/guides/EnterpriseProcurementGuide"));
const ExportImportSourcingGuide = lazy(() => import("./pages/guides/ExportImportSourcingGuide"));
const AIB2BProcurementGuide = lazy(() => import("./pages/guides/AIB2BProcurementGuide"));

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

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AIChatBox />
        <GlobalSEOTools />
        <GlobalSEO />
        <BrowserRouter>
          <VisitorTracker />
          <SEMTracker />
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
              {/* Country-specific signal pages for geo-intelligence */}
              {/* Phase 1: Middle East + Africa */}
              <Route path="/:country/procurement/:slug" element={<ProcurementSignalPage />} />
              {/* Phase 2: USA, UK, Europe, Singapore - supported via same dynamic route */}
              
              {/* AEO/GEO How-To & Guide Pages */}
              <Route path="/how-to-post-rfq-online" element={<HowToPostRFQ />} />
              <Route path="/find-verified-b2b-suppliers" element={<FindVerifiedSuppliers />} />
              <Route path="/enterprise-procurement-guide" element={<EnterpriseProcurementGuide />} />
              <Route path="/export-import-sourcing-guide" element={<ExportImportSourcingGuide />} />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
