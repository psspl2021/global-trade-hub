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
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));

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
              <Route path="/about" element={<About />} />
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
