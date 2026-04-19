import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const RELOAD_FLAG_KEY = "__ps_chunk_reload__";

/**
 * Detects "stale chunk" errors that happen when a user has the app open
 * during a deploy and tries to navigate to a route whose lazy chunk hash
 * has changed. The fix is a one-shot hard reload to pull the new index.html.
 */
function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  const msg = `${error.name} ${error.message}`.toLowerCase();
  return (
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("loading chunk") ||
    msg.includes("loading css chunk") ||
    msg.includes("importing a module script failed") ||
    msg.includes("error loading dynamically imported module")
  );
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Auto-recover from stale lazy-chunk loads after a deploy.
    // Use a session flag so we only reload once and avoid infinite loops.
    if (isChunkLoadError(error)) {
      const alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG_KEY);
      if (!alreadyReloaded) {
        sessionStorage.setItem(RELOAD_FLAG_KEY, "1");
        // Small delay so React commits the boundary state before navigation
        setTimeout(() => window.location.reload(), 50);
        return;
      }
      // Second time: clear so future deploys can recover again
      sessionStorage.removeItem(RELOAD_FLAG_KEY);
    }

    console.error("ErrorBoundary CRITICAL - Error caught:", error.message);
    console.error("ErrorBoundary CRITICAL - Stack:", error.stack);
    console.error("ErrorBoundary CRITICAL - Component Stack:", errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    sessionStorage.removeItem(RELOAD_FLAG_KEY);
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // While we're auto-recovering from a stale chunk, show a quiet loader
      // instead of the scary error screen.
      if (isChunkLoadError(this.state.error) && !sessionStorage.getItem(RELOAD_FLAG_KEY + "_done")) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex items-center gap-3 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Updating to the latest version…</span>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Something went wrong
            </h1>
            <p className="text-muted-foreground">
              We encountered an unexpected error. Please try reloading the page.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left bg-muted p-4 rounded-lg text-sm">
                <summary className="cursor-pointer font-medium text-foreground mb-2">
                  Error Details
                </summary>
                <pre className="overflow-auto text-destructive whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <Button onClick={this.handleReload} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
