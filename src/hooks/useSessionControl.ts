/**
 * Session Control — Single active session per user, race-safe.
 * Backend auto-evicts old sessions. Heartbeat keeps session alive.
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
 * Session heartbeat — calls update_session_heartbeat RPC every 5 min
 * to keep session marked active. Sessions inactive >30min are considered expired.
 */
export function useSessionHeartbeat(sessionId: string | null) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // Get current user id for heartbeat RPC
    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id ?? null;
    });

    const sendHeartbeat = () => {
      if (!userIdRef.current) return;
      supabase
        .rpc("update_session_heartbeat", { p_user_id: userIdRef.current })
        .then(({ error }) => {
          if (error) console.warn("Session heartbeat failed:", error.message);
        });
    };

    // Send immediately, then every 5 minutes
    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionId]);
}
