import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate random backup codes (8 characters each)
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  const chars = "0123456789";
  
  for (let i = 0; i < count; i++) {
    let code = "";
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    for (let j = 0; j < 8; j++) {
      code += chars[randomBytes[j] % chars.length];
    }
    codes.push(code);
  }
  
  return codes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { secret, action } = await req.json();

    if (action === "disable") {
      // Disable TOTP
      const { error: deleteError } = await supabase
        .from("user_totp_secrets")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Error disabling TOTP:", deleteError);
        return new Response(JSON.stringify({ error: "Failed to disable TOTP" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`TOTP disabled for user ${user.id}`);
      return new Response(JSON.stringify({ success: true, message: "TOTP disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!secret) {
      return new Response(JSON.stringify({ error: "Secret is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);

    // Check if user already has TOTP settings
    const { data: existingTotp } = await supabase
      .from("user_totp_secrets")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingTotp) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("user_totp_secrets")
        .update({
          encrypted_secret: secret,
          is_enabled: true,
          backup_codes: backupCodes,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating TOTP:", updateError);
        return new Response(JSON.stringify({ error: "Failed to enable TOTP" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from("user_totp_secrets")
        .insert({
          user_id: user.id,
          encrypted_secret: secret,
          is_enabled: true,
          backup_codes: backupCodes,
        });

      if (insertError) {
        console.error("Error inserting TOTP:", insertError);
        return new Response(JSON.stringify({ error: "Failed to enable TOTP" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log(`TOTP enabled for user ${user.id}`);
    return new Response(
      JSON.stringify({
        success: true,
        backupCodes,
        message: "TOTP enabled successfully. Save your backup codes!",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error enabling TOTP:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
