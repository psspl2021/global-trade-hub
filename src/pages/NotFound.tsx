import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Home, FileText, Layers } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useSEO({
    title: "Page Not Found | ProcureSaathi",
    description: "The page you're looking for doesn't exist. Return to ProcureSaathi's B2B marketplace to browse verified suppliers and products.",
    canonical: "https://procuresaathi.com/404"
  });

  // Add noindex meta tag for 404 pages
  useEffect(() => {
    const robotsMeta = document.querySelector('meta[name="robots"]');
    if (robotsMeta) {
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex, nofollow';
      document.head.appendChild(meta);
    }
    
    return () => {
      // Restore default robots on unmount
      const meta = document.querySelector('meta[name="robots"]');
      if (meta) {
        meta.setAttribute('content', 'index, follow');
      }
    };
  }, []);

  useEffect(() => {
    // Check for double-encoded URLs (e.g., /signup%3Fcategory=... instead of /signup?category=...)
    if (location.pathname.includes('%3F') || location.pathname.includes('%26')) {
      const decodedPath = decodeURIComponent(location.pathname);
      setIsRedirecting(true);
      navigate(decodedPath, { replace: true });
      return;
    }
    
    if (import.meta.env.DEV) console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname, navigate]);

  if (isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="text-center max-w-md">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Oops! This page doesn't exist</p>
        <p className="mb-8 text-sm text-muted-foreground">
          The page you're looking for might have been moved or doesn't exist. 
          Let's get you back on track.
        </p>
        
        {/* Primary CTAs - NO "Become a Supplier" */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link to="/post-rfq">
              <FileText className="h-4 w-4" />
              Post RFQ – Free
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/categories">
              <Layers className="h-4 w-4" />
              Browse Categories
            </Link>
          </Button>
        </div>
        
        <div className="mt-4">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
        
        {/* Trust message */}
        <p className="mt-8 text-xs text-muted-foreground">
          ProcureSaathi – AI-powered B2B procurement for verified buyers and suppliers.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
