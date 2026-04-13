/**
 * Tab-Level Lock — Prevents same auction from opening in multiple tabs.
 * Uses localStorage + BroadcastChannel for cross-tab coordination.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useAuctionTabLock(auctionId: string | undefined) {
  const [isLocked, setIsLocked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auctionId) return;

    const key = `auction_tab_lock_${auctionId}`;
    const tabId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Check if another tab already has this auction open
    const existing = localStorage.getItem(key);
    if (existing && existing !== tabId) {
      // Verify the other tab is still alive via storage event
      // Give benefit of doubt — set ours and let storage listener handle conflicts
      setIsLocked(true);
      toast.error("This auction is already open in another tab.");
      navigate(-1);
      return;
    }

    // Claim the lock
    localStorage.setItem(key, tabId);
    setIsLocked(false);

    // Listen for other tabs trying to claim
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue && e.newValue !== tabId) {
        // Another tab took over — we keep ours, they'll see the lock
      }
    };

    // Clean up on tab close / unload
    const handleUnload = () => {
      const current = localStorage.getItem(key);
      if (current === tabId) {
        localStorage.removeItem(key);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      handleUnload();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [auctionId, navigate]);

  return { isLocked };
}
