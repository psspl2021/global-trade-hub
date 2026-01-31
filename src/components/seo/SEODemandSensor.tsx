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

import { useEffect, useRef } from 'react';
import { useDemandCapture } from '@/hooks/useDemandCapture';
import { PageType } from '@/lib/demandSignalCapture';

interface SEODemandSensorProps {
  pageType: PageType;
  categorySlug: string;
  subcategorySlug?: string;
  productSlug?: string;
  onRFQClick?: () => void; // Callback to capture RFQ click
}

export function SEODemandSensor({
  pageType,
  categorySlug,
  subcategorySlug,
  productSlug,
}: SEODemandSensorProps) {
  const { capturePageView, isGeoDetected } = useDemandCapture();
  const hasCapturedRef = useRef(false);
  
  // Capture page view on mount (once)
  useEffect(() => {
    if (isGeoDetected && !hasCapturedRef.current) {
      hasCapturedRef.current = true;
      
      capturePageView(
        pageType,
        categorySlug,
        subcategorySlug,
        productSlug
      );
      
      if (import.meta.env.DEV) {
        console.log('[SEODemandSensor] Page view captured:', {
          pageType,
          categorySlug,
          subcategorySlug,
        });
      }
    }
  }, [isGeoDetected, capturePageView, pageType, categorySlug, subcategorySlug, productSlug]);
  
  // This component renders nothing - it's purely for tracking
  return null;
}

export default SEODemandSensor;
