import { Component, ErrorInfo, ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AlertTriangle, RefreshCw, Home, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Enhanced Error Boundary with recovery options
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  errorTime: Date | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    errorTime: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorTime: new Date() };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleClearCacheAndReload = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-lg w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Something went wrong
              </h1>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Try the recovery options below.
              </p>
              {this.state.errorTime && (
                <p className="text-xs text-muted-foreground">
                  Error occurred at: {this.state.errorTime.toLocaleTimeString()}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReload} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
              <Button
                onClick={this.handleClearCacheAndReload}
                variant="secondary"
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear Cache & Reload
              </Button>
            </div>

            <div className="pt-4">
              <button
                onClick={this.toggleDetails}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                {this.state.showDetails ? "Hide" : "Show"} Technical Details
              </button>

              {this.state.showDetails && this.state.error && (
                <div className="mt-4 text-left bg-muted p-4 rounded-lg text-sm overflow-auto max-h-64">
                  <p className="font-semibold text-destructive mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                    {this.state.error.stack}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Direct imports for all pages (prevents lazy loading blank page issues)
import Login from "./pages/Login";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Categories from "./pages/Categories";
import Browse from "./pages/Browse";
import BookTruck from "./pages/BookTruck";
import SourceCountry from "./pages/SourceCountry";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
