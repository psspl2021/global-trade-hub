// Mirrors src/lib/currency.ts sanitizeCurrencyStrict + UI validation rules.
// Keep logic identical — no drift allowed.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function sanitizeCurrencyStrict(raw: unknown): number | null {
  if (raw == null) return null;

  let s = String(raw)
    .replace(/[₹$€£¥,\s]/g, "")
    .toLowerCase()
    .trim();

  if (!s || s.startsWith("-")) return null;

  let multiplier = 1;
  if (s.endsWith("cr")) {
    multiplier = 10_000_000;
    s = s.slice(0, -2);
  } else if (s.endsWith("l")) {
    multiplier = 100_000;
    s = s.slice(0, -1);
  } else if (s.endsWith("k")) {
    multiplier = 1_000;
    s = s.slice(0, -1);
  }

  if (!s || !/^\d*\.?\d*$/.test(s)) return null;

  const n = Number(s) * multiplier;
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n > 9_990_000_000) return null; // ₹999 Cr cap

  return Math.round(n);
}

type PricingInput = {
  pricingMethod: "per_unit" | "total";
  startingPrice: unknown;
  minDecrement: unknown;
  unit?: string | null;
};

type ValidationResult =
  | { ok: true; normalized: { startingPrice: number; minDecrement: number } }
  | { ok: false; error: string };

const ALLOWED_UNITS = Object.freeze([
  "ton",
  "kg",
  "piece",
  "bag",
  "box",
  "drum",
  "metre",
  "litre",
]);

type ValidationResultWithUnit =
  | {
      ok: true;
      normalized: {
        startingPrice: number;
        minDecrement: number;
        unit?: string;
      };
    }
  | { ok: false; error: string };

function validatePricing(input: PricingInput): ValidationResultWithUnit {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "invalid_payload" };
  }

  // Validate pricingMethod explicitly — prevents bypass via unknown values
  if (
    input.pricingMethod !== "per_unit" &&
    input.pricingMethod !== "total"
  ) {
    return { ok: false, error: "invalid_pricing_method" };
  }

  const startingPrice = sanitizeCurrencyStrict(input.startingPrice) ?? 0;
  const minDecrement = sanitizeCurrencyStrict(input.minDecrement) ?? 0;

  // Normalize unit (lowercase) before validation to avoid case-sensitivity bugs
  const unit =
    typeof input.unit === "string" ? input.unit.toLowerCase().trim() : "";

  // Priority: unit → starting → decrement → relational
  if (input.pricingMethod === "per_unit") {
    if (!unit) {
      return { ok: false, error: "unit_required" };
    }
    if (!ALLOWED_UNITS.includes(unit)) {
      return { ok: false, error: "invalid_unit" };
    }
  }
  if (startingPrice <= 0) {
    return { ok: false, error: "invalid_starting_price" };
  }
  if (minDecrement <= 0) {
    return { ok: false, error: "invalid_min_decrement" };
  }
  if (minDecrement >= startingPrice) {
    return { ok: false, error: "decrement_too_large" };
  }

  return {
    ok: true,
    normalized: {
      startingPrice,
      minDecrement,
      ...(input.pricingMethod === "per_unit" ? { unit } : {}),
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ ok: false, error: "method_not_allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: "invalid_payload" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const result = validatePricing(body as PricingInput);

    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "server_error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
