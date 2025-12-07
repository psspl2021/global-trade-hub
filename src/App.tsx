// Layer 3 Test: 2025-12-07T19:35:00Z - Adding QueryClientProvider
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

const TestPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center p-10">
      <h1 className="text-3xl font-bold text-primary mb-4">
        ✓ Layer 3 Working!
      </h1>
      <p className="text-muted-foreground">
        CSS + UI Providers + QueryClientProvider all functional.
      </p>
    </div>
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
};

export default App;
