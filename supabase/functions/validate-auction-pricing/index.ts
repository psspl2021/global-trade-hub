// --------------------------------------------------
// validate-auction-pricing (FINAL PRODUCTION VERSION)
// Mirrors src/lib/currency.ts sanitizeCurrencyStrict + UI validation rules.
// Keep logic identical — no drift allowed.
// --------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// -----------------------------
// Shared currency sanitizer
// -----------------------------
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

  if (!/^\d+(\.\d+)?$/.test(s)) return null;

  const n = Number(s) * multiplier;
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n > 9_990_000_000) return null; // ₹999 Cr cap

  return Math.round(n);
}

// -----------------------------
// Types
// -----------------------------
type PricingInput = {
  pricingMethod: "per_unit" | "total";
  startingPrice: unknown;
  minDecrement: unknown;
  unit?: string | null;
};

type ValidationResult =
  | {
      ok: true;
      normalized: {
        startingPrice: number;
        minDecrement: number;
        unit: string | null;
      };
    }
  | { ok: false; error: string };

// -----------------------------
// Constants
// -----------------------------
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

// -----------------------------
// Core validation
// Priority: payload → method → unit → starting → decrement → relational
// -----------------------------
function validatePricing(input: PricingInput): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "invalid_payload" };
  }

  if (
    input.pricingMethod !== "per_unit" &&
    input.pricingMethod !== "total"
  ) {
    return { ok: false, error: "invalid_pricing_method" };
  }

  // Defensive trim before sanitize — keeps behavior stable even if sanitizer changes
  const startingPrice =
    sanitizeCurrencyStrict(
      typeof input.startingPrice === "string"
        ? input.startingPrice.trim()
        : input.startingPrice,
    ) ?? 0;

  const minDecrement =
    sanitizeCurrencyStrict(
      typeof input.minDecrement === "string"
        ? input.minDecrement.trim()
        : input.minDecrement,
    ) ?? 0;

  const unit =
    typeof input.unit === "string" ? input.unit.toLowerCase().trim() : "";

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
      unit: input.pricingMethod === "per_unit" ? unit : null,
    },
  };
}

// -----------------------------
// Edge handler
// -----------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const baseHeaders = {
    ...corsHeaders,
    "Content-Type": "application/json",
    "x-request-id": requestId,
  };

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "method_not_allowed", requestId }),
      { status: 405, headers: baseHeaders },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    console.error("pricing_validation_failed", {
      requestId,
      error: "invalid_json",
    });
    return new Response(
      JSON.stringify({ ok: false, error: "invalid_json", requestId }),
      { status: 400, headers: baseHeaders },
    );
  }

  try {
    const result = validatePricing(body as PricingInput);

    if (!result.ok) {
      console.error("pricing_validation_failed", {
        requestId,
        input: body,
        error: result.error,
      });
    }

    return new Response(JSON.stringify({ ...result, requestId }), {
      status: result.ok ? 200 : 400,
      headers: baseHeaders,
    });
  } catch {
    console.error("pricing_server_error", {
      requestId,
      input: body,
    });
    return new Response(
      JSON.stringify({ ok: false, error: "server_error", requestId }),
      { status: 500, headers: baseHeaders },
    );
  }
});

