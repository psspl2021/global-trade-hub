// Layer 5 Test: 2025-12-07T19:45:00Z - Adding ErrorBoundary
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const TestPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center p-10">
      <h1 className="text-3xl font-bold text-primary mb-4">
        ✓ Layer 5 Working!
      </h1>
      <p className="text-muted-foreground">
        All providers + ErrorBoundary functional. Ready for page imports.
      </p>
    </div>
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<TestPage />} />
                <Route path="*" element={<div className="p-10">404 - Not Found</div>} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
