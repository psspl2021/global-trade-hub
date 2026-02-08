/**
 * ============================================================
 * ROLE SECURITY HOOK
 * ============================================================
 * 
 * Manages verification state for sensitive management roles.
 * All verification is stored in memory only (React state).
 * Never stores PINs in localStorage.
 * 
 * Verification expires after 15 minutes or on logout.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { ManagementViewType } from '@/hooks/useBuyerCompanyContext';

const VERIFICATION_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

export interface VerificationState {
  role: ManagementViewType;
  verifiedAt: Date;
  expiresAt: Date;
}

interface RoleSecurityContext {
  // Verification states (in-memory only)
  verifiedRoles: Map<string, VerificationState>;
  isRoleVerified: (role: ManagementViewType) => boolean;
  
  // PIN management
  hasPinConfigured: (role: ManagementViewType) => Promise<boolean>;
  
  // Verification actions
  verifyWithPin: (role: ManagementViewType, pin: string) => Promise<{ success: boolean; error?: string }>;
  verifyWithPassword: (role: ManagementViewType, password: string) => Promise<{ success: boolean; error?: string }>;
  setPinForRole: (role: ManagementViewType, pin: string) => Promise<{ success: boolean; error?: string }>;
  
  // Session management
  clearVerification: (role?: ManagementViewType) => void;
  clearAllVerifications: () => void;
  
  // Check if verification is required
  requiresVerification: (role: ManagementViewType) => boolean;
  
  // Loading states
  isVerifying: boolean;
}

export function useRoleSecurity(): RoleSecurityContext {
  const { user } = useAuth();
  const [verifiedRoles, setVerifiedRoles] = useState<Map<string, VerificationState>>(new Map());
  const [isVerifying, setIsVerifying] = useState(false);
  const expiryTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clear all verifications on logout
  useEffect(() => {
    if (!user) {
      clearAllVerifications();
    }
  }, [user]);

  // Check if role requires verification (all management roles do)
  const requiresVerification = useCallback((role: ManagementViewType): boolean => {
    if (!role) return false;
    const managementRoles = ['cfo', 'ceo', 'hr', 'manager'];
    return managementRoles.includes(role);
  }, []);

  // Check if a role is currently verified and not expired
  const isRoleVerified = useCallback((role: ManagementViewType): boolean => {
    if (!role) return false;
    const verification = verifiedRoles.get(role);
    if (!verification) return false;
    return new Date() < verification.expiresAt;
  }, [verifiedRoles]);

  // Set up expiry timer for a verification
  const setupExpiryTimer = useCallback((role: string, expiresAt: Date) => {
    // Clear existing timer
    const existingTimer = expiryTimersRef.current.get(role);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timeUntilExpiry = expiresAt.getTime() - Date.now();
    if (timeUntilExpiry > 0) {
      const timer = setTimeout(() => {
        setVerifiedRoles(prev => {
          const next = new Map(prev);
          next.delete(role);
          return next;
        });
        // Log session expiry
        if (user?.id) {
          (async () => {
            try {
              await supabase.rpc('log_role_switch' as any, {
                _user_id: user.id,
                _target_role: role,
                _metadata: { action: 'session_expired' }
              });
            } catch {
              // Ignore logging errors
            }
          })();
        }
      }, timeUntilExpiry);
      expiryTimersRef.current.set(role, timer);
    }
  }, [user?.id]);

  // Check if user has PIN configured for role
  const hasPinConfigured = useCallback(async (role: ManagementViewType): Promise<boolean> => {
    if (!user?.id || !role) return false;
    
    try {
      const { data, error } = await supabase.rpc('has_role_pin' as any, {
        _user_id: user.id,
        _role: `buyer_${role}`
      });
      
      if (error) {
        console.error('[useRoleSecurity] hasPinConfigured error:', error);
        return false;
      }
      
      return data === true;
    } catch (err) {
      console.error('[useRoleSecurity] hasPinConfigured failed:', err);
      return false;
    }
  }, [user?.id]);

  // Verify role access with PIN
  const verifyWithPin = useCallback(async (
    role: ManagementViewType,
    pin: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id || !role) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsVerifying(true);
    
    try {
      const { data, error } = await supabase.rpc('verify_role_pin' as any, {
        _user_id: user.id,
        _role: `buyer_${role}`,
        _pin: pin
      });

      if (error) {
        console.error('[useRoleSecurity] verifyWithPin error:', error);
        return { success: false, error: error.message };
      }

      const result = data as { success: boolean; error?: string; message?: string };
      
      if (result.success) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + VERIFICATION_EXPIRY_MS);
        
        setVerifiedRoles(prev => {
          const next = new Map(prev);
          next.set(role, {
            role,
            verifiedAt: now,
            expiresAt
          });
          return next;
        });
        
        setupExpiryTimer(role, expiresAt);
        
        return { success: true };
      }
      
      return { success: false, error: result.message || 'Invalid PIN' };
    } catch (err) {
      console.error('[useRoleSecurity] verifyWithPin failed:', err);
      return { success: false, error: 'Verification failed' };
    } finally {
      setIsVerifying(false);
    }
  }, [user?.id, setupExpiryTimer]);

  // Verify role access with password (re-auth)
  const verifyWithPassword = useCallback(async (
    role: ManagementViewType,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id || !user?.email || !role) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsVerifying(true);
    
    try {
      // Re-authenticate with password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password
      });

      if (signInError) {
        // Log failure
        try {
          await supabase.rpc('log_role_switch' as any, {
            _user_id: user.id,
            _target_role: `buyer_${role}`,
            _metadata: { action: 'unlock_failure', reason: 'invalid_password' }
          });
        } catch (logError) {
          console.error('Failed to log unlock failure:', logError);
        }
        
        return { success: false, error: 'Invalid password' };
      }

      // Log success
      try {
        await supabase.rpc('log_role_switch' as any, {
          _user_id: user.id,
          _target_role: `buyer_${role}`,
          _metadata: { action: 'unlock_success', method: 'password' }
        });
      } catch (logError) {
        console.error('Failed to log unlock success:', logError);
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + VERIFICATION_EXPIRY_MS);
      
      setVerifiedRoles(prev => {
        const next = new Map(prev);
        next.set(role, {
          role,
          verifiedAt: now,
          expiresAt
        });
        return next;
      });
      
      setupExpiryTimer(role, expiresAt);
      
      return { success: true };
    } catch (err) {
      console.error('[useRoleSecurity] verifyWithPassword failed:', err);
      return { success: false, error: 'Verification failed' };
    } finally {
      setIsVerifying(false);
    }
  }, [user?.id, user?.email, setupExpiryTimer]);

  // Set PIN for a role
  const setPinForRole = useCallback(async (
    role: ManagementViewType,
    pin: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id || !role) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsVerifying(true);
    
    try {
      const { data, error } = await supabase.rpc('set_role_pin' as any, {
        _user_id: user.id,
        _role: `buyer_${role}`,
        _pin: pin
      });

      if (error) {
        console.error('[useRoleSecurity] setPinForRole error:', error);
        return { success: false, error: error.message };
      }

      const result = data as { success: boolean; error?: string; message?: string };
      
      if (result.success) {
        return { success: true };
      }
      
      return { success: false, error: result.message || 'Failed to set PIN' };
    } catch (err) {
      console.error('[useRoleSecurity] setPinForRole failed:', err);
      return { success: false, error: 'Failed to set PIN' };
    } finally {
      setIsVerifying(false);
    }
  }, [user?.id]);

  // Clear verification for a specific role
  const clearVerification = useCallback((role?: ManagementViewType) => {
    if (role) {
      const timer = expiryTimersRef.current.get(role);
      if (timer) {
        clearTimeout(timer);
        expiryTimersRef.current.delete(role);
      }
      setVerifiedRoles(prev => {
        const next = new Map(prev);
        next.delete(role);
        return next;
      });
    }
  }, []);

  // Clear all verifications (on logout)
  const clearAllVerifications = useCallback(() => {
    // Clear all timers
    expiryTimersRef.current.forEach((timer) => clearTimeout(timer));
    expiryTimersRef.current.clear();
    
    // Clear all verified roles
    setVerifiedRoles(new Map());
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      expiryTimersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return {
    verifiedRoles,
    isRoleVerified,
    hasPinConfigured,
    verifyWithPin,
    verifyWithPassword,
    setPinForRole,
    clearVerification,
    clearAllVerifications,
    requiresVerification,
    isVerifying
  };
}

export default useRoleSecurity;
