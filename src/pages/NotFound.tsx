import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { FileText, Layers, Shield, Home } from "lucide-react";

/**
 * Centralized NotFound page.
 * - Sets <meta name="robots" content="noindex, follow"> (follow preserves link equity)
 * - Shows helpful CTA buttons: Browse Products, Post RFQ, Managed Procurement
 * - Used by catch-all route AND soft-404 fallbacks in dynamic routes
 */
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Force noindex, follow on this page
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = 'noindex, follow';

    if (import.meta.env.DEV) {
      console.warn(`[NotFound] 404 rendered for: ${location.pathname}`);
    }

    return () => {
      // Restore default on unmount
      if (robotsMeta) {
        robotsMeta.content = 'index, follow, max-image-preview:large';
      }
    };
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>Page Not Found | ProcureSaathi</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <div className="text-center max-w-lg">
          <h1 className="mb-3 text-6xl font-bold text-primary">404</h1>
          <p className="mb-2 text-xl font-semibold text-foreground">
            This page no longer exists or has moved
          </p>
          <p className="mb-8 text-sm text-muted-foreground">
            The URL you visited may have been updated, removed, or mistyped.
            Use the options below to find what you need.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/browseproducts">
                <Layers className="h-4 w-4" />
                Browse Products
              </Link>
            </Button>

            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/post-rfq">
                <FileText className="h-4 w-4" />
                Post RFQ
              </Link>
            </Button>

            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link to="/buyer">
                <Shield className="h-4 w-4" />
                Managed Procurement
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

          {/* Trust footer */}
          <p className="mt-8 text-xs text-muted-foreground">
            ProcureSaathi – AI-powered B2B procurement for verified buyers and suppliers.
          </p>
        </div>
      </div>
    </>
  );
};

export default NotFound;
