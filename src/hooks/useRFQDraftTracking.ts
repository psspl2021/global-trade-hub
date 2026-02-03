import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RFQDraftTrackingOptions {
  userId?: string | null;
  categorySlug?: string;
  pageUrl?: string;
  formData?: Record<string, unknown>;
  idleTimeoutMs?: number; // Default 45 seconds
}

/**
 * Extracts category slug from various sources with priority:
 * 1. Explicitly passed categorySlug prop
 * 2. URL path (e.g., /buy/chemicals/acids → chemicals)
 * 3. Form data category field
 * 4. First item's category in items array
 */
const extractCategorySlug = (
  categorySlug?: string,
  pageUrl?: string,
  formData?: Record<string, unknown>
): string | null => {
  // Priority 1: Explicit category slug
  if (categorySlug) {
    return categorySlug;
  }

  // Priority 2: Extract from URL path (/buy/{category}/{subcategory} or /source/{country}/{category})
  const url = pageUrl || window.location.pathname;
  const buyMatch = url.match(/\/buy\/([^/]+)/);
  if (buyMatch) {
    return buyMatch[1];
  }
  const sourceMatch = url.match(/\/source\/[^/]+\/([^/]+)/);
  if (sourceMatch) {
    return sourceMatch[1];
  }
  const procurementMatch = url.match(/\/procurement\/([^/]+)/);
  if (procurementMatch) {
    return procurementMatch[1];
  }

  // Priority 3: From form data
  if (formData) {
    // Direct category field
    if (typeof formData.category === 'string' && formData.category) {
      return slugify(formData.category);
    }
    // From generatedRFQ object (PostRFQ page)
    if (formData.generatedRFQ && typeof formData.generatedRFQ === 'object') {
      const rfq = formData.generatedRFQ as { category?: string };
      if (rfq.category) {
        return slugify(rfq.category);
      }
    }
    // From items array (CreateRequirementForm)
    if (Array.isArray(formData.items) && formData.items.length > 0) {
      const firstItem = formData.items[0] as { category?: string };
      if (firstItem?.category) {
        return slugify(firstItem.category);
      }
    }
  }

  return null;
};

/**
 * Convert category name to slug format
 * e.g., "Metals - Ferrous (Steel, Iron)" → "metals-ferrous"
 */
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

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
  
  // Store latest form data for saving - category is extracted dynamically at save time
  const latestFormData = useRef<Record<string, unknown>>({});
  const latestCategorySlug = useRef<string | undefined>(categorySlug);
  const latestPageUrl = useRef<string | undefined>(pageUrl);

  // Update refs when props change
  useEffect(() => {
    if (formData) {
      latestFormData.current = formData;
    }
    if (categorySlug) {
      latestCategorySlug.current = categorySlug;
    }
    if (pageUrl) {
      latestPageUrl.current = pageUrl;
    }
  }, [formData, categorySlug, pageUrl]);

  // Dynamically extract category slug at save time (uses latest form data)
  const getEffectiveCategorySlug = useCallback((): string | null => {
    return extractCategorySlug(
      latestCategorySlug.current,
      latestPageUrl.current,
      latestFormData.current
    );
  }, []);

  // Save draft to Supabase
  const saveDraft = useCallback(async () => {
    // Guard: Only save if interacted AND not submitted AND not already saved
    if (!hasInteracted.current || isSubmitted.current || draftSaved.current) {
      return;
    }

    // Mark as saved immediately to prevent duplicates
    draftSaved.current = true;

    try {
      // Extract category dynamically from all available sources
      const effectiveCategory = getEffectiveCategorySlug();
      
      const draftPayload = {
        user_id: userId || null,
        session_id: sessionId.current,
        category_slug: effectiveCategory,
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
  }, [userId, pageUrl, getEffectiveCategorySlug]);

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
        // Extract category dynamically from all available sources
        const effectiveCategory = extractCategorySlug(
          latestCategorySlug.current,
          latestPageUrl.current,
          latestFormData.current
        );
        
        const payload = {
          user_id: userId || null,
          session_id: sessionId.current,
          category_slug: effectiveCategory,
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
