// Layer 4 Test: 2025-12-07T19:40:00Z - Adding CurrencyProvider
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

const queryClient = new QueryClient();

const TestPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center p-10">
      <h1 className="text-3xl font-bold text-primary mb-4">
        ✓ Layer 4 Working!
      </h1>
      <p className="text-muted-foreground">
        CSS + UI Providers + QueryClientProvider + CurrencyProvider all functional.
      </p>
    </div>
  </div>
);

const App = () => {
  return (
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
  );
};

export default App;
