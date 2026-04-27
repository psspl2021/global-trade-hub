const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const key = Deno.env.get("GSC_PRIVATE_KEY") || "";
  const email = Deno.env.get("GSC_CLIENT_EMAIL") || "";
  const property = Deno.env.get("GSC_PROPERTY_URL") || "";

  const info = {
    has_key: !!key,
    key_length: key.length,
    starts_with_begin: key.startsWith("-----BEGIN PRIVATE KEY-----"),
    starts_with_quote: key.startsWith('"'),
    contains_literal_backslash_n: key.includes("\\n"),
    contains_real_newlines: key.includes("\n"),
    ends_with_end_marker: key.trimEnd().endsWith("-----END PRIVATE KEY-----") || key.trimEnd().endsWith('-----END PRIVATE KEY-----"'),
    line_count_real: key.split("\n").length,
    line_count_literal: key.split("\\n").length,
    client_email: email,
    email_ends_iam: email.endsWith(".iam.gserviceaccount.com"),
    property_url: property,
  };

  return new Response(JSON.stringify(info, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
