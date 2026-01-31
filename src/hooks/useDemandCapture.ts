/**
 * ============================================================
 * DEMAND CAPTURE HOOK
 * ============================================================
 * 
 * React hook for capturing demand signals from SEO pages.
 * Integrates geo-detection with signal capture system.
 * 
 * Usage:
 *   const { capturePageView, captureRFQClick } = useDemandCapture();
 *   
 *   // On page load
 *   useEffect(() => {
 *     capturePageView('category', 'steel');
 *   }, []);
 *   
 *   // On RFQ button click
 *   <Button onClick={() => captureRFQClick('steel', 'structural-steel')}>
 *     Get Quotes
 *   </Button>
 */

import { useCallback, useEffect, useRef } from 'react';
import { useGeoDetection } from '@/hooks/useGeoDetection';
import {
  captureSEOVisit,
  captureRFQInterest,
  captureRFQSubmission,
  PageType,
  logDemandCaptureStats,
} from '@/lib/demandSignalCapture';

export interface DemandCaptureContext {
  countryCode: string;
  countryName: string;
  region: string;
  isDetected: boolean;
}

export function useDemandCapture() {
  const geoData = useGeoDetection();
  const hasLoggedRef = useRef(false);
  
  // Log stats in dev mode once
  useEffect(() => {
    if (import.meta.env.DEV && !hasLoggedRef.current) {
      hasLoggedRef.current = true;
      logDemandCaptureStats();
    }
  }, []);
  
  /**
   * Get current geo context for RFQ forms
   * Country is READ-ONLY and cannot be changed by user
   */
  const getGeoContext = useCallback((): DemandCaptureContext => {
    return {
      countryCode: geoData.countryCode || 'GLOBAL',
      countryName: geoData.countryName || 'Worldwide',
      region: geoData.region,
      isDetected: geoData.isDetected,
    };
  }, [geoData]);
  
  /**
   * Capture page view as SEO demand signal
   * Call on page mount for any SEO page
   */
  const capturePageView = useCallback(async (
    pageType: PageType,
    categorySlug: string,
    subcategorySlug?: string,
    productSlug?: string
  ): Promise<void> => {
    if (!geoData.isDetected) return; // Wait for geo detection
    
    await captureSEOVisit({
      pageType,
      categorySlug,
      subcategorySlug,
      productSlug,
      detectedCountry: geoData.countryName,
      detectedCountryCode: geoData.countryCode,
      detectedRegion: geoData.region,
    });
  }, [geoData]);
  
  /**
   * Capture RFQ interest (modal opened, CTA clicked)
   * Call when user clicks "Get Quotes", "Post RFQ", etc.
   */
  const captureRFQClick = useCallback(async (
    categorySlug: string,
    subcategorySlug?: string,
    sourcePageType: PageType = 'product'
  ): Promise<void> => {
    if (!geoData.isDetected) return;
    
    await captureRFQInterest({
      categorySlug,
      subcategorySlug,
      detectedCountry: geoData.countryName,
      detectedCountryCode: geoData.countryCode,
      detectedRegion: geoData.region,
      sourcePageType,
    });
  }, [geoData]);
  
  /**
   * Capture successful RFQ submission
   * Call after RFQ is successfully created
   */
  const captureRFQSuccess = useCallback(async (
    categorySlug: string,
    rfqId: string,
    subcategorySlug?: string
  ): Promise<void> => {
    if (!geoData.isDetected) return;
    
    await captureRFQSubmission({
      categorySlug,
      subcategorySlug,
      detectedCountry: geoData.countryName,
      detectedCountryCode: geoData.countryCode,
      detectedRegion: geoData.region,
      rfqId,
    });
  }, [geoData]);
  
  return {
    // Geo context (read-only)
    geoContext: getGeoContext(),
    isGeoDetected: geoData.isDetected,
    
    // Capture functions
    capturePageView,
    captureRFQClick,
    captureRFQSuccess,
    
    // Raw geo data for display
    countryCode: geoData.countryCode,
    countryName: geoData.countryName,
    region: geoData.region,
  };
}

export default useDemandCapture;
