// Force rebuild: 2025-12-07T18:22:00Z - Complete cache invalidation v2
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

// Lazy load pages with error recovery
const lazyWithRetry = (importFn: () => Promise<{ default: React.ComponentType }>) =>
  lazy(() =>
    importFn().catch(() => {
      // Force reload on chunk load failure
      window.location.reload();
      return importFn();
    })
  );

const Index = lazyWithRetry(() => import("./pages/Index"));
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const Login = lazyWithRetry(() => import("./pages/Login"));
const Signup = lazyWithRetry(() => import("./pages/Signup"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const Categories = lazyWithRetry(() => import("./pages/Categories"));
const Browse = lazyWithRetry(() => import("./pages/Browse"));
const BookTruck = lazyWithRetry(() => import("./pages/BookTruck"));
const SourceCountry = lazyWithRetry(() => import("./pages/SourceCountry"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

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
      <CurrencyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/book-truck" element={<BookTruck />} />
                <Route path="/source/:country" element={<SourceCountry />} />
                <Route path="/auth" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
