import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Base32 decoding
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(encoded: string): ArrayBuffer {
  const cleanEncoded = encoded.toUpperCase().replace(/=+$/, "");
  const output: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of cleanEncoded) {
    const index = BASE32_CHARS.indexOf(char);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  const arr = new Uint8Array(output);
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
}

// TOTP implementation (RFC 6238)
async function generateTOTP(secret: string, timeStep: number = 0, digits: number = 8): Promise<string> {
  const keyBuffer = base32Decode(secret);
  const time = Math.floor(Date.now() / 1000 / 30) + timeStep;
  
  // Convert time to 8-byte buffer (big-endian)
  const timeArray = new Uint8Array(8);
  let t = time;
  for (let i = 7; i >= 0; i--) {
    timeArray[i] = t & 0xff;
    t = Math.floor(t / 256);
  }
  const timeBuffer = timeArray.buffer.slice(timeArray.byteOffset, timeArray.byteOffset + timeArray.byteLength);

  // HMAC-SHA1
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, timeBuffer);
  const hash = new Uint8Array(signature);

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0xf;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, "0");
}

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(userId);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (limit.count >= 5) {
    return false;
  }
  
  limit.count++;
  return true;
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

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      console.warn(`Rate limit exceeded for user ${user.id}`);
      return new Response(JSON.stringify({ error: "Too many attempts. Please wait a minute." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { code, secret, isBackupCode } = await req.json();

    if (!code || code.length !== 8) {
      return new Response(JSON.stringify({ error: "Invalid code format. Must be 8 digits." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If secret is provided (during setup), use that instead of stored secret
    let totpSecret = secret;
    let backupCodes: string[] = [];

    if (!totpSecret) {
      // Get stored secret from database using service role for this lookup
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data: totpData, error: totpError } = await supabaseAdmin
        .from("user_totp_secrets")
        .select("encrypted_secret, backup_codes")
        .eq("user_id", user.id)
        .eq("is_enabled", true)
        .single();

      if (totpError || !totpData) {
        console.error("TOTP not found:", totpError);
        return new Response(JSON.stringify({ error: "TOTP not configured for this user" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      totpSecret = totpData.encrypted_secret;
      backupCodes = totpData.backup_codes || [];
    }

    // Check if it's a backup code
    if (isBackupCode && backupCodes.length > 0) {
      const codeIndex = backupCodes.indexOf(code);
      if (codeIndex !== -1) {
        // Remove used backup code
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        backupCodes.splice(codeIndex, 1);
        await supabaseAdmin
          .from("user_totp_secrets")
          .update({ backup_codes: backupCodes })
          .eq("user_id", user.id);

        console.log(`Backup code used for user ${user.id}, ${backupCodes.length} remaining`);
        return new Response(JSON.stringify({ valid: true, isBackupCode: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Verify TOTP with ±1 time step tolerance (30 seconds drift)
    for (const timeStep of [-1, 0, 1]) {
      const expectedCode = await generateTOTP(totpSecret, timeStep);
      if (code === expectedCode) {
        console.log(`TOTP verified for user ${user.id}`);
        return new Response(JSON.stringify({ valid: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log(`Invalid TOTP code for user ${user.id}`);
    return new Response(JSON.stringify({ valid: false, error: "Invalid code" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error verifying TOTP:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
