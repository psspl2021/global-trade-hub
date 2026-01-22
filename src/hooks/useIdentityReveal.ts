/**
 * ================================================================
 * CONTROLLED IDENTITY REVEAL HOOK
 * ================================================================
 * 
 * Enterprise-grade identity reveal system with full audit trail.
 * 
 * RULES:
 * 1. Only admins can reveal identities
 * 2. All reveals are logged in identity_reveal_events
 * 3. Frontend stays masked until identity_revealed flag is true
 * 4. Reveal only happens after specific milestones (PO signed, payment, etc.)
 * ================================================================
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IdentityRevealResult {
  success: boolean;
  error?: string;
}

interface UseIdentityRevealReturn {
  /**
   * Reveal identities for a requirement (Admin only)
   * @param requirementId - The requirement UUID
   * @param reason - Mandatory reason for audit (e.g., "PO signed + payment initiated")
   */
  revealIdentities: (requirementId: string, reason: string) => Promise<IdentityRevealResult>;
  
  /**
   * Check if identities are revealed for a requirement
   */
  isRevealed: (requirementId: string) => Promise<boolean>;
  
  /**
   * Loading state
   */
  isLoading: boolean;
}

/**
 * Hook for admin-controlled identity reveal
 * 
 * SECURITY:
 * - Uses SECURITY DEFINER RPC that validates admin status
 * - All reveals are logged with timestamp, reason, and admin ID
 * - Cannot be called by non-admin users
 */
export function useIdentityReveal(): UseIdentityRevealReturn {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Reveal buyer/supplier identities for a requirement
   * Only callable by admin users (enforced at DB level)
   */
  const revealIdentities = useCallback(async (
    requirementId: string,
    reason: string
  ): Promise<IdentityRevealResult> => {
    if (!reason.trim()) {
      toast.error('Reason is required for audit trail');
      return { success: false, error: 'Reason is required' };
    }

    setIsLoading(true);
    try {
      // Call the reveal_identities RPC (SECURITY DEFINER, admin-only)
      const { error } = await (supabase.rpc as any)('reveal_identities', {
        p_req_id: requirementId,
        p_reason: reason.trim(),
      });

      if (error) {
        console.error('Identity reveal error:', error);
        toast.error('Failed to reveal identities: ' + error.message);
        return { success: false, error: error.message };
      }

      toast.success('Identities revealed successfully');
      return { success: true };
    } catch (err: any) {
      console.error('Identity reveal error:', err);
      toast.error('Failed to reveal identities');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check if identities have been revealed for a requirement
   */
  const isRevealed = useCallback(async (requirementId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('requirements')
        .select('identity_revealed')
        .eq('id', requirementId)
        .single();

      if (error) {
        console.error('Check identity reveal error:', error);
        return false;
      }

      return data?.identity_revealed === true;
    } catch (err) {
      console.error('Check identity reveal error:', err);
      return false;
    }
  }, []);

  return {
    revealIdentities,
    isRevealed,
    isLoading,
  };
}

/**
 * Utility to check if contacts should be displayed
 * Returns false by default (masked) until identity_revealed is true
 */
export function shouldShowContacts(identityRevealed?: boolean | null): boolean {
  return identityRevealed === true;
}

/**
 * Format contact info for display (masked or revealed)
 */
export function formatContactInfo(
  value: string | null | undefined,
  isRevealed: boolean,
  maskChar: string = '•'
): string {
  if (!value) return '—';
  if (isRevealed) return value;
  
  // Mask all but first 2 and last 2 characters
  if (value.length <= 4) return maskChar.repeat(value.length);
  return value.slice(0, 2) + maskChar.repeat(Math.max(4, value.length - 4)) + value.slice(-2);
}
