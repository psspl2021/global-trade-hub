import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find expired RFQs that buyer hasn't closed (soft-expired)
    const { data: expiredRFQs, error: rfqError } = await supabase
      .from("requirements")
      .select(`
        id,
        title,
        product_category,
        deadline,
        buyer_id,
        profiles!requirements_buyer_id_fkey (
          email,
          company_name
        )
      `)
      .eq("status", "expired")
      .eq("buyer_closure_status", "open");

    if (rfqError) {
      console.error("Error fetching expired RFQs:", rfqError);
    }

    // Find expired logistics loads that buyer hasn't closed
    const { data: expiredLoads, error: loadError } = await supabase
      .from("logistics_requirements")
      .select(`
        id,
        title,
        material_type,
        delivery_deadline,
        customer_id,
        profiles!logistics_requirements_customer_id_fkey (
          email,
          company_name
        )
      `)
      .eq("status", "expired")
      .eq("buyer_closure_status", "open");

    if (loadError) {
      console.error("Error fetching expired loads:", loadError);
    }

    const notifications: any[] = [];

    // Create notifications for expired RFQs
    for (const rfq of expiredRFQs || []) {
      if (!rfq.buyer_id) continue;
      
      // Check if we already sent a reminder in the last 24 hours
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", rfq.buyer_id)
        .eq("type", "rfq_expiry_reminder")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (count && count > 0) continue;

      notifications.push({
        user_id: rfq.buyer_id,
        type: "rfq_expiry_reminder",
        title: "RFQ Expired - Action Required",
        message: `Your RFQ "${rfq.title}" for ${rfq.product_category} has expired. Extend the deadline or close it to continue receiving quotes.`,
        metadata: { requirement_id: rfq.id },
        is_read: false,
      });
    }

    // Create notifications for expired logistics loads
    for (const load of expiredLoads || []) {
      if (!load.customer_id) continue;
      
      // Check if we already sent a reminder in the last 24 hours
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", load.customer_id)
        .eq("type", "load_expiry_reminder")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (count && count > 0) continue;

      notifications.push({
        user_id: load.customer_id,
        type: "load_expiry_reminder",
        title: "Logistics Load Expired - Action Required",
        message: `Your load "${load.title}" for ${load.material_type} has expired. Extend the deadline or close it to continue receiving quotes.`,
        metadata: { logistics_requirement_id: load.id },
        is_read: false,
      });
    }

    // Insert notifications
    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notifError) {
        console.error("Error inserting notifications:", notifError);
      }
    }

    console.log(`Soft-expiry reminder: Sent ${notifications.length} notifications`);
    console.log(`  - Expired RFQs found: ${expiredRFQs?.length || 0}`);
    console.log(`  - Expired Loads found: ${expiredLoads?.length || 0}`);

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: notifications.length,
        expiredRFQs: expiredRFQs?.length || 0,
        expiredLoads: expiredLoads?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error("Soft-expiry reminder error:", err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});