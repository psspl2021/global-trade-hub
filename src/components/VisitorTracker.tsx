import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getStoredUTMParams } from '@/lib/analytics';

const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getVisitorId = (): string => {
  let visitorId = localStorage.getItem('ps_visitor_id');
  if (!visitorId) {
    visitorId = generateId();
    localStorage.setItem('ps_visitor_id', visitorId);
  }
  return visitorId;
};

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('ps_session_id');
  if (!sessionId) {
    sessionId = generateId();
    sessionStorage.setItem('ps_session_id', sessionId);
  }
  return sessionId;
};

const detectDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return 'mobile';
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth < 1024) return 'tablet';
  return 'desktop';
};

const detectBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Other';
};

const parseTrafficSource = (referrer: string): string => {
  if (!referrer) return 'Direct';
  
  const url = referrer.toLowerCase();
  
  if (url.includes('google.')) return 'Google';
  if (url.includes('instagram.com') || url.includes('l.instagram.com')) return 'Instagram';
  if (url.includes('facebook.com') || url.includes('fb.com') || url.includes('l.facebook.com')) return 'Facebook';
  if (url.includes('linkedin.com')) return 'LinkedIn';
  if (url.includes('twitter.com') || url.includes('x.com') || url.includes('t.co')) return 'Twitter';
  if (url.includes('wa.me') || url.includes('whatsapp.com')) return 'WhatsApp';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('bing.com')) return 'Bing';
  if (url.includes('yahoo.com')) return 'Yahoo';
  
  // Check if it's from the same domain (internal navigation)
  if (url.includes(window.location.hostname)) return 'Direct';
  
  return 'Referral';
};

// Store page entry time in sessionStorage with page path as key
const PAGE_ENTRY_KEY_PREFIX = 'ps_page_entry_';

const getPageEntryKey = (path: string) => `${PAGE_ENTRY_KEY_PREFIX}${path}`;

const recordPageEntry = (path: string) => {
  sessionStorage.setItem(getPageEntryKey(path), Date.now().toString());
};

const getTimeSpentOnPage = (path: string): number | null => {
  const entryTime = sessionStorage.getItem(getPageEntryKey(path));
  if (!entryTime) return null;
  const seconds = Math.round((Date.now() - parseInt(entryTime, 10)) / 1000);
  // Cap at 30 minutes to filter out inactive tabs
  return Math.min(seconds, 1800);
};

export const VisitorTracker = () => {
  const location = useLocation();
  const lastTrackedPath = useRef<string>('');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const currentVisitId = useRef<string | null>(null);

  // Function to update time spent on previous page
  const updateTimeSpent = useCallback(async (path: string) => {
    const timeSpent = getTimeSpentOnPage(path);
    if (timeSpent === null || timeSpent < 1) return;

    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      
      await supabase.functions.invoke('track-visit', {
        body: {
          update_time_spent: true,
          visitor_id: visitorId,
          session_id: sessionId,
          page_path: path,
          time_spent_seconds: timeSpent,
        },
      });
    } catch (error) {
      console.error('Failed to update time spent:', error);
    }
  }, []);

  useEffect(() => {
    const trackPageVisit = async () => {
      // Debounce to prevent duplicate tracking
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(async () => {
        const currentPath = location.pathname;
        
        // Skip if same path (prevents double tracking on initial load)
        if (currentPath === lastTrackedPath.current) return;
        
        // Update time spent on previous page before tracking new one
        if (lastTrackedPath.current) {
          await updateTimeSpent(lastTrackedPath.current);
        }
        
        lastTrackedPath.current = currentPath;
        // Record entry time for current page
        recordPageEntry(currentPath);

        try {
          const visitorId = getVisitorId();
          const sessionId = getSessionId();
          const referrer = document.referrer;
          const source = parseTrafficSource(referrer);
          const deviceType = detectDeviceType();
          const browser = detectBrowser();
          const utmParams = getStoredUTMParams();

          // Use edge function for server-side country detection via IP
          const response = await supabase.functions.invoke('track-visit', {
            body: {
              visitor_id: visitorId,
              session_id: sessionId,
              page_path: currentPath,
              referrer: referrer || null,
              source,
              device_type: deviceType,
              browser,
              user_agent: navigator.userAgent,
              screen_width: window.screen.width,
              screen_height: window.screen.height,
              // SEM tracking data
              utm_source: utmParams?.utm_source || null,
              utm_medium: utmParams?.utm_medium || null,
              utm_campaign: utmParams?.utm_campaign || null,
              utm_term: utmParams?.utm_term || null,
              utm_content: utmParams?.utm_content || null,
              gclid: utmParams?.gclid || null,
            },
          });
          
          if (response.data?.visit_id) {
            currentVisitId.current = response.data.visit_id;
          }
        } catch (error) {
          // Silently fail - don't disrupt user experience
          console.error('Failed to track page visit:', error);
        }
      }, 100);
    };

    trackPageVisit();

    // Update time spent when user leaves the page
    const handleBeforeUnload = () => {
      if (lastTrackedPath.current) {
        const timeSpent = getTimeSpentOnPage(lastTrackedPath.current);
        if (timeSpent && timeSpent >= 1) {
          const visitorId = getVisitorId();
          const sessionId = getSessionId();
          // Use sendBeacon for reliable delivery on page unload
          navigator.sendBeacon(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-visit`,
            JSON.stringify({
              update_time_spent: true,
              visitor_id: visitorId,
              session_id: sessionId,
              page_path: lastTrackedPath.current,
              time_spent_seconds: timeSpent,
            })
          );
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.pathname, updateTimeSpent]);

  return null;
};
