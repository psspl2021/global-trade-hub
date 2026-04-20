/**
 * Tab-Level Lock — Prevents same auction from opening in multiple LIVE tabs.
 * Uses a heartbeat in localStorage so stale locks (from crashes, refreshes,
 * or closed tabs) automatically expire.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const HEARTBEAT_INTERVAL_MS = 2000;
const STALE_THRESHOLD_MS = 6000; // lock is stale if not refreshed in 6s

interface LockPayload {
  tabId: string;
  ts: number;
}

export function useAuctionTabLock(auctionId: string | undefined) {
  const [isLocked, setIsLocked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auctionId) return;

    const key = `auction_tab_lock_${auctionId}`;
    const tabId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const readLock = (): LockPayload | null => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        // Backward compat: old format was just the tabId string
        if (!raw.startsWith("{")) return null;
        return JSON.parse(raw) as LockPayload;
      } catch {
        return null;
      }
    };

    const writeLock = () => {
      localStorage.setItem(key, JSON.stringify({ tabId, ts: Date.now() }));
    };

    const existing = readLock();
    const isStale = !existing || Date.now() - existing.ts > STALE_THRESHOLD_MS;

    if (existing && !isStale && existing.tabId !== tabId) {
      setIsLocked(true);
      toast.error("This auction is already open in another tab.");
      navigate(-1);
      return;
    }

    // Claim (or reclaim stale) lock
    writeLock();
    setIsLocked(false);

    // Heartbeat keeps the lock fresh
    const heartbeat = window.setInterval(writeLock, HEARTBEAT_INTERVAL_MS);

    const handleUnload = () => {
      const current = readLock();
      if (current?.tabId === tabId) {
        localStorage.removeItem(key);
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.clearInterval(heartbeat);
      handleUnload();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [auctionId, navigate]);

  return { isLocked };
}
