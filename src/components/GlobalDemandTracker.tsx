/**
 * ============================================================
 * GLOBAL DEMAND TRACKER COMPONENT
 * ============================================================
 * 
 * Mount this ONCE at the app root level (App.tsx).
 * Automatically tracks ALL ~1200 SEO pages without per-page setup.
 * 
 * Features:
 * - Auto-tracks page views on route change
 * - Classifies page type (BUY/SUPPLIER/PROCUREMENT/CATEGORY)
 * - Extracts category from URL
 * - Calculates intent score
 * - Geo-detection integration
 * - Scroll depth tracking
 * - Session-based throttling (prevents duplicates)
 * 
 * Usage:
 *   <BrowserRouter>
 *     <GlobalDemandTracker />
 *     <Routes>...</Routes>
 *   </BrowserRouter>
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useGeoDetection } from '@/hooks/useGeoDetection';
import { 
  trackGlobalDemand, 
  trackRFQInterest,
  getScrollDepth,
  logGlobalDemandStats,
  classifyPage,
} from '@/lib/globalDemandTracker';

// Paths to skip tracking (non-SEO pages)
const SKIP_PATHS = [
  '/login',
  '/signup',
  '/reset-password',
  '/dashboard',
  '/affiliate',
  '/invoice-generator',
  '/auth',
];

/**
 * Global Demand Tracker Component
 * 
 * Tracks every page visit as an AI demand signal.
 * Must be mounted inside BrowserRouter.
 */
export function GlobalDemandTracker() {
  const location = useLocation();
  const geoData = useGeoDetection();
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPathRef = useRef<string>('');
  
  // Log stats on mount (dev only)
  useEffect(() => {
    logGlobalDemandStats();
  }, []);
  
  // Track page view on route change
  useEffect(() => {
    // Skip if geo not detected yet
    if (!geoData.isDetected) return;
    
    // Skip non-SEO paths
    const shouldSkip = SKIP_PATHS.some(skip => 
      location.pathname === skip || location.pathname.startsWith(`${skip}/`)
    );
    if (shouldSkip) return;
    
    // Skip if same path (prevents double tracking)
    if (location.pathname === lastPathRef.current) return;
    lastPathRef.current = location.pathname;
    
    // Track the page visit
    trackGlobalDemand({
      path: location.pathname,
      referrer: document.referrer,
      country: geoData.countryName || 'Unknown',
      countryCode: geoData.countryCode || 'GLOBAL',
      timestamp: Date.now(),
    });
    
    // Setup scroll depth tracking (after 10 seconds on page)
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      const scrollDepth = getScrollDepth();
      if (scrollDepth > 50) {
        // Re-track with scroll data if user engaged
        trackGlobalDemand({
          path: location.pathname,
          referrer: document.referrer,
          country: geoData.countryName || 'Unknown',
          countryCode: geoData.countryCode || 'GLOBAL',
          timestamp: Date.now(),
          scrollDepth,
        });
      }
    }, 10000);
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [location.pathname, geoData.isDetected, geoData.countryName, geoData.countryCode]);
  
  // Expose RFQ tracking globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.__trackRFQInterest = () => {
        trackRFQInterest(
          location.pathname,
          geoData.countryName || 'Unknown',
          geoData.countryCode || 'GLOBAL'
        );
      };
    }
  }, [location.pathname, geoData.countryName, geoData.countryCode]);
  
  // This component renders nothing - purely for tracking
  return null;
}

export default GlobalDemandTracker;
