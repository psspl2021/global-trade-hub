import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { captureUTMParams, trackPageView } from '@/lib/analytics';

/**
 * SEMTracker Component
 * 
 * Captures UTM parameters and tracks page views for SEM campaigns.
 * Place this component at the app root level alongside VisitorTracker.
 */
export const SEMTracker = () => {
  const location = useLocation();

  // Capture UTM params on initial load
  useEffect(() => {
    captureUTMParams();
  }, []);

  // Track page views with title
  useEffect(() => {
    // Small delay to ensure title is updated
    const timeout = setTimeout(() => {
      trackPageView(location.pathname, document.title);
    }, 100);

    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return null;
};
