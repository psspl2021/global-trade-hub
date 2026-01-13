import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, ...params } = await req.json();

    /* -------------------------------
       AUTH (Admin required for writes)
    --------------------------------*/
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { data: admin } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .eq("business_type", "admin")
      .single();

    if (!admin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    /* -------------------------------
       ACTION HANDLER
    --------------------------------*/
    switch (action) {
      /* ============================
         CREATE PO
      ============================ */
      case "create_po": {
        const { contract_id, po_value, delivery_due_date, notes } = params;

        // Fetch contract
        const { data: contract, error: contractError } = await supabase
          .from("contracts")
          .select(
            "id, contract_status, contract_value, requirement_id, currency"
          )
          .eq("id", contract_id)
          .single();

        if (contractError || !contract) {
          throw new Error("Contract not found");
        }

        if (contract.contract_status !== "ACTIVE") {
          throw new Error("PO can be created only for ACTIVE contracts");
        }

        // Calculate already used PO value
        const { data: pos } = await supabase
          .from("purchase_orders")
          .select("po_value")
          .eq("contract_id", contract_id);

        const usedValue =
          pos?.reduce((sum, p) => sum + Number(p.po_value), 0) || 0;

        if (usedValue + po_value > contract.contract_value) {
          throw new Error(
            `PO exceeds remaining contract value. Remaining: ${
              contract.contract_value - usedValue
            }`
          );
        }

        // Generate PO number
        const poNumber = `PO-${Date.now()}`;

        const { data: po, error } = await supabase
          .from("purchase_orders")
          .insert({
            contract_id,
            requirement_id: contract.requirement_id,
            po_number: poNumber,
            po_value,
            currency: contract.currency,
            delivery_due_date,
            notes,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ po }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      /* ============================
         UPDATE PO STATUS
      ============================ */
      case "update_po_status": {
        const { po_id, po_status } = params;

        const { data: po, error } = await supabase
          .from("purchase_orders")
          .update({ po_status })
          .eq("id", po_id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ po }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      /* ============================
         LIST POs (Admin)
      ============================ */
      case "get_pos": {
        const { data, error } = await supabase
          .from("purchase_orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ pos: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: corsHeaders,
        });
    }
  } catch (error) {
    console.error("PO Engine Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
