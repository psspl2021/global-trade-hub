/**
 * ============================================================
 * DEMAND ALERT CRON (Edge Function)
 * ============================================================
 * 
 * Runs periodically to check for demand threshold breaches
 * and create alerts for admin/supplier dashboards.
 * 
 * Triggers when:
 * - Intent >= 7 in any category + country
 * - >= 3 RFQs detected in 72 hours
 * - Same category spikes across >= 2 countries
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    console.log("[demand-alert-cron] Starting alert check...");

    // Call the SQL function to check and create alerts
    const { data: alertsCreated, error } = await supabase.rpc(
      'check_and_create_demand_alerts'
    );

    if (error) {
      console.error("[demand-alert-cron] Error:", error);
      throw error;
    }

    console.log(`[demand-alert-cron] Created ${alertsCreated} new alerts`);

    // Log to admin activity for audit trail
    if (alertsCreated > 0) {
      await supabase.from('admin_activity_logs').insert({
        action_type: 'demand_alert_cron',
        admin_id: '00000000-0000-0000-0000-000000000000', // System
        metadata: {
          alerts_created: alertsCreated,
          run_at: new Date().toISOString(),
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        alerts_created: alertsCreated,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[demand-alert-cron] Error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
