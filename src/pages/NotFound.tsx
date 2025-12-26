import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSEO } from "@/hooks/useSEO";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useSEO({
    title: "Page Not Found | ProcureSaathi",
    description: "The page you're looking for doesn't exist. Return to ProcureSaathi's B2B marketplace to browse verified suppliers and products.",
    canonical: "https://procuresaathi.com/404"
  });

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
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
