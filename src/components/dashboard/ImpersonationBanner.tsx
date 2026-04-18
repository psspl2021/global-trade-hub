/**
 * ============================================================
 * IMPERSONATION BANNER
 * ============================================================
 *
 * Persistent notice shown whenever the logged-in user is viewing
 * the dashboard scoped to a *different* purchaser than themselves.
 *
 * Prevents: confusion, mis-attributed actions, wrong-context decisions.
 * Action: "Exit" returns scope to the logged-in user.
 */

import { Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBuyerCompanyContext } from '@/hooks/useBuyerCompanyContext';

export function ImpersonationBanner() {
  const { user } = useAuth();
  const {
    selectedPurchaser,
    selectedPurchaserId,
    purchasers,
    setSelectedPurchaserId,
  } = useBuyerCompanyContext();

  // Only show when scope ≠ logged-in user
  if (!user || !selectedPurchaserId || selectedPurchaserId === user.id) {
    return null;
  }
  if (!selectedPurchaser) return null;

  const handleExit = () => {
    const me = purchasers.find((p) => p.user_id === user.id);
    setSelectedPurchaserId(me ? me.user_id : null);
  };

  return (
    <div className="w-full bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200 min-w-0">
          <Eye className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            Viewing as{' '}
            <span className="font-semibold">{selectedPurchaser.display_name}</span>
            <span className="text-amber-700 dark:text-amber-400">
              {' '}
              ({selectedPurchaser.role})
            </span>
            . Dashboard data is scoped to this purchaser. Your identity is unchanged.
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs flex-shrink-0 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40"
          onClick={handleExit}
        >
          <X className="h-3 w-3 mr-1" />
          Exit
        </Button>
      </div>
    </div>
  );
}

export default ImpersonationBanner;
