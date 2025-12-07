// Layer 2 Test: 2025-12-07T19:30:00Z - Adding CSS + UI providers
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const TestPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center p-10">
      <h1 className="text-3xl font-bold text-primary mb-4">
        ✓ Layer 2 Working!
      </h1>
      <p className="text-muted-foreground">
        CSS + TooltipProvider + Toaster + Sonner all functional.
      </p>
    </div>
  </div>
);

const App = () => {
  return (
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
  );
};

export default App;
