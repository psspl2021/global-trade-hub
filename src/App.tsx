// Force rebuild: 2025-12-07T18:45:00Z - Direct imports for critical pages
import { Suspense, lazy, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";

// Direct imports for critical pages - no dynamic loading issues
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Lazy load only secondary pages with retry mechanism
const lazyWithRetry = (
  importFn: () => Promise<{ default: React.ComponentType }>,
  retries = 3,
  interval = 1000
) =>
  lazy(async () => {
    for (let i = 0; i < retries; i++) {
      try {
        return await importFn();
      } catch (error) {
        console.warn(`Module load attempt ${i + 1}/${retries} failed`);
        if (i === retries - 1) {
          console.error('All module load attempts failed, reloading page...');
          window.location.reload();
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    throw new Error('Failed to load module');
  });

// Secondary pages - lazy loaded
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const Categories = lazyWithRetry(() => import("./pages/Categories"));
const Browse = lazyWithRetry(() => import("./pages/Browse"));
const BookTruck = lazyWithRetry(() => import("./pages/BookTruck"));
const SourceCountry = lazyWithRetry(() => import("./pages/SourceCountry"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

// Loading fallback with timeout recovery
const PageLoader = () => {
  const [showRetry, setShowRetry] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      {showRetry && (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Taking longer than expected...</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      )}
    </div>
  );
};

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
