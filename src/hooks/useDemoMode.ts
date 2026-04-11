import { useState, useCallback } from 'react';
import { useUserRole } from '@/hooks/useUserRole';

export function useDemoMode(userId: string | undefined) {
  const { role } = useUserRole(userId);
  const [demoEnabled, setDemoEnabled] = useState(false);

  const canAccessDemo = role === 'ps_admin' || role === 'admin';

  const toggleDemo = useCallback(() => {
    if (canAccessDemo) setDemoEnabled(prev => !prev);
  }, [canAccessDemo]);

  const resetDemo = useCallback(() => {
    setDemoEnabled(false);
    // Re-enable after brief reset
    setTimeout(() => { if (canAccessDemo) setDemoEnabled(true); }, 300);
  }, [canAccessDemo]);

  return {
    demoEnabled: canAccessDemo && demoEnabled,
    toggleDemo,
    resetDemo,
    canAccessDemo,
  };
}
