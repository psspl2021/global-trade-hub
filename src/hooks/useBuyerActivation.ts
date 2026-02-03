/**
 * ============================================================
 * BUYER ACTIVATION HOOK
 * ============================================================
 * 
 * Frontend tracking for buyer activation triggers:
 * - Page abandonment detection (>30s on page, no RFQ)
 * - Partial RFQ fill tracking
 * - Multi-session engagement
 * - Category interest signals
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ActivationConfig {
  abandonmentThreshold?: number; // seconds before triggering abandonment nudge
  enableTracking?: boolean;
}

interface BuyerActivationState {
  sessionCount: number;
  pageViewCount: number;
  timeOnPage: number;
  hasInteractedWithRFQ: boolean;
  lastCategory: string | null;
  lastCountry: string | null;
}

const SESSION_KEY = 'ps_buyer_activation';
const SESSION_COUNT_KEY = 'ps_session_count';

export function useBuyerActivation(config: ActivationConfig = {}) {
  const { 
    abandonmentThreshold = 30, 
    enableTracking = true 
  } = config;
  
  const { user, session } = useAuth();
  const startTimeRef = useRef<number>(Date.now());
  const [state, setState] = useState<BuyerActivationState>(() => {
    // Load from session storage
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Increment session count
    const sessionCount = Number(localStorage.getItem(SESSION_COUNT_KEY) || '0') + 1;
    localStorage.setItem(SESSION_COUNT_KEY, String(sessionCount));
    
    return {
      sessionCount,
      pageViewCount: 0,
      timeOnPage: 0,
      hasInteractedWithRFQ: false,
      lastCategory: null,
      lastCountry: null
    };
  });

  // Save state to session storage
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  }, [state]);

  // Generate session ID
  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('ps_session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem('ps_session_id', sessionId);
    }
    return sessionId;
  }, []);

  // Track page view
  const trackPageView = useCallback((category?: string, country?: string) => {
    if (!enableTracking) return;
    
    setState(prev => ({
      ...prev,
      pageViewCount: prev.pageViewCount + 1,
      lastCategory: category || prev.lastCategory,
      lastCountry: country || prev.lastCountry
    }));
    
    startTimeRef.current = Date.now();
  }, [enableTracking]);

  // Track RFQ interaction
  const trackRFQInteraction = useCallback(() => {
    setState(prev => ({ ...prev, hasInteractedWithRFQ: true }));
  }, []);

  // Track partial RFQ fill
  const trackPartialRFQ = useCallback(async (category: string, fieldsCompleted: number) => {
    if (!enableTracking || fieldsCompleted < 2) return;
    
    try {
      await supabase.rpc('create_buyer_nudge', {
        p_user_id: user?.id || null,
        p_session_id: getSessionId(),
        p_nudge_type: 'partial_rfq',
        p_trigger_reason: `Completed ${fieldsCompleted} fields without submission`,
        p_category: category,
        p_country: state.lastCountry,
        p_page_url: window.location.pathname,
        p_time_on_page: Math.floor((Date.now() - startTimeRef.current) / 1000)
      });
    } catch (err) {
      console.error('[BuyerActivation] Partial RFQ nudge error:', err);
    }
  }, [enableTracking, user?.id, getSessionId, state.lastCountry]);

  // Check for multi-session engagement
  const checkMultiSessionTrigger = useCallback(async () => {
    if (!enableTracking || state.sessionCount < 3) return;
    if (state.hasInteractedWithRFQ) return;
    
    try {
      await supabase.rpc('create_buyer_nudge', {
        p_user_id: user?.id || null,
        p_session_id: getSessionId(),
        p_nudge_type: 'multi_session',
        p_trigger_reason: `${state.sessionCount} sessions without RFQ`,
        p_category: state.lastCategory,
        p_country: state.lastCountry,
        p_page_url: window.location.pathname,
        p_time_on_page: null
      });
    } catch (err) {
      console.error('[BuyerActivation] Multi-session nudge error:', err);
    }
  }, [enableTracking, state, user?.id, getSessionId]);

  // Abandonment detection
  useEffect(() => {
    if (!enableTracking) return;
    
    const checkAbandonment = async () => {
      const timeOnPage = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      if (timeOnPage >= abandonmentThreshold && !state.hasInteractedWithRFQ) {
        try {
          await supabase.rpc('create_buyer_nudge', {
            p_user_id: user?.id || null,
            p_session_id: getSessionId(),
            p_nudge_type: 'abandonment',
            p_trigger_reason: `${timeOnPage}s on page without action`,
            p_category: state.lastCategory,
            p_country: state.lastCountry,
            p_page_url: window.location.pathname,
            p_time_on_page: timeOnPage
          });
        } catch (err) {
          console.error('[BuyerActivation] Abandonment nudge error:', err);
        }
      }
    };

    // Check on page visibility change (user switching tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        checkAbandonment();
      }
    };

    // Check on page unload
    const handleBeforeUnload = () => {
      checkAbandonment();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enableTracking, abandonmentThreshold, state, user?.id, getSessionId]);

  // Multi-session check on mount
  useEffect(() => {
    if (state.sessionCount >= 3 && state.pageViewCount === 0) {
      checkMultiSessionTrigger();
    }
  }, [state.sessionCount, state.pageViewCount, checkMultiSessionTrigger]);

  return {
    state,
    trackPageView,
    trackRFQInteraction,
    trackPartialRFQ,
    sessionId: getSessionId()
  };
}

export default useBuyerActivation;
