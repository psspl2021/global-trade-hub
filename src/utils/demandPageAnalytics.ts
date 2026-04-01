/**
 * Demand Page Analytics - tracks views and RFQ clicks on generated SEO pages.
 * Writes to demand_page_analytics table (public insert, admin read).
 */

import { supabase } from "@/integrations/supabase/client";

function getSessionId(): string {
  const key = "ps_analytics_sid";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(key, id);
  return id;
}

const tracked = new Set<string>();

export async function trackDemandPageView(slug: string): Promise<void> {
  const viewKey = `view:${slug}`;
  if (tracked.has(viewKey)) return; // once per session per slug
  tracked.add(viewKey);

  try {
    await supabase.from("demand_page_analytics" as any).insert({
      slug,
      event_type: "view",
      session_id: getSessionId(),
      referrer: document.referrer || null,
      country_code: null, // geo filled elsewhere if needed
    } as any);
  } catch {
    // silent
  }
}

export async function trackDemandRFQClick(slug: string): Promise<void> {
  try {
    await supabase.from("demand_page_analytics" as any).insert({
      slug,
      event_type: "rfq_click",
      session_id: getSessionId(),
      referrer: document.referrer || null,
      country_code: null,
    } as any);
  } catch {
    // silent
  }
}
