/**
 * Session Control — Soft limit of max 2 concurrent sessions per user.
 * Backend returns allowed:false if >= 2 active. Frontend decides whether to evict.
 */
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";

export async function registerSession(userId: string): Promise<{
  sessionId: string | null;
}> {
  const deviceInfo = `${navigator.userAgent.slice(0, 100)}`;
  const { data, error } = await supabase.rpc("register_session", {
    p_user_id: userId,
    p_device_info: deviceInfo,
  });

  if (error) {
    console.error("Session registration failed:", error);
    return { sessionId: null };
  }

  const result = data as any;
  return {
    sessionId: result?.session_id ?? null,
  };
}

export async function deactivateAllSessions(userId: string): Promise<void> {
  await supabase.rpc("deactivate_user_sessions", { p_user_id: userId });
}

/**
 * Session heartbeat — updates last_seen_at every 60s to keep session marked active.
 * Enables accurate stale session cleanup.
 */
export function useSessionHeartbeat(sessionId: string | null) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const sendHeartbeat = () => {
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      supabase
        .from("user_sessions" as any)
        .update({ last_seen_at: new Date().toISOString() } as any)
        .eq("id", sessionId)
        .lt("last_seen_at" as any, twoMinAgo)
        .then(({ error }) => {
          if (error) console.warn("Session heartbeat failed:", error.message);
        });
    };

    // Send immediately, then every 60s
    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionId]);
}
