import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user is authenticated and is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's auth to verify their identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin using service role
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: adminRole, error: roleError } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !adminRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { view, limit = 50 } = await req.json();

    // Validate view name (whitelist allowed views)
    const allowedViews = [
      "admin_overview_metrics",
      "admin_profit_summary",
      "admin_deal_analytics",
      "admin_ai_inventory_suppliers",
      "admin_revenue_by_trade_type",
      "admin_daily_kpis",
    ];

    if (!allowedViews.includes(view)) {
      return new Response(JSON.stringify({ error: "Invalid view requested" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch data using service role
    let data: any;
    let queryError: any;
    
    if (view === "admin_overview_metrics") {
      // Single row view
      const result = await serviceClient.from(view).select("*").single();
      data = result.data;
      queryError = result.error;
    } else if (view === "admin_profit_summary") {
      const result = await serviceClient.from(view).select("*").order("date", { ascending: false }).limit(limit);
      data = result.data;
      queryError = result.error;
    } else if (view === "admin_deal_analytics") {
      const result = await serviceClient.from(view).select("*").order("bid_created_at", { ascending: false }).limit(limit);
      data = result.data;
      queryError = result.error;
    } else if (view === "admin_ai_inventory_suppliers") {
      const result = await serviceClient.from(view).select("*").order("ai_matched_products", { ascending: false }).limit(limit);
      data = result.data;
      queryError = result.error;
    } else if (view === "admin_daily_kpis") {
      const result = await serviceClient.from(view).select("*").order("date", { ascending: false }).limit(limit);
      data = result.data;
      queryError = result.error;
    } else if (view === "admin_revenue_by_trade_type") {
      const result = await serviceClient.from(view).select("*");
      data = result.data;
      queryError = result.error;
    }

    if (queryError) {
      console.error("Query error:", queryError);
      return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in admin-analytics:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
