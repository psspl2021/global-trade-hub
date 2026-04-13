/**
 * Session Control — Soft limit of max 2 concurrent sessions per user.
 * Uses register_session RPC which auto-evicts oldest if >= 2.
 */
import { supabase } from "@/integrations/supabase/client";

export async function checkSessionLimit(userId: string): Promise<{
  allowed: boolean;
  message?: string;
}> {
  const { data, error } = await supabase
    .from("user_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("active", true);

  if (error) return { allowed: true };

  if ((data || []).length >= 2) {
    return {
      allowed: false,
      message:
        "You already have 2 active sessions. Continue and close the others?",
    };
  }

  return { allowed: true };
}

export async function registerSession(userId: string): Promise<{
  sessionId: string | null;
  evicted: boolean;
}> {
  const deviceInfo = `${navigator.userAgent.slice(0, 100)}`;
  const { data, error } = await supabase.rpc("register_session", {
    p_user_id: userId,
    p_device_info: deviceInfo,
  });

  if (error) {
    console.error("Session registration failed:", error);
    return { sessionId: null, evicted: false };
  }

  return {
    sessionId: (data as any)?.session_id ?? null,
    evicted: (data as any)?.evicted ?? false,
  };
}

export async function deactivateAllSessions(userId: string): Promise<void> {
  await supabase.rpc("deactivate_user_sessions", { p_user_id: userId });
}
