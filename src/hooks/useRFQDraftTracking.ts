import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RFQDraftTrackingOptions {
  userId?: string | null;
  categorySlug?: string;
  pageUrl?: string;
  formData?: Record<string, unknown>;
  idleTimeoutMs?: number; // Default 45 seconds
}

// Generate a session ID once per browser session
const getSessionId = (): string => {
  const key = 'rfq_session_id';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
};

/**
 * Custom hook to track RFQ draft abandonment.
 * 
 * Fires a draft save ONLY when:
 * 1. User has interacted with the form (typed in at least one field)
 * 2. RFQ is NOT submitted
 * 3. User leaves the page, closes tab, or stays idle for 45 seconds
 * 
 * Ensures draft is saved only ONCE per session.
 */
export function useRFQDraftTracking({
  userId,
  categorySlug,
  pageUrl,
  formData,
  idleTimeoutMs = 45000,
}: RFQDraftTrackingOptions) {
  // Interaction tracking
  const hasInteracted = useRef(false);
  const isSubmitted = useRef(false);
  const draftSaved = useRef(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionId = useRef(getSessionId());
  
  // Store latest form data for saving
  const latestFormData = useRef<Record<string, unknown>>({});
  const latestCategorySlug = useRef<string | undefined>(categorySlug);

  // Update refs when props change
  useEffect(() => {
    if (formData) {
      latestFormData.current = formData;
    }
    if (categorySlug) {
      latestCategorySlug.current = categorySlug;
    }
  }, [formData, categorySlug]);

  // Save draft to Supabase
  const saveDraft = useCallback(async () => {
    // Guard: Only save if interacted AND not submitted AND not already saved
    if (!hasInteracted.current || isSubmitted.current || draftSaved.current) {
      return;
    }

    // Mark as saved immediately to prevent duplicates
    draftSaved.current = true;

    try {
      const draftPayload = {
        user_id: userId || null,
        session_id: sessionId.current,
        category_slug: latestCategorySlug.current || null,
        status: 'draft',
        page_url: pageUrl || window.location.pathname,
        form_data: latestFormData.current as Record<string, unknown>,
      };

      const { error } = await (supabase.from('rfq_drafts') as any).insert(draftPayload);

      if (error) {
        console.error('Failed to save RFQ draft:', error);
        // Reset flag so it can retry on next trigger
        draftSaved.current = false;
      } else {
        console.log('RFQ draft saved successfully');
      }
    } catch (err) {
      console.error('Error saving RFQ draft:', err);
      draftSaved.current = false;
    }
  }, [userId, pageUrl]);

  // Clear idle timer
  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  // Start idle timer (resets on each interaction after first)
  const startIdleTimer = useCallback(() => {
    clearIdleTimer();
    
    if (!isSubmitted.current && hasInteracted.current) {
      idleTimerRef.current = setTimeout(() => {
        saveDraft();
      }, idleTimeoutMs);
    }
  }, [clearIdleTimer, idleTimeoutMs, saveDraft]);

  // Called when user interacts with form
  const markInteraction = useCallback(() => {
    if (!hasInteracted.current) {
      hasInteracted.current = true;
    }
    // Reset idle timer on every interaction
    startIdleTimer();
  }, [startIdleTimer]);

  // Called when RFQ is successfully submitted
  const markSubmitted = useCallback(() => {
    isSubmitted.current = true;
    clearIdleTimer();
    // Clear session storage to start fresh next time
    sessionStorage.removeItem('rfq_session_id');
  }, [clearIdleTimer]);

  // Handle page visibility change (tab switch, minimize)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveDraft();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveDraft]);

  // Handle page unload (close tab, navigate away, refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable delivery on page unload
      if (hasInteracted.current && !isSubmitted.current && !draftSaved.current) {
        const payload = {
          user_id: userId || null,
          session_id: sessionId.current,
          category_slug: latestCategorySlug.current || null,
          status: 'draft',
          page_url: pageUrl || window.location.pathname,
          form_data: latestFormData.current,
        };

        // sendBeacon is more reliable for unload events
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rfq_drafts`,
          blob
        );
        // Note: sendBeacon doesn't include auth headers, but RLS allows public insert
        draftSaved.current = true;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId, pageUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearIdleTimer();
      // Save draft on component unmount (e.g., navigate away within SPA)
      saveDraft();
    };
  }, [clearIdleTimer, saveDraft]);

  return {
    markInteraction,
    markSubmitted,
    hasInteracted: () => hasInteracted.current,
    isSubmitted: () => isSubmitted.current,
    isDraftSaved: () => draftSaved.current,
  };
}
