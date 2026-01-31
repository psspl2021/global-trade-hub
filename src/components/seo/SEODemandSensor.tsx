/**
 * ============================================================
 * SEO DEMAND SENSOR
 * ============================================================
 * 
 * Invisible component that captures demand signals from SEO pages.
 * Place this on any SEO page to turn it into an AI sensor.
 * 
 * Features:
 * - Auto-captures page view with geo context
 * - Tracks RFQ intent when CTA is clicked
 * - Connects to global demand intelligence
 * - NO visible UI - purely for tracking
 * 
 * Usage:
 *   <SEODemandSensor 
 *     pageType="product"
 *     categorySlug="steel"
 *     subcategorySlug="structural-steel"
 *   />
 */

import { useEffect, useRef, useCallback } from 'react';
import { useDemandCapture } from '@/hooks/useDemandCapture';
import { PageType } from '@/lib/demandSignalCapture';

interface SEODemandSensorProps {
  pageType: PageType;
  categorySlug: string;
  subcategorySlug?: string;
  productSlug?: string;
  /** Called when RFQ interest is captured (for parent components) */
  onRFQInterest?: () => void;
}

/**
 * SEO Demand Sensor
 * 
 * Invisible AI sensor that captures demand signals from SEO pages.
 * 
 * Signal Flow:
 * 1. SEO_VISIT: User lands on page → State = "Detected"
 * 2. RFQ_INTEREST: User clicks CTA → State = "Confirmed"
 * 3. RFQ_SUBMITTED: RFQ created → State = "Active"
 * 
 * All signals are linked to:
 * - Detected country (auto, READ-ONLY)
 * - Category/subcategory
 * - Source page
 */
export function SEODemandSensor({
  pageType,
  categorySlug,
  subcategorySlug,
  productSlug,
  onRFQInterest,
}: SEODemandSensorProps) {
  const { capturePageView, captureRFQClick, isGeoDetected, countryCode, countryName } = useDemandCapture();
  const hasCapturedRef = useRef(false);
  
  // Capture page view on mount (once per session)
  useEffect(() => {
    if (isGeoDetected && !hasCapturedRef.current) {
      hasCapturedRef.current = true;
      
      // Store page context for RFQ form auto-fill
      try {
        sessionStorage.setItem('ps_seo_context', JSON.stringify({
          pageType,
          categorySlug,
          subcategorySlug,
          productSlug,
          countryCode,
          countryName,
          timestamp: new Date().toISOString(),
        }));
      } catch {
        // Ignore storage errors
      }
      
      capturePageView(
        pageType,
        categorySlug,
        subcategorySlug,
        productSlug
      );
      
      if (import.meta.env.DEV) {
        console.log('[SEODemandSensor] 🧠 AI Learning:', {
          signal: 'SEO_VISIT',
          pageType,
          category: categorySlug,
          subcategory: subcategorySlug,
          country: countryName,
          countryCode,
        });
      }
    }
  }, [isGeoDetected, capturePageView, pageType, categorySlug, subcategorySlug, productSlug, countryCode, countryName]);
  
  // Expose RFQ interest capture for parent components
  const handleRFQInterest = useCallback(() => {
    captureRFQClick(categorySlug, subcategorySlug, pageType);
    onRFQInterest?.();
  }, [captureRFQClick, categorySlug, subcategorySlug, pageType, onRFQInterest]);
  
  // This component renders nothing - it's purely for tracking
  return null;
}

export default SEODemandSensor;
