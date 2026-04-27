const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const privateKey = Deno.env.get("GSC_PRIVATE_KEY") || "";

  let normalizedKey = privateKey.trim();
  if (normalizedKey.startsWith("{")) {
    try {
      const parsed = JSON.parse(normalizedKey);
      if (parsed.private_key) normalizedKey = parsed.private_key;
    } catch (_) {}
  }
  const beginIdx = normalizedKey.indexOf("-----BEGIN PRIVATE KEY-----");
  const endIdx = normalizedKey.indexOf("-----END PRIVATE KEY-----");
  if (beginIdx > 0 && endIdx > beginIdx) {
    normalizedKey = normalizedKey.slice(beginIdx, endIdx + "-----END PRIVATE KEY-----".length) + "\n";
  }
  normalizedKey = normalizedKey.replace(/\\n/g, "\n");

  const lines = normalizedKey.split("\n");
  return new Response(JSON.stringify({
    length: normalizedKey.length,
    first_line: lines[0],
    second_line_first_30: lines[1]?.slice(0, 30),
    last_meaningful_line: lines.filter(l => l.length).slice(-1)[0],
    total_lines: lines.length,
    base64_line_lengths: lines.slice(1, -1).filter(l => l.length).map(l => l.length).slice(0, 5),
  }, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
