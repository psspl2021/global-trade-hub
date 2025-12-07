// Force rebuild: 2025-12-07T19:00:00Z - Fresh rebuild trigger
console.log("App.tsx: Module loading started");

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

// ALL direct imports - no lazy loading whatsoever
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Categories from "./pages/Categories";
import Browse from "./pages/Browse";
import BookTruck from "./pages/BookTruck";
import SourceCountry from "./pages/SourceCountry";
import NotFound from "./pages/NotFound";

console.log("App.tsx: All page imports completed");

const queryClient = new QueryClient();

const App = () => {
  console.log("App.tsx: App component rendering");
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
            </BrowserRouter>
          </TooltipProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

console.log("App.tsx: App component defined");

export default App;
