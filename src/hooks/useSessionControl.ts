/**
 * Session Control — Soft limit of max 2 concurrent sessions per user.
 * Backend returns allowed:false if >= 2 active. Frontend decides whether to evict.
 */
import { supabase } from "@/integrations/supabase/client";

export async function registerSession(userId: string): Promise<{
  allowed: boolean;
  sessionId: string | null;
  reason?: string;
  activeCount?: number;
}> {
  const deviceInfo = `${navigator.userAgent.slice(0, 100)}`;
  const { data, error } = await supabase.rpc("register_session", {
    p_user_id: userId,
    p_device_info: deviceInfo,
  });

  if (error) {
    console.error("Session registration failed:", error);
    return { allowed: true, sessionId: null };
  }

  const result = data as any;
  return {
    allowed: result?.allowed ?? true,
    sessionId: result?.session_id ?? null,
    reason: result?.reason,
    activeCount: result?.active_count,
  };
}

export async function deactivateAllSessions(userId: string): Promise<void> {
  await supabase.rpc("deactivate_user_sessions", { p_user_id: userId });
}
