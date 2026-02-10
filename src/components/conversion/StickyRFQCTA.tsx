/**
 * Sticky CTA — "Post Requirement (AI Assisted)"
 * 
 * Appears on ALL buyer-facing public pages:
 * - Fixed bottom bar on first load (above fold equivalent for mobile)
 * - Re-appears after 60% scroll with a pulse animation
 * - Opens AI RFQ Modal on click
 * - Tracks CTA click events
 */
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { AIRFQModal } from './AIRFQModal';
import { trackConversionEvent } from '@/lib/conversionTracker';

// Routes where sticky CTA should NOT appear
const EXCLUDED_ROUTES = [
  '/admin', '/dashboard', '/management', '/control-tower',
  '/login', '/signup', '/reset-password',
  '/supplier', '/post-rfq', // Already has its own RFQ form
  '/invoice-generator',
];

export function StickyRFQCTA() {
  const { pathname } = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showScrollCTA, setShowScrollCTA] = useState(false);
  const [initialShow, setInitialShow] = useState(true);

  // Check if route is excluded
  const isExcluded = EXCLUDED_ROUTES.some(r => pathname.startsWith(r));

  // Handle scroll-triggered re-appearance
  useEffect(() => {
    if (isExcluded) return;

    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent >= 0.6) {
        setShowScrollCTA(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isExcluded]);

  // Reset state on route change
  useEffect(() => {
    setDismissed(false);
    setShowScrollCTA(false);
    setInitialShow(true);
  }, [pathname]);

  const handleCTAClick = useCallback(() => {
    trackConversionEvent('cta_click', { source: 'sticky_bar', page: pathname });
    setModalOpen(true);
  }, [pathname]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setInitialShow(false);
  }, []);

  if (isExcluded) return <AIRFQModal open={modalOpen} onOpenChange={setModalOpen} />;

  const isVisible = !dismissed && (initialShow || showScrollCTA);

  return (
    <>
      {/* Sticky bottom bar */}
      {isVisible && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-500"
          style={{ 
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.9) 100%)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Sparkles className="h-5 w-5 text-primary-foreground shrink-0 animate-pulse" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary-foreground truncate">
                  Post Requirement (AI Assisted)
                </p>
                <p className="text-xs text-primary-foreground/70 hidden sm:block">
                  Describe what you need → AI generates RFQ → Get competitive quotes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handleCTAClick}
                variant="secondary"
                size="sm"
                className="gap-1.5 font-semibold shadow-lg whitespace-nowrap"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Get Quotes Free
              </Button>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-full text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <AIRFQModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
